"""Application ASGI de l'espace de gestion (HTML rendu côté serveur, même origine, pas de CORS)."""

from __future__ import annotations

from fastapi import APIRouter, Depends, FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import FileResponse, HTMLResponse, PlainTextResponse, Response
from fastapi.staticfiles import StaticFiles
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.admin.deps import AuthRequired, csrf_protect
from app.admin.routes import account, admins, auth, dashboard, demandes, passagers, settings_audit, webhooks
from app.admin.templating import ADMIN_DIR, render
from app.errors import ApiProblem, problem_response
from app.middleware import ADMIN_HEADERS, BodyLimitMiddleware, SecurityHeadersMiddleware

STATIC_DIR = ADMIN_DIR / "static"
_HX_RETARGET = {
    "HX-Retarget": "#flash",
    "HX-Reswap": "innerHTML",
    "HX-Reselect": "#flash-error",
}


def _wants_fragment(request: Request) -> bool:
    return request.headers.get("hx-request") == "true"


async def problem_handler(request: Request, exc: Exception) -> Response:
    assert isinstance(exc, ApiProblem)
    if exc.code == "step_up_required" or exc.status >= 500:
        return problem_response(exc)  # JSON : consommé par admin.js
    message = exc.detail or "Action impossible."
    if _wants_fragment(request):
        return render(
            request,
            "_flash_error.html",
            {"message": message, "code": exc.code},
            status_code=exc.status,
            headers=_HX_RETARGET,
        )
    return render(request, "error.html", {"status": exc.status, "message": message}, status_code=exc.status)


async def validation_handler(request: Request, exc: Exception) -> Response:
    assert isinstance(exc, RequestValidationError)
    return await problem_handler(request, ApiProblem(422, "validation_error", "Saisie invalide : vérifiez les champs."))


async def http_handler(request: Request, exc: Exception) -> Response:
    assert isinstance(exc, StarletteHTTPException)
    if exc.status_code == 404:
        return await problem_handler(request, ApiProblem(404, "not_found", "Page introuvable."))
    if exc.status_code == 405:
        return await problem_handler(request, ApiProblem(405, "method_not_allowed", "Non autorisé."))
    return await problem_handler(request, ApiProblem(exc.status_code, "http_error", "Erreur."))


async def auth_required_handler(request: Request, _: Exception) -> Response:
    if _wants_fragment(request):
        return Response(status_code=401, headers={"HX-Redirect": "/login"})
    return HTMLResponse(
        '<!doctype html><meta charset="utf-8"><meta http-equiv="refresh" content="0;url=/login">'
        '<a href="/login">Se connecter</a>',
        status_code=401,
        headers={"Cache-Control": "no-store"},
    )


def create_admin_app() -> FastAPI:
    app = FastAPI(docs_url=None, redoc_url=None, openapi_url=None, title="MBT – gestion")

    protected = APIRouter(dependencies=[Depends(csrf_protect)])  # csrf_protect exige la session
    for module in (dashboard, demandes, passagers, admins, settings_audit, account, webhooks):
        protected.include_router(module.router)

    app.include_router(auth.router)
    app.include_router(protected)

    @app.get("/robots.txt", include_in_schema=False)
    async def robots() -> PlainTextResponse:
        return PlainTextResponse("User-agent: *\nDisallow: /\n")

    @app.get("/favicon.ico", include_in_schema=False)
    async def favicon() -> FileResponse:
        # Les navigateurs le demandent à la racine, même quand une balise <link> existe.
        return FileResponse(STATIC_DIR / "img" / "favicon.ico", media_type="image/x-icon")

    app.mount("/static", StaticFiles(directory=STATIC_DIR, check_dir=False), name="static")

    app.add_exception_handler(ApiProblem, problem_handler)
    app.add_exception_handler(RequestValidationError, validation_handler)
    app.add_exception_handler(StarletteHTTPException, http_handler)
    app.add_exception_handler(AuthRequired, auth_required_handler)

    app.add_middleware(SecurityHeadersMiddleware, headers=ADMIN_HEADERS)
    app.add_middleware(BodyLimitMiddleware)
    return app


__all__ = ["create_admin_app"]
