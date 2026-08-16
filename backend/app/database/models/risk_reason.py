"""
FraudShield — Risk Reason ORM Model
=======================================
Represents an individual explainability signal contributing to a risk event.

Purpose:
  Explainability is a core requirement. This table stores the derived reasons
  (e.g., NEW_DEVICE, AMOUNT_ANOMALY) why a transaction was flagged, which
  can be displayed to the user and the fraud analyst.

Privacy note:
  This table stores DERIVED risk reasons only.
  Do NOT store raw audio, raw conversations, or sensitive user inputs here.
  Instead of "User said 'transfer money immediately to my fake account'",
  store reason_code="AUTHORITY_IMPERSONATION" and signal_value=0.91.
"""

import uuid
from typing import TYPE_CHECKING

from sqlalchemy import Float, ForeignKey, Index, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.session import Base
from app.database.models.mixins import UUIDPrimaryKeyMixin, TimestampMixin
from app.database.models.enums import ReasonSeverity

if TYPE_CHECKING:
    from app.database.models.risk_event import RiskEvent


class RiskReason(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    """
    An individual explainability signal contributing to a RiskEvent.
    """

    __tablename__ = "risk_reasons"

    __table_args__ = (
        Index("ix_risk_reasons_risk_event_id", "risk_event_id"),
    )

    # --- Foreign key --------------------------------------------------------
    risk_event_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("risk_events.id", ondelete="CASCADE"),
        nullable=False,
    )

    # --- Explainability details ---------------------------------------------
    reason_code: Mapped[str] = mapped_column(
        String(128),
        nullable=False,
        comment="Machine-readable code (e.g., NEW_DEVICE, AMOUNT_ANOMALY)",
    )

    severity: Mapped[ReasonSeverity] = mapped_column(
        String(32),
        nullable=False,
        comment="How significantly this signal contributed to the risk (LOW, MEDIUM, HIGH, CRITICAL)",
    )

    message: Mapped[str] = mapped_column(
        String(512),
        nullable=False,
        comment="Human-readable explanation for UI display",
    )

    signal_value: Mapped[float | None] = mapped_column(
        Float,
        nullable=True,
        comment="Continuous value for the signal (if applicable, e.g., 0.91 for urgency). Null for categorical signals.",
    )

    # --- Relationships ------------------------------------------------------
    risk_event: Mapped["RiskEvent"] = relationship(
        "RiskEvent",
        back_populates="risk_reasons",
    )

    def __repr__(self) -> str:
        return (
            f"<RiskReason id={self.id} event_id={self.risk_event_id} "
            f"code={self.reason_code} severity={self.severity}>"
        )
