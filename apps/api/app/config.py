"""Configuration de l'application (variables d'environnement, annexe A de la spec)."""

from __future__ import annotations

from functools import cached_property, lru_cache
from pathlib import Path
from urllib.parse import urlsplit, urlunsplit

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict

API_ROOT = Path(__file__).resolve().parent.parent


def _split_csv(value: str) -> list[str]:
    return [item.strip() for item in value.split(",") if item.strip()]


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=API_ROOT / ".env", env_file_encoding="utf-8", extra="ignore")

    app_env: str = "development"  # development | staging | production
    log_level: str = "INFO"

    admin_host: str = "gestion.localhost"
    public_api_host: str = "api.localhost"
    # URL publique de l'admin (liens des e-mails). Déduite de ADMIN_HOST si vide.
    admin_base_url: str = ""

    # Liens affichés dans l'espace de gestion (bouton « En savoir plus » et pied de page).
    handycab_url: str = "https://www.handycab.be"
    mbttaxis_url: str = "https://www.mbttaxis.be"

    database_url: str = "postgresql://localhost:5432/mbt_dev"
    test_database_url: str = "postgresql://localhost:5432/mbt_test"
    db_pool_size: int = 5

    app_encryption_keys: str = ""
    secret_key: str = ""
    secret_key_previous: str = ""
    access_token_ttl_minutes: int = 15
    refresh_token_ttl_days: int = 30

    bff_keys: str = ""

    resend_api_key: str = ""
    resend_from_email: str = "MBT Taxis <noreply@notifications.mbttaxis.be>"
    admin_notify_emails: str = ""

    google_maps_api_key: str = ""
    google_maps_static_signing_secret: str = ""

    sentry_dsn: str = ""

    webhook_allowed_hosts: str = ""
    webhook_allowed_ports: str = "443"
    quotaguardstatic_url: str = ""

    # Interne : permet aux tests de désactiver l'attente réelle des tâches.
    session_cookie_secure: bool | None = Field(default=None)

    @property
    def is_production(self) -> bool:
        return self.app_env == "production"

    @property
    def is_local(self) -> bool:
        return self.app_env == "development"

    @property
    def reference_prefix(self) -> str:
        """`D-` en production, `T-` ailleurs : une demande de test n'est jamais confondue (§4.1)."""
        return "D" if self.is_production else "T"

    @property
    def cookie_secure(self) -> bool:
        if self.session_cookie_secure is not None:
            return self.session_cookie_secure
        # Le préfixe __Host- impose Secure ; en local (http) on utilise un nom sans préfixe.
        return not self.is_local

    @property
    def session_cookie_name(self) -> str:
        return "__Host-session" if self.cookie_secure else "session"

    @cached_property
    def bff_key_map(self) -> dict[str, str]:
        """Clé -> origine (`site_mbt`, `site_handycab`). Plusieurs clés par site sont permises."""
        mapping: dict[str, str] = {}
        for item in _split_csv(self.bff_keys):
            origin, _, key = item.partition(":")
            if origin and key:
                mapping[key] = origin
        return mapping

    @property
    def admin_url(self) -> str:
        if self.admin_base_url:
            return self.admin_base_url.rstrip("/")
        if self.is_local:
            return f"http://{self.admin_host}:8000"
        return f"https://{self.admin_host}"

    @property
    def notify_emails(self) -> list[str]:
        return _split_csv(self.admin_notify_emails)

    def async_url(self, url: str | None = None) -> str:
        return to_async_url(url or self.database_url)

    def db_connect_args(self, url: str | None = None) -> dict[str, object]:
        """SSL requis sur Heroku Postgres ; inutile pour une base locale."""
        host = urlsplit(url or self.database_url).hostname or ""
        if host in {"", "localhost", "127.0.0.1", "::1"}:
            return {}
        return {"ssl": "require"}


def to_async_url(url: str) -> str:
    """Heroku fournit `postgres://` ; SQLAlchemy async attend `postgresql+asyncpg://`."""
    parts = urlsplit(url)
    scheme = parts.scheme
    if scheme in {"postgres", "postgresql"}:
        scheme = "postgresql+asyncpg"
    return urlunsplit((scheme, parts.netloc, parts.path, parts.query, parts.fragment))


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
