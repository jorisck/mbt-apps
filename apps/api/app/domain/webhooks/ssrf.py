"""Protection SSRF : résolution DNS et filtrage des IP (§9.4b).

À chaque tentative d'envoi :
1. Résoudre le DNS.
2. Rejeter si UNE SEULE IP n'est pas publique.
3. Retourner la liste des IPs validées (IPv4 en premier).

`is_public_ip` refuse notamment :
  127.0.0.0/8, 10/8, 172.16/12, 192.168/16, 169.254/16 (métadonnées cloud),
  100.64/10, 0.0.0.0, multicast et broadcast, plages de documentation/test,
  ::1, fe80::/10, fc00::/7,
  adresses IPv4 encapsulées (::ffff:…, NAT64 64:ff9b::/96, 6to4 2002::/16,
  Teredo 2001::/32).

IP Policy injectable pour les tests (jamais via variable d'environnement).
"""

from __future__ import annotations

import ipaddress
import socket
from collections.abc import Callable

import anyio

from app.errors import ApiProblem

# --- Plages IPv6 bloquant l'encapsulation d'IPv4 ------------------------------------
_BLOCKED_V6: list[ipaddress.IPv6Network] = [
    ipaddress.ip_network(n)
    for n in ("64:ff9b::/96", "64:ff9b:1::/48", "2002::/16", "2001::/32")
]


def is_public_ip(raw: str) -> bool:
    """Retourne True si l'adresse est routable publiquement et non-multicast.

    Testé sur 25+ cas (voir test_webhooks_ssrf.py).
    """
    # Retirer un éventuel identifiant de zone IPv6 (fe80::1%eth0)
    ip = ipaddress.ip_address(raw.split("%", 1)[0])
    if isinstance(ip, ipaddress.IPv6Address):
        # ::ffff:127.0.0.1 → traiter comme l'IPv4 correspondante
        if ip.ipv4_mapped is not None:
            return is_public_ip(str(ip.ipv4_mapped))
        # NAT64, 6to4, Teredo : encapsulent de l'IPv4
        if any(ip in net for net in _BLOCKED_V6):
            return False
    return ip.is_global and not ip.is_multicast


class DeliveryError(ApiProblem):
    """Erreur d'envoi non liée à une réponse HTTP (DNS, SSRF, timeout, TLS…)."""

    def __init__(self, code: str) -> None:
        messages = {
            "dns": "Échec de résolution DNS.",
            "ssrf_blocked": "L'adresse IP cible est un réseau privé ou réservé.",
            "timeout": "Délai dépassé.",
            "tls": "Erreur TLS.",
            "connect": "Connexion impossible.",
            "redirect": "Les redirections ne sont pas suivies.",
        }
        super().__init__(502, f"delivery.{code}", messages.get(code, code))
        self.code = code  # type: ignore[assignment]


# Type alias pour la politique IP (injectable dans les tests)
IPPolicy = Callable[[str], bool]

_DEFAULT_POLICY: IPPolicy = is_public_ip


async def resolve_public_ips(
    host: str,
    port: int,
    *,
    ip_policy: IPPolicy | None = None,
) -> list[str]:
    """Résout `host:port` et retourne les adresses IP publiques (IPv4 en premier).

    Lève `DeliveryError("dns")` si la résolution échoue.
    Lève `DeliveryError("ssrf_blocked")` si au moins une IP est privée/réservée.

    `ip_policy` est réservé aux tests unitaires (jamais configuré via l'env).
    """
    policy = ip_policy or _DEFAULT_POLICY
    try:
        infos = await anyio.getaddrinfo(host, port, type=socket.SOCK_STREAM)
    except OSError as exc:
        raise DeliveryError("dns") from exc

    ips = sorted(
        {info[4][0] for info in infos},
        key=lambda ip: ":" in ip,  # IPv4 (sans `:`) avant IPv6
    )
    if not ips or not all(policy(ip) for ip in ips):
        raise DeliveryError("ssrf_blocked")
    return ips
