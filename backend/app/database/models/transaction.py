"""
FraudShield — Transaction ORM Model
=======================================
Represents a simulated UPI payment attempt.

This is one of the most important tables in the schema.
The risk engine evaluates a transaction in context and produces
a RiskEvent that references this record.

Money / Decimal policy:
  `amount` uses NUMERIC(14,2) — i.e. up to 12 digits before the decimal
  point and 2 digits after.  For INR this supports amounts up to
  ₹999,999,999,999.99 which is more than sufficient for any UPI transaction.

  Rationale for NOT using Float/Double:
    IEEE-754 floating point cannot represent many decimal fractions exactly.
    Using float for monetary amounts causes cumulative rounding errors.
    PostgreSQL's NUMERIC is exact and safe for financial values.

  This is enforced at the Python layer via Python's `Decimal` type and at
  the database layer via the NUMERIC column type.

  Currency defaults to INR (simulated UPI environment).
  No currency conversion is implemented.

Amount constraint:
  A CHECK constraint enforces amount > 0 at the database level.
  Application-level validation alone is insufficient for an audit table.

Cascade policy:
  Transactions are audit records.  They are NEVER automatically deleted
  by cascading from a parent.  The `save-update, merge` cascade is used
  on all parent relationships.  Risk events DO cascade-delete from
  transactions (a risk evaluation without a transaction is meaningless),
  but the risk event itself carries the audit trail.

Indexes:
  - user_id        — common filter: "all transactions for user X"
  - recipient_id   — common filter: "all transactions to recipient Y"
  - device_id      — device-change query support
  - initiated_at   — time-range queries for velocity analysis
  - status         — filter by payment lifecycle state
  - (user_id, initiated_at) composite — velocity queries per user over time
"""

import uuid
from datetime import datetime
from decimal import Decimal
from typing import TYPE_CHECKING, List

from sqlalchemy import (
    CheckConstraint, DateTime, ForeignKey, Index,
    Numeric, String, UniqueConstraint, Uuid
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.session import Base
from app.database.models.mixins import UUIDPrimaryKeyMixin, TimestampMixin
from app.database.models.enums import TransactionStatus, TransactionType

if TYPE_CHECKING:
    from app.database.models.user import User
    from app.database.models.device import Device
    from app.database.models.recipient import Recipient
    from app.database.models.risk_event import RiskEvent
    from app.database.models.transaction_event import TransactionEvent


class Transaction(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    """
    A simulated UPI payment attempt.

    Relationships:
        user        — many-to-one: user who initiated the payment
        recipient   — many-to-one: intended payment recipient
        device      — many-to-one: device used to initiate payment
        risk_events — one-to-many: risk evaluations for this transaction
    """

    __tablename__ = "transactions"

    __table_args__ = (
        # Enforce positive amounts at the database level
        CheckConstraint("amount > 0", name="ck_transactions_amount_positive"),
        # Indexes for common access patterns
        Index("ix_transactions_user_id", "user_id"),
        Index("ix_transactions_recipient_id", "recipient_id"),
        Index("ix_transactions_device_id", "device_id"),
        Index("ix_transactions_initiated_at", "initiated_at"),
        Index("ix_transactions_status", "status"),
        # Composite: velocity queries — all transactions by a user in time order
        Index("ix_transactions_user_initiated", "user_id", "initiated_at"),
    )

    # --- Foreign keys -------------------------------------------------------
    user_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("users.id", ondelete="RESTRICT"),
        nullable=False,
        comment="User who initiated this payment",
    )

    recipient_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("recipients.id", ondelete="RESTRICT"),
        nullable=False,
        comment="Intended recipient of this payment",
    )

    device_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("devices.id", ondelete="RESTRICT"),
        nullable=False,
        comment="Device from which this payment was initiated",
    )

    # --- Amount (EXACT DECIMAL — no floating point) -------------------------
    amount: Mapped[Decimal] = mapped_column(
        Numeric(precision=14, scale=2),
        nullable=False,
        comment="Payment amount in the specified currency (exact decimal)",
    )

    currency: Mapped[str] = mapped_column(
        String(3),
        nullable=False,
        default="INR",
        server_default="INR",
        comment="ISO 4217 currency code — defaults to INR for simulated UPI",
    )

    # --- Classification -----------------------------------------------------
    transaction_type: Mapped[TransactionType] = mapped_column(
        String(32),
        nullable=False,
        default=TransactionType.UPI_SEND,
        comment="Category of simulated payment",
    )

    # --- Lifecycle ----------------------------------------------------------
    status: Mapped[TransactionStatus] = mapped_column(
        String(32),
        nullable=False,
        default=TransactionStatus.INITIATED,
        comment="Current lifecycle state of the payment",
    )

    initiated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        comment="When the payment was first created (UTC)",
    )

    completed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
        comment="When the payment reached a terminal state (UTC) — null if pending",
    )

    # --- Relationships ------------------------------------------------------
    user: Mapped["User"] = relationship(
        "User",
        back_populates="transactions",
    )

    recipient: Mapped["Recipient"] = relationship(
        "Recipient",
        back_populates="transactions",
    )

    device: Mapped["Device"] = relationship(
        "Device",
        back_populates="transactions",
    )

    risk_events: Mapped[List["RiskEvent"]] = relationship(
        "RiskEvent",
        back_populates="transaction",
        # Risk events are meaningful only in the context of their transaction.
        # When a transaction is deleted (uncommon — only via explicit admin
        # action), its risk events are also removed.
        cascade="all, delete-orphan",
        lazy="select",
    )

    timeline_events: Mapped[List["TransactionEvent"]] = relationship(
        "TransactionEvent",
        back_populates="transaction",
        cascade="all, delete-orphan",
        lazy="select",
    )

    def __repr__(self) -> str:
        return (
            f"<Transaction id={self.id} amount={self.amount} {self.currency} "
            f"status={self.status} user_id={self.user_id}>"
        )
