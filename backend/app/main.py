"""
FraudShield Backend — Application Entry Point
==============================================
FastAPI application factory, middleware, and startup configuration.
"""

import uuid
import logging
from fastapi import FastAPI, Request, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from sqlalchemy import text

from app.core.config import settings
from app.database.session import get_db

logger = logging.getLogger("fraudshield.main")


# ---------------------------------------------------------------------------
# Application factory
# ---------------------------------------------------------------------------

def create_application() -> FastAPI:
    """Create and configure the FastAPI application."""

    application = FastAPI(
        title=settings.APP_NAME,
        description=(
            "FraudShield — Explainable Real-Time Fraud Risk API for UPI, "
            "Voice Phishing and Social Engineering (Hackathon POC). "
            "This is a proof-of-concept and NOT a production banking system."
        ),
        version=settings.APP_VERSION,
        docs_url="/api/docs",
        redoc_url="/api/redoc",
        openapi_url="/api/openapi.json",
    )

    # --- CORS ---------------------------------------------------------------
    application.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # --- X-Request-ID middleware --------------------------------------------
    @application.middleware("http")
    async def request_id_middleware(request: Request, call_next):
        """
        Accepts or generates a request correlation ID.
        The ID is echoed back in the response header for debugging.
        Purpose: traceability only — NOT an authentication mechanism.
        """
        incoming = request.headers.get("X-Request-ID", "")
        # Only use incoming ID if it looks like a valid UUID
        try:
            request_id = str(uuid.UUID(incoming)) if incoming else str(uuid.uuid4())
        except ValueError:
            request_id = str(uuid.uuid4())

        response = await call_next(request)
        response.headers["X-Request-ID"] = request_id
        return response

    # --- Global exception handler -------------------------------------------
    @application.exception_handler(Exception)
    async def unhandled_exception_handler(request: Request, exc: Exception):
        """
        Catch-all handler that prevents raw Python tracebacks, SQL queries,
        or filesystem paths from reaching API consumers.
        The original exception is logged at ERROR level for diagnostics.
        """
        logger.error(
            "Unhandled exception on %s %s: %s",
            request.method,
            request.url.path,
            repr(exc),
            exc_info=True,
        )
        return JSONResponse(
            status_code=500,
            content={"detail": "An internal server error occurred. Please try again later."},
        )

    # --- Routers ------------------------------------------------------------
    from app.api.routes.payments import router as payments_router
    from app.api.routes.interactions import router as interactions_router
    from app.api.routes.risk_events import router as risk_events_router

    application.include_router(payments_router, prefix="/api/v1/payments", tags=["payments"])
    application.include_router(interactions_router, prefix="/api/v1/interactions", tags=["interactions"])
    application.include_router(risk_events_router, prefix="/api/v1/risk-events", tags=["risk_events"])

    return application


app = create_application()


# ---------------------------------------------------------------------------
# Health check — liveness probe
# ---------------------------------------------------------------------------

@app.get("/health", tags=["diagnostics"])
async def health_check() -> dict:
    """
    Liveness probe. Confirms the API process is running and reachable.
    Also exposes lightweight service status information for the Dashboard UI.
    """
    from app.api.routes.payments import _orchestrator

    ml_available = _orchestrator.ml_service.is_available
    ml_version = _orchestrator.ml_service.version

    return {
        "status": "ok",
        "service": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "environment": settings.APP_ENV,
        "services": {
            "database": "connected",
            "ml_engine": ml_version if ml_available else "degraded (unavailable)",
        },
    }


# ---------------------------------------------------------------------------
# Readiness check — readiness probe
# ---------------------------------------------------------------------------

@app.get("/ready", tags=["diagnostics"])
async def readiness_check(db: Session = Depends(get_db)) -> dict:
    """
    Readiness probe. Verifies that the application is capable of serving
    requests by checking critical dependencies.

    - database: checked via a lightweight ping query
    - ml_model: reflects whether the fraud model artifact was loaded
    - nlp: always available (deterministic pattern analyzer, no external deps)

    An overall status of READY_WITH_DEGRADED_OPTIONAL indicates that
    the deterministic rule engine is fully operational but an optional
    component (e.g. ML model) is unavailable.

    The application is considered READY unless the database is unreachable.
    """
    from app.api.routes.payments import _orchestrator

    # --- Database ping ---
    db_status = "READY"
    db_error: str | None = None
    try:
        db.execute(text("SELECT 1"))
    except Exception as e:
        db_status = "UNAVAILABLE"
        db_error = "Database connection failed"
        logger.warning("Readiness check: DB unreachable — %s", repr(e))

    # --- ML model status ---
    ml_available = _orchestrator.ml_service.is_available
    ml_version = _orchestrator.ml_service.version
    ml_status = "READY" if ml_available else "DEGRADED"

    # --- NLP status (always available) ---
    nlp_status = "READY"

    # --- Overall ---
    if db_status != "READY":
        overall = "NOT_READY"
    elif not ml_available:
        overall = "READY_WITH_DEGRADED_OPTIONAL"
    else:
        overall = "READY"

    response: dict = {
        "status": overall,
        "components": {
            "database": {"status": db_status},
            "rules": {"status": "READY"},
            "ml_model": {
                "status": ml_status,
                "version": ml_version,
                "available": ml_available,
            },
            "nlp": {"status": nlp_status},
        },
    }
    if db_error:
        response["components"]["database"]["detail"] = db_error

    return response
