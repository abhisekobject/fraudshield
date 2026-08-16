"""
FraudShield — Rule Engine
=========================
Evaluates the feature set against all registered deterministic rules,
aggregates the results, and produces the preliminary risk evaluation.
"""

from typing import Dict, List
from app.risk.types import RiskFeature, TriggeredRule, RiskEvaluation
from app.database.models.enums import RiskLevel, InterventionType, ReasonSeverity
from app.risk.rules.base import BaseRule


class RuleEngine:
    def __init__(self, rules: List[BaseRule]):
        self.rules = rules

    def evaluate(self, features: Dict[str, RiskFeature]) -> RiskEvaluation:
        """Run all rules and aggregate the risk."""
        triggered_rules = []
        for rule in self.rules:
            result = rule.evaluate(features)
            if result:
                triggered_rules.append(result)

        # Aggregate preliminary risk level
        risk_level = self._aggregate_risk_level(triggered_rules)
        intervention = self._map_intervention(risk_level)
        rule_score = self._calculate_score(triggered_rules)

        return RiskEvaluation(
            risk_level=risk_level,
            intervention=intervention,
            rule_score=rule_score,
            final_risk_score=rule_score, # For RuleEngine, final_risk_score is just rule_score before fusion
            triggered_rules=triggered_rules,
            features_used={name: f.value for name, f in features.items() if f.is_available},
            evaluation_version="rules-v1"
        )

    def _aggregate_risk_level(self, triggered_rules: List[TriggeredRule]) -> RiskLevel:
        """
        Deterministic aggregation policy:
        - Critical reason -> CRITICAL
        - Multiple High reasons or one High -> HIGH
        - One or more Medium reasons -> MEDIUM
        - No rules -> LOW
        """
        if not triggered_rules:
            return RiskLevel.LOW

        severities = [r.severity for r in triggered_rules]
        
        if ReasonSeverity.CRITICAL in severities:
            return RiskLevel.CRITICAL
            
        if ReasonSeverity.HIGH in severities:
            # For this POC, even one HIGH reason triggers HIGH risk.
            return RiskLevel.HIGH
            
        if ReasonSeverity.MEDIUM in severities:
            return RiskLevel.MEDIUM
            
        return RiskLevel.LOW

    def _map_intervention(self, risk_level: RiskLevel) -> InterventionType:
        """Explicit mapping of preliminary risk level to UX intervention."""
        mapping = {
            RiskLevel.LOW: InterventionType.PROCEED,
            RiskLevel.MEDIUM: InterventionType.WARNING,
            RiskLevel.HIGH: InterventionType.STRONG_WARNING,
            RiskLevel.CRITICAL: InterventionType.VERIFICATION
        }
        return mapping[risk_level]

    def _calculate_score(self, triggered_rules: List[TriggeredRule]) -> float:
        """
        A deterministic normalized score for Phase 3 (before ML).
        This is a simple weighted sum, capped at 1.0.
        """
        score = 0.0
        weights = {
            ReasonSeverity.LOW: 0.1,
            ReasonSeverity.MEDIUM: 0.3,
            ReasonSeverity.HIGH: 0.6,
            ReasonSeverity.CRITICAL: 0.9,
        }
        
        for rule in triggered_rules:
            score += weights.get(rule.severity, 0.0)
            
        return min(score, 1.0)
