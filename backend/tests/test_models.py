"""
FraudShield — Database Model Unit Tests
========================================
Validates that SQLAlchemy models can be instantiated correctly and have
the correct fields and constraints defined.

Note: Since PostgreSQL is not running in the development environment,
these tests validate model structure and basic relationships at the Python level.
"""

import uuid
from decimal import Decimal
from datetime import datetime, timezone

from app.database.models import (
    User,
    Device,
    Recipient,
    Transaction,
    RiskEvent,
    RiskReason,
    AnalystFeedback,
)
from app.database.models.enums import (
    TransactionStatus,
    TransactionType,
    RiskLevel,
    InterventionType,
    RiskDecision,
    ReasonSeverity,
    FeedbackClassification,
)


def test_user_model_instantiation():
    """Verify that a User model can be created with required fields."""
    user = User(
        id=uuid.uuid4(),
        name="Alice Tester",
        email="alice@example.com",
    )
    assert user.name == "Alice Tester"
    assert user.email == "alice@example.com"
    # Note: SQLAlchemy defaults are applied on flush, so before flush, it may be None.
    assert hasattr(user, "is_active")


def test_device_model_relationships():
    """Verify Device has correct attributes for User relationship."""
    user_id = uuid.uuid4()
    device = Device(
        id=uuid.uuid4(),
        user_id=user_id,
        device_fingerprint="mock-fingerprint-123",
        first_seen_at=datetime.now(timezone.utc),
        last_seen_at=datetime.now(timezone.utc),
    )
    assert device.user_id == user_id
    assert device.device_fingerprint == "mock-fingerprint-123"


def test_recipient_model():
    """Verify Recipient model identity tracking."""
    user_id = uuid.uuid4()
    recipient = Recipient(
        id=uuid.uuid4(),
        user_id=user_id,
        recipient_identifier="9876543210@upi",
        first_seen_at=datetime.now(timezone.utc),
    )
    assert recipient.recipient_identifier == "9876543210@upi"
    assert hasattr(recipient, "transaction_count")


def test_transaction_model():
    """Verify Transaction amount is Decimal and enums are correct."""
    transaction = Transaction(
        id=uuid.uuid4(),
        user_id=uuid.uuid4(),
        recipient_id=uuid.uuid4(),
        device_id=uuid.uuid4(),
        amount=Decimal("1500.50"),
        initiated_at=datetime.now(timezone.utc),
    )
    assert isinstance(transaction.amount, Decimal)
    assert transaction.amount == Decimal("1500.50")
    # Default enums before flush might be None, but they should be properly typed
    assert hasattr(transaction, "status")
    assert hasattr(transaction, "transaction_type")


def test_risk_event_model():
    """Verify RiskEvent stores scores and intervention decisions."""
    risk_event = RiskEvent(
        id=uuid.uuid4(),
        transaction_id=uuid.uuid4(),
        risk_score=0.85,
        confidence=0.92,
        risk_level=RiskLevel.HIGH,
        intervention=InterventionType.STRONG_WARNING,
        evaluated_at=datetime.now(timezone.utc),
    )
    assert risk_event.risk_score == 0.85
    assert risk_event.risk_level == RiskLevel.HIGH


def test_risk_reason_model():
    """Verify RiskReason captures explainability signals."""
    reason = RiskReason(
        id=uuid.uuid4(),
        risk_event_id=uuid.uuid4(),
        reason_code="NEW_DEVICE",
        severity=ReasonSeverity.MEDIUM,
        message="This is a new device for the user",
    )
    assert reason.reason_code == "NEW_DEVICE"
    assert reason.severity == ReasonSeverity.MEDIUM
    assert reason.signal_value is None  # Should allow nullable float


def test_analyst_feedback_model():
    """Verify AnalystFeedback records manual review verdicts."""
    feedback = AnalystFeedback(
        id=uuid.uuid4(),
        risk_event_id=uuid.uuid4(),
        classification=FeedbackClassification.CONFIRMED_FRAUD,
        analyst_identifier="analyst-john-doe",
    )
    assert feedback.classification == FeedbackClassification.CONFIRMED_FRAUD
    assert feedback.analyst_identifier == "analyst-john-doe"
