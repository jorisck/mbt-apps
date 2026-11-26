"""Gabarits d'e-mails. Les e-mails aux passagers existent en FR, NL et EN ; ceux de l'équipe en FR.

Le contexte est préparé à la mise en file (dates déjà formatées à l'heure de Bruxelles) :
le rendu ne dépend donc ni de l'heure d'envoi ni de la base.
"""

from __future__ import annotations

import html
import re
from dataclasses import dataclass
from typing import Any

# Gabarits dont le contexte contient un lien à usage unique : effacé après l'envoi.
SENSITIVE_TEMPLATES = frozenset({"admin_invitation", "admin_password_reset"})

PASSENGER_TEMPLATES = frozenset({"demande_received", "demande_confirmed", "demande_refused", "demande_cancelled"})


@dataclass(frozen=True)
class Rendered:
    subject: str
    text: str
    html: str


class _Safe(dict[str, Any]):
    def __missing__(self, key: str) -> str:
        return ""


def _route_block(lang: str, ctx: dict[str, Any]) -> str:
    labels = {
        "fr": ("Départ", "Destination", "Retour"),
        "nl": ("Vertrek", "Bestemming", "Terugrit"),
        "en": ("Pick-up", "Destination", "Return"),
    }[lang]
    lines = [f"{labels[0]} : {ctx.get('pickup', '')}", f"{labels[1]} : {ctx.get('dropoff', '')}"]
    if ctx.get("return_when"):
        lines.append(f"{labels[2]} : {ctx['return_when']}")
    return "\n".join(lines)


_PASSENGER: dict[str, dict[str, tuple[str, str]]] = {
    "demande_received": {
        "fr": (
            "Votre demande {ref} a bien été reçue",
            "Bonjour {name},\n\nNous avons bien reçu votre demande de transport ({ref}) pour le "
            "{when}.\n\n{route}\n\nIl s'agit d'une demande : elle n'est pas encore confirmée. "
            "Notre équipe l'examine et vous répond par e-mail. Pour toute urgence, appelez-nous "
            "au {phone}.\n\nMBT Taxis",
        ),
        "nl": (
            "Uw aanvraag {ref} is ontvangen",
            "Beste {name},\n\nWe hebben uw vervoersaanvraag ({ref}) voor {when} goed "
            "ontvangen.\n\n{route}\n\nDit is een aanvraag: ze is nog niet bevestigd. Ons team "
            "bekijkt ze en antwoordt u per e-mail. Voor dringende vragen belt u ons op "
            "{phone}.\n\nMBT Taxis",
        ),
        "en": (
            "Your request {ref} has been received",
            "Hello {name},\n\nWe have received your transport request ({ref}) for "
            "{when}.\n\n{route}\n\nThis is a request: it is not confirmed yet. Our team is "
            "reviewing it and will reply by e-mail. For anything urgent, call us on "
            "{phone}.\n\nMBT Taxis",
        ),
    },
    "demande_confirmed": {
        "fr": (
            "Votre course {ref} est confirmée",
            "Bonjour {name},\n\nBonne nouvelle : votre course du {when} est confirmée "
            "({ref}).\n\n{route}\n\nBesoin de nous joindre ? Appelez-nous au {phone}.\n\n"
            "MBT Taxis",
        ),
        "nl": (
            "Uw rit {ref} is bevestigd",
            "Beste {name},\n\nGoed nieuws: uw rit van {when} is bevestigd ({ref}).\n\n{route}"
            "\n\nMoet u ons bereiken? Bel ons op {phone}.\n\nMBT Taxis",
        ),
        "en": (
            "Your ride {ref} is confirmed",
            "Hello {name},\n\nGood news: your ride on {when} is confirmed ({ref}).\n\n{route}"
            "\n\nNeed to reach us? Call {phone}.\n\nMBT Taxis",
        ),
    },
    "demande_refused": {
        "fr": (
            "Votre demande {ref} n'a pas pu être acceptée",
            "Bonjour {name},\n\nNous ne pouvons malheureusement pas assurer la course demandée "
            "pour le {when} ({ref}).\n\nMotif : {reason}\n\nAppelez-nous au {phone} : nous "
            "chercherons une solution avec vous.\n\nMBT Taxis",
        ),
        "nl": (
            "Uw aanvraag {ref} kon niet worden aanvaard",
            "Beste {name},\n\nWe kunnen de gevraagde rit van {when} ({ref}) helaas niet "
            "uitvoeren.\n\nReden: {reason}\n\nBel ons op {phone}: we zoeken samen met u naar een "
            "oplossing.\n\nMBT Taxis",
        ),
        "en": (
            "Your request {ref} could not be accepted",
            "Hello {name},\n\nUnfortunately we cannot provide the ride requested for {when} "
            "({ref}).\n\nReason: {reason}\n\nCall us on {phone}: we will look for a solution "
            "with you.\n\nMBT Taxis",
        ),
    },
    "demande_cancelled": {
        "fr": (
            "Votre course {ref} est annulée",
            "Bonjour {name},\n\nVotre course du {when} ({ref}) est annulée.{reason_line}\n\n"
            "Une question ? Appelez-nous au {phone}.\n\nMBT Taxis",
        ),
        "nl": (
            "Uw rit {ref} is geannuleerd",
            "Beste {name},\n\nUw rit van {when} ({ref}) is geannuleerd.{reason_line}\n\n"
            "Een vraag? Bel ons op {phone}.\n\nMBT Taxis",
        ),
        "en": (
            "Your ride {ref} is cancelled",
            "Hello {name},\n\nYour ride on {when} ({ref}) is cancelled.{reason_line}\n\n"
            "A question? Call us on {phone}.\n\nMBT Taxis",
        ),
    },
}

_REASON_PREFIX = {"fr": " Motif : ", "nl": " Reden: ", "en": " Reason: "}

# Équipe MBT (français uniquement, traduction de l'interface d'administration hors périmètre).
_TEAM: dict[str, tuple[str, str]] = {
    "demande_new": (
        "Nouvelle demande {ref} : {when}",
        "Une nouvelle demande vient d'arriver ({origin}).\n\nRéférence : {ref}\nService : "
        "{service}\nPrise en charge : {when}\n{route}\nPassagers : {count}\n\nPassager : {name}"
        "\nTéléphone : {phone}\nE-mail : {email}\nLangue : {language}\n\nBesoins : {needs}\n"
        "Commentaire : {comment}\n\nTraiter la demande : {link}",
    ),
    "demande_cancelled_team": (
        "Demande {ref} annulée par le passager",
        "Le passager a annulé la demande {ref} prévue le {when}.\n\n{route}\n\nPassager : {name}"
        "\nTéléphone : {phone}\n\nVoir la demande : {link}",
    ),
    "admin_invitation": (
        "Invitation à l'espace de gestion HandyCab / MBT",
        "Bonjour {name},\n\nVous êtes invité(e) à rejoindre l'espace de gestion. Choisissez votre "
        "mot de passe avec ce lien, valable 72 heures :\n{link}\n\nSi vous n'attendiez pas cette "
        "invitation, ignorez ce message.",
    ),
    "admin_password_reset": (
        "Réinitialisation de votre mot de passe",
        "Bonjour {name},\n\nPour choisir un nouveau mot de passe, utilisez ce lien, valable 1 "
        "heure :\n{link}\n\nSi vous n'êtes pas à l'origine de cette demande, ignorez ce message : "
        "votre mot de passe reste inchangé.",
    ),
    "admin_password_changed": (
        "Votre mot de passe a été modifié",
        "Bonjour {name},\n\nLe mot de passe de votre compte vient d'être modifié. Toutes vos "
        "autres sessions ont été fermées.\n\nSi ce n'est pas vous, contactez immédiatement un "
        "autre administrateur.",
    ),
    "admin_new_login": (
        "Nouvelle connexion à votre compte",
        "Bonjour {name},\n\nUne connexion depuis un nouvel appareil vient d'avoir lieu le {when}."
        "\nAppareil : {device}\nAdresse IP : {ip}\n\nSi ce n'est pas vous, changez votre mot de "
        "passe et contactez un autre administrateur.",
    ),
    "admin_locked": (
        "Votre compte est temporairement verrouillé",
        "Bonjour {name},\n\nPlusieurs tentatives de connexion ont échoué : votre compte est "
        "verrouillé jusqu'au {until}.\n\nSi ce n'est pas vous, prévenez un autre administrateur.",
    ),
    "admin_disabled_notice": (
        "Votre accès à l'espace de gestion a été désactivé",
        "Bonjour {name},\n\nVotre accès à l'espace de gestion a été désactivé. Contactez un "
        "administrateur si vous pensez qu'il s'agit d'une erreur.",
    ),
}


def _to_html(text: str) -> str:
    escaped = html.escape(text)
    linked = re.sub(r"(https?://[^\s<]+)", r'<a href="\1">\1</a>', escaped)
    paragraphs = [p.replace("\n", "<br>") for p in linked.split("\n\n")]
    return (
        '<div style="font-family:Arial,sans-serif;line-height:1.5">'
        + "".join(f"<p>{p}</p>" for p in paragraphs)
        + "</div>"
    )


def render(template: str, language: str, context: dict[str, Any]) -> Rendered:
    lang = language if language in {"fr", "nl", "en"} else "fr"
    ctx = _Safe(context)
    if template in _PASSENGER:
        subject_tpl, body_tpl = _PASSENGER[template][lang]
        ctx["route"] = _route_block(lang, context)
        reason = context.get("reason")
        ctx["reason_line"] = f"{_REASON_PREFIX[lang]}{reason}" if reason else ""
    elif template in _TEAM:
        subject_tpl, body_tpl = _TEAM[template]
    else:
        raise KeyError(f"gabarit d'e-mail inconnu : {template}")
    if template in {"demande_new", "demande_cancelled_team"}:
        ctx["route"] = _route_block("fr", context)
    subject = subject_tpl.format_map(ctx)
    body = body_tpl.format_map(ctx)
    return Rendered(subject=subject, text=body, html=_to_html(body))
