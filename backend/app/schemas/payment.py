"""
FraudShield — Payment API Schemas
==================================
Pydantic models defining the API boundaries for simulated payments.

These schemas ensure clients cannot inject risk scores or arbitrary statuses.
Money amounts use Decimal to prevent precision loss.
"""

import uuid
import hashlib
from datetime import datetime
from decimal import Decimal
from pydantic import BaseModel, ConfigDict, Field, condecimal, field_validator

from app.database.models.enums import TransactionStatus, TransactionType


# ---------------------------------------------------------------------------
# Request Schemas
# ---------------------------------------------------------------------------

class CreatePaymentRequest(BaseModel):
    """
    Client request to initiate a new simulated payment.
    """
    user_id: uuid.UUID = Field(
        ..., description="The user initiating the payment"
    )
    recipient_id: uuid.UUID = Field(
        ..., description="The intended recipient"
    )
    device_id: uuid.UUID = Field(
        ..., description="The device used for this transaction"
    )
    amount: condecimal(gt=Decimal("0.0"), decimal_places=2, max_digits=14) = Field(
        ..., description="Payment amount (must be positive, max 2 decimal places)"
    )
    currency: str = Field(
        default="INR", min_length=3, max_length=3, description="Currency code (e.g., INR)"
    )
    interaction_context: dict | None = Field(
        default=None, description="Optional interaction context for NLP evaluation."
    )

    @field_validator("user_id", "recipient_id", "device_id", mode="before")
    @classmethod
    def convert_string_to_uuid(cls, v):
        if isinstance(v, uuid.UUID):
            return v
        if isinstance(v, str):
            try:
                return uuid.UUID(v)
            except ValueError:
                # Dynamically convert any arbitrary string to a deterministic UUID
                m = hashlib.md5()
                m.update(v.encode("utf-8"))
                return uuid.UUID(m.hexdigest())
        return v


class TransactionStateTransitionRequest(BaseModel):
    """
    Request to manually progress a transaction's lifecycle.
    (This is for the simulation UI to confirm/cancel after an intervention).
    """
    target_status: TransactionStatus = Field(
        ..., description="The requested new status (e.g., COMPLETED, CANCELLED)"
    )


# ---------------------------------------------------------------------------
# Response Schemas
# ---------------------------------------------------------------------------

class PaymentResponse(BaseModel):
    """
    Standard response after initiating or modifying a payment.
    """
    id: uuid.UUID
    user_id: uuid.UUID
    recipient_id: uuid.UUID
    device_id: uuid.UUID
    amount: Decimal
    currency: str
    status: TransactionStatus
    initiated_at: datetime
    completed_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)


class TransactionDetailResponse(PaymentResponse):
    """
    Detailed response for a specific transaction (can be expanded later to include risk_events).
    """
    transaction_type: TransactionType
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class TransactionHistoryResponse(BaseModel):
    """
    Paginated list of transactions.
    """
    items: list[TransactionDetailResponse]
    total: int
    limit: int
    offset: int
