"""
FraudShield — Privacy Audit Event ORM Model (Phase J)
=====================================================
Records privacy-related events for transparency and compliance demonstration.
Documents when PII was detected, redacted, and how data was handled.
"""

import uuid
from datetime import datetime
from typing import Optional

from sqlalchemy import DateTime, ForeignKey, Index, Integer, String, Uuid
from sqlalchemy.orm import Mapped, mapped_column

from app.database.session import Base
from app.database.models.mixins import UUIDPrimaryKeyMixin, TimestampMixin


class PrivacyAuditEvent(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    """A privacy audit event recording how data was processed."""

    __tablename__ = "privacy_audit_events"

    __table_args__ = (
        Index("ix_privacy_audit_events_transaction_id", "transaction_id"),
        Index("ix_privacy_audit_events_occurred_at", "occurred_at"),
    )

    transaction_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        Uuid(as_uuid=True),
        nullable=True,
        comment="Associated transaction (if applicable)",
    )

    event_type: Mapped[str] = mapped_column(
        String(128),
        nullable=False,
        comment="e.g. TRANSCRIPT_RECEIVED, PII_DETECTED, PII_REDACTED, NLP_ANALYSIS_COMPLETED, RAW_CONTENT_DISCARDED",
    )

    detail: Mapped[Optional[str]] = mapped_column(
        String(1024),
        nullable=True,
        comment="Additional context about the privacy event",
    )

    pii_types_detected: Mapped[Optional[str]] = mapped_column(
        String(512),
        nullable=True,
        comment="Comma-separated PII types detected: PHONE, OTP, ACCOUNT_NUMBER, EMAIL, etc.",
    )

    redaction_count: Mapped[Optional[int]] = mapped_column(
        Integer,
        nullable=True,
        comment="Number of PII items redacted",
    )

    occurred_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
    )

    def __repr__(self) -> str:
        return (
            f"<PrivacyAuditEvent id={self.id} type={self.event_type} "
            f"tx={self.transaction_id}>"
        )
