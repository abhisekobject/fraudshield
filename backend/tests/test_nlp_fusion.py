import pytest
from app.ml.fusion import RiskFusionEngine
from app.database.models.enums import RiskLevel, InterventionType
from app.risk.types import TriggeredRule

@pytest.fixture
def fusion_engine():
    return RiskFusionEngine()

def test_fusion_all_signals_low(fusion_engine):
    score, level, intervention = fusion_engine.fuse(
        rule_score=0.1, ml_probability=0.1, ml_available=True,
        social_score=0.1, social_available=True,
        rule_level=RiskLevel.LOW, triggered_rules=[]
    )
    assert level == RiskLevel.LOW
    assert intervention == InterventionType.PROCEED

def test_fusion_missing_social_signal(fusion_engine):
    # If social is missing, weights re-balance to Rule(0.4) and ML(0.35) -> out of 0.75
    score, level, intervention = fusion_engine.fuse(
        rule_score=0.9, ml_probability=0.9, ml_available=True,
        social_score=0.0, social_available=False,
        rule_level=RiskLevel.HIGH, triggered_rules=[]
    )
    assert score > 0.85
    assert level == RiskLevel.CRITICAL

def test_fusion_deterministic_override(fusion_engine):
    # Rule engine says CRITICAL, but ML/Social say LOW.
    # Result must not downgrade below CRITICAL.
    score, level, intervention = fusion_engine.fuse(
        rule_score=0.9, ml_probability=0.01, ml_available=True,
        social_score=0.01, social_available=True,
        rule_level=RiskLevel.CRITICAL, triggered_rules=[]
    )
    assert level == RiskLevel.CRITICAL
    assert intervention == InterventionType.VERIFICATION

def test_fusion_social_risk_elevation(fusion_engine):
    # Rule is low (0.1), ML is low (0.1). But social is high (0.95).
    # 0.1*(0.4) + 0.1*(0.35) + 0.95*(0.25) = 0.04 + 0.035 + 0.2375 = 0.3125 (LOW)
    # Wait, 0.31 is LOW. To push it to MEDIUM/HIGH, it needs more.
    # Let's say rule is 0.5, ML is 0.5, Social is 1.0 -> 0.2 + 0.175 + 0.25 = 0.625 (MEDIUM).
    # Let's verify exactly how the math works.
    
    score, level, intervention = fusion_engine.fuse(
        rule_score=0.5, ml_probability=0.5, ml_available=True,
        social_score=1.0, social_available=True,
        rule_level=RiskLevel.MEDIUM, triggered_rules=[]
    )
    assert 0.62 < score < 0.63
    assert level == RiskLevel.MEDIUM
