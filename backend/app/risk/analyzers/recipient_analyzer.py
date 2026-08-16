"""
FraudShield — Recipient Analyzer
================================
Extracts contextual familiarity of the recipient.
"""

from typing import List
from sqlalchemy import select, func
from sqlalchemy.orm import Session

from app.database.models import Recipient, Transaction
from app.risk.types import TransactionContext, RiskFeature


class RecipientAnalyzer:
    """Analyzes if the recipient is known or new."""

    def extract(self, db: Session, context: TransactionContext) -> List[RiskFeature]:
        features = []

        recipient = db.execute(
            select(Recipient).where(Recipient.id == context.recipient_id)
        ).scalar_one_or_none()

        if not recipient:
            # Fallback
            features.append(RiskFeature(name="recipient_is_new", value=True, feature_type="bool"))
            return features

        # Check prior successful transactions to this recipient by this user
        tx_count_query = select(func.count(Transaction.id)).where(
            Transaction.user_id == context.user_id,
            Transaction.recipient_id == context.recipient_id,
            Transaction.id != context.transaction_id,
            Transaction.status == "COMPLETED"
        )
        completed_tx_count = db.execute(tx_count_query).scalar() or 0

        features.append(RiskFeature(
            name="recipient_transaction_count",
            value=completed_tx_count,
            feature_type="int"
        ))

        # A recipient is "new" if there is no successful prior history
        is_new = completed_tx_count == 0
        features.append(RiskFeature(
            name="recipient_is_new",
            value=is_new,
            feature_type="bool"
        ))

        return features
