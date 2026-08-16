"""
FraudShield — Transaction Analyzer
====================================
Extracts features related to the transaction amount and history.
"""

from typing import List
from sqlalchemy import select, func
from sqlalchemy.orm import Session
from decimal import Decimal

from app.database.models import Transaction
from app.risk.types import TransactionContext, RiskFeature

class TransactionAnalyzer:
    """Analyzes amount anomalies relative to historical behavior."""

    def extract(self, db: Session, context: TransactionContext) -> List[RiskFeature]:
        features = []

        features.append(RiskFeature(
            name="current_amount",
            value=context.amount,
            feature_type="Decimal",
        ))

        # Query historical average amount (excluding the current transaction)
        avg_query = select(func.avg(Transaction.amount)).where(
            Transaction.user_id == context.user_id,
            Transaction.id != context.transaction_id,
            Transaction.status == "COMPLETED"  # Only completed transactions form a baseline
        )
        
        avg_amount_val = db.execute(avg_query).scalar()

        if avg_amount_val is not None:
            # We have history
            avg_decimal = Decimal(str(avg_amount_val))
            features.append(RiskFeature(
                name="historical_average_amount",
                value=avg_decimal,
                feature_type="Decimal",
            ))

            if avg_decimal > 0:
                ratio = context.amount / avg_decimal
                features.append(RiskFeature(
                    name="amount_ratio_to_average",
                    value=float(ratio),
                    feature_type="float",
                ))
            else:
                features.append(RiskFeature(
                    name="amount_ratio_to_average",
                    value=None,
                    feature_type="float",
                    is_available=False
                ))
        else:
            # No history
            features.append(RiskFeature(
                name="historical_average_amount",
                value=None,
                feature_type="Decimal",
                is_available=False
            ))
            features.append(RiskFeature(
                name="amount_ratio_to_average",
                value=None,
                feature_type="float",
                is_available=False
            ))

        return features
