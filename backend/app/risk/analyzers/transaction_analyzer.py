"""
FraudShield — Transaction Analyzer
====================================
Extracts features related to the transaction amount and history.
"""

from typing import List
from sqlalchemy import select, func
from sqlalchemy.orm import Session
from decimal import Decimal
from datetime import datetime, timezone

from app.database.models import Transaction, Recipient
from app.risk.types import TransactionContext, RiskFeature

class TransactionAnalyzer:
    """Analyzes amount anomalies relative to historical behavior."""

    def extract(self, db: Session, context: TransactionContext) -> List[RiskFeature]:
        features = []

        features.append(RiskFeature(
            name="amount",          # Must match FEATURE_ORDER in app/ml/features.py
            value=float(context.amount),
            feature_type="float",
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
            
        # ---------------------------------------------------------------------
        # Phase E: Recipient Risk Intelligence
        # ---------------------------------------------------------------------
        recipient_query = select(Recipient).where(Recipient.id == context.recipient_id)
        recipient = db.execute(recipient_query).scalar_one_or_none()
        
        if recipient:
            features.append(RiskFeature(
                name="recipient_is_trusted",
                value=recipient.is_trusted,
                feature_type="bool",
            ))
            features.append(RiskFeature(
                name="recipient_transaction_count",
                value=recipient.transaction_count,
                feature_type="int",
            ))
            
            # Recipient velocity: How recently was the recipient added?
            if recipient.first_seen_at:
                # Normalize both datetimes to UTC-naive to avoid offset-naive vs
                # offset-aware subtraction errors (SQLite stores naive datetimes).
                def _to_naive_utc(dt: datetime) -> datetime:
                    if dt.tzinfo is not None:
                        return dt.astimezone(timezone.utc).replace(tzinfo=None)
                    return dt

                initiated = _to_naive_utc(context.initiated_at)
                first_seen = _to_naive_utc(recipient.first_seen_at)
                days_since_added = (initiated - first_seen).days
                features.append(RiskFeature(
                    name="recipient_days_since_added",
                    value=days_since_added,
                    feature_type="int",
                ))
            else:
                features.append(RiskFeature(
                    name="recipient_days_since_added",
                    value=0,
                    feature_type="int",
                ))
        else:
            features.append(RiskFeature(
                name="recipient_is_trusted",
                value=False,
                feature_type="bool",
            ))
            features.append(RiskFeature(
                name="recipient_transaction_count",
                value=0,
                feature_type="int",
            ))
            features.append(RiskFeature(
                name="recipient_days_since_added",
                value=0,
                feature_type="int",
            ))

        return features
