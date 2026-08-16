"""
FraudShield — Behavior Analyzer
===============================
Extracts temporal and velocity-based transaction features.
"""

from typing import List
from datetime import timedelta
from sqlalchemy import select, func
from sqlalchemy.orm import Session

from app.database.models import Transaction
from app.risk.types import TransactionContext, RiskFeature


class BehaviorAnalyzer:
    """Analyzes temporal context (velocity) of transactions."""

    def extract(self, db: Session, context: TransactionContext) -> List[RiskFeature]:
        features = []

        now = context.initiated_at
        ten_mins_ago = now - timedelta(minutes=10)
        one_hour_ago = now - timedelta(hours=1)

        # Base query to find recent transactions by the same user, 
        # BEFORE the current one was initiated.
        # Exclude the current transaction ID explicitly.
        # We count ALL initiated transactions, not just completed ones, 
        # as fraudsters might rapidly initiate many payments that fail or block.
        
        # 10 minutes velocity
        q_10m = select(func.count(Transaction.id)).where(
            Transaction.user_id == context.user_id,
            Transaction.id != context.transaction_id,
            Transaction.initiated_at >= ten_mins_ago,
            Transaction.initiated_at <= now
        )
        tx_10m_count = db.execute(q_10m).scalar() or 0
        
        # 1 hour velocity
        q_1h = select(func.count(Transaction.id)).where(
            Transaction.user_id == context.user_id,
            Transaction.id != context.transaction_id,
            Transaction.initiated_at >= one_hour_ago,
            Transaction.initiated_at <= now
        )
        tx_1h_count = db.execute(q_1h).scalar() or 0

        features.append(RiskFeature(
            name="transactions_last_10_minutes",
            value=tx_10m_count,
            feature_type="int"
        ))

        features.append(RiskFeature(
            name="transactions_last_1_hour",
            value=tx_1h_count,
            feature_type="int"
        ))

        return features
