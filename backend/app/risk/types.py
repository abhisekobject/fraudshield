"""
FraudShield — Risk Types
========================
Data structures for the risk engine, feature extraction, and rule evaluation.
These decouple the risk layer from the API layer and the database layer.
"""

from typing import Any, Optional, Dict, List
from pydantic import BaseModel, ConfigDict
from decimal import Decimal
import uuid
from datetime import datetime

from app.database.models.enums import RiskLevel, InterventionType, ReasonSeverity


class RiskFeature(BaseModel):
    """
    An explicitly extracted feature from the context analyzers.
    Used by the Rule Engine to make deterministic decisions.
    """
    name: str
    value: Any
    feature_type: str  # e.g., "float", "bool", "Decimal", "int"
    is_available: bool = True
    metadata: Dict[str, Any] = {}


class TriggeredRule(BaseModel):
    """
    Result of a single deterministic rule triggering.
    """
    rule_id: str
    reason_code: str
    severity: ReasonSeverity
    explanation: str
    signal_value: Optional[float] = None


class RiskEvaluation(BaseModel):
    """
    The final output of the combined Risk Engine (Rules + ML Fusion + Social Engineering).
    """
    risk_level: RiskLevel
    intervention: InterventionType
    rule_score: float
    ml_probability: Optional[float] = None
    ml_available: bool = False
    social_engineering_score: Optional[float] = None
    social_engineering_available: bool = False
    final_risk_score: float
    triggered_rules: List[TriggeredRule]
    features_used: Dict[str, Any]
    evaluation_version: str = "fusion-v2"
    model_version: Optional[str] = None


class TransactionContext(BaseModel):
    """
    The data passed from the Payment Service to the Risk Orchestrator.
    """
    transaction_id: uuid.UUID
    user_id: uuid.UUID
    recipient_id: uuid.UUID
    device_id: uuid.UUID
    amount: Decimal
    currency: str
    initiated_at: datetime
    
    model_config = ConfigDict(arbitrary_types_allowed=True)
