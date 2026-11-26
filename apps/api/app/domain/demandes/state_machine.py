"""Machine à états des demandes : transitions explicites, aucune valeur libre (§5)."""

from __future__ import annotations

from datetime import datetime, timedelta

STATUSES = ("received", "confirmed", "refused", "cancelled", "completed", "not_completed")
FINAL = frozenset({"refused", "cancelled", "completed", "not_completed"})

STATUS_LABELS = {
    "received": "Reçue",
    "confirmed": "Confirmée",
    "refused": "Refusée",
    "cancelled": "Annulée",
    "completed": "Terminée",
    "not_completed": "Non effectuée",
}

# (statut de départ, statut d'arrivée) -> acteurs autorisés
TRANSITIONS: dict[tuple[str, str], set[str]] = {
    ("received", "confirmed"): {"admin"},
    ("received", "refused"): {"admin"},
    ("received", "cancelled"): {"admin", "passenger"},
    ("confirmed", "cancelled"): {"admin", "passenger"},
    ("confirmed", "completed"): {"admin", "system"},
    ("confirmed", "not_completed"): {"admin"},
    ("completed", "not_completed"): {"admin"},
    ("not_completed", "completed"): {"admin"},
}

# Événements sortants (webhooks, lot L4) déclenchés par un changement de statut.
OUTBOUND_EVENT = {
    "confirmed": "demande.confirmed",
    "refused": "demande.refused",
    "cancelled": "demande.cancelled",
}

REFUSAL_REASONS = (
    "Pas de véhicule disponible",
    "Hors zone desservie",
    "Délai trop court",
    "Demande incomplète",
    "Autre",
)
CANCELLATION_REASONS = ("Demande du passager", "Annulation par MBT Taxis", "Autre")
NOT_COMPLETED_REASONS = ("Passager absent", "Annulation tardive par téléphone", "Autre")
CORRECTION_REASONS = ("Erreur de saisie", "Course finalement effectuée", "Autre")

MAX_REASON_LENGTH = 500


def allowed_targets(status: str, actor_type: str) -> list[str]:
    """Statuts d'arrivée possibles pour un acteur : l'interface n'affiche que ces actions."""
    return [to for (frm, to), actors in TRANSITIONS.items() if frm == status and actor_type in actors]


def reference_time(pickup_at: datetime, return_at: datetime | None) -> datetime:
    """Heure de référence de la clôture automatique : le retour pour un aller-retour (§5.5)."""
    return return_at or pickup_at


def cancellation_deadline(pickup_at: datetime, deadline_hours: int) -> datetime:
    return pickup_at - timedelta(hours=deadline_hours)
