"""
FraudShield — ML Feature Schema
===============================
Defines the explicit feature schema for the ML model.
Maps the live `RiskFeature` objects to a deterministic vector.
"""

from typing import Dict, Any, List

# The canonical ordering of features for the model
FEATURE_ORDER = [
    "amount",
    "amount_ratio_to_average",
    "device_is_trusted",
    "device_transaction_count",
    "device_is_new",
    "recipient_transaction_count",
    "recipient_is_new",
    "transactions_last_10_minutes",
    "transactions_last_1_hour",
]

FEATURE_DEFAULTS = {
    "amount": 0.0,
    "amount_ratio_to_average": 1.0, # Default to 1.0 if no history
    "device_is_trusted": 1.0, # boolean to float
    "device_transaction_count": 0.0,
    "device_is_new": 1.0, # boolean to float
    "recipient_transaction_count": 0.0,
    "recipient_is_new": 1.0, # boolean to float
    "transactions_last_10_minutes": 0.0,
    "transactions_last_1_hour": 0.0,
}

def map_risk_features_to_vector(features: Dict[str, Any]) -> List[float]:
    """
    Takes the dictionary of RiskFeature objects and returns a dense float list
    in the EXACT order defined by FEATURE_ORDER.
    """
    vector = []
    for feature_name in FEATURE_ORDER:
        if feature_name in features:
            f = features[feature_name]
            if f.is_available and f.value is not None:
                # Convert bool to 1.0 / 0.0, Decimals to float
                vector.append(float(f.value))
            else:
                vector.append(FEATURE_DEFAULTS[feature_name])
        else:
            # Fallback if a feature is entirely missing from the payload
            vector.append(FEATURE_DEFAULTS[feature_name])
            
    return vector
