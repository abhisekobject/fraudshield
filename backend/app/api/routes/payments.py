"""
FraudShield — Payment Routes
==============================
API endpoints for the simulated payment lifecycle.

These endpoints orchestrate the request handling, delegation to the service layer,
and potential future hooks into the risk engine. They do not contain raw DB queries.
"""

import uuid
from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.schemas.payment import (
    CreatePaymentRequest,
    PaymentResponse,
    TransactionDetailResponse,
    TransactionHistoryResponse,
    TransactionStateTransitionRequest,
)
from app.services import payment_service


router = APIRouter()


from app.risk.orchestrator import RiskOrchestrator
from app.database.models.enums import RiskLevel, TransactionStatus

# Module-level singleton so the ML model is only loaded once
_orchestrator = RiskOrchestrator()

@router.post(
    "",
    status_code=status.HTTP_201_CREATED,
    summary="Initiate a simulated payment",
)
def create_payment(
    request: CreatePaymentRequest, db: Session = Depends(get_db)
):
    """
    Creates a new payment transaction.
    
    1. Validates user, recipient, and device exist.
    2. Validates recipient and device belong to the user.
    3. Records the transaction in INITIATED state.
    4. Invokes the risk orchestrator to evaluate the payment.
    
    Returns: { transaction: {...}, risk_evaluation: {...} }
    """
    transaction = payment_service.create_transaction(db, request)
    
    # -----------------------------------------------------------------------
    # RISK BOUNDARY
    # -----------------------------------------------------------------------
    risk_evaluation = None
    try:
        from app.nlp.types import InteractionContext
        int_ctx = None
        if request.interaction_context:
            int_ctx = InteractionContext(
                transaction_id=transaction.id,
                channel=request.interaction_context.get("channel", "voice"),
                transcript=request.interaction_context.get("transcript", "")
            )
        risk_evaluation = _orchestrator.evaluate(db, transaction, int_ctx)
    except Exception as e:
        # We must never silently let a failed transaction through without risk review.
        # Fail the payment loudly so the user knows something went wrong.
        import logging
        logging.getLogger(__name__).error(f"Risk orchestration failed completely for tx {transaction.id}: {e}", exc_info=True)
        
        # We transition it to failed, although the DB might rollback from the exception
        payment_service.transition_transaction_status(db, transaction.id, TransactionStatus.FAILED)
        
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Transaction could not be processed due to a risk engine failure. Please try again."
        )
    
    # POC State Transition based on preliminary risk evaluation
    # First, move to EVALUATING
    transaction = payment_service.transition_transaction_status(
        db, transaction.id, TransactionStatus.EVALUATING
    )
    
    if risk_evaluation.risk_level == RiskLevel.LOW:
        # For LOW risk, we proceed cleanly to COMPLETED
        transaction = payment_service.transition_transaction_status(
            db, transaction.id, TransactionStatus.COMPLETED
        )
    else:
        # MEDIUM, HIGH, CRITICAL require intervention UI, so it hangs in PENDING_CONFIRMATION
        transaction = payment_service.transition_transaction_status(
            db, transaction.id, TransactionStatus.PENDING_CONFIRMATION
        )

    return {
        "transaction": PaymentResponse.model_validate(transaction).model_dump(mode="json"),
        "risk_evaluation": risk_evaluation.model_dump(mode="json"),
    }


@router.get(
    "/user/{user_id}",
    response_model=TransactionHistoryResponse,
    summary="Get user transaction history",
)
def get_user_history(
    user_id: uuid.UUID,
    limit: Annotated[int, Query(ge=1, le=100, description="Pagination limit")] = 20,
    offset: Annotated[int, Query(ge=0, description="Pagination offset")] = 0,
    db: Session = Depends(get_db),
):
    """Retrieves paginated transactions initiated by a specific user."""
    items, total = payment_service.get_user_transactions(db, user_id, limit, offset)
    return TransactionHistoryResponse(
        items=list(items),
        total=total,
        limit=limit,
        offset=offset,
    )


@router.get(
    "/{transaction_id}",
    response_model=TransactionDetailResponse,
    summary="Get transaction details",
)
def get_transaction(
    transaction_id: uuid.UUID, db: Session = Depends(get_db)
):
    """Retrieves the full details of a specific transaction."""
    return payment_service.get_transaction_by_id(db, transaction_id)


@router.post(
    "/{transaction_id}/transition",
    response_model=PaymentResponse,
    summary="Manually transition a transaction state (Simulated Confirmation/Cancellation)",
)
def transition_transaction(
    transaction_id: uuid.UUID,
    request: TransactionStateTransitionRequest,
    db: Session = Depends(get_db),
):
    """
    Simulates a user or system confirming or cancelling a transaction 
    after an intervention has been displayed.
    
    Adheres strictly to the state-machine rules.
    """
    return payment_service.transition_transaction_status(
        db, transaction_id, request.target_status
    )
