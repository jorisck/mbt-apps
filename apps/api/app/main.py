"""Point d'entrée ASGI : deux applications distinctes selon l'hôte (§3.1).

- `PUBLIC_API_HOST` (api.…) : API publique `/v1` et `/healthz` ;
- `ADMIN_HOST` (gestion.…)  : espace de gestion (HTML), sans CORS ;
- tout autre hôte reçoit 404.
"""

from __future__ import annotations

from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

import structlog
from fastapi import FastAPI
from fastapi.exceptions import RequestValidationError
from starlette.applications import Starlette
from starlette.exceptions import HTTPException as StarletteHTTPException
from starlette.requests import Request
from starlette.responses import Response
from starlette.routing import Host

from app.admin.app import create_admin_app
from app.api.v1 import auth as v1_auth
from app.api.v1 import config as v1_config
from app.api.v1 import demandes as v1_demandes
from app.api.v1 import me as v1_me
from app.api.v1 import messages as v1_messages
from app.config import settings
from app.db import dispose_engine
from app.errors import ApiProblem, api_problem_handler, problem_response, validation_handler
from app.health import healthz
from app.logging_config import configure_logging, init_sentry
from app.middleware import API_HEADERS, BodyLimitMiddleware, SecurityHeadersMiddleware

API_VERSION = "1.0.0"


async def _http_exception_handler(_: Request, exc: Exception) -> Response:
    assert isinstance(exc, StarletteHTTPException)
    code = {404: "not_found", 405: "method_not_allowed"}.get(exc.status_code, "http_error")
    return problem_response(ApiProblem(exc.status_code, code))


def create_public_app() -> FastAPI:
    docs = not settings.is_production
    app = FastAPI(
        title="MBT – API publique",
        version=API_VERSION,
        docs_url="/docs" if docs else None,
        redoc_url=None,
        openapi_url="/openapi.json" if docs else None,
    )
    app.include_router(v1_demandes.router, prefix="/v1")
    app.include_router(v1_messages.router, prefix="/v1")
    app.include_router(v1_config.router, prefix="/v1")
    app.include_router(v1_auth.router, prefix="/v1")
    app.include_router(v1_me.router, prefix="/v1")
    app.add_api_route("/healthz", healthz, methods=["GET"], include_in_schema=False)

    app.add_exception_handler(ApiProblem, api_problem_handler)
    app.add_exception_handler(RequestValidationError, validation_handler)
    app.add_exception_handler(StarletteHTTPException, _http_exception_handler)

    app.add_middleware(SecurityHeadersMiddleware, headers=API_HEADERS)
    app.add_middleware(BodyLimitMiddleware)
    return app


@asynccontextmanager
async def lifespan(_: Starlette) -> AsyncIterator[None]:
    configure_logging()
    init_sentry()
    structlog.get_logger("app").info("startup", env=settings.app_env)
    try:
        yield
    finally:
        await dispose_engine()


def create_app() -> Starlette:
    public = create_public_app()
    admin = create_admin_app()
    return Starlette(
        routes=[
            Host(settings.public_api_host, app=public, name="public"),
            Host(settings.admin_host, app=admin, name="admin"),
        ],
        lifespan=lifespan,
    )


app = create_app()
