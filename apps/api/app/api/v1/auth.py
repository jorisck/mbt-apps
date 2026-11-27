"""Routes d'authentification des passagers : /v1/auth (lot L8, §18.2–18.3)."""

from __future__ import annotations

from typing import Annotated

import phonenumbers
from email_validator import EmailNotValidError, validate_email
from fastapi import APIRouter, Depends, Request
from fastapi.responses import JSONResponse, Response
from pydantic import BaseModel, ConfigDict, Field, field_validator
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.deps import ClientInfo, get_client
from app.db import get_db
from app.domain.passengers import service as pax
from app.errors import PROBLEM_JSON, ApiProblem

router = APIRouter(prefix="/auth", tags=["auth"])

# --- Schémas d'entrée --------------------------------------------------------------------

_LANG = ("fr", "nl", "en")
_CLIENTS = ("site_mbt", "site_handycab", "app_ios", "app_android")


class RegisterIn(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    email: str = Field(max_length=254)
    password: str = Field(min_length=1, max_length=128)
    first_name: str = Field(min_length=1, max_length=80)
    last_name: str = Field(min_length=1, max_length=80)
    phone: str = Field(min_length=6, max_length=30)
    language: str = Field(default="fr")

    @field_validator("email")
    @classmethod
    def _email(cls, v: str) -> str:
        try:
            return validate_email(v, check_deliverability=False).normalized.lower()
        except EmailNotValidError:
            raise ValueError("Adresse e-mail invalide.") from None

    @field_validator("phone")
    @classmethod
    def _phone(cls, v: str) -> str:
        try:
            parsed = phonenumbers.parse(v, "BE")
        except phonenumbers.NumberParseException:
            raise ValueError("Numéro de téléphone invalide.") from None
        if not phonenumbers.is_possible_number(parsed):
            raise ValueError("Numéro de téléphone invalide.")
        return phonenumbers.format_number(parsed, phonenumbers.PhoneNumberFormat.E164)

    @field_validator("language")
    @classmethod
    def _lang(cls, v: str) -> str:
        if v not in _LANG:
            return "fr"
        return v


class VerifyEmailIn(BaseModel):
    token: str


class LoginIn(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    email: str
    password: str
    device_label: str | None = Field(default=None, max_length=120)


class RefreshIn(BaseModel):
    refresh_token: str


class LogoutIn(BaseModel):
    refresh_token: str


class ForgotIn(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)
    email: str


class ResetIn(BaseModel):
    token: str
    password: str = Field(min_length=1, max_length=128)


# --- Schémas de réponse ------------------------------------------------------------------

class RegisterOut(BaseModel):
    message: str


class TokenOut(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str


# --- Routes ------------------------------------------------------------------------------

def _ip(request: Request) -> str | None:
    from app.security.client_ip import client_ip
    return client_ip(request)


@router.post(
    "/register",
    response_model=RegisterOut,
    status_code=201,
    summary="Inscription d'un passager",
)
async def register(
    body: RegisterIn,
    request: Request,
    client: Annotated[ClientInfo, Depends(get_client)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> RegisterOut:
    try:
        await pax.register(
            db,
            email=body.email,
            password=body.password,
            first_name=body.first_name,
            last_name=body.last_name,
            phone=body.phone,
            language=body.language,
            ip=_ip(request),
        )
    except pax.PassengerError as exc:
        raise ApiProblem(422, "registration_error", str(exc)) from exc
    return RegisterOut(message="Un e-mail de vérification a été envoyé.")


@router.post(
    "/verify-email",
    response_model=RegisterOut,
    summary="Vérification de l'adresse e-mail",
)
async def verify_email(
    body: VerifyEmailIn,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> RegisterOut:
    try:
        await pax.verify_email(db, body.token)
    except pax.PassengerError as exc:
        raise ApiProblem(422, "invalid_token", str(exc)) from exc
    return RegisterOut(message="Adresse e-mail vérifiée.")


@router.post(
    "/token",
    summary="Connexion (e-mail + mot de passe)",
)
async def token(
    body: LoginIn,
    request: Request,
    client: Annotated[ClientInfo, Depends(get_client)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> Response:
    # On NE lève PAS d'exception en cas d'échec : la transaction doit commiter pour persister
    # les incréments de `failed_logins` / `locked_until` (même pattern que l'admin HTML).
    result = await pax.login(
        db,
        email=body.email,
        password=body.password,
        client=client.origin,
        device_label=body.device_label,
        ip=_ip(request),
        user_agent=request.headers.get("user-agent"),
    )
    if not result.ok or result.pair is None:
        problem = ApiProblem(401, "invalid_credentials", result.error or "Identifiants invalides.")
        return JSONResponse(problem.body(), status_code=401, media_type=PROBLEM_JSON)
    pair = result.pair
    return JSONResponse(
        {"access_token": pair.access_token, "refresh_token": pair.refresh_token, "token_type": pair.token_type}
    )


@router.post(
    "/refresh",
    summary="Rotation du jeton de rafraîchissement",
)
async def refresh(
    body: RefreshIn,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> Response:
    # Pas d'exception levée : la transaction doit commiter pour persister la révocation.
    result = await pax.refresh(db, body.refresh_token)
    if not result.ok or result.pair is None:
        problem = ApiProblem(401, "invalid_refresh_token", result.error or "Jeton invalide.")
        return JSONResponse(problem.body(), status_code=401, media_type=PROBLEM_JSON)
    pair = result.pair
    return JSONResponse(
        {"access_token": pair.access_token, "refresh_token": pair.refresh_token, "token_type": pair.token_type}
    )


@router.post(
    "/logout",
    status_code=204,
    summary="Déconnexion (révocation de la famille de jetons)",
)
async def logout(
    body: LogoutIn,
    request: Request,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> None:
    """Révoque la famille de jetons identifiée par le jeton de rafraîchissement fourni."""
    import hashlib
    token_hash = hashlib.sha256(body.refresh_token.encode()).digest()
    from sqlalchemy import select

    from app.domain.actors import Actor
    from app.models import PassengerRefreshToken
    row = await db.scalar(select(PassengerRefreshToken).where(PassengerRefreshToken.token_hash == token_hash))
    if row is not None:
        actor = Actor.passenger(row.passenger_id, _ip(request), request.headers.get("user-agent"))
        await pax.logout(db, row.passenger_id, row.family_id, actor)


@router.post(
    "/password/forgot",
    response_model=RegisterOut,
    summary="Demande de réinitialisation de mot de passe",
)
async def forgot_password(
    body: ForgotIn,
    request: Request,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> RegisterOut:
    # Réponse identique que l'e-mail existe ou non.
    await pax.forgot_password(db, body.email, _ip(request))
    return RegisterOut(message="Si cette adresse est connue, un e-mail a été envoyé.")


@router.post(
    "/password/reset",
    response_model=RegisterOut,
    summary="Réinitialisation du mot de passe",
)
async def reset_password(
    body: ResetIn,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> RegisterOut:
    try:
        await pax.reset_password(db, body.token, body.password)
    except pax.PassengerError as exc:
        raise ApiProblem(422, "invalid_token", str(exc)) from exc
    return RegisterOut(message="Mot de passe réinitialisé.")
