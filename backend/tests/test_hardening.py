"""
FraudShield — Hardening & Edge Case Tests (Phase 8)
=====================================================
Tests for state machine protection, graceful degradation, and fusion logic.
"""

import uuid
import pytest
from app.database.models.enums import TransactionStatus, RiskLevel
from app.core.config import settings

def test_config_safe_defaults():
    """Verify that safe defaults are enforced."""
    assert settings.STORE_RAW_TRANSCRIPT is False
    assert settings.APP_VERSION == "0.1.0"


def test_health_endpoint(client):
    """Liveness probe must return 200 and version."""
    resp = client.get("/health")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "ok"
    assert data["version"] == "0.1.0"


def test_ready_endpoint(client):
    """Readiness probe must return DB and ML status."""
    resp = client.get("/ready")
    assert resp.status_code == 200
    data = resp.json()
    assert "components" in data
    assert "database" in data["components"]
    assert "ml_model" in data["components"]
    assert data["components"]["database"]["status"] == "READY"


def test_interaction_invalid_channel(client):
    """Channel must be validated as enum."""
    resp = client.post("/api/v1/interactions/analyze", json={
        "transcript": "hello",
        "channel": "invalid_channel"
    })
    assert resp.status_code == 422 # Pydantic validation error


def test_interaction_oversized_transcript(client):
    """Transcript > 5000 chars should be rejected."""
    resp = client.post("/api/v1/interactions/analyze", json={
        "transcript": "A" * 5001,
        "channel": "voice"
    })
    assert resp.status_code == 400
    assert "length exceeds 5000" in resp.json()["detail"]


# Fusion tests
from app.ml.fusion import RiskFusionEngine

def test_fusion_all_low():
    engine = RiskFusionEngine()
    score, level, intervention = engine.fuse(
        rule_score=0.1,
        ml_probability=0.1,
        ml_available=True,
        social_score=0.0,
        social_available=True,
        rule_level=RiskLevel.LOW,
        triggered_rules=[]
    )
    assert level == RiskLevel.LOW
    assert score < 0.35


def test_fusion_all_critical():
    engine = RiskFusionEngine()
    score, level, intervention = engine.fuse(
        rule_score=0.9,
        ml_probability=0.9,
        ml_available=True,
        social_score=0.9,
        social_available=True,
        rule_level=RiskLevel.CRITICAL,
        triggered_rules=[]
    )
    assert level == RiskLevel.CRITICAL
    assert score > 0.85


def test_fusion_deterministic_safety_floor():
    """If ML/NLP say LOW, but rule engine says HIGH, final must be HIGH."""
    engine = RiskFusionEngine()
    score, level, intervention = engine.fuse(
        rule_score=0.1, # Rule engine score doesn't matter for the override, just the level
        ml_probability=0.0,
        ml_available=True,
        social_score=0.0,
        social_available=True,
        rule_level=RiskLevel.HIGH, # This is the safety floor
        triggered_rules=[]
    )
    assert level == RiskLevel.HIGH


def test_fusion_degraded_graceful():
    """If ML is missing, it should just drop out of the weighting."""
    engine = RiskFusionEngine()
    score, level, intervention = engine.fuse(
        rule_score=0.5,
        ml_probability=0.0,
        ml_available=False, # Missing
        social_score=0.5,
        social_available=True,
        rule_level=RiskLevel.MEDIUM,
        triggered_rules=[]
    )
    assert level == RiskLevel.MEDIUM
    assert score == 0.5 # (0.5 * 0.4/0.65) + (0.5 * 0.25/0.65) = 0.5
