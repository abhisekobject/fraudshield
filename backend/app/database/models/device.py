"""
FraudShield — Device ORM Model
================================
Represents a device associated with a simulated user.

Purpose:
  Supports device-change detection in the fraud risk engine.
  A user switching to a new, unknown device is a risk signal.

Privacy note:
  `device_fingerprint` is a SIMULATED identifier.
  It does NOT implement invasive real-world device fingerprinting.
  In the POC, it is a string supplied by the simulated UPI client,
  representing a device ID that a real implementation could derive
  from hardware identifiers.

is_trusted default:
  Devices default to is_trusted=False.
  Rationale: a new device is unknown until the user (or analyst) explicitly
  trusts it.  Defaulting to trusted would undermine the device-change signal.

Cascade policy:
  Devices use cascade="all, delete-orphan" from User because a device record
  has no independent meaning without its user.  However, individual device
  deletion should be blocked if linked transactions exist (handled by FK
  constraint in transactions table).
"""

import uuid
from datetime import datetime
from typing import TYPE_CHECKING, List

from sqlalchemy import Boolean, DateTime, ForeignKey, Index, String, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.session import Base
from app.database.models.mixins import UUIDPrimaryKeyMixin, TimestampMixin

if TYPE_CHECKING:
    from app.database.models.user import User
    from app.database.models.transaction import Transaction


class Device(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    """
    A device associated with a simulated user.

    Relationships:
        user         — many-to-one: the owning user
        transactions — one-to-many: transactions initiated from this device
    """

    __tablename__ = "devices"

    __table_args__ = (
        Index("ix_devices_user_id", "user_id"),
        Index("ix_devices_fingerprint", "device_fingerprint"),
    )

    # --- Foreign key --------------------------------------------------------
    user_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )

    # --- Device identity ----------------------------------------------------
    device_fingerprint: Mapped[str] = mapped_column(
        String(512),
        nullable=False,
        comment="Simulated device identifier — not real hardware fingerprint",
    )

    device_name: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
        comment="Human-readable label e.g. 'Pixel 9 Pro'",
    )

    # --- Timestamps specific to device lifecycle ----------------------------
    first_seen_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        comment="When this device was first registered for this user (UTC)",
    )

    last_seen_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        comment="When this device was most recently used (UTC)",
    )

    # --- Trust status -------------------------------------------------------
    is_trusted: Mapped[bool] = mapped_column(
        Boolean,
        default=False,   # Safe default: unknown devices are untrusted
        nullable=False,
    )

    # --- Relationships ------------------------------------------------------
    user: Mapped["User"] = relationship(
        "User",
        back_populates="devices",
    )

    transactions: Mapped[List["Transaction"]] = relationship(
        "Transaction",
        back_populates="device",
        # Do NOT cascade-delete transactions when a device is removed.
        # Transactions are audit records.
        cascade="save-update, merge",
        lazy="select",
    )

    def __repr__(self) -> str:
        return (
            f"<Device id={self.id} user_id={self.user_id} "
            f"trusted={self.is_trusted}>"
        )
