"""
FraudShield — Payment Service
===============================
Business logic layer for simulated transactions.

Enforces domain constraints (ownership validation) and legal state transitions.
Ensures the API layer remains thin and decoupled from SQLAlchemy internals.
"""

import uuid
from datetime import datetime, timezone
from typing import Sequence
from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database.models import User, Device, Recipient, Transaction
from app.database.models.enums import TransactionStatus
from app.schemas.payment import CreatePaymentRequest


def validate_payment_ownership(
    db: Session, user_id: uuid.UUID, recipient_id: uuid.UUID, device_id: uuid.UUID
) -> None:
    """
    Ensures that the user, recipient, and device exist in the database.
    If a recipient or device already exists but belongs to a different user, raises 400.
    If they do not exist (e.g. random inputs from simulator), we dynamically create them
    so the ML model can evaluate them as unseen entities.
    """
    # 1. User exists
    user = db.execute(select(User).where(User.id == user_id)).scalar_one_or_none()
    if not user:
        user = User(id=user_id, email=f"{user_id}@demo.local", name="Demo User")
        db.add(user)

    # 2. Recipient belongs to user (or create it)
    recipient = db.execute(
        select(Recipient).where(Recipient.id == recipient_id)
    ).scalar_one_or_none()

    if not recipient:
        recipient = Recipient(
            id=recipient_id,
            user_id=user_id,
            recipient_identifier=f"ACC-{recipient_id}",
            first_seen_at=datetime.now(timezone.utc)
        )
        db.add(recipient)
    elif recipient.user_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Recipient {recipient_id} does not belong to user {user_id}.",
        )

    # 3. Device belongs to user (or create it)
    device = db.execute(
        select(Device).where(Device.id == device_id)
    ).scalar_one_or_none()

    if not device:
        now = datetime.now(timezone.utc)
        device = Device(
            id=device_id,
            user_id=user_id,
            device_fingerprint=f"DEV-{device_id}",
            first_seen_at=now,
            last_seen_at=now
        )
        db.add(device)
    elif device.user_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Device {device_id} does not belong to user {user_id}.",
        )

    # Commit any newly created entities so the foreign keys for the transaction are valid
    db.commit()



def validate_state_transition(
    current_status: TransactionStatus, target_status: TransactionStatus
) -> None:
    """
    Centralized state-machine logic.
    Raises 409 Conflict if the transition is illegal.
    Idempotent: if current == target and both are terminal, silently succeeds.
    """
    # Idempotent guard: already in the desired terminal state, no-op.
    # This handles the case where LOW-risk transactions are auto-completed by
    # the risk engine, and the frontend still tries to confirm them.
    TERMINAL_STATES = {
        TransactionStatus.COMPLETED,
        TransactionStatus.CANCELLED,
        TransactionStatus.FAILED,
    }
    if current_status == target_status and current_status in TERMINAL_STATES:
        return

    valid_transitions = {
        TransactionStatus.INITIATED: [
            TransactionStatus.EVALUATING,
            TransactionStatus.CANCELLED,
        ],
        TransactionStatus.EVALUATING: [
            TransactionStatus.PENDING_CONFIRMATION,
            TransactionStatus.COMPLETED,  # e.g., Low risk bypasses confirmation
            TransactionStatus.CANCELLED,
        ],
        TransactionStatus.PENDING_CONFIRMATION: [
            TransactionStatus.COMPLETED,
            TransactionStatus.CANCELLED,
        ],
        TransactionStatus.COMPLETED: [],
        TransactionStatus.CANCELLED: [],
        TransactionStatus.FAILED: [],
    }

    allowed = valid_transitions.get(current_status, [])
    if target_status not in allowed:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Illegal state transition from {current_status} to {target_status}",
        )


def create_transaction(db: Session, request: CreatePaymentRequest) -> Transaction:
    """
    Creates a new payment attempt.
    Transaction begins in the INITIATED state.
    """
    validate_payment_ownership(
        db, request.user_id, request.recipient_id, request.device_id
    )

    transaction = Transaction(
        user_id=request.user_id,
        recipient_id=request.recipient_id,
        device_id=request.device_id,
        amount=request.amount,
        currency=request.currency.upper(),
        status=TransactionStatus.INITIATED,
        initiated_at=datetime.now(timezone.utc),
    )

    db.add(transaction)
    db.commit()
    db.refresh(transaction)
    
    return transaction


def get_transaction_by_id(db: Session, transaction_id: uuid.UUID) -> Transaction:
    """Retrieve a transaction or raise 404."""
    transaction = db.execute(
        select(Transaction).where(Transaction.id == transaction_id)
    ).scalar_one_or_none()
    
    if not transaction:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Transaction not found."
        )
    return transaction


def get_user_transactions(
    db: Session, user_id: uuid.UUID, limit: int = 20, offset: int = 0
) -> tuple[Sequence[Transaction], int]:
    """Retrieve paginated transactions for a user."""
    # Ensure user exists to avoid empty lists masking a 404
    user = db.execute(select(User.id).where(User.id == user_id)).scalar_one_or_none()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="User not found."
        )

    # Base query
    base_query = select(Transaction).where(Transaction.user_id == user_id)

    # Count
    from sqlalchemy import func
    total_query = select(func.count()).select_from(base_query.subquery())
    total = db.execute(total_query).scalar_one()

    # Data
    stmt = base_query.order_by(Transaction.initiated_at.desc()).offset(offset).limit(limit)
    transactions = db.execute(stmt).scalars().all()

    return transactions, total


def transition_transaction_status(
    db: Session, transaction_id: uuid.UUID, target_status: TransactionStatus
) -> Transaction:
    """
    Moves a transaction to a new state if legal.
    Records completed_at if entering a terminal state.
    """
    transaction = get_transaction_by_id(db, transaction_id)
    
    validate_state_transition(transaction.status, target_status)
    
    transaction.status = target_status
    
    # Terminal states record completion time
    if target_status in [
        TransactionStatus.COMPLETED,
        TransactionStatus.CANCELLED,
        TransactionStatus.FAILED,
    ]:
        transaction.completed_at = datetime.now(timezone.utc)
        
    db.commit()
    db.refresh(transaction)
    
    return transaction
