"""
FraudShield — Risk Event ORM Model
======================================
Represents a fraud-risk evaluation associated with a transaction.

Purpose:
  Persist the result of the risk engine independently from the transaction.
  One transaction might technically have multiple risk events if it was
  re-evaluated (though typically it's 1:1).

Constraints:
  risk_score is between 0.0 and 1.0.
  confidence is between 0.0 and 1.0 (if present).

Relationships:
  - transaction: the payment that was evaluated
  - risk_reasons: the individual signals/reasons explaining the score
  - analyst_feedback: manual review by an institution analyst (if any)
"""

import uuid
from datetime import datetime
from typing import TYPE_CHECKING, List

from sqlalchemy import CheckConstraint, DateTime, Float, ForeignKey, Index, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.session import Base
from app.database.models.mixins import UUIDPrimaryKeyMixin, TimestampMixin
from app.database.models.enums import RiskLevel, InterventionType, RiskDecision

if TYPE_CHECKING:
    from app.database.models.transaction import Transaction
    from app.database.models.risk_reason import RiskReason
    from app.database.models.feedback import AnalystFeedback


class RiskEvent(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    """
    A fraud-risk evaluation for a specific transaction.
    """

    __tablename__ = "risk_events"

    __table_args__ = (
        CheckConstraint("risk_score >= 0.0 AND risk_score <= 1.0", name="ck_risk_events_score_range"),
        CheckConstraint("confidence >= 0.0 AND confidence <= 1.0", name="ck_risk_events_confidence_range"),
        Index("ix_risk_events_transaction_id", "transaction_id"),
        Index("ix_risk_events_risk_level", "risk_level"),
        Index("ix_risk_events_evaluated_at", "evaluated_at"),
        Index("ix_risk_events_decision", "decision"),
    )

    # --- Foreign key --------------------------------------------------------
    transaction_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("transactions.id", ondelete="CASCADE"),
        nullable=False,
    )

    # --- Evaluation results -------------------------------------------------
    risk_score: Mapped[float] = mapped_column(
        Float,
        nullable=False,
        comment="Normalized risk value between 0.0 and 1.0",
    )

    confidence: Mapped[float | None] = mapped_column(
        Float,
        nullable=True,
        comment="Normalized confidence between 0.0 and 1.0 (nullable if model doesn't support)",
    )

    risk_level: Mapped[RiskLevel] = mapped_column(
        String(32),
        nullable=False,
        comment="Categorical risk level (LOW, MEDIUM, HIGH, CRITICAL)",
    )

    intervention: Mapped[InterventionType] = mapped_column(
        String(32),
        nullable=False,
        comment="Recommended intervention (PROCEED, WARNING, etc.)",
    )

    # --- User response ------------------------------------------------------
    decision: Mapped[RiskDecision] = mapped_column(
        String(32),
        nullable=False,
        default=RiskDecision.PENDING,
        comment="User's eventual response (PENDING, CONFIRMED, CANCELLED)",
    )

    # --- Audit / Tracking ---------------------------------------------------
    evaluation_version: Mapped[str | None] = mapped_column(
        String(64),
        nullable=True,
        comment="Version identifier of the risk engine used for this evaluation",
    )

    evaluated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        comment="When the risk evaluation was completed (UTC)",
    )

    # --- Relationships ------------------------------------------------------
    transaction: Mapped["Transaction"] = relationship(
        "Transaction",
        back_populates="risk_events",
    )

    risk_reasons: Mapped[List["RiskReason"]] = relationship(
        "RiskReason",
        back_populates="risk_event",
        cascade="all, delete-orphan",
        lazy="select",
    )

    analyst_feedback: Mapped[List["AnalystFeedback"]] = relationship(
        "AnalystFeedback",
        back_populates="risk_event",
        # Analyst feedback is an important audit trail, don't cascade delete it silently
        cascade="save-update, merge",
        lazy="select",
    )

    def __repr__(self) -> str:
        return (
            f"<RiskEvent id={self.id} transaction_id={self.transaction_id} "
            f"score={self.risk_score} level={self.risk_level}>"
        )
