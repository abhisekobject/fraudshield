"""
FraudShield — Risk Orchestrator
=================================
Central coordinator for the fraud risk evaluation pipeline.
Extracts features, runs rules, evaluates ML model, and fuses scores.
"""

import uuid
import logging
from typing import Optional
from datetime import datetime, timezone
from sqlalchemy.orm import Session

from app.database.models import RiskEvent, RiskReason, Transaction
from app.database.models.enums import TransactionStatus
from app.risk.types import TransactionContext, RiskEvaluation
from app.risk.analyzers.transaction_analyzer import TransactionAnalyzer
from app.risk.analyzers.device_analyzer import DeviceAnalyzer
from app.risk.analyzers.recipient_analyzer import RecipientAnalyzer
from app.risk.analyzers.behavior_analyzer import BehaviorAnalyzer
from app.risk.rules.engine import RuleEngine
from app.risk.rules.definitions import (
    NewDeviceRule, NewRecipientRule, UntrustedDeviceRule,
    AmountAnomalyRule, HighTransactionVelocityRule, MultipleRecentTransactionsRule
)
from app.ml.inference import MLInferenceService
from app.ml.fusion import RiskFusionEngine
from app.nlp.types import InteractionContext
from app.nlp.analyzer import DeterministicPatternAnalyzer

logger = logging.getLogger(__name__)


class RiskOrchestrator:
    """Coordinates the deterministic, ML, and Social Engineering risk evaluation pipeline."""

    def __init__(self):
        # Initialize Analyzers
        self.analyzers = [
            TransactionAnalyzer(),
            DeviceAnalyzer(),
            RecipientAnalyzer(),
            BehaviorAnalyzer()
        ]
        
        # Initialize Rule Engine
        self.rule_engine = RuleEngine(rules=[
            NewDeviceRule(),
            NewRecipientRule(),
            UntrustedDeviceRule(),
            AmountAnomalyRule(),
            HighTransactionVelocityRule(),
            MultipleRecentTransactionsRule()
        ])
        
        # Initialize ML and Fusion
        self.ml_service = MLInferenceService()
        self.fusion_engine = RiskFusionEngine()
        
        # Initialize Social Engineering Analyzer
        self.nlp_analyzer = DeterministicPatternAnalyzer()

    def evaluate(self, db: Session, transaction: Transaction, interaction_context: Optional[InteractionContext] = None) -> RiskEvaluation:
        """Runs the full risk evaluation pipeline for a transaction."""
        logger.info(f"Risk evaluation started — tx={transaction.id}")

        context = TransactionContext(
            transaction_id=transaction.id,
            user_id=transaction.user_id,
            recipient_id=transaction.recipient_id,
            device_id=transaction.device_id,
            amount=transaction.amount,
            currency=transaction.currency,
            initiated_at=transaction.initiated_at
        )

        # 1. Extract Features (graceful degradation per analyzer)
        features_list = []
        for analyzer in self.analyzers:
            try:
                features_list.extend(analyzer.extract(db, context))
            except Exception as e:
                logger.warning(f"Analyzer {analyzer.__class__.__name__} failed: {e}")
                
        features = {f.name: f for f in features_list}

        # 2. Rule Evaluation
        rule_eval = self.rule_engine.evaluate(features)

        # 3. ML Inference
        ml_available, ml_prob, model_version = self.ml_service.predict(features)

        # 4. Social Engineering Analysis (Optional Phase 5)
        if interaction_context:
            social_eval = self.nlp_analyzer.analyze(interaction_context)
        else:
            # Fallback if no context provided
            from app.nlp.types import SocialEngineeringEvaluation
            social_eval = SocialEngineeringEvaluation(available=False)

        # 5. Risk Fusion V2
        final_score, final_level, final_intervention = self.fusion_engine.fuse(
            rule_score=rule_eval.rule_score,
            ml_probability=ml_prob,
            ml_available=ml_available,
            social_score=social_eval.score,
            social_available=social_eval.available,
            rule_level=rule_eval.risk_level,
            social_level=social_eval.risk_level,
            triggered_rules=rule_eval.triggered_rules
        )

        # Combine deterministic rules and NLP indicators into a single reasoning pipeline
        # TriggeredRule structure needs to accommodate SocialEngineeringIndicator for persistence
        all_reasons = []
        all_reasons.extend(rule_eval.triggered_rules)
        
        from app.risk.types import TriggeredRule
        for ind in social_eval.triggered_indicators:
            all_reasons.append(TriggeredRule(
                rule_id="NLP-PATTERN",
                reason_code=ind.code,
                severity=ind.severity,
                explanation=ind.explanation,
                signal_value=None
            ))

        # 6. Compile Final Evaluation
        evaluation = RiskEvaluation(
            risk_level=final_level,
            intervention=final_intervention,
            rule_score=rule_eval.rule_score,
            ml_probability=ml_prob if ml_available else None,
            ml_available=ml_available,
            social_engineering_score=social_eval.score if social_eval.available else None,
            social_engineering_available=social_eval.available,
            final_risk_score=final_score,
            triggered_rules=all_reasons,
            features_used={name: f.value for name, f in features.items() if f.is_available},
            evaluation_version="fusion-v2",
            model_version=model_version if ml_available else None
        )

        # 7. Persistence
        self._persist_evaluation(db, transaction.id, evaluation)

        logger.info(
            f"Risk result — tx={transaction.id} score={final_score:.2f} "
            f"level={final_level.value} ml={ml_prob if ml_available else 'N/A'} "
            f"social={social_eval.score if social_eval.available else 'N/A'}"
        )

        return evaluation

    def _persist_evaluation(self, db: Session, transaction_id: uuid.UUID, evaluation: RiskEvaluation) -> None:
        """Saves the RiskEvent and associated RiskReasons to the database."""
        
        risk_event = RiskEvent(
            id=uuid.uuid4(),
            transaction_id=transaction_id,
            risk_score=evaluation.final_risk_score,
            confidence=evaluation.ml_probability, # For Phase 4, confidence becomes ML probability
            risk_level=evaluation.risk_level,
            intervention=evaluation.intervention,
            evaluation_version=evaluation.evaluation_version,
            evaluated_at=datetime.now(timezone.utc)
        )
        # Note: We are using the existing `risk_score` for final_risk_score, 
        # and `confidence` for ml_probability to avoid DB migrations right now.
        # `evaluation_version` will track model info natively.
        
        db.add(risk_event)
        
        for rule in evaluation.triggered_rules:
            reason = RiskReason(
                id=uuid.uuid4(),
                risk_event_id=risk_event.id,
                reason_code=rule.reason_code,
                severity=rule.severity,
                message=rule.explanation,
                signal_value=rule.signal_value
            )
            db.add(reason)
            
        db.commit()
