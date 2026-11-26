"""Chiffrement applicatif AES-256-GCM avec trousseau de clés versionné (§9.3).

APP_ENCRYPTION_KEYS="k2:<32 octets base64>,k1:<32 octets base64>"
La première clé chiffre ; toutes peuvent déchiffrer.
"""

from __future__ import annotations

import base64
import os
import secrets
from functools import lru_cache

from cryptography.hazmat.primitives.ciphers.aead import AESGCM

from app.config import settings


class Keyring:
    def __init__(self, spec: str) -> None:
        pairs = [item.strip().split(":", 1) for item in spec.split(",") if item.strip()]
        if not pairs or any(len(p) != 2 for p in pairs):
            raise ValueError("APP_ENCRYPTION_KEYS invalide")
        self.keys = {kid: base64.b64decode(material) for kid, material in pairs}
        self.active_id = pairs[0][0]
        if any(len(k) != 32 for k in self.keys.values()):
            raise ValueError("APP_ENCRYPTION_KEYS invalide : chaque clé doit faire 32 octets")

    def encrypt(self, plaintext: bytes, aad: bytes) -> bytes:
        nonce = os.urandom(12)
        ciphertext = AESGCM(self.keys[self.active_id]).encrypt(nonce, plaintext, aad)
        return self.active_id.encode() + b":" + nonce + ciphertext

    def decrypt(self, blob: bytes, aad: bytes) -> bytes:
        kid, rest = blob.split(b":", 1)
        return AESGCM(self.keys[kid.decode()]).decrypt(rest[:12], rest[12:], aad)


def generate_key_spec(key_id: str = "k1") -> str:
    """Valeur utilisable pour APP_ENCRYPTION_KEYS (`python -m app.cli gen-key`)."""
    return f"{key_id}:{base64.b64encode(secrets.token_bytes(32)).decode()}"


@lru_cache
def get_keyring() -> Keyring:
    return Keyring(settings.app_encryption_keys)
