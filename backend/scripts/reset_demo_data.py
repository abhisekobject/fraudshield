#!/usr/bin/env python3
"""
FraudShield — Demo Environment Reset Script (Phase 9)
=====================================================
Drops and recreates the database tables, then seeds deterministic demo data
that provides a stable, reproducible foundation for all 7 hackathon scenarios.

This script is ONLY for development / demonstration environments.
It will DESTROY all existing data in the database.

Usage:
    cd backend
    python scripts/reset_demo_data.py

The script sets up the following entities:

Users:       demo_user_001 (established user)
Devices:     dev_trusted_001 (trusted, 5 COMPLETED txns)
             dev_new_001     (never used, 0 COMPLETED txns)
             dev_untrusted_001 (untrusted flag set)
Recipients:  rec_trusted_001 (known, 10 COMPLETED txns)
             rec_new_001     (never paid, 0 COMPLETED txns)
             rec_new_002     (never paid, 0 COMPLETED txns)

Historical transactions seeded to create the necessary context:
- 5 COMPLETED transactions with dev_trusted_001 -> rec_trusted_001
  at amounts of 1000, 1500, 2000, 800, 1200 (avg ≈ 1300)
  → Amount anomaly threshold (3x) will trigger at amounts > ~3900
- 4 COMPLETED transactions within the last hour to demo velocity
  (used in the high_velocity scenario)
"""

import sys
import os
import uuid
from pathlib import Path
from datetime import datetime, timezone, timedelta
from decimal import Decimal

# Add the project root to sys.path so we can import from app
sys.path.append(str(Path(__file__).resolve().parent.parent))

# ---------------------------------------------------------------------------
# Demo DB Configuration
# Override DATABASE_URL before importing app modules.
# By default: use a local SQLite file (`fraudshield_demo.db`) so the
# script works without PostgreSQL/Docker. Set DEMO_USE_POSTGRES=1 to
# use the configured PostgreSQL instance instead.
# ---------------------------------------------------------------------------
_DEMO_DB_PATH = os.environ.get("DEMO_DB_PATH", str(Path(__file__).resolve().parent.parent / "fraudshield_demo.db"))
if not os.environ.get("DEMO_USE_POSTGRES"):
    os.environ["DATABASE_URL"] = f"sqlite:///{_DEMO_DB_PATH}"

from sqlalchemy import text  # noqa: E402
from app.database.session import engine, Base, SessionLocal  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402
from app.main import app  # noqa: E402
from app.database.models.risk_event import RiskEvent  # noqa: E402
from app.database.models.enums import FeedbackClassification  # noqa: E402

# ---------------------------------------------------------------------------
# Deterministic UUIDs (Fixed seeds for reproducibility)
# ---------------------------------------------------------------------------

USER_001_ID   = uuid.UUID("a0000000-0000-0000-0000-000000000001")
USER_CLEAN_ID = uuid.UUID("c0000000-0000-0000-0000-000000000001")  # Isolated LOW-risk demo user

DEV_TRUSTED   = uuid.UUID("a0000000-0000-0000-0000-000000000010")
DEV_NEW       = uuid.UUID("a0000000-0000-0000-0000-000000000011")
DEV_UNTRUSTED = uuid.UUID("a0000000-0000-0000-0000-000000000012")
DEV_CLEAN     = uuid.UUID("c0000000-0000-0000-0000-000000000010")  # Trusted device for clean user

REC_TRUSTED   = uuid.UUID("a0000000-0000-0000-0000-000000000020")
REC_NEW_001   = uuid.UUID("a0000000-0000-0000-0000-000000000021")
REC_NEW_002   = uuid.UUID("a0000000-0000-0000-0000-000000000022")
REC_CLEAN     = uuid.UUID("c0000000-0000-0000-0000-000000000020")  # Trusted recipient for clean user

# Public reference maps for convenience
DEMO_IDS = {
    "user_id":          str(USER_001_ID),
    "user_clean":       str(USER_CLEAN_ID),
    "dev_trusted":      str(DEV_TRUSTED),
    "dev_new":          str(DEV_NEW),
    "dev_untrusted":    str(DEV_UNTRUSTED),
    "dev_clean":        str(DEV_CLEAN),
    "rec_trusted":      str(REC_TRUSTED),
    "rec_new_001":      str(REC_NEW_001),
    "rec_new_002":      str(REC_NEW_002),
    "rec_clean":        str(REC_CLEAN),
}


def reset_db() -> None:
    """Drop all tables and recreate them from the SQLAlchemy metadata."""
    print("  [DB] Dropping all tables...")
    Base.metadata.drop_all(bind=engine)
    print("  [DB] Creating all tables...")
    Base.metadata.create_all(bind=engine)
    print("  [DB] Schema reset complete.")


def seed_entities(db) -> None:
    """Seed the base entities: user, devices, recipients using raw SQL for SQLite compatibility."""
    # Use naive UTC strings to match SQLAlchemy's SQLite datetime format.
    def _ts(dt: datetime) -> str:
        """Strip timezone info and return a string SQLite can compare with ORM-inserted values."""
        if dt.tzinfo is not None:
            dt = dt.astimezone(timezone.utc).replace(tzinfo=None)
        return dt.strftime("%Y-%m-%d %H:%M:%S.%f")

    now = datetime.now(timezone.utc)
    past_90  = now - timedelta(days=90)
    past_180 = now - timedelta(days=180)

    db.execute(text("""
        INSERT INTO users (id, name, email, is_active, created_at, updated_at)
        VALUES (:id, :name, :email, TRUE, :created_at, :updated_at)
    """), {"id": USER_001_ID.hex, "name": "Demo User 001",
           "email": "demo_user_001@fraudshield.poc",
           "created_at": _ts(now), "updated_at": _ts(now)})

    for dev_id, fingerprint, is_trusted, first_seen in [
    (DEV_TRUSTED.hex,   "dev_trusted_001",   True, past_90),
    (DEV_NEW.hex,       "dev_new_001",       False, now),
    (DEV_UNTRUSTED.hex, "dev_untrusted_001", False, now),
]:
        db.execute(text("""
    INSERT INTO devices (id, user_id, device_fingerprint, is_trusted, first_seen_at, last_seen_at, created_at, updated_at)
    VALUES (:id, :uid, :fp, :trusted, :first, :last, :ca, :ua)
"""), {
    "id": dev_id,
    "uid": USER_001_ID.hex,
    "fp": fingerprint,
    "trusted": is_trusted,
    "first": _ts(first_seen),
    "last": _ts(now),
    "ca": _ts(now),
    "ua": _ts(now)
})

    for rec_id, identifier, first_seen, tx_count, is_trusted_rec in [
        (REC_TRUSTED.hex, "rec_trusted_001@upi", past_180, 10, True),
        (REC_NEW_001.hex, "rec_new_001@upi",     now,      0,  False),
        (REC_NEW_002.hex, "rec_new_002@upi",     now,      0,  False),
    ]:
        db.execute(text("""
    INSERT INTO recipients (id, user_id, recipient_identifier, is_trusted, first_seen_at, transaction_count, created_at, updated_at)
    VALUES (:id, :uid, :identifier, :is_trusted, :first, :tx_count, :ca, :ua)
"""), {"id": rec_id, "uid": USER_001_ID.hex, "identifier": identifier,
       "is_trusted": is_trusted_rec,
       "first": _ts(first_seen), "tx_count": tx_count, "ca": _ts(now), "ua": _ts(now)})

    # --- Clean isolated user for Normal Payment (LOW-risk) scenario ---
    # Uses c0000000-... UUIDs; has no velocity history so it reliably shows LOW risk.
    db.execute(text("""
        INSERT INTO users (id, name, email, is_active, created_at, updated_at)
        VALUES (:id, :name, :email, TRUE, :created_at, :updated_at)
    """), {"id": USER_CLEAN_ID.hex, "name": "Demo User Clean",
           "email": "demo_user_clean@fraudshield.poc",
           "created_at": _ts(now), "updated_at": _ts(now)})

    db.execute(text("""
        INSERT INTO devices (id, user_id, device_fingerprint, is_trusted, first_seen_at, last_seen_at, created_at, updated_at)
        VALUES (:id, :uid, :fp, TRUE, :first, :last, :ca, :ua)
    """), {"id": DEV_CLEAN.hex, "uid": USER_CLEAN_ID.hex,
           "fp": "dev_clean_trusted", "first": _ts(past_90), "last": _ts(now),
           "ca": _ts(now), "ua": _ts(now)})

    db.execute(text("""
        INSERT INTO recipients (id, user_id, recipient_identifier, is_trusted, first_seen_at, transaction_count, created_at, updated_at)
        VALUES (:id, :uid, :identifier, TRUE, :first, 10, :ca, :ua)
    """), {"id": REC_CLEAN.hex, "uid": USER_CLEAN_ID.hex,
           "identifier": "rec_clean_001@upi",
           "first": _ts(past_180), "ca": _ts(now), "ua": _ts(now)})

    db.commit()
    print("  [Seed] Base entities seeded.")


def seed_historical_transactions(db) -> None:
    """
    Seed COMPLETED historical transactions to establish:
      1. Device trust context: dev_trusted has completed transactions.
      2. Amount baseline: avg ≈ ₹1,300. Anomaly (>3x) fires at ~₹3,900+.
      3. Velocity context: 4 recent transactions to prime velocity scenario.

    All timestamps are stored as naive UTC strings to match ORM-inserted values
    and ensure correct string comparison in SQLite velocity/history queries.
    """
    def _ts(dt: datetime) -> str:
        if dt.tzinfo is not None:
            dt = dt.astimezone(timezone.utc).replace(tzinfo=None)
        return dt.strftime("%Y-%m-%d %H:%M:%S.%f")

    now = datetime.now(timezone.utc)

    # --- Baseline COMPLETED transactions (old, to establish baseline avg) ---
    # Amounts: 1000, 1500, 2000, 800, 1200  → avg = 1300
    baseline_amounts = [1000, 1500, 2000, 800, 1200]
    for i, amt in enumerate(baseline_amounts):
        tx_id = uuid.UUID(f"a0000000-0000-0000-0001-{i+1:012d}").hex
        ts = _ts(now - timedelta(days=30 - i))
        db.execute(text("""
            INSERT INTO transactions
              (id, user_id, recipient_id, device_id, amount, currency, transaction_type, status, initiated_at, completed_at, created_at, updated_at)
            VALUES
              (:id, :uid, :rid, :did, :amt, 'INR', 'UPI_SEND', 'COMPLETED', :ts, :ts, :ts, :ts)
        """), {"id": tx_id, "uid": USER_001_ID.hex, "rid": REC_TRUSTED.hex,
               "did": DEV_TRUSTED.hex, "amt": str(amt), "ts": ts})

    # --- Recent velocity transactions (within the last hour) ---
    # These prime the velocity scenario: 4 transactions in last 8 mins
    for i in range(4):
        tx_id = uuid.UUID(f"a0000000-0000-0000-0002-{i+1:012d}").hex
        ts = _ts(now - timedelta(minutes=8 - i * 2))
        db.execute(text("""
            INSERT INTO transactions
              (id, user_id, recipient_id, device_id, amount, currency, transaction_type, status, initiated_at, completed_at, created_at, updated_at)
            VALUES
              (:id, :uid, :rid, :did, 1000, 'INR', 'UPI_SEND', 'COMPLETED', :ts, :ts, :ts, :ts)
        """), {"id": tx_id, "uid": USER_001_ID.hex, "rid": REC_TRUSTED.hex,
               "did": DEV_TRUSTED.hex, "ts": ts})

    db.commit()
    print("  [Seed] Historical transactions seeded (avg ≈ ₹1,300, 4 recent velocity txns).")

    # --- Clean user historical transactions (OLD, non-recent) ---
    # These give the clean user a device and recipient with completed tx history,
    # so NEW_DEVICE and NEW_RECIPIENT rules do NOT fire on the Normal Payment demo.
    clean_amounts = [400, 600, 500, 450, 550]  # avg ≈ 500, well within normal range
    for i, amt in enumerate(clean_amounts):
        tx_id = uuid.UUID(f"c0000000-0000-0000-0001-{i+1:012d}").hex
        ts = _ts(now - timedelta(days=60 - i))  # 55–60 days ago, far from velocity window
        db.execute(text("""
            INSERT INTO transactions
              (id, user_id, recipient_id, device_id, amount, currency, transaction_type, status, initiated_at, completed_at, created_at, updated_at)
            VALUES
              (:id, :uid, :rid, :did, :amt, 'INR', 'UPI_SEND', 'COMPLETED', :ts, :ts, :ts, :ts)
        """), {"id": tx_id, "uid": USER_CLEAN_ID.hex, "rid": REC_CLEAN.hex,
               "did": DEV_CLEAN.hex, "amt": str(amt), "ts": ts})

    db.commit()
    print("  [Seed] Clean user historical transactions seeded.")


def create_demo_scenario_events(client) -> None:
    """
    Create and store risk events by running real payment submissions through the API.
    This exercises the actual FraudShield intelligence pipeline.
    """

    def make_payment(amount, device_id, recipient_id, transcript=None):
        payload = {
            "user_id": str(USER_001_ID),
            "amount": amount,
            "device_id": device_id,
            "recipient_id": recipient_id,
        }
        if transcript:
            payload["interaction_context"] = {"transcript": transcript, "channel": "voice"}
        resp = client.post("/api/v1/payments/", json=payload)
        if resp.status_code != 201:
            print(f"  [WARN] Payment failed ({resp.status_code}): {resp.text[:120]}")
            return None
        return resp.json()

    def get_risk_event_id(tx_id: str) -> str | None:
        db = SessionLocal()
        try:
            event = db.query(RiskEvent).filter(
                RiskEvent.transaction_id == uuid.UUID(tx_id)
            ).first()
            return str(event.id) if event else None
        finally:
            db.close()

    def submit_feedback(event_id, label, notes):
        resp = client.post(
            f"/api/v1/risk-events/{event_id}/feedback",
            json={"label": label, "notes": notes},
            headers={"X-Analyst-ID": "analyst_demo_001"},
        )
        if resp.status_code != 201:
            print(f"  [WARN] Feedback failed ({resp.status_code}): {resp.text[:120]}")

    # Scenario 1 — Normal payment (LOW)
    print("  [Scenario 1] Normal payment...")
    p1 = make_payment(500, str(DEV_TRUSTED), str(REC_TRUSTED))
    if p1:
        eid = get_risk_event_id(p1["transaction"]["id"])
        if eid:
            submit_feedback(eid, FeedbackClassification.LEGITIMATE.value,
                            "Routine payment, confirmed as legitimate by customer history.")

    # Scenario 2 — New device (MEDIUM+)
    print("  [Scenario 2] New device...")
    p2 = make_payment(2000, str(DEV_NEW), str(REC_TRUSTED))
    if p2:
        eid = get_risk_event_id(p2["transaction"]["id"])
        if eid:
            submit_feedback(eid, FeedbackClassification.FALSE_POSITIVE.value,
                            "User purchased a new phone. Transfer was verified by callback.")

    # Scenario 3 — High amount (HIGH)
    print("  [Scenario 3] High amount anomaly...")
    p3 = make_payment(15000, str(DEV_TRUSTED), str(REC_TRUSTED))
    if p3:
        eid = get_risk_event_id(p3["transaction"]["id"])
        if eid:
            submit_feedback(eid, FeedbackClassification.UNCERTAIN.value,
                            "Awaiting customer callback to confirm large transfer.")

    # Scenario 4 — High velocity (HIGH)
    print("  [Scenario 4] High velocity...")
    make_payment(800, str(DEV_TRUSTED), str(REC_TRUSTED))
    # Leave unreviewed — velocity scenario is best shown live in the simulator

    # Scenario 5 — Voice phishing (HIGH/CRITICAL)
    print("  [Scenario 5] Voice phishing...")
    phishing_transcript = (
        "I am calling from bank security. Your account needs urgent verification. "
        "Tell me the OTP so I can secure the account immediately."
    )
    p5 = make_payment(4000, str(DEV_TRUSTED), str(REC_TRUSTED), phishing_transcript)
    if p5:
        eid = get_risk_event_id(p5["transaction"]["id"])
        if eid:
            submit_feedback(eid, FeedbackClassification.CONFIRMED_FRAUD.value,
                            "Classic vishing attack: bank impersonation + OTP harvest.")

    # Scenario 6 — Coercive transfer (CRITICAL)
    print("  [Scenario 6] Coercive transfer...")
    coercive_transcript = (
        "The bank account has been compromised. Move your money immediately "
        "to this safe account or you will lose everything."
    )
    p6 = make_payment(25000, str(DEV_TRUSTED), str(REC_NEW_001), coercive_transcript)
    if p6:
        get_risk_event_id(p6["transaction"]["id"])  # Leave unreviewed for demo

    # Scenario 7 — Multi-signal attack (CRITICAL)
    print("  [Scenario 7] Multi-signal attack...")
    multi_transcript = (
        "Your account is frozen. Do not hang up. Transfer all funds to the safe account "
        "right now to prevent legal action. Give me the OTP to verify."
    )
    p7 = make_payment(95000, str(DEV_UNTRUSTED), str(REC_NEW_002), multi_transcript)
    if p7:
        eid = get_risk_event_id(p7["transaction"]["id"])
        if eid:
            submit_feedback(eid, FeedbackClassification.CONFIRMED_FRAUD.value,
                            "Multi-vector fraud: new untrusted device, unknown recipient, "
                            "extreme amount, coercive vishing call.")


def main():
    print("=" * 60)
    print("FraudShield — Demo Reset Script (Phase 9)")
    print("=" * 60)
    print()
    print("⚠  WARNING: This will DESTROY all existing database data.")
    print("   Only run this in development / demo environments.")
    print()

    # Step 1: Reset database schema
    print("[Step 1] Resetting database schema...")
    reset_db()
    print()

    # Step 2: Seed base entities
    print("[Step 2] Seeding base entities (users, devices, recipients)...")
    db = SessionLocal()
    try:
        seed_entities(db)
        seed_historical_transactions(db)
    finally:
        db.close()
    print()

    # Step 3: Create scenario events via the real API pipeline
    print("[Step 3] Creating demo scenario events via FraudShield pipeline...")
    client = TestClient(app)
    create_demo_scenario_events(client)
    print()

    print("=" * 60)
    print("✓  Demo environment reset complete.")
    print()
    print("Demo entity reference:")
    for key, val in DEMO_IDS.items():
        print(f"  {key:<20} {val}")
    print()
    print("Notes:")
    print("  - Average historical amount ≈ ₹1,300")
    print("  - Amount anomaly (>3x) triggers at amounts above ≈ ₹3,900")
    print("  - Velocity scenario: 4 recent txns already seeded within last 8 mins")
    print("  - Scenarios 4 (high velocity) should be run immediately after reset")
    print("=" * 60)


if __name__ == "__main__":
    main()
