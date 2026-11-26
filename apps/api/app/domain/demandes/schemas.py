"""Contrat d'entrée de la création d'une demande (§18.7)."""

from __future__ import annotations

from typing import Literal

import phonenumbers
from email_validator import EmailNotValidError, validate_email
from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

Service = Literal["business", "daily", "vsl", "pmr"]
Language = Literal["fr", "nl", "en"]
MobilityAid = Literal["none", "walking_aid", "manual_wheelchair", "electric_wheelchair", "other"]

MIN_ELAPSED_MS = 3000


class Strict(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)


class AddressIn(Strict):
    formatted: str = Field(min_length=3, max_length=300)
    place_id: str | None = Field(default=None, max_length=300)
    instructions: str | None = Field(default=None, max_length=500)


class PassengerIn(Strict):
    first_name: str = Field(min_length=1, max_length=80)
    last_name: str = Field(min_length=1, max_length=80)
    phone: str = Field(min_length=6, max_length=30)
    email: str = Field(max_length=254)
    language: Language = "fr"

    @field_validator("phone")
    @classmethod
    def _phone(cls, value: str) -> str:
        try:
            parsed = phonenumbers.parse(value, "BE")
        except phonenumbers.NumberParseException:
            raise ValueError("Numéro de téléphone invalide.") from None
        if not phonenumbers.is_possible_number(parsed):
            raise ValueError("Numéro de téléphone invalide.")
        return phonenumbers.format_number(parsed, phonenumbers.PhoneNumberFormat.E164)

    @field_validator("email")
    @classmethod
    def _email(cls, value: str) -> str:
        try:
            return validate_email(value, check_deliverability=False).normalized.lower()
        except EmailNotValidError:
            raise ValueError("Adresse e-mail invalide.") from None


class NeedsIn(Strict):
    mobility_aid: MobilityAid = "none"
    stays_in_wheelchair: bool = False
    companions: int = Field(default=0, ge=0, le=7)
    door_to_door: bool = False
    notes: str | None = Field(default=None, max_length=500)

    @model_validator(mode="after")
    def _other_needs_notes(self) -> NeedsIn:
        if self.mobility_aid == "other" and not self.notes:
            raise ValueError("Précisez l'aide à la mobilité dans les remarques.")
        return self


class AntispamIn(Strict):
    hp: str = ""
    elapsed_ms: int = Field(default=0, ge=0)


class DemandeCreate(Strict):
    service: Service
    pickup_at: str = Field(pattern=r"^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$")
    pickup: AddressIn
    dropoff: AddressIn
    return_at: str | None = Field(default=None, pattern=r"^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$")
    return_pickup: AddressIn | None = None
    passenger_count: int = Field(default=1, ge=1, le=8)
    passenger: PassengerIn
    needs: NeedsIn | None = None
    health_consent: bool = False
    privacy_consent: bool
    comment: str | None = Field(default=None, max_length=1000)
    places_session_token: str | None = Field(default=None, max_length=200)
    antispam: AntispamIn = Field(default_factory=AntispamIn)

    @model_validator(mode="after")
    def _consistency(self) -> DemandeCreate:
        if self.return_pickup is not None and self.return_at is None:
            raise ValueError("Une adresse de retour exige une date de retour.")
        if self.needs is not None and self.needs.companions >= self.passenger_count:
            raise ValueError("Le nombre d'accompagnants doit être inférieur au nombre de passagers.")
        return self


class DemandeCreated(BaseModel):
    """Réponse à un invité : aucune donnée personnelle (§18.2)."""

    id: str
    reference: str
    status: str
