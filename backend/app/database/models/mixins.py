"""
FraudShield — Mixin Base Classes
==================================
Shared column mixins used across all ORM models.

Design decisions:
  - UUIDs are used as primary keys throughout.
    Rationale: PKs never leak ordering information, work naturally in
    distributed systems, and are safe to expose in API responses.
  - All timestamps are timezone-aware (UTC).
    Rationale: Matches the project timestamp policy; avoids ambiguity when
    analysts in different timezones review events.
  - created_at is set once on INSERT (server_default).
  - updated_at is maintained by SQLAlchemy's onupdate hook.
"""

import uuid
from datetime import datetime, timezone

from sqlalchemy import DateTime, Uuid, func
from sqlalchemy.orm import Mapped, mapped_column


class UUIDPrimaryKeyMixin:
    """Provides a UUID v4 primary key column named `id`."""

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        nullable=False,
    )


class TimestampMixin:
    """
    Provides `created_at` and `updated_at` timestamp columns.

    Both are timezone-aware and stored in UTC.
    `created_at` is set once at INSERT time.
    `updated_at` is refreshed automatically on every UPDATE.
    """

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )
