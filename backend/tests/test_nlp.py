import pytest
from app.nlp.analyzer import DeterministicPatternAnalyzer
from app.nlp.types import InteractionContext
from app.database.models.enums import RiskLevel, ReasonSeverity

@pytest.fixture
def analyzer():
    return DeterministicPatternAnalyzer()

def test_pattern_urgency(analyzer):
    context = InteractionContext(transcript="You must transfer the money immediately before your account is blocked!")
    result = analyzer.analyze(context)
    assert result.available is True
    
    codes = [ind.code for ind in result.triggered_indicators]
    assert "SE-001" in codes  # Urgency (immediately)
    assert "SE-003" in codes  # Threat (account is blocked)
    assert "SE-005" in codes  # Payment (transfer the money)

def test_pattern_authority_and_otp(analyzer):
    context = InteractionContext(transcript="I am a bank officer. Tell me the OTP for verification.")
    result = analyzer.analyze(context)
    codes = [ind.code for ind in result.triggered_indicators]
    assert "SE-002" in codes  # Authority
    assert "SE-004" in codes  # OTP

def test_remote_access(analyzer):
    context = InteractionContext(transcript="Please install anydesk so I can help you.")
    result = analyzer.analyze(context)
    codes = [ind.code for ind in result.triggered_indicators]
    assert "SE-008" in codes  # Remote Access

def test_negation_handling(analyzer):
    # Should not trigger OTP credential request
    context = InteractionContext(transcript="Remember, your bank will never ask you to share your OTP or PIN.")
    result = analyzer.analyze(context)
    codes = [ind.code for ind in result.triggered_indicators]
    
    # Neither SE-004 (OTP/PIN) should trigger
    assert "SE-004" not in codes
    assert result.score < 0.35 # Low risk

def test_benign_transcript(analyzer):
    context = InteractionContext(transcript="Hey, I just sent the money for dinner yesterday. Thanks!")
    result = analyzer.analyze(context)
    assert result.risk_level == RiskLevel.LOW
    assert len(result.triggered_indicators) == 0

def test_multi_signal_attack(analyzer):
    transcript = (
        "I am calling from the police fraud department. "
        "Your account is being frozen. You need to transfer all funds to a safe account right now. "
        "Do not disconnect the call and tell me the verification code."
    )
    context = InteractionContext(transcript=transcript)
    result = analyzer.analyze(context)
    
    codes = [ind.code for ind in result.triggered_indicators]
    assert "SE-001" in codes # urgency
    assert "SE-002" in codes # authority
    assert "SE-004" in codes # credential (verification code)
    assert "SE-005" in codes # payment (transfer)
    assert "SE-007" in codes # secrecy (do not disconnect)
    
    assert result.risk_level == RiskLevel.CRITICAL
