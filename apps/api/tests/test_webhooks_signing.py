"""Tests unitaires : module signing.py (§9.2, guide §9).

Pas de base de données nécessaire.
"""

from __future__ import annotations

import base64
import time

import pytest

from app.domain.webhooks.signing import (
    _TEST_BODY,
    _TEST_EXPECTED,
    _TEST_MSG_ID,
    _TEST_SECRET,
    _TEST_TIMESTAMP,
    decode_secret,
    generate_secret,
    sign,
    signature_header,
    verify,
)

# --- Vecteur de test officiel (spec §9.2, guide §9) --------------------------------


def test_sign_official_vector() -> None:
    """Le vecteur de test officiel doit produire exactement la signature attendue."""
    key = decode_secret(_TEST_SECRET)
    result = sign(key, _TEST_MSG_ID, _TEST_TIMESTAMP, _TEST_BODY)
    assert result == _TEST_EXPECTED


def test_sign_different_body_rejected() -> None:
    """Un seul caractère modifié dans le corps doit produire une signature différente."""
    key = decode_secret(_TEST_SECRET)
    # Remplace le dernier `}` par `X` → octets réellement différents
    modified = _TEST_BODY[:-1] + b"X"
    result = sign(key, _TEST_MSG_ID, _TEST_TIMESTAMP, modified)
    assert result != _TEST_EXPECTED


def test_sign_prefix() -> None:
    """La signature doit commencer par `v1,`."""
    key = decode_secret(_TEST_SECRET)
    result = sign(key, _TEST_MSG_ID, _TEST_TIMESTAMP, _TEST_BODY)
    assert result.startswith("v1,")


# --- signature_header : rotation de secret (deux signatures) -------------------------


def test_signature_header_single_key() -> None:
    """Un seul secret → une seule signature dans l'en-tête."""
    key = decode_secret(_TEST_SECRET)
    header = signature_header([key], _TEST_MSG_ID, _TEST_TIMESTAMP, _TEST_BODY)
    assert header == _TEST_EXPECTED
    assert " " not in header


def test_signature_header_two_keys() -> None:
    """Deux secrets → deux signatures séparées par une espace (rotation)."""
    key1 = decode_secret(_TEST_SECRET)
    key2 = base64.b64decode("A" * 44 + "==")[:32]  # clé fictive 32 octets
    header = signature_header([key1, key2], _TEST_MSG_ID, _TEST_TIMESTAMP, _TEST_BODY)
    parts = header.split(" ")
    assert len(parts) == 2
    assert parts[0] == _TEST_EXPECTED
    assert parts[1].startswith("v1,")
    assert parts[0] != parts[1]


def test_signature_header_one_valid_one_fake_accepted() -> None:
    """En-tête `v1,AAAA… v1,<valide>` : la bonne signature est trouvée (rotation)."""
    key = decode_secret(_TEST_SECRET)
    fake_b64 = base64.b64encode(b"\x00" * 32).decode()
    sig_header = f"v1,{fake_b64} {_TEST_EXPECTED}"
    assert verify(key, _TEST_MSG_ID, _TEST_TIMESTAMP, _TEST_BODY, sig_header, _now=_TEST_TIMESTAMP)


# --- verify : tolérance d'horodatage -----------------------------------------------


def test_verify_valid_timestamp() -> None:
    key = decode_secret(_TEST_SECRET)
    assert verify(key, _TEST_MSG_ID, _TEST_TIMESTAMP, _TEST_BODY, _TEST_EXPECTED, _now=_TEST_TIMESTAMP)


def test_verify_timestamp_too_old() -> None:
    key = decode_secret(_TEST_SECRET)
    stale = _TEST_TIMESTAMP - 400  # 400 s d'écart > 300 s
    assert not verify(key, _TEST_MSG_ID, _TEST_TIMESTAMP, _TEST_BODY, _TEST_EXPECTED, _now=stale)


def test_verify_timestamp_in_future() -> None:
    key = decode_secret(_TEST_SECRET)
    future = _TEST_TIMESTAMP + 400
    assert not verify(key, _TEST_MSG_ID, _TEST_TIMESTAMP, _TEST_BODY, _TEST_EXPECTED, _now=future)


def test_verify_within_tolerance() -> None:
    key = decode_secret(_TEST_SECRET)
    close = _TEST_TIMESTAMP + 299  # < 300 s : accepté
    assert verify(key, _TEST_MSG_ID, _TEST_TIMESTAMP, _TEST_BODY, _TEST_EXPECTED, _now=close)


def test_verify_wrong_key() -> None:
    wrong_key = b"\x00" * 32
    assert not verify(wrong_key, _TEST_MSG_ID, _TEST_TIMESTAMP, _TEST_BODY, _TEST_EXPECTED, _now=_TEST_TIMESTAMP)


def test_verify_wrong_body() -> None:
    key = decode_secret(_TEST_SECRET)
    assert not verify(key, _TEST_MSG_ID, _TEST_TIMESTAMP, b"tampered", _TEST_EXPECTED, _now=_TEST_TIMESTAMP)


def test_verify_malformed_header_ignored() -> None:
    key = decode_secret(_TEST_SECRET)
    assert not verify(key, _TEST_MSG_ID, _TEST_TIMESTAMP, _TEST_BODY, "v2,somethingelse", _now=_TEST_TIMESTAMP)


# --- generate_secret & decode_secret -----------------------------------------------


def test_generate_secret_format() -> None:
    secret = generate_secret()
    assert secret.startswith("whsec_")
    decoded = base64.b64decode(secret.removeprefix("whsec_"))
    assert len(decoded) == 32


def test_generate_secret_unique() -> None:
    secrets = {generate_secret() for _ in range(20)}
    assert len(secrets) == 20


def test_decode_secret_roundtrip() -> None:
    key = decode_secret(_TEST_SECRET)
    assert len(key) == 32
    assert key == base64.b64decode("jmOigo2WR8R6RSIgn4MwSHnuC1l0YPN5H5KuR7s1Yqo=")
