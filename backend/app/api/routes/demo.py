"""
FraudShield — Demo Utility Routes
====================================
Endpoints specifically designed for POC / hackathon demonstration.
These routes are NOT intended for production use.

The primary purpose is to allow a full session reset so the ML model's
velocity counters and historical transaction records are cleared, then
re-seeded with a clean baseline that establishes trusted devices, known
recipients, and historical transaction averages — guaranteeing reproducible
demo outcomes for all scenarios.
"""

import uuid
from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text

from app.database.session import get_db

router = APIRouter()

# ---------------------------------------------------------------------------
# Deterministic demo UUIDs — must match frontend/src/utils/scenarios.ts
# ---------------------------------------------------------------------------
USER_001_ID   = uuid.UUID("a0000000-0000-0000-0000-000000000001")
USER_CLEAN_ID = uuid.UUID("c0000000-0000-0000-0000-000000000001")

DEV_TRUSTED   = uuid.UUID("a0000000-0000-0000-0000-000000000010")
DEV_NEW       = uuid.UUID("a0000000-0000-0000-0000-000000000011")
DEV_UNTRUSTED = uuid.UUID("a0000000-0000-0000-0000-000000000012")
DEV_CLEAN     = uuid.UUID("c0000000-0000-0000-0000-000000000010")

REC_TRUSTED   = uuid.UUID("a0000000-0000-0000-0000-000000000020")
REC_NEW_001   = uuid.UUID("a0000000-0000-0000-0000-000000000021")
REC_NEW_002   = uuid.UUID("a0000000-0000-0000-0000-000000000022")
REC_CLEAN     = uuid.UUID("c0000000-0000-0000-0000-000000000020")

# Mobile simulation recipients
REC_MOBILE_21 = uuid.UUID("a0000000-0000-0000-0000-000000000021")
REC_MOBILE_22 = uuid.UUID("a0000000-0000-0000-0000-000000000022")
REC_MOBILE_23 = uuid.UUID("a0000000-0000-0000-0000-000000000023")


def _ts(dt: datetime) -> str:
    """Normalise to naive UTC string for SQLite compatibility."""
    if dt.tzinfo is not None:
        dt = dt.astimezone(timezone.utc).replace(tzinfo=None)
    return dt.strftime("%Y-%m-%d %H:%M:%S.%f")


def _seed_baseline(db: Session) -> dict:
    """
    Re-seed users, devices, recipients, and historical completed
    transactions so the ML model and rule engine see a warm, established
    session for demo purposes.
    """
    now = datetime.now(timezone.utc)
    past_90  = now - timedelta(days=90)
    past_180 = now - timedelta(days=180)

    counts: dict = {"users": 0, "devices": 0, "recipients": 0, "seed_transactions": 0}

    # ── Users ──────────────────────────────────────────────────────────────
    for uid, name, email in [
        (USER_001_ID.hex, "Demo User 001", "demo_user_001@fraudshield.poc"),
        (USER_CLEAN_ID.hex, "Demo User Clean", "demo_user_clean@fraudshield.poc"),
    ]:
        existing = db.execute(text("SELECT id FROM users WHERE id = :id"), {"id": uid}).fetchone()
        if not existing:
            db.execute(text("""
                INSERT INTO users (id, name, email, is_active, created_at, updated_at)
                VALUES (:id, :name, :email, TRUE, :ca, :ua)
            """), {"id": uid, "name": name, "email": email, "ca": _ts(now), "ua": _ts(now)})
            counts["users"] += 1

    # ── Devices ────────────────────────────────────────────────────────────
    for dev_id, user_id, fingerprint, is_trusted, first_seen in [
        (DEV_TRUSTED.hex,   USER_001_ID.hex,   "dev_trusted_001",   True,  past_90),
        (DEV_NEW.hex,       USER_001_ID.hex,   "dev_new_001",       False, now),
        (DEV_UNTRUSTED.hex, USER_001_ID.hex,   "dev_untrusted_001", False, now),
        (DEV_CLEAN.hex,     USER_CLEAN_ID.hex, "dev_clean_trusted", True,  past_90),
    ]:
        existing = db.execute(text("SELECT id FROM devices WHERE id = :id"), {"id": dev_id}).fetchone()
        if not existing:
            db.execute(text("""
                INSERT INTO devices (id, user_id, device_fingerprint, is_trusted, first_seen_at, last_seen_at, created_at, updated_at)
                VALUES (:id, :uid, :fp, :trusted, :first, :last, :ca, :ua)
            """), {
                "id": dev_id, "uid": user_id, "fp": fingerprint,
                "trusted": is_trusted, "first": _ts(first_seen),
                "last": _ts(now), "ca": _ts(now), "ua": _ts(now)
            })
            counts["devices"] += 1

    # ── Recipients ─────────────────────────────────────────────────────────
    for rec_id, user_id, identifier, is_trusted_rec, first_seen, tx_count in [
        (REC_TRUSTED.hex, USER_001_ID.hex,   "rec_trusted_001@upi", True,  past_180, 10),
        (REC_NEW_001.hex, USER_001_ID.hex,   "rec_new_001@upi",     False, now,      0),
        (REC_NEW_002.hex, USER_001_ID.hex,   "rec_new_002@upi",     False, now,      0),
        (REC_CLEAN.hex,   USER_CLEAN_ID.hex, "rec_clean_001@upi",   True,  past_180, 10),
    ]:
        existing = db.execute(text("SELECT id FROM recipients WHERE id = :id"), {"id": rec_id}).fetchone()
        if not existing:
            db.execute(text("""
                INSERT INTO recipients (id, user_id, recipient_identifier, is_trusted, first_seen_at, transaction_count, created_at, updated_at)
                VALUES (:id, :uid, :identifier, :is_trusted, :first, :tx_count, :ca, :ua)
            """), {
                "id": rec_id, "uid": user_id, "identifier": identifier,
                "is_trusted": is_trusted_rec, "first": _ts(first_seen),
                "tx_count": tx_count, "ca": _ts(now), "ua": _ts(now)
            })
            counts["recipients"] += 1

    db.commit()

    # ── Baseline COMPLETED transactions (established user) ─────────────────
    # Amounts 1000,1500,2000,800,1200 → avg ≈ ₹1,300
    # Placed 25-30 days ago — outside any velocity window.
    for i, amt in enumerate([1000, 1500, 2000, 800, 1200]):
        tx_id = uuid.UUID(f"a0000000-0000-0000-0001-{i+1:012d}").hex
        ts = _ts(now - timedelta(days=30 - i))
        db.execute(text("""
            INSERT INTO transactions
              (id, user_id, recipient_id, device_id, amount, currency, transaction_type, status, initiated_at, completed_at, created_at, updated_at)
            VALUES (:id, :uid, :rid, :did, :amt, 'INR', 'UPI_SEND', 'COMPLETED', :ts, :ts, :ts, :ts)
        """), {"id": tx_id, "uid": USER_001_ID.hex, "rid": REC_TRUSTED.hex,
               "did": DEV_TRUSTED.hex, "amt": str(amt), "ts": ts})
        counts["seed_transactions"] += 1

    # ── Clean user historical transactions ─────────────────────────────────
    # 5 old completed transactions → device & recipient no longer "new"
    for i, amt in enumerate([400, 600, 500, 450, 550]):
        tx_id = uuid.UUID(f"c0000000-0000-0000-0001-{i+1:012d}").hex
        ts = _ts(now - timedelta(days=60 - i))
        db.execute(text("""
            INSERT INTO transactions
              (id, user_id, recipient_id, device_id, amount, currency, transaction_type, status, initiated_at, completed_at, created_at, updated_at)
            VALUES (:id, :uid, :rid, :did, :amt, 'INR', 'UPI_SEND', 'COMPLETED', :ts, :ts, :ts, :ts)
        """), {"id": tx_id, "uid": USER_CLEAN_ID.hex, "rid": REC_CLEAN.hex,
               "did": DEV_CLEAN.hex, "amt": str(amt), "ts": ts})
        counts["seed_transactions"] += 1

    db.commit()
    return counts


@router.post("/reset-session", summary="Reset Demo Session")
async def reset_demo_session(db: Session = Depends(get_db)) -> dict:
    """
    **POC/Demo use only.**

    1. Clears all live transaction history and risk events (removes velocity).
    2. Re-seeds the baseline demo entities and historical transactions so:
       - DEV_TRUSTED and DEV_CLEAN are no longer \"new\" devices
       - REC_TRUSTED and REC_CLEAN are known recipients
       - Amount average baseline is restored (avg ≈ ₹1,300 for main user,
         ≈ ₹500 for clean user)
       - Velocity counters are back to zero

    After calling this, the \"Normal Payment\" scenario will consistently
    return LOW risk, and all other demo scenarios will behave as specified.
    """

    # Step 1: Delete live data (respects FK order)
    risk_events_deleted = db.execute(text("DELETE FROM risk_events")).rowcount
    transactions_deleted = db.execute(text("DELETE FROM transactions")).rowcount
    db.commit()

    # Step 2: Re-seed baseline data
    seeded = _seed_baseline(db)

    return {
        "status": "ok",
        "message": (
            "Demo session reset and re-seeded. "
            "Device history restored — Normal Payment will now score LOW risk."
        ),
        "cleared": {
            "transactions": transactions_deleted,
            "risk_events": risk_events_deleted,
        },
        "seeded": seeded,
    }
