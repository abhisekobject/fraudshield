import sys
from pathlib import Path

# Add the project root to sys.path so we can import from app
sys.path.append(str(Path(__file__).resolve().parent.parent))

from fastapi.testclient import TestClient # noqa: E402
from app.main import app # noqa: E402
from app.database.session import engine, Base, SessionLocal # noqa: E402
from app.database.models.enums import FeedbackClassification # noqa: E402
from app.schemas.feedback import FeedbackCreateRequest # noqa: E402

client = TestClient(app)

def reset_db():
    print("Dropping all tables...")
    Base.metadata.drop_all(bind=engine)
    print("Creating all tables...")
    Base.metadata.create_all(bind=engine)

def create_payment(user_id, amount, device_id, recipient_id, transcript=None):
    payload = {
        "user_id": user_id,
        "amount": amount,
        "device_id": device_id,
        "recipient_id": recipient_id,
    }
    if transcript:
        payload["interaction_context"] = {
            "transcript": transcript,
            "channel": "voice"
        }
    
    response = client.post("/api/v1/payments/", json=payload)
    response.raise_for_status()
    return response.json()

def submit_feedback(event_id, label, notes):
    request = FeedbackCreateRequest(label=label, notes=notes)
    response = client.post(
        f"/api/v1/risk-events/{event_id}/feedback", 
        json=request.model_dump(),
        headers={"X-Analyst-ID": "analyst_demo_001"}
    )
    response.raise_for_status()
    return response.json()

from app.database.models import User, Device, Recipient
from datetime import datetime, timezone

def main():
    print("FraudShield Phase 7 - Seeding Demo Data...")
    
    # We are using SQLite, so we can afford to just wipe and recreate tables
    reset_db()
    
    # Target User
    user_id = "11111111-1111-1111-1111-111111111111"
    trusted_device = "22222222-2222-2222-2222-222222222222"
    trusted_recipient = "33333333-3333-3333-3333-333333333333"

    # Insert parent entities
    db = SessionLocal()
    import uuid
    
    u_id = uuid.uuid4()
    d1_id = uuid.uuid4()
    d2_id = uuid.uuid4()
    d3_id = uuid.uuid4()
    r1_id = uuid.uuid4()
    r2_id = uuid.uuid4()
    r3_id = uuid.uuid4()
    
    u = User(id=u_id, name="Demo User", email="demo@example.com")
    db.add(u)
    
    d1 = Device(id=d1_id, user_id=u.id, device_fingerprint="fingerprint-trusted", first_seen_at=datetime.now(timezone.utc), last_seen_at=datetime.now(timezone.utc))
    d2 = Device(id=d2_id, user_id=u.id, device_fingerprint="fingerprint-new1", first_seen_at=datetime.now(timezone.utc), last_seen_at=datetime.now(timezone.utc))
    d3 = Device(id=d3_id, user_id=u.id, device_fingerprint="fingerprint-new2", first_seen_at=datetime.now(timezone.utc), last_seen_at=datetime.now(timezone.utc))
    db.add_all([d1, d2, d3])
    
    r1 = Recipient(id=r1_id, user_id=u.id, recipient_identifier="mom@upi", first_seen_at=datetime.now(timezone.utc), transaction_count=50)
    r2 = Recipient(id=r2_id, user_id=u.id, recipient_identifier="unknown1@upi", first_seen_at=datetime.now(timezone.utc), transaction_count=0)
    r3 = Recipient(id=r3_id, user_id=u.id, recipient_identifier="unknown2@upi", first_seen_at=datetime.now(timezone.utc), transaction_count=0)
    db.add_all([r1, r2, r3])
    
    db.commit()
    db.close()
    
    user_id = str(u_id)
    trusted_device = str(d1_id)
    trusted_recipient = str(r1_id)

    def get_event_id_for_tx(tx_id: str) -> str | None:
        db = SessionLocal()
        from app.database.models.risk_event import RiskEvent
        import uuid
        event = db.query(RiskEvent).filter(RiskEvent.transaction_id == uuid.UUID(tx_id)).first()
        db.close()
        return str(event.id) if event else None

    # 1. Legitimate low-risk transaction
    print("Seeding Legitimate Transaction...")
    p1 = create_payment(user_id, 500, trusted_device, trusted_recipient)

    # 2. New-device transaction (High Amount)
    print("Seeding New Device Transaction...")
    p2 = create_payment(user_id, 15000, str(d2_id), trusted_recipient)

    # 3. Voice-phishing-related transaction
    print("Seeding Voice Phishing Transaction...")
    p3 = create_payment(user_id, 4000, trusted_device, str(r2_id),
                        "I am calling from bank security. Tell me the OTP immediately.")

    # 4. Critical multi-signal transaction
    print("Seeding Multi-Signal Attack...")
    p4 = create_payment(user_id, 95000, str(d3_id), str(r3_id),
                        "Your account is frozen. Do not hang up. Transfer all funds to the safe account right now.")

    # Fetch risk event IDs after all payments are created
    e1_id = get_event_id_for_tx(p1["transaction"]["id"]) if p1 else None
    e2_id = get_event_id_for_tx(p2["transaction"]["id"]) if p2 else None
    e3_id = get_event_id_for_tx(p3["transaction"]["id"]) if p3 else None
    e4_id = get_event_id_for_tx(p4["transaction"]["id"]) if p4 else None
    
    # Now, simulate Analyst Reviews

    # Mark Legitimate one as FALSE_POSITIVE (e.g. maybe it was wrongly flagged in an older system, though here it's LOW)
    # Actually, marking a LOW risk as LEGITIMATE
    print("Seeding Analyst Feedback: Legitimate")
    if e1_id:
        submit_feedback(e1_id, FeedbackClassification.LEGITIMATE.value, "Normal transaction, confirmed by customer history.")
    
    # Mark New Device as FALSE_POSITIVE
    print("Seeding Analyst Feedback: False Positive")
    if e2_id:
        submit_feedback(e2_id, FeedbackClassification.FALSE_POSITIVE.value, "User bought a new phone and confirmed the emergency transfer.")
    
    # Mark Multi-Signal as CONFIRMED_FRAUD
    print("Seeding Analyst Feedback: Confirmed Fraud")
    if e4_id:
        submit_feedback(e4_id, FeedbackClassification.CONFIRMED_FRAUD.value, "Multiple independent signals indicate coordinated social engineering and payment fraud.")
    
    # Leave Voice Phishing unreviewed (Needs Review / Pending) -> Or we can mark UNCERTAIN
    print("Seeding Analyst Feedback: Needs Review")
    if e3_id:
        submit_feedback(e3_id, FeedbackClassification.UNCERTAIN.value, "Escalating to Tier 2 fraud squad.")

    print("Demo Data Seeded Successfully!")
    print("Available events generated for analyst dashboard.")

if __name__ == "__main__":
    main()
