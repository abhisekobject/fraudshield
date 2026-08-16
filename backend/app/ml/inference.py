"""
FraudShield — ML Inference Service
==================================
Loads the trained ML artifact and executes inference safely.
"""

import os
import logging
from typing import Dict, Any, Tuple
import joblib

from app.risk.types import RiskFeature
from app.ml.features import map_risk_features_to_vector, FEATURE_ORDER
import pandas as pd

logger = logging.getLogger(__name__)

MODEL_ARTIFACT_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "ml", "models", "model_v1.joblib")

class MLInferenceService:
    def __init__(self):
        self.model = None
        self.version = "unknown"
        self.is_available = False
        
        self._load_model()

    def _load_model(self):
        try:
            if os.path.exists(MODEL_ARTIFACT_PATH):
                artifact = joblib.load(MODEL_ARTIFACT_PATH)
                self.model = artifact["model"]
                self.version = artifact.get("version", "ml-v1")
                self.is_available = True
                logger.info(f"Successfully loaded ML model {self.version}")
            else:
                logger.warning(f"ML artifact not found at {MODEL_ARTIFACT_PATH}. ML will be unavailable.")
        except Exception as e:
            logger.error(f"Failed to load ML model: {e}")
            self.is_available = False

    def predict(self, features: Dict[str, RiskFeature]) -> Tuple[bool, float, str]:
        """
        Executes ML inference safely.
        Returns:
            (is_available: bool, probability: float, version: str)
        """
        if not self.is_available or self.model is None:
            return False, 0.0, self.version
            
        try:
            # Map the complex objects to the strict numeric vector
            vector = map_risk_features_to_vector(features)
            
            # predict_proba expects a DataFrame with the exact column names used during training
            input_df = pd.DataFrame([vector], columns=FEATURE_ORDER)
            probs = self.model.predict_proba(input_df)
            
            # Return the probability of class 1 (fraud)
            ml_prob = float(probs[0][1])
            
            return True, ml_prob, self.version
            
        except Exception as e:
            logger.error(f"ML inference failed: {e}")
            # Safe fallback: don't crash the payment, just say ML failed
            return False, 0.0, self.version
