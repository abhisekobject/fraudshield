"""
FraudShield — Database Models
===============================
This module exposes all ORM models.
Importing this module ensures that SQLAlchemy's Base.metadata registers
all tables correctly before Alembic attempts to autogenerate migrations.
"""

# Re-export Base for convenience
from app.database.session import Base

# Import all models to register them with Base.metadata
from app.database.models.user import User
from app.database.models.device import Device
from app.database.models.recipient import Recipient
from app.database.models.transaction import Transaction
from app.database.models.risk_event import RiskEvent
from app.database.models.risk_reason import RiskReason
from app.database.models.feedback import AnalystFeedback
from app.database.models.transaction_event import TransactionEvent
from app.database.models.privacy_audit_event import PrivacyAuditEvent
from app.database.models.admin import AdminUser

# Explicitly define what is exported
__all__ = [
    "Base",
    "User",
    "Device",
    "Recipient",
    "Transaction",
    "RiskEvent",
    "RiskReason",
    "AnalystFeedback",
    "TransactionEvent",
    "PrivacyAuditEvent",
    "AdminUser",
]
