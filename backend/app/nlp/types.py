"""
FraudShield — NLP/Social Engineering Types
===========================================
Defines the explicit schema for interaction intelligence.
"""

from typing import Optional, List, Dict
from pydantic import BaseModel
import uuid
from datetime import datetime

from app.database.models.enums import RiskLevel, ReasonSeverity


class InteractionContext(BaseModel):
    """
    Input context for social engineering analysis.
    """
    interaction_id: Optional[uuid.UUID] = None
    transaction_id: Optional[uuid.UUID] = None
    channel: str = "voice"
    transcript: str
    language: str = "en"
    timestamp: Optional[datetime] = None


class SocialEngineeringIndicator(BaseModel):
    """
    A single detected pattern of social engineering.
    """
    code: str
    category: str
    severity: ReasonSeverity
    matched_phrase: str
    explanation: str


class SocialEngineeringEvaluation(BaseModel):
    """
    The final output of the Social Engineering Analyzer.
    """
    available: bool = False
    score: float = 0.0
    risk_level: RiskLevel = RiskLevel.LOW
    triggered_indicators: List[SocialEngineeringIndicator] = []
    explanation: str = "No interaction data analyzed."
    evaluation_version: str = "social-v1"
    channel: str = "unknown"
    method: str = "deterministic-pattern-engine"
