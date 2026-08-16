"""
FraudShield — Logging Configuration
=====================================
Structured logging setup for the backend application.

Privacy rules:
- Raw transcripts must NEVER appear in log messages.
- Credentials, OTP values, and authentication secrets must NEVER be logged.
- Only safe identifiers (transaction ID, event ID, risk level) are logged.
"""

import logging
import sys

from app.core.config import settings


def configure_logging() -> None:
    """Configure root logger with appropriate level and format."""
    log_level = getattr(logging, settings.LOG_LEVEL.upper(), logging.INFO)

    logging.basicConfig(
        level=log_level,
        format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
        datefmt="%Y-%m-%dT%H:%M:%S",
        stream=sys.stdout,
    )

    # Suppress noisy third-party loggers
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)

    # Suppress SQLAlchemy engine echo in non-debug mode
    # (echo=True in DEBUG mode is set on the engine itself; this prevents
    # duplicate output in production)
    if not settings.DEBUG:
        logging.getLogger("sqlalchemy.engine").setLevel(logging.WARNING)
        logging.getLogger("sqlalchemy.pool").setLevel(logging.WARNING)
        logging.getLogger("sqlalchemy.dialects").setLevel(logging.WARNING)


# Configure on import
configure_logging()

logger = logging.getLogger("fraudshield")
