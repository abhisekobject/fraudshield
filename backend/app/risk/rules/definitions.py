"""
FraudShield — Rule Definitions
==============================
Specific deterministic fraud rules as defined in the Phase 3 specification.
"""

from typing import Dict, Optional
from app.risk.types import RiskFeature, TriggeredRule
from app.database.models.enums import ReasonSeverity
from app.risk.rules.base import BaseRule


# --- Configuration Thresholds ---
# These are deterministic configuration constants, easy to modify.
AMOUNT_RATIO_THRESHOLD = 3.0  # Alert if current amount is > 3x the historical average
VELOCITY_10_MIN_THRESHOLD = 5 # Alert if > 5 transactions in last 10 mins
VELOCITY_1_HOUR_THRESHOLD = 10 # Alert if > 10 transactions in last 1 hour
# --------------------------------


class NewDeviceRule(BaseRule):
    rule_id = "RULE-001"
    reason_code = "NEW_DEVICE"
    severity = ReasonSeverity.MEDIUM

    def evaluate(self, features: Dict[str, RiskFeature]) -> Optional[TriggeredRule]:
        device_is_new = features.get("device_is_new")
        if device_is_new and device_is_new.is_available and device_is_new.value is True:
            return self._build_trigger(
                "This payment is being initiated from a device that has not been used for previous successful payments by this account."
            )
        return None


class NewRecipientRule(BaseRule):
    rule_id = "RULE-002"
    reason_code = "NEW_RECIPIENT"
    severity = ReasonSeverity.MEDIUM

    def evaluate(self, features: Dict[str, RiskFeature]) -> Optional[TriggeredRule]:
        recipient_is_new = features.get("recipient_is_new")
        if recipient_is_new and recipient_is_new.is_available and recipient_is_new.value is True:
            return self._build_trigger(
                "This is a recipient you have not previously paid successfully."
            )
        return None


class UntrustedDeviceRule(BaseRule):
    rule_id = "RULE-003"
    reason_code = "UNTRUSTED_DEVICE"
    severity = ReasonSeverity.MEDIUM

    def evaluate(self, features: Dict[str, RiskFeature]) -> Optional[TriggeredRule]:
        device_trusted = features.get("device_is_trusted")
        if device_trusted and device_trusted.is_available and device_trusted.value is False:
            return self._build_trigger(
                "This device is currently marked as untrusted for this account."
            )
        return None


class AmountAnomalyRule(BaseRule):
    rule_id = "RULE-004"
    reason_code = "HIGH_AMOUNT_RELATIVE_TO_HISTORY"
    severity = ReasonSeverity.HIGH

    def evaluate(self, features: Dict[str, RiskFeature]) -> Optional[TriggeredRule]:
        ratio_feature = features.get("amount_ratio_to_average")
        
        # If history is missing, feature is unavailable, rule DOES NOT trigger.
        if ratio_feature and ratio_feature.is_available and ratio_feature.value is not None:
            ratio = ratio_feature.value
            if ratio > AMOUNT_RATIO_THRESHOLD:
                return self._build_trigger(
                    f"The payment amount is unusually high compared to your typical history (over {AMOUNT_RATIO_THRESHOLD}x average).",
                    signal_value=ratio
                )
        return None


class HighTransactionVelocityRule(BaseRule):
    rule_id = "RULE-005"
    reason_code = "HIGH_TRANSACTION_VELOCITY"
    severity = ReasonSeverity.HIGH

    def evaluate(self, features: Dict[str, RiskFeature]) -> Optional[TriggeredRule]:
        tx_10m = features.get("transactions_last_10_minutes")
        if tx_10m and tx_10m.is_available:
            count = tx_10m.value
            if count >= VELOCITY_10_MIN_THRESHOLD:
                return self._build_trigger(
                    f"An unusually high number of payments ({count}) have been initiated in the last 10 minutes.",
                    signal_value=float(count)
                )
        return None


class MultipleRecentTransactionsRule(BaseRule):
    rule_id = "RULE-006"
    reason_code = "MULTIPLE_RECENT_TRANSACTIONS"
    severity = ReasonSeverity.MEDIUM

    def evaluate(self, features: Dict[str, RiskFeature]) -> Optional[TriggeredRule]:
        tx_1h = features.get("transactions_last_1_hour")
        if tx_1h and tx_1h.is_available:
            count = tx_1h.value
            if count >= VELOCITY_1_HOUR_THRESHOLD:
                return self._build_trigger(
                    f"Multiple payments ({count}) have been initiated in the last hour.",
                    signal_value=float(count)
                )
        return None
