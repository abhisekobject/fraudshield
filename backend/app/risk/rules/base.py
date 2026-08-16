"""
FraudShield — Base Rule
=======================
Interface for all deterministic rules.
"""

from abc import ABC, abstractmethod
from typing import Dict, Optional, Any

from app.risk.types import RiskFeature, TriggeredRule
from app.database.models.enums import ReasonSeverity

class BaseRule(ABC):
    """
    Abstract base class for a deterministic risk rule.
    Rules consume a dictionary of RiskFeatures and return a TriggeredRule if conditions are met.
    """
    
    @property
    @abstractmethod
    def rule_id(self) -> str:
        """Unique ID for the rule (e.g. RULE-001)"""
        pass

    @property
    @abstractmethod
    def reason_code(self) -> str:
        """Machine readable code (e.g. NEW_DEVICE)"""
        pass
        
    @property
    @abstractmethod
    def severity(self) -> ReasonSeverity:
        """Severity mapping (LOW, MEDIUM, HIGH, CRITICAL)"""
        pass

    @abstractmethod
    def evaluate(self, features: Dict[str, RiskFeature]) -> Optional[TriggeredRule]:
        """
        Evaluate the feature set. 
        Returns a TriggeredRule if the condition is met, otherwise None.
        """
        pass

    def _build_trigger(
        self, 
        explanation: str, 
        signal_value: Optional[float] = None,
        source_engine: str = "RULE",
        contribution: Optional[float] = None,
        evidence: Optional[str] = None
    ) -> TriggeredRule:
        """Helper to construct the TriggeredRule."""
        return TriggeredRule(
            rule_id=self.rule_id,
            reason_code=self.reason_code,
            severity=self.severity,
            explanation=explanation,
            signal_value=signal_value,
            source_engine=source_engine,
            contribution=contribution,
            evidence=evidence
        )
