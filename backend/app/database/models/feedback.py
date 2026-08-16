"""
FraudShield — Analyst Feedback ORM Model
============================================
Represents institutional review of a risk event.

Purpose:
  Allows fraud analysts to identify whether a flagged event was legitimate
  (false positive) or confirmed fraud. This closes the feedback loop and
  enables future model improvement.

Identity note:
  `analyst_identifier` is a simulated/reference identifier, not a real
  authenticated account, as authentication is not implemented in this phase.
"""

import uuid
from typing import TYPE_CHECKING

from sqlalchemy import ForeignKey, Index, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.session import Base
from app.database.models.mixins import UUIDPrimaryKeyMixin, TimestampMixin
from app.database.models.enums import FeedbackClassification

if TYPE_CHECKING:
    from app.database.models.risk_event import RiskEvent


class AnalystFeedback(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    """
    An analyst's manual review of a RiskEvent.
    """

    __tablename__ = "analyst_feedback"

    __table_args__ = (
        Index("ix_analyst_feedback_risk_event_id", "risk_event_id"),
    )

    # --- Foreign key --------------------------------------------------------
    risk_event_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("risk_events.id", ondelete="CASCADE"),
        nullable=False,
    )

    # --- Feedback details ---------------------------------------------------
    classification: Mapped[FeedbackClassification] = mapped_column(
        String(32),
        nullable=False,
        comment="Analyst verdict (LEGITIMATE, FALSE_POSITIVE, CONFIRMED_FRAUD, UNCERTAIN)",
    )

    comment: Mapped[str | None] = mapped_column(
        String(1024),
        nullable=True,
        comment="Optional qualitative notes from the analyst",
    )

    analyst_identifier: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
        comment="Simulated reference identifier for the analyst who performed the review",
    )

    # --- Relationships ------------------------------------------------------
    risk_event: Mapped["RiskEvent"] = relationship(
        "RiskEvent",
        back_populates="analyst_feedback",
    )

    def __repr__(self) -> str:
        return (
            f"<AnalystFeedback id={self.id} event_id={self.risk_event_id} "
            f"classification={self.classification} analyst={self.analyst_identifier}>"
        )
