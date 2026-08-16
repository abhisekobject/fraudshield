"""
FraudShield — Backend Health Check Test
=========================================
Minimal startup test: verifies the FastAPI app initializes correctly
and the /health endpoint returns a 200 response.

Run with:
    pytest backend/tests/test_health.py -v
"""

from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_health_check_returns_200():
    """The /health endpoint must respond with HTTP 200."""
    response = client.get("/health")
    assert response.status_code == 200


def test_health_check_response_structure():
    """The /health response must include status, service and environment keys."""
    response = client.get("/health")
    data = response.json()

    assert "status" in data
    assert "service" in data
    assert "environment" in data
    assert data["status"] == "ok"
    assert data["service"] == "FraudShield"
