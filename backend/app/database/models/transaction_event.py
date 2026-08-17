"""
FraudShield — Transaction Event ORM Model (Phase C)
====================================================
Represents a step in the transaction intelligence timeline.
Records each stage of the risk evaluation pipeline with its result.
"""

import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, Float, ForeignKey, Index, String, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.session import Base
from app.database.models.mixins import UUIDPrimaryKeyMixin, TimestampMixin

if TYPE_CHECKING:
    from app.database.models.transaction import Transaction


class TransactionEvent(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    """A single step in the transaction intelligence timeline."""

    __tablename__ = "transaction_events"

    __table_args__ = (
        Index("ix_transaction_events_transaction_id", "transaction_id"),
        Index("ix_transaction_events_occurred_at", "occurred_at"),
    )

    transaction_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("transactions.id", ondelete="CASCADE"),
        nullable=False,
    )

    event_type: Mapped[str] = mapped_column(
        String(128),
        nullable=False,
        comment="e.g. PAYMENT_INITIATED, RULE_ENGINE_EXECUTED, RISK_FUSION_COMPLETED",
    )

    engine: Mapped[str | None] = mapped_column(
        String(64),
        nullable=True,
        comment="Which engine emitted this event: RULE, ML, NLP, FUSION",
    )

    status: Mapped[str] = mapped_column(
        String(64),
        nullable=False,
        comment="COMPLETED, SKIPPED, FAILED",
    )

    explanation: Mapped[str | None] = mapped_column(
        String(1024),
        nullable=True,
        comment="Human-readable description of what happened",
    )

    risk_contribution: Mapped[float | None] = mapped_column(
        Float,
        nullable=True,
        comment="How much this stage contributed to the final risk score",
    )

    occurred_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
    )

    transaction: Mapped["Transaction"] = relationship(
        "Transaction",
        back_populates="timeline_events",
    )

    def __repr__(self) -> str:
        return (
            f"<TransactionEvent id={self.id} type={self.event_type} "
            f"status={self.status} tx={self.transaction_id}>"
        )
