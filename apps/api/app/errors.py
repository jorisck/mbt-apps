"""Erreurs métier et format RFC 9457 (`application/problem+json`) avec un `code` stable (§7.1)."""

from __future__ import annotations

from typing import Any

from fastapi import Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

PROBLEM_JSON = "application/problem+json"


class ApiProblem(Exception):  # noqa: N818
    def __init__(
        self,
        status: int,
        code: str,
        detail: str = "",
        errors: dict[str, str] | None = None,
        headers: dict[str, str] | None = None,
    ) -> None:
        super().__init__(code)
        self.status = status
        self.code = code
        self.detail = detail
        self.errors = errors or {}
        self.headers = headers or {}

    def body(self) -> dict[str, Any]:
        body: dict[str, Any] = {
            "type": "about:blank",
            "title": self.code,
            "status": self.status,
            "code": self.code,
        }
        if self.detail:
            body["detail"] = self.detail
        if self.errors:
            body["errors"] = self.errors
        return body


class PreconditionFailed(ApiProblem):
    def __init__(self, code: str = "revision_mismatch") -> None:
        super().__init__(412, code, "La demande a été modifiée entre-temps.")


class Conflict(ApiProblem):
    def __init__(self, code: str = "invalid_transition", detail: str = "") -> None:
        super().__init__(409, code, detail or "Transition non autorisée.")


class BusinessRule(ApiProblem):
    def __init__(self, code: str, detail: str) -> None:
        super().__init__(422, code, detail)


def problem_response(problem: ApiProblem) -> JSONResponse:
    return JSONResponse(problem.body(), status_code=problem.status, media_type=PROBLEM_JSON, headers=problem.headers)


async def api_problem_handler(_: Request, exc: Exception) -> JSONResponse:
    assert isinstance(exc, ApiProblem)
    return problem_response(exc)


def _field_name(loc: tuple[Any, ...]) -> str:
    parts = [str(p) for p in loc if p not in {"body", "query", "header", "path"}]
    return ".".join(parts) or "body"


async def validation_handler(_: Request, exc: Exception) -> JSONResponse:
    assert isinstance(exc, RequestValidationError)
    errors: dict[str, str] = {}
    for item in exc.errors():
        errors.setdefault(_field_name(tuple(item.get("loc", ()))), str(item.get("msg", "invalide")))
    return problem_response(ApiProblem(422, "validation_error", "Requête invalide.", errors))
