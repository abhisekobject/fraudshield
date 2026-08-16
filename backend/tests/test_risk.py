"""
FraudShield — Risk Engine Tests
===============================
Validates analyzers, deterministic rule evaluation, and orchestration.
"""

import uuid
from decimal import Decimal
from datetime import datetime, timezone, timedelta
import pytest

from app.database.models import User, Device, Recipient, Transaction, RiskEvent, RiskReason
from app.database.models.enums import TransactionStatus, RiskLevel, InterventionType
from app.risk.types import TransactionContext, RiskFeature
from app.risk.rules.engine import RuleEngine
from app.risk.rules.definitions import NewDeviceRule, AmountAnomalyRule
from app.risk.orchestrator import RiskOrchestrator


@pytest.fixture
def risk_user(db_session):
    user = User(id=uuid.uuid4(), name="Risk User", email="risk@example.com")
    db_session.add(user)
    db_session.commit()
    return user


@pytest.fixture
def risk_device(db_session, risk_user):
    device = Device(
        id=uuid.uuid4(),
        user_id=risk_user.id,
        device_fingerprint="fingerprint-risk",
        first_seen_at=datetime.now(timezone.utc),
        last_seen_at=datetime.now(timezone.utc),
        is_trusted=True
    )
    db_session.add(device)
    db_session.commit()
    return device


@pytest.fixture
def risk_recipient(db_session, risk_user):
    recipient = Recipient(
        id=uuid.uuid4(),
        user_id=risk_user.id,
        recipient_identifier="risk@upi",
        first_seen_at=datetime.now(timezone.utc),
    )
    db_session.add(recipient)
    db_session.commit()
    return recipient


def test_rule_engine_aggregation():
    """Verify RuleEngine correctly aggregates rules into HIGH or MEDIUM."""
    engine = RuleEngine(rules=[NewDeviceRule()])
    
    # 1. Triggered Medium Rule
    features = {
        "device_is_new": RiskFeature(name="device_is_new", value=True, feature_type="bool")
    }
    eval_result = engine.evaluate(features)
    assert eval_result.risk_level == RiskLevel.MEDIUM
    assert eval_result.intervention == InterventionType.WARNING
    assert len(eval_result.triggered_rules) == 1

    # 2. No Rules Triggered
    features = {
        "device_is_new": RiskFeature(name="device_is_new", value=False, feature_type="bool")
    }
    eval_result2 = engine.evaluate(features)
    assert eval_result2.risk_level == RiskLevel.LOW
    assert eval_result2.intervention == InterventionType.PROCEED
    assert len(eval_result2.triggered_rules) == 0


def test_amount_anomaly_no_history():
    """Verify Amount Anomaly ignores missing history."""
    rule = AmountAnomalyRule()
    
    # Feature is extracted but is unavailable because no history exists
    features = {
        "amount_ratio_to_average": RiskFeature(
            name="amount_ratio_to_average", 
            value=None, 
            feature_type="float",
            is_available=False
        )
    }
    
    result = rule.evaluate(features)
    assert result is None  # Should not trigger


def test_amount_anomaly_triggers():
    """Verify Amount Anomaly triggers on 3x average."""
    rule = AmountAnomalyRule()
    
    features = {
        "amount_ratio_to_average": RiskFeature(
            name="amount_ratio_to_average", 
            value=4.5, 
            feature_type="float",
            is_available=True
        )
    }
    
    result = rule.evaluate(features)
    assert result is not None
    assert result.reason_code == "HIGH_AMOUNT_RELATIVE_TO_HISTORY"


def test_orchestrator_full_pipeline(db_session, risk_user, risk_device, risk_recipient):
    """Verify the orchestrator queries DB, evaluates, and persists RiskEvent."""
    
    # This is a new user, new device, new recipient, with NO prior transactions.
    tx = Transaction(
        id=uuid.uuid4(),
        user_id=risk_user.id,
        recipient_id=risk_recipient.id,
        device_id=risk_device.id,
        amount=Decimal("1500.00"),
        currency="INR",
        status=TransactionStatus.INITIATED,
        initiated_at=datetime.now(timezone.utc),
    )
    db_session.add(tx)
    db_session.commit()
    
    orchestrator = RiskOrchestrator()
    eval_result = orchestrator.evaluate(db_session, tx)
    
    # Because it's a first time transaction, it should trigger:
    # 1. NEW_DEVICE
    # 2. NEW_RECIPIENT
    # -> Risk Level should be MEDIUM
    
    assert eval_result.risk_level == RiskLevel.MEDIUM
    assert len(eval_result.triggered_rules) == 2
    
    # Verify DB Persistence
    risk_event = db_session.query(RiskEvent).filter_by(transaction_id=tx.id).first()
    assert risk_event is not None
    assert risk_event.risk_level == RiskLevel.MEDIUM
    
    reasons = db_session.query(RiskReason).filter_by(risk_event_id=risk_event.id).all()
    assert len(reasons) == 2
    reason_codes = [r.reason_code for r in reasons]
    assert "NEW_DEVICE" in reason_codes
    assert "NEW_RECIPIENT" in reason_codes
