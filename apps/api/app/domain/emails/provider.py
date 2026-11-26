"""Envoi via l'API REST de Resend (https://resend.com/docs/api-reference/emails/send-email)."""

from __future__ import annotations

import uuid

import httpx
import structlog

from app.config import settings

log = structlog.get_logger("emails")

RESEND_URL = "https://api.resend.com/emails"


class PermanentEmailError(Exception):
    """Refus définitif du fournisseur (adresse invalide, domaine non vérifié…) : inutile de réessayer."""


class TemporaryEmailError(Exception):
    """Échec temporaire (réseau, limite de débit, erreur serveur) : à réessayer."""


async def send_email(
    *,
    to: str,
    subject: str,
    text: str,
    html: str,
    idempotency_key: str,
    client: httpx.AsyncClient | None = None,
) -> str:
    """Envoie un e-mail et renvoie l'identifiant du message chez le fournisseur."""
    if not settings.resend_api_key:
        if settings.is_local:
            # Développement : on écrit l'e-mail dans les logs au lieu de l'envoyer.
            log.info("email.dev", to_domain=to.rsplit("@", 1)[-1], subject=subject, body=text)
            return f"dev-{uuid.uuid4()}"
        raise TemporaryEmailError("RESEND_API_KEY manquante")

    payload = {
        "from": settings.resend_from_email,
        "to": [to],
        "subject": subject,
        "text": text,
        "html": html,
    }
    headers = {
        "Authorization": f"Bearer {settings.resend_api_key}",
        "Idempotency-Key": idempotency_key,
    }
    owns_client = client is None
    client = client or httpx.AsyncClient(timeout=httpx.Timeout(10.0))
    try:
        response = await client.post(RESEND_URL, json=payload, headers=headers)
    except httpx.HTTPError as exc:
        raise TemporaryEmailError(type(exc).__name__) from exc
    finally:
        if owns_client:
            await client.aclose()

    if response.status_code == 200:
        return str(response.json().get("id", ""))
    if response.status_code == 429 or response.status_code >= 500:
        raise TemporaryEmailError(f"http_{response.status_code}")
    raise PermanentEmailError(f"http_{response.status_code}")
