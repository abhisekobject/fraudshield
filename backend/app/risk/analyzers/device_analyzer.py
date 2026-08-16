"""
FraudShield — Device Analyzer
=============================
Extracts contextual familiarity of the device.
"""

from typing import List
from sqlalchemy import select, func
from sqlalchemy.orm import Session

from app.database.models import Device, Transaction
from app.risk.types import TransactionContext, RiskFeature


class DeviceAnalyzer:
    """Analyzes if the device is known, new, or untrusted."""

    def extract(self, db: Session, context: TransactionContext) -> List[RiskFeature]:
        features = []

        device = db.execute(
            select(Device).where(Device.id == context.device_id)
        ).scalar_one_or_none()

        if not device:
            # This should have been blocked by PaymentService, but handle safely
            features.append(RiskFeature(name="device_is_trusted", value=False, feature_type="bool"))
            features.append(RiskFeature(name="device_is_new", value=True, feature_type="bool", metadata={"reason": "missing"}))
            return features

        features.append(RiskFeature(
            name="device_is_trusted",
            value=device.is_trusted,
            feature_type="bool"
        ))

        # Determine if it's a "new" device contextually (has it successfully completed payments before?)
        tx_count_query = select(func.count(Transaction.id)).where(
            Transaction.user_id == context.user_id,
            Transaction.device_id == context.device_id,
            Transaction.id != context.transaction_id,
            Transaction.status == "COMPLETED"
        )
        completed_tx_count = db.execute(tx_count_query).scalar() or 0

        features.append(RiskFeature(
            name="device_transaction_count",
            value=completed_tx_count,
            feature_type="int"
        ))

        # A device is "new" if we have no successful prior transactions with it
        is_new = completed_tx_count == 0
        features.append(RiskFeature(
            name="device_is_new",
            value=is_new,
            feature_type="bool"
        ))

        return features
