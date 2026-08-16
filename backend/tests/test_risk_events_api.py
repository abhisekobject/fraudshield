import uuid
import pytest
from fastapi.testclient import TestClient

from app.database.models import User, Device, Recipient, Transaction, RiskEvent
from app.database.models.enums import TransactionStatus, RiskLevel, InterventionType, RiskDecision, FeedbackClassification
from app.database.models.feedback import AnalystFeedback
from app.database.models.risk_reason import RiskReason


from datetime import datetime, timezone

@pytest.fixture
def test_user(db_session):
    u = User(id=uuid.uuid4(), name="Test Analyst User", email="analyst.test@example.com")
    db_session.add(u)
    db_session.commit()
    db_session.refresh(u)
    return u


@pytest.fixture
def test_risk_event(db_session, test_user):
    # Create required parent models
    now = datetime.now(timezone.utc)
    d = Device(id=uuid.uuid4(), user_id=test_user.id, device_fingerprint="fp1", first_seen_at=now, last_seen_at=now)
    r = Recipient(id=uuid.uuid4(), user_id=test_user.id, recipient_identifier="test@upi", first_seen_at=now)
    db_session.add_all([d, r])
    db_session.commit()

    t = Transaction(
        id=uuid.uuid4(),
        user_id=test_user.id,
        recipient_id=r.id,
        device_id=d.id,
        amount=500.0,
        transaction_type="UPI_SEND",
        status=TransactionStatus.PENDING_CONFIRMATION,
        initiated_at=now,
    )
    db_session.add(t)
    db_session.commit()
    
    re = RiskEvent(
        id=uuid.uuid4(),
        transaction_id=t.id,
        risk_score=0.85,
        risk_level=RiskLevel.HIGH,
        intervention=InterventionType.STRONG_WARNING,
        decision=RiskDecision.PENDING,
        evaluation_version="fusion-v1",
        evaluated_at=now,
    )
    db_session.add(re)
    db_session.commit()
    db_session.refresh(re)
    
    reason = RiskReason(
        id=uuid.uuid4(),
        risk_event_id=re.id,
        reason_code="NEW_DEVICE",
        severity="MEDIUM",
        message="New device detected",
    )
    db_session.add(reason)
    db_session.commit()
    
    return re


def test_list_risk_events(client: TestClient, test_risk_event):
    response = client.get("/api/v1/risk-events/")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] >= 1
    assert any(item["id"] == str(test_risk_event.id) for item in data["items"])


def test_get_risk_event_detail(client: TestClient, test_risk_event):
    response = client.get(f"/api/v1/risk-events/{test_risk_event.id}")
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == str(test_risk_event.id)
    assert data["risk_score"] == 0.85
    assert data["risk_level"] == "HIGH"
    
    # Check relationships are loaded
    assert "transaction" in data
    assert data["transaction"]["amount"] == "500.00"
    
    assert len(data["risk_reasons"]) == 1
    assert data["risk_reasons"][0]["reason_code"] == "NEW_DEVICE"


def test_submit_analyst_feedback(client: TestClient, test_risk_event):
    payload = {
        "label": "FALSE_POSITIVE",
        "notes": "Looks like the user just got a new phone."
    }
    
    # Ensure it's not present before
    response = client.get(f"/api/v1/risk-events/{test_risk_event.id}")
    assert len(response.json()["feedback_history"]) == 0
    
    response = client.post(
        f"/api/v1/risk-events/{test_risk_event.id}/feedback",
        json=payload,
        headers={"X-Analyst-ID": "test_analyst_01"}
    )
    assert response.status_code == 201
    feedback = response.json()
    assert feedback["classification"] == "FALSE_POSITIVE"
    assert feedback["comment"] == "Looks like the user just got a new phone."
    assert feedback["analyst_identifier"] == "test_analyst_01"
    
    # Fetch detail again, should see feedback in history
    response2 = client.get(f"/api/v1/risk-events/{test_risk_event.id}")
    detail = response2.json()
    assert len(detail["feedback_history"]) == 1
    assert detail["feedback_history"][0]["id"] == feedback["id"]


def test_get_risk_event_statistics(client: TestClient, test_risk_event):
    # Make sure we have some feedback to show in stats
    client.post(
        f"/api/v1/risk-events/{test_risk_event.id}/feedback",
        json={"label": "FALSE_POSITIVE", "notes": "Test"},
        headers={"X-Analyst-ID": "test_analyst_01"}
    )
    
    response = client.get("/api/v1/risk-events/statistics")
    assert response.status_code == 200
    stats = response.json()
    
    assert stats["total_events"] >= 1
    assert stats["reviewed_count"] >= 1
    assert stats["high_events"] >= 1
    assert stats["false_positive_count"] >= 1
