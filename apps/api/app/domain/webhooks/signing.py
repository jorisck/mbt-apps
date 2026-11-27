"""Signature Standard Webhooks (§9.2).

Format : HMAC-SHA256 sur `{webhook-id}.{webhook-timestamp}.{corps brut}`.
En-tête `webhook-signature` : `v1,<base64>`. Pour une rotation de secret, deux
signatures séparées par une espace.

Vecteur de test (guide d'intégration §9, spec §9.2) :
  secret : whsec_jmOigo2WR8R6RSIgn4MwSHnuC1l0YPN5H5KuR7s1Yqo=
  id     : msg_01JDQ8Z5V9K3M7XW2TYB4N6HRE
  ts     : 1795687200
  corps  : {"type":"webhook.test",...,"data":{"test":true}}
  sortie : v1,O2Fe75t42uZPc6RVjX/ThsMlObtaCCHZ2v5m+gSmoJo=
"""

from __future__ import annotations

import base64
import hashlib
import hmac
import secrets
import time


def sign(key: bytes, msg_id: str, timestamp: int, body: bytes) -> str:
    """Produit une seule signature `v1,<base64>`."""
    mac = hmac.new(key, f"{msg_id}.{timestamp}.".encode() + body, hashlib.sha256)
    return "v1," + base64.b64encode(mac.digest()).decode()


def signature_header(keys: list[bytes], msg_id: str, timestamp: int, body: bytes) -> str:
    """Produit la valeur de l'en-tête `webhook-signature` pour une ou plusieurs clés."""
    return " ".join(sign(k, msg_id, timestamp, body) for k in keys)


def verify(
    key: bytes,
    msg_id: str,
    timestamp: int,
    body: bytes,
    sig_header: str,
    *,
    tolerance_s: int = 300,
    _now: int | None = None,
) -> bool:
    """Vérifie la signature et l'horodatage (tolérance 5 min par défaut).

    Accepte plusieurs signatures séparées par une espace (rotation de secret).
    Utilise une comparaison en temps constant.
    Retourne False plutôt que lever une exception.
    """
    now = _now if _now is not None else int(time.time())
    if abs(now - timestamp) > tolerance_s:
        return False
    expected = sign(key, msg_id, timestamp, body)
    _, _, expected_value = expected.partition(",")
    for part in sig_header.split(" "):
        version, _, value = part.partition(",")
        if version == "v1" and hmac.compare_digest(value, expected_value):
            return True
    return False


def generate_secret() -> str:
    """Génère un nouveau secret au format `whsec_<base64>` (Standard Webhooks)."""
    return "whsec_" + base64.b64encode(secrets.token_bytes(32)).decode()


def decode_secret(raw: str) -> bytes:
    """Décode un secret `whsec_<base64>` en octets bruts."""
    return base64.b64decode(raw.removeprefix("whsec_"))


# ---------------------------------------------------------------------------
# Vecteur de test (spec §9.2 et guide §9) — doit rester dans ce module pour
# que le vecteur soit exécutable sans base de données.
# ---------------------------------------------------------------------------

_TEST_SECRET = "whsec_jmOigo2WR8R6RSIgn4MwSHnuC1l0YPN5H5KuR7s1Yqo="
_TEST_MSG_ID = "msg_01JDQ8Z5V9K3M7XW2TYB4N6HRE"
_TEST_TIMESTAMP = 1795687200
_TEST_BODY = (
    b'{"type":"webhook.test","timestamp":"2026-11-26T10:00:00Z",'
    b'"api_version":"2026-12-01","data":{"test":true}}'
)
_TEST_EXPECTED = "v1,O2Fe75t42uZPc6RVjX/ThsMlObtaCCHZ2v5m+gSmoJo="


def _assert_test_vector() -> None:
    """Vérifie le vecteur officiel. Appelé dans les tests unitaires (test_webhooks_signing.py)."""
    key = decode_secret(_TEST_SECRET)
    result = sign(key, _TEST_MSG_ID, _TEST_TIMESTAMP, _TEST_BODY)
    assert result == _TEST_EXPECTED, f"vecteur échoué : {result!r} != {_TEST_EXPECTED!r}"
