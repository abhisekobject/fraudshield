"""
FraudShield — Recipient ORM Model
====================================
Represents a payment recipient known to a simulated user.

Purpose:
  Supports detection of:
    - new / unknown recipients (high-risk signal)
    - recipient familiarity (known recipient = lower risk)
    - recipient transaction frequency
    - trusted vs. untrusted status

Privacy note:
  `recipient_identifier` is a SIMULATED UPI VPA / phone-number-style
  identifier.  No real banking information is stored here.

Uniqueness:
  A recipient_identifier is unique PER USER (not globally).
  The same VPA can exist as a recipient for multiple users.
  This is enforced by a composite unique constraint: (user_id, recipient_identifier).

is_trusted default:
  False — a recipient is unknown until the user explicitly trusts them or
  they accumulate enough transaction history.

Cascade policy:
  Recipients use cascade="all, delete-orphan" from User because a recipient
  record is user-scoped.  Transactions referencing a recipient must be handled
  before a recipient can be deleted (FK constraint in transactions table).
"""

import uuid
from datetime import datetime
from typing import TYPE_CHECKING, List

from sqlalchemy import (
    Boolean, DateTime, ForeignKey, Index, Integer,
    String, UniqueConstraint
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.session import Base
from app.database.models.mixins import UUIDPrimaryKeyMixin, TimestampMixin

if TYPE_CHECKING:
    from app.database.models.user import User
    from app.database.models.transaction import Transaction


class Recipient(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    """
    A payment recipient known to a simulated user.

    Relationships:
        user         — many-to-one: the user for whom this is a recipient
        transactions — one-to-many: transactions sent to this recipient
    """

    __tablename__ = "recipients"

    __table_args__ = (
        # A given identifier is unique per user
        UniqueConstraint(
            "user_id", "recipient_identifier",
            name="uq_recipients_user_identifier",
        ),
        Index("ix_recipients_user_id", "user_id"),
        Index("ix_recipients_identifier", "recipient_identifier"),
    )

    # --- Foreign key --------------------------------------------------------
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )

    # --- Recipient identity -------------------------------------------------
    recipient_identifier: Mapped[str] = mapped_column(
        String(320),
        nullable=False,
        comment="Simulated UPI VPA or mobile number (not real banking data)",
    )

    display_name: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
        comment="Human-readable label e.g. 'Mom', 'Grocery Store'",
    )

    # --- History ------------------------------------------------------------
    first_seen_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        comment="When this user first sent money to this recipient (UTC)",
    )

    last_transaction_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
        comment="Timestamp of the most recent transaction to this recipient (UTC)",
    )

    transaction_count: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False,
        comment="Cumulative count of transactions to this recipient",
    )

    # --- Trust status -------------------------------------------------------
    is_trusted: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False,
    )

    # --- Relationships ------------------------------------------------------
    user: Mapped["User"] = relationship(
        "User",
        back_populates="recipients",
    )

    transactions: Mapped[List["Transaction"]] = relationship(
        "Transaction",
        back_populates="recipient",
        # Do NOT cascade-delete transactions — they are audit records.
        cascade="save-update, merge",
        lazy="select",
    )

    def __repr__(self) -> str:
        return (
            f"<Recipient id={self.id} identifier={self.recipient_identifier!r} "
            f"user_id={self.user_id} count={self.transaction_count}>"
        )
