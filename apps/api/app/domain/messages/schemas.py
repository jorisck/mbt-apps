"""Contrat d'entrée de POST /v1/messages : contact, devis, adaptation, location-vente (§18.2, D22)."""

from __future__ import annotations

from typing import Any, Literal

import phonenumbers
from email_validator import EmailNotValidError, validate_email
from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

from app.domain.demandes.schemas import MIN_ELAPSED_MS, AntispamIn

MessageKind = Literal["contact", "quote", "adaptation", "location_sale"]
Language = Literal["fr", "nl", "en"]


class Strict(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)


class MessageCreate(Strict):
    kind: MessageKind
    first_name: str = Field(min_length=1, max_length=80)
    last_name: str = Field(min_length=1, max_length=80)
    email: str = Field(max_length=254)
    phone: str | None = Field(default=None, max_length=30)
    language: Language = "fr"
    subject: str | None = Field(default=None, max_length=200)
    body: str = Field(min_length=1, max_length=5000)
    privacy_consent: bool
    details: dict[str, Any] = Field(default_factory=dict)
    antispam: AntispamIn = Field(default_factory=AntispamIn)

    @field_validator("email")
    @classmethod
    def _email(cls, value: str) -> str:
        try:
            return validate_email(value, check_deliverability=False).normalized.lower()
        except EmailNotValidError:
            raise ValueError("Adresse e-mail invalide.") from None

    @field_validator("phone")
    @classmethod
    def _phone(cls, value: str | None) -> str | None:
        if not value:
            return None
        try:
            parsed = phonenumbers.parse(value, "BE")
        except phonenumbers.NumberParseException:
            raise ValueError("Numéro de téléphone invalide.") from None
        if not phonenumbers.is_possible_number(parsed):
            raise ValueError("Numéro de téléphone invalide.")
        return phonenumbers.format_number(parsed, phonenumbers.PhoneNumberFormat.E164)

    @model_validator(mode="after")
    def _consent(self) -> MessageCreate:
        if not self.privacy_consent:
            raise ValueError("Le consentement est obligatoire.")
        return self


class MessageCreated(BaseModel):
    ok: bool = True


__all__ = ["MIN_ELAPSED_MS", "MessageCreate", "MessageCreated", "MessageKind"]
