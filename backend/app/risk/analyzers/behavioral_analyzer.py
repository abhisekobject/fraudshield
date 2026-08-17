"""
FraudShield — Behavioral Analyzer
=================================
Analyzes a user's transaction history to establish a baseline of normal behavior.
Emits features describing how much the current transaction deviates from the baseline.
"""

from typing import List, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import select, func
from datetime import datetime, timedelta

from app.risk.types import TransactionContext, RiskFeature
from app.database.models.transaction import Transaction
from app.database.models.enums import TransactionStatus

class BehavioralAnalyzer:
    """Analyzes a user's historical transaction behavior."""
    
    def extract(self, db: Session, context: TransactionContext) -> List[RiskFeature]:
        """
        Extract behavioral features based on the last 30 days of the user's history.
        """
        features = []
        
        # Normalize context.initiated_at to naive UTC so SQLite comparison works
        # (SQLite stores datetimes as naive strings; Python's datetime from the API is tz-aware)
        def _naive_utc(dt) -> "datetime":
            if dt.tzinfo is not None:
                from datetime import timezone as _tz
                return dt.astimezone(_tz.utc).replace(tzinfo=None)
            return dt

        initiated_naive = _naive_utc(context.initiated_at)
        
        # Calculate 30-day window
        thirty_days_ago = initiated_naive - timedelta(days=30)
        
        # Query historical completed transactions for this user
        query = (
            select(
                func.count(Transaction.id).label("tx_count"),
                func.sum(Transaction.amount).label("total_amount"),
                func.avg(Transaction.amount).label("avg_amount"),
                func.max(Transaction.amount).label("max_amount")
            )
            .where(
                Transaction.user_id == context.user_id,
                Transaction.status == TransactionStatus.COMPLETED,
                Transaction.initiated_at >= thirty_days_ago,
                Transaction.initiated_at < initiated_naive  # Strictly before current tx
            )
        )
        
        result = db.execute(query).one_or_none()
        
        # Defaults if no history
        tx_count = result.tx_count if result and result.tx_count is not None else 0
        total_amount = float(result.total_amount) if result and result.total_amount is not None else 0.0
        avg_amount = float(result.avg_amount) if result and result.avg_amount is not None else 0.0
        max_amount = float(result.max_amount) if result and result.max_amount is not None else 0.0
        
        features.append(RiskFeature(
            name="historical_tx_count_30d",
            value=tx_count,
            feature_type="int",
            is_available=True
        ))
        
        features.append(RiskFeature(
            name="historical_avg_amount_30d",
            value=avg_amount,
            feature_type="float",
            is_available=True
        ))
        
        features.append(RiskFeature(
            name="historical_max_amount_30d",
            value=max_amount,
            feature_type="float",
            is_available=True
        ))
        
        # Calculate deviations
        current_amount = float(context.amount)
        amount_deviation_ratio = 0.0
        
        if tx_count > 0 and avg_amount > 0:
            amount_deviation_ratio = current_amount / avg_amount
            
        features.append(RiskFeature(
            name="amount_deviation_ratio",
            value=amount_deviation_ratio,
            feature_type="float",
            is_available=True,
            metadata={"current": current_amount, "historical_avg": avg_amount}
        ))
        
        return features
