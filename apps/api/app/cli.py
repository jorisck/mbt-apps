"""Commandes d'exploitation : `python -m app.cli <commande>`.

release            vérifie la configuration puis applique les migrations (phase `release` Heroku)
admin create       crée le premier administrateur (envoie l'invitation, affiche aussi le lien)
admin unlock       lève le verrouillage d'un compte après trop d'échecs de connexion
gen-key            génère une valeur pour APP_ENCRYPTION_KEYS ou SECRET_KEY
export-openapi     écrit le contrat OpenAPI de l'API publique
"""

from __future__ import annotations

import argparse
import asyncio
import json
import secrets
import sys
from pathlib import Path

from alembic import command
from alembic.config import Config
from sqlalchemy import select

from app.config import API_ROOT, settings
from app.db import dispose_engine, session_scope
from app.domain.actors import Actor
from app.domain.admins import service as admins
from app.domain.audit import audit
from app.models import Admin
from app.security.crypto import Keyring, generate_key_spec


def check_config() -> list[str]:
    """Erreurs bloquantes de configuration (en production et staging)."""
    problems: list[str] = []
    if settings.is_local:
        return problems
    if len(settings.secret_key) < 32:
        problems.append("SECRET_KEY manquante ou trop courte (32 caractères minimum).")
    try:
        Keyring(settings.app_encryption_keys)
    except ValueError as exc:
        problems.append(str(exc))
    if not settings.bff_key_map:
        problems.append("BFF_KEYS est vide : aucun site ne pourra envoyer de demande.")
    if not settings.resend_api_key:
        problems.append("RESEND_API_KEY manquante : aucun e-mail ne pourra partir.")
    if not settings.notify_emails:
        problems.append("ADMIN_NOTIFY_EMAILS est vide : personne ne sera prévenu des nouvelles demandes.")
    return problems


def cmd_release(_: argparse.Namespace) -> int:
    problems = check_config()
    if problems:
        for problem in problems:
            print(f"CONFIG: {problem}", file=sys.stderr)
        return 1
    cfg = Config(str(API_ROOT / "alembic.ini"))
    cfg.set_main_option("script_location", str(API_ROOT / "migrations"))
    command.upgrade(cfg, "head")
    print("Migrations appliquées.")
    return 0


async def _admin_create(email: str, name: str) -> int:
    try:
        async with session_scope() as db:
            admin, token = await admins.invite_admin(db, Actor.system(), email, name)
            link = admins.invitation_link(token)
            print(f"Administrateur créé : {admin.email} (statut : invité)")
            print(f"Lien d'activation (72 h, à usage unique) :\n  {link}")
    except admins.AdminError as exc:
        print(f"Erreur : {exc}", file=sys.stderr)
        return 1
    finally:
        await dispose_engine()
    return 0


async def _admin_unlock(email: str) -> int:
    try:
        async with session_scope() as db:
            admin = await db.scalar(select(Admin).where(Admin.email == admins.normalize_email(email)))
            if admin is None:
                print("Aucun administrateur avec cette adresse.", file=sys.stderr)
                return 1
            admin.failed_logins, admin.lockout_count, admin.locked_until = 0, 0, None
            await audit(db, Actor.system(), "admin.unlocked", "admin", admin.id, {"via": "cli"})
            print("Compte déverrouillé.")
    except admins.AdminError as exc:
        print(f"Erreur : {exc}", file=sys.stderr)
        return 1
    finally:
        await dispose_engine()
    return 0


def cmd_gen_key(args: argparse.Namespace) -> int:
    if args.kind == "secret":
        print(secrets.token_urlsafe(48))
    else:
        print(generate_key_spec(args.id))
    return 0


def cmd_export_openapi(args: argparse.Namespace) -> int:
    from app.main import create_public_app

    schema = create_public_app().openapi()
    text = json.dumps(schema, indent=2, ensure_ascii=False, sort_keys=True) + "\n"
    if args.out:
        Path(args.out).write_text(text, encoding="utf-8")
    else:
        print(text, end="")
    return 0


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        prog="app.cli", description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter
    )
    sub = parser.add_subparsers(dest="command", required=True)

    sub.add_parser("release", help="vérifie la configuration et migre la base").set_defaults(func=cmd_release)

    admin = sub.add_parser("admin", help="gestion des administrateurs").add_subparsers(
        dest="admin_command", required=True
    )
    create = admin.add_parser("create", help="crée un administrateur et affiche son lien d'activation")
    create.add_argument("--email", required=True)
    create.add_argument("--name", required=True)
    create.set_defaults(func=lambda a: asyncio.run(_admin_create(a.email, a.name)))
    unlock = admin.add_parser("unlock", help="lève un verrouillage de compte")
    unlock.add_argument("--email", required=True)
    unlock.set_defaults(func=lambda a: asyncio.run(_admin_unlock(a.email)))

    gen = sub.add_parser("gen-key", help="génère une clé")
    gen.add_argument("--kind", choices=["encryption", "secret"], default="encryption")
    gen.add_argument("--id", default="k1", help="identifiant de la clé de chiffrement")
    gen.set_defaults(func=cmd_gen_key)

    export = sub.add_parser("export-openapi", help="écrit le contrat OpenAPI")
    export.add_argument("--out", help="fichier de sortie (sinon : sortie standard)")
    export.set_defaults(func=cmd_export_openapi)

    args = parser.parse_args(argv)
    return int(args.func(args))


if __name__ == "__main__":
    raise SystemExit(main())
