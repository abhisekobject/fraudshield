"""
FraudShield — User ORM Model
==============================
Represents a simulated FraudShield user (payment sender).

Privacy note:
  This table stores only the minimum identity information needed for the
  simulated payment environment.  It does NOT store:
    - UPI PINs
    - banking passwords
    - card numbers
    - real bank account credentials
    - authentication secrets

Security note:
  Passwords are NOT stored here.  A future authentication phase will add a
  hashed credential store separately.  This model intentionally has no
  password column to prevent accidental plaintext storage.
"""

import uuid
from datetime import datetime
from typing import TYPE_CHECKING, List

from sqlalchemy import Boolean, Index, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.session import Base
from app.database.models.mixins import UUIDPrimaryKeyMixin, TimestampMixin

if TYPE_CHECKING:
    from app.database.models.device import Device
    from app.database.models.recipient import Recipient
    from app.database.models.transaction import Transaction


class User(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    """
    Simulated FraudShield user (payment sender).

    Relationships:
        devices      — one-to-many: devices registered by this user
        recipients   — one-to-many: payment recipients known to this user
        transactions — one-to-many: payment attempts initiated by this user
    """

    __tablename__ = "users"

    __table_args__ = (
        UniqueConstraint("email", name="uq_users_email"),
        Index("ix_users_email", "email"),
    )

    # --- Identity -----------------------------------------------------------
    name: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )

    email: Mapped[str] = mapped_column(
        String(320),   # RFC 5321 max email length
        nullable=False,
    )

    # --- Status -------------------------------------------------------------
    is_active: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False,
    )

    # --- Relationships ------------------------------------------------------
    devices: Mapped[List["Device"]] = relationship(
        "Device",
        back_populates="user",
        cascade="all, delete-orphan",
        lazy="select",
    )

    recipients: Mapped[List["Recipient"]] = relationship(
        "Recipient",
        back_populates="user",
        cascade="all, delete-orphan",
        lazy="select",
    )

    transactions: Mapped[List["Transaction"]] = relationship(
        "Transaction",
        back_populates="user",
        # Transactions are NOT cascade-deleted: they are audit records.
        # Deletion policy: RESTRICT — a user with transactions cannot be
        # deleted without explicitly handling those transactions first.
        cascade="save-update, merge",
        lazy="select",
    )

    def __repr__(self) -> str:
        return f"<User id={self.id} email={self.email!r}>"
