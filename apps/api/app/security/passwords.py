"""Mots de passe : Argon2id, longueur 12 à 128, liste locale de mots de passe courants (§10.1)."""

from __future__ import annotations

from argon2 import PasswordHasher
from argon2.exceptions import InvalidHashError, VerificationError, VerifyMismatchError

MIN_LENGTH = 12
MAX_LENGTH = 128

# Paramètres par défaut d'argon2-cffi : profil RFC 9106 « faible mémoire » (t=3, m=64 Mio, p=4).
_hasher = PasswordHasher()

# Liste locale (aucun appel externe). Seuls les mots de passe de 12 caractères ou plus comptent
# ici, la longueur minimale écartant déjà les autres.
COMMON_PASSWORDS = frozenset(
    {
        "password1234",
        "password12345",
        "password123456",
        "motdepasse123",
        "motdepasse1234",
        "123456789012",
        "1234567890123",
        "12345678901234",
        "012345678901",
        "111111111111",
        "000000000000",
        "aaaaaaaaaaaa",
        "azertyuiop12",
        "azertyuiopqs",
        "azertyuiop123",
        "qwertyuiop12",
        "qwertyuiop123",
        "qwertyuiopas",
        "qwertyuiop[]",
        "1qaz2wsx3edc",
        "1q2w3e4r5t6y",
        "zaq12wsxcde3",
        "abcdefghijkl",
        "abcd12345678",
        "iloveyou1234",
        "letmein12345",
        "welcome12345",
        "administrator",
        "administrator1",
        "admin1234567",
        "admin12345678",
        "changeme1234",
        "changemenow1",
        "passw0rd1234",
        "p@ssw0rd1234",
        "p@ssword1234",
        "password!234",
        "bienvenue1234",
        "bonjour12345",
        "bonjourbonjour",
        "soleil123456",
        "football1234",
        "monmotdepasse",
        "mbttaxis1234",
        "handycab1234",
        "mbttaxis2026",
        "handycab2026",
        "taxi12345678",
        "brussels1234",
        "bruxelles123",
        "tototototoo1",
        "trustno1trustno1",
        "dragon123456",
        "master123456",
        "shadow123456",
    }
)


class WeakPassword(ValueError):
    """Mot de passe refusé ; le message est affichable à l'utilisateur."""


def validate_password(password: str, *, email: str | None = None) -> None:
    if len(password) < MIN_LENGTH:
        raise WeakPassword(f"Le mot de passe doit contenir au moins {MIN_LENGTH} caractères.")
    if len(password) > MAX_LENGTH:
        raise WeakPassword(f"Le mot de passe ne peut pas dépasser {MAX_LENGTH} caractères.")
    lowered = password.lower()
    if lowered in COMMON_PASSWORDS or len(set(lowered)) <= 2:
        raise WeakPassword("Ce mot de passe est trop courant. Choisissez-en un autre.")
    if email:
        local = email.split("@", 1)[0].lower()
        if len(local) >= 4 and local in lowered:
            raise WeakPassword("Le mot de passe ne doit pas contenir votre adresse e-mail.")


def hash_password(password: str) -> str:
    return _hasher.hash(password)


def verify_password(password_hash: str, password: str) -> bool:
    try:
        return _hasher.verify(password_hash, password)
    except VerifyMismatchError, VerificationError, InvalidHashError:
        return False


def needs_rehash(password_hash: str) -> bool:
    return _hasher.check_needs_rehash(password_hash)


# Haché factice : calculé quand l'e-mail est inconnu, pour un temps de réponse constant (§10.5).
DUMMY_HASH = _hasher.hash("dummy-password-for-constant-time")


def burn_time(password: str) -> None:
    verify_password(DUMMY_HASH, password)
