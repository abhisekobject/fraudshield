"""
FraudShield — Payment API Tests
================================
Validates the simulated payment endpoints, business logic constraints,
and ownership checks.
"""

import uuid
from datetime import datetime, timezone
import pytest

from app.database.models import User, Device, Recipient, Transaction
from app.database.models.enums import TransactionStatus


@pytest.fixture
def mock_user(db_session):
    user = User(id=uuid.uuid4(), name="Test User", email="test@example.com")
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture
def mock_device(db_session, mock_user):
    device = Device(
        id=uuid.uuid4(),
        user_id=mock_user.id,
        device_fingerprint="fingerprint-123",
        first_seen_at=datetime.now(timezone.utc),
        last_seen_at=datetime.now(timezone.utc),
    )
    db_session.add(device)
    db_session.commit()
    db_session.refresh(device)
    return device


@pytest.fixture
def mock_recipient(db_session, mock_user):
    recipient = Recipient(
        id=uuid.uuid4(),
        user_id=mock_user.id,
        recipient_identifier="1234567890@upi",
        first_seen_at=datetime.now(timezone.utc),
    )
    db_session.add(recipient)
    db_session.commit()
    db_session.refresh(recipient)
    return recipient


@pytest.fixture
def mock_transaction(db_session, mock_user, mock_device, mock_recipient):
    transaction = Transaction(
        id=uuid.uuid4(),
        user_id=mock_user.id,
        recipient_id=mock_recipient.id,
        device_id=mock_device.id,
        amount=500.00,
        currency="INR",
        status=TransactionStatus.INITIATED,
        initiated_at=datetime.now(timezone.utc),
    )
    db_session.add(transaction)
    db_session.commit()
    db_session.refresh(transaction)
    return transaction


def test_create_payment_success(client, mock_user, mock_recipient, mock_device):
    """A valid request creates a transaction in INITIATED state."""
    payload = {
        "user_id": str(mock_user.id),
        "recipient_id": str(mock_recipient.id),
        "device_id": str(mock_device.id),
        "amount": 1000.50,
        "currency": "INR",
    }
    response = client.post("/api/v1/payments", json=payload)
    
    assert response.status_code == 201
    data = response.json()
    # Due to Phase 3 Risk Engine integration, this triggers NEW_DEVICE and NEW_RECIPIENT rules (MEDIUM risk)
    # The API will transition the state to PENDING_CONFIRMATION before returning.
    assert data["transaction"]["status"] == "PENDING_CONFIRMATION"
    assert "id" in data["transaction"]


def test_create_payment_invalid_amount(client, mock_user, mock_recipient, mock_device):
    """Negative and zero amounts are rejected."""
    payload = {
        "user_id": str(mock_user.id),
        "recipient_id": str(mock_recipient.id),
        "device_id": str(mock_device.id),
        "amount": -50.00,
        "currency": "INR",
    }
    response = client.post("/api/v1/payments", json=payload)
    assert response.status_code == 422  # Pydantic validation error


def test_create_payment_ownership_failure(client, mock_user, mock_device, db_session):
    """Reject if the recipient doesn't belong to the user."""
    # Create another user and recipient
    other_user = User(id=uuid.uuid4(), name="Other", email="other@test.com")
    other_recipient = Recipient(
        id=uuid.uuid4(),
        user_id=other_user.id,
        recipient_identifier="other@upi",
        first_seen_at=datetime.now(timezone.utc),
    )
    db_session.add_all([other_user, other_recipient])
    db_session.commit()

    payload = {
        "user_id": str(mock_user.id),
        "recipient_id": str(other_recipient.id),
        "device_id": str(mock_device.id),
        "amount": 500.00,
        "currency": "INR",
    }
    response = client.post("/api/v1/payments", json=payload)
    assert response.status_code == 400
    assert "does not belong" in response.json()["detail"]


def test_get_transaction(client, mock_transaction):
    """Can retrieve a created transaction."""
    response = client.get(f"/api/v1/payments/{mock_transaction.id}")
    assert response.status_code == 200
    assert response.json()["id"] == str(mock_transaction.id)


def test_get_transaction_not_found(client):
    """404 for missing transaction."""
    response = client.get(f"/api/v1/payments/{uuid.uuid4()}")
    assert response.status_code == 404


def test_get_user_history(client, mock_user, mock_transaction):
    """Can retrieve paginated history for a user."""
    response = client.get(f"/api/v1/payments/user/{mock_user.id}?limit=10&offset=0")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 1
    assert len(data["items"]) == 1
    assert data["items"][0]["id"] == str(mock_transaction.id)


def test_valid_state_transition(client, mock_transaction):
    """Can transition from INITIATED to EVALUATING."""
    payload = {"target_status": "EVALUATING"}
    response = client.post(f"/api/v1/payments/{mock_transaction.id}/transition", json=payload)
    
    assert response.status_code == 200
    assert response.json()["status"] == "EVALUATING"


def test_invalid_state_transition(client, mock_transaction):
    """Cannot transition from INITIATED directly to COMPLETED."""
    payload = {"target_status": "COMPLETED"}
    response = client.post(f"/api/v1/payments/{mock_transaction.id}/transition", json=payload)
    
    assert response.status_code == 409
    assert "Illegal state transition" in response.json()["detail"]
