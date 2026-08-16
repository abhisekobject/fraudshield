"""
FraudShield — Risk Fusion Engine
================================
Combines the deterministic Rule Engine score, Machine Learning probability, 
and Social Engineering risk score into a final risk assessment.
"""

from app.database.models.enums import RiskLevel, InterventionType
from app.risk.types import TriggeredRule

# Configuration Default Weights (Configurable/Centralized)
RULE_WEIGHT_BASE = 0.40
ML_WEIGHT_BASE = 0.35
SOCIAL_WEIGHT_BASE = 0.25

# Configuration Thresholds for Final Fusion Score
FUSION_LOW_MAX = 0.35
FUSION_MEDIUM_MAX = 0.65
FUSION_HIGH_MAX = 0.85
# Above 0.85 is CRITICAL

class RiskFusionEngine:
    
    def fuse(self, 
             rule_score: float, 
             ml_probability: float, 
             ml_available: bool,
             social_score: float,
             social_available: bool,
             rule_level: RiskLevel,
             social_level: RiskLevel,
             triggered_rules: list[TriggeredRule]) -> tuple[float, RiskLevel, InterventionType]:
        """
        Calculates the final risk score and determines final state mapping.
        Handles missing signals by dynamically re-weighting.
        """
        
        # 1. Dynamic Weight Normalization
        active_weights = 0.0
        active_weights += RULE_WEIGHT_BASE
        
        if ml_available:
            active_weights += ML_WEIGHT_BASE
            
        if social_available:
            active_weights += SOCIAL_WEIGHT_BASE
            
        # 2. Base Fusion Calculation
        final_score = (rule_score * (RULE_WEIGHT_BASE / active_weights))
        
        if ml_available:
            final_score += (ml_probability * (ML_WEIGHT_BASE / active_weights))
            
        if social_available:
            final_score += (social_score * (SOCIAL_WEIGHT_BASE / active_weights))
            
        # Cap at 1.0
        final_score = min(final_score, 1.0)
        
        # 3. Map continuous score to categorical risk level
        if final_score < FUSION_LOW_MAX:
            fused_level = RiskLevel.LOW
        elif final_score < FUSION_MEDIUM_MAX:
            fused_level = RiskLevel.MEDIUM
        elif final_score < FUSION_HIGH_MAX:
            fused_level = RiskLevel.HIGH
        else:
            fused_level = RiskLevel.CRITICAL
            
        # 4. Deterministic Safety Floor (Override)
        severity_order = {
            RiskLevel.LOW: 0,
            RiskLevel.MEDIUM: 1,
            RiskLevel.HIGH: 2,
            RiskLevel.CRITICAL: 3
        }
        
        # If the deterministic engine or NLP engine explicitly flagged HIGH or CRITICAL, 
        # the ML models are NOT allowed to silently downgrade it below that floor.
        floor_order = max(
            severity_order[rule_level], 
            severity_order[social_level] if social_available else 0
        )
        
        if floor_order > severity_order[fused_level]:
            for level, order in severity_order.items():
                if order == floor_order:
                    final_level = level
                    break
            
            # Align numeric score dynamically with the upgraded safety floor
            if final_level == RiskLevel.CRITICAL:
                final_score = max(final_score, FUSION_HIGH_MAX + 0.05)
            elif final_level == RiskLevel.HIGH:
                final_score = max(final_score, FUSION_MEDIUM_MAX + 0.05)
            elif final_level == RiskLevel.MEDIUM:
                final_score = max(final_score, FUSION_LOW_MAX + 0.05)
        else:
            final_level = fused_level
            
        # 5. Map to Intervention
        intervention_mapping = {
            RiskLevel.LOW: InterventionType.PROCEED,
            RiskLevel.MEDIUM: InterventionType.WARNING,
            RiskLevel.HIGH: InterventionType.STRONG_WARNING,
            RiskLevel.CRITICAL: InterventionType.VERIFICATION
        }
        final_intervention = intervention_mapping[final_level]
        
        return float(final_score), final_level, final_intervention
