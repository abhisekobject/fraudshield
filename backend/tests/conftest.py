"""
FraudShield — Pytest Configuration & Fixtures
=============================================
Provides test fixtures including an in-memory SQLite database
to allow API testing without a running PostgreSQL instance.
"""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, StaticPool, text
from sqlalchemy.orm import sessionmaker

from app.main import app
from app.database.session import Base, get_db

# Use an in-memory SQLite database for testing to bypass Postgres requirement
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="session")
def setup_database():
    """Create all tables in the in-memory SQLite DB for the test session."""
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def db_session(setup_database):
    """
    Provides a fresh database session for a test. Data is cleaned up
    after each test using a fresh cleanup session to avoid state issues.
    """
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

    # Use a fresh session for cleanup to avoid operating on a closed/broken session
    cleanup_db = TestingSessionLocal()
    try:
        for table in reversed(Base.metadata.sorted_tables):
            cleanup_db.execute(table.delete())
        cleanup_db.commit()
    finally:
        cleanup_db.close()


@pytest.fixture
def client(db_session):
    """
    Returns a FastAPI TestClient with the database dependency overridden
    to use the isolated in-memory SQLite session.
    """
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()
