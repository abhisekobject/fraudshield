from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_analyze_interaction_api():
    payload = {
        "transcript": "Hello, this is a normal bank conversation. Your transaction is complete.",
        "channel": "voice"
    }
    
    response = client.post("/api/v1/interactions/analyze", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["risk_level"] == "LOW"
    assert len(data["triggered_indicators"]) == 0

def test_analyze_interaction_high_risk():
    payload = {
        "transcript": "I am calling from the RBI. Your account is blocked. Share your OTP immediately.",
        "channel": "voice"
    }
    
    response = client.post("/api/v1/interactions/analyze", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["risk_level"] == "CRITICAL"
    
    codes = [ind["code"] for ind in data["triggered_indicators"]]
    assert "SE-002" in codes # authority
    assert "SE-004" in codes # OTP
