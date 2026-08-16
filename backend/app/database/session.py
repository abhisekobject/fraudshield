"""
FraudShield — Database Session Management
==========================================
SQLAlchemy engine and session factory.

Engine configuration automatically adapts to SQLite (testing) vs
PostgreSQL (production) — connection pooling is disabled for SQLite
since it uses a single file/in-memory connection.
"""

from sqlalchemy import create_engine, text
from sqlalchemy.orm import DeclarativeBase, sessionmaker
from sqlalchemy.exc import SQLAlchemyError

from app.core.config import settings


# ---------------------------------------------------------------------------
# Engine
# ---------------------------------------------------------------------------

def _build_engine():
    """
    Build the SQLAlchemy engine with appropriate options for the DB backend.

    SQLite: no pool args (pool_size / max_overflow do not apply)
    PostgreSQL: full connection pooling configuration
    """
    url = settings.DATABASE_URL
    is_sqlite = url.startswith("sqlite")

    common_kwargs = {
        "echo": settings.DEBUG,       # Log SQL statements in development only
        "pool_pre_ping": True,        # Verify connection health before use
    }

    if not is_sqlite:
        common_kwargs.update({
            "pool_size": 5,
            "max_overflow": 10,
            "pool_timeout": 30,
            "pool_recycle": 1800,     # Recycle connections after 30 minutes
        })
    else:
        # SQLite in-memory / file: use StaticPool or NullPool is handled
        # by test fixtures; production path is always PostgreSQL.
        common_kwargs["connect_args"] = {"check_same_thread": False}

    return create_engine(url, **common_kwargs)


engine = _build_engine()


# ---------------------------------------------------------------------------
# Session factory
# ---------------------------------------------------------------------------

SessionLocal = sessionmaker(
    bind=engine,
    autocommit=False,
    autoflush=False,
)


# ---------------------------------------------------------------------------
# Declarative base — all ORM models inherit from this
# ---------------------------------------------------------------------------

class Base(DeclarativeBase):
    """Base class for all SQLAlchemy ORM models."""
    pass


# ---------------------------------------------------------------------------
# FastAPI dependency
# ---------------------------------------------------------------------------

def get_db():
    """
    FastAPI dependency that provides a database session per request.
    The session is rolled back on any unhandled exception so the connection
    is returned to the pool in a clean state, then closed unconditionally.
    """
    db = SessionLocal()
    try:
        yield db
    except SQLAlchemyError:
        db.rollback()
        raise
    finally:
        db.close()
