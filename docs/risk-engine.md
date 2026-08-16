# FraudShield — Risk Engine Documentation

## 1. Purpose
This document outlines the Phase 3 implementation of the FraudShield deterministic risk engine. It transforms raw transaction context into explainable risk events and determines the preliminary transaction state before final evaluation/confirmation by the user. 

*Note: This is purely deterministic. No ML models, fake probability scores, or voice-analysis components are present in this layer.*

## 2. Risk Architecture
```
[Payment API]
      │
      ▼
[Risk Orchestrator] ─┬─> [Transaction Analyzer]
                     ├─> [Device Analyzer]
                     ├─> [Recipient Analyzer]
                     └─> [Behavior Analyzer]
      │
      ▼
(Risk Features Extracted)
      │
      ▼
 [Rule Engine] ──> (Deterministic Rules: New Device, Velocity, Amount Anomaly, etc.)
      │
      ▼
[Risk Evaluation] ──> (Aggregated Risk Level, Score, Intervention, Risk Reasons)
      │
      ▼
[Database Persistence] ──> (RiskEvents & RiskReasons saved)
      │
      ▼
[State Transition] ──> (INITIATED -> EVALUATING -> PENDING_CONFIRMATION / COMPLETED)
```

## 3. Analyzer Responsibilities & Features

| Analyzer | Features Extracted | Missing History Handling |
|---|---|---|
| **TransactionAnalyzer** | `current_amount`, `historical_average_amount`, `amount_ratio_to_average` | Ratio feature marked as `is_available=False` if no history. |
| **DeviceAnalyzer** | `device_is_trusted`, `device_transaction_count`, `device_is_new` | "New" means 0 prior completed transactions for this user. |
| **RecipientAnalyzer** | `recipient_transaction_count`, `recipient_is_new` | "New" means 0 prior completed transactions to this recipient. |
| **BehaviorAnalyzer** | `transactions_last_10_minutes`, `transactions_last_1_hour` | Gracefully defaults to 0 if no prior activity exists. |

## 4. Rule Definitions & Thresholds

| Rule ID | Reason Code | Trigger Condition | Severity |
|---|---|---|---|
| **RULE-001** | `NEW_DEVICE` | `device_is_new == True` | MEDIUM |
| **RULE-002** | `NEW_RECIPIENT` | `recipient_is_new == True` | MEDIUM |
| **RULE-003** | `UNTRUSTED_DEVICE` | `device_is_trusted == False` | MEDIUM |
| **RULE-004** | `HIGH_AMOUNT_RELATIVE_TO_HISTORY` | `amount_ratio_to_average > 3.0` | HIGH |
| **RULE-005** | `HIGH_TRANSACTION_VELOCITY` | `transactions_last_10_minutes >= 5` | HIGH |
| **RULE-006** | `MULTIPLE_RECENT_TRANSACTIONS` | `transactions_last_1_hour >= 10` | MEDIUM |

*Note: Thresholds are defined deterministically in `app.risk.rules.definitions`.*

## 5. Risk Level Aggregation & Intervention Mapping

The `RuleEngine` aggregates triggered rules into a preliminary Risk Level and Intervention plan:
- **CRITICAL**: If *any* CRITICAL severity rule triggers → `VERIFICATION`
- **HIGH**: If *any* HIGH severity rule triggers → `STRONG_WARNING`
- **MEDIUM**: If *any* MEDIUM severity rule triggers → `WARNING`
- **LOW**: If *no* rules trigger → `PROCEED`

### Rule Score
A basic weighted sum is calculated for deterministic risk comparison before ML integration. 
- LOW reason = `+0.1`
- MEDIUM reason = `+0.3`
- HIGH reason = `+0.6`
- CRITICAL reason = `+0.9`

The score is capped at `1.0`.

## 6. Explainability
Every rule must return a `TriggeredRule` object containing a human-readable explanation designed for end-users, shielding them from internal metric labels.
*Example: Instead of showing `device_transaction_count == 0`, it shows "This payment is being initiated from a device that has not been used for previous successful payments by this account."*

## 7. Persistence and Evaluation Versioning
Risk events are explicitly saved to the database:
- `RiskEvent` linked to `Transaction`.
- `RiskReason` records (1 to N) linked to `RiskEvent`.
- `confidence` is stored as `NULL` (N/A for rules).
- `evaluation_version` is currently stored as `"rules-v1"`.

## 8. Payment Lifecycle Integration
The API now natively traps transactions in `PENDING_CONFIRMATION` if they are MEDIUM, HIGH, or CRITICAL. 
- `LOW` risk transactions advance to `COMPLETED` automatically.
- This creates the exact "wait point" where the UI will display the intervention warning and solicit user feedback.

## 9. Privacy Model
- No PII is logged into the rule engine logs.
- No voice data, text contents, or raw bank credentials exist in this boundary.
- The rule engine exclusively looks at database metadata relationships.

## 10. Machine Learning Integration & Risk Fusion (Phase 4)
The deterministic rule engine is now supplemented by an ML Model.
- The `MLInferenceService` generates an `ml_probability` representing the statistical likelihood of fraud.

## 11. Social Engineering Intelligence (Phase 5)
A deterministic NLP layer analyzes interaction context (e.g. voice transcripts) to identify coercive patterns such as authority impersonation, urgency, and OTP requests. It produces an explainable `social_engineering_score`.

## 12. Risk Fusion V2
The `RiskFusionEngine` combines `rule_score`, `ml_probability`, and `social_engineering_score` to produce a `final_risk_score`.
- **Dynamic Reweighting:** If the ML model is offline, or if the transaction does not involve an interaction (e.g., no transcript available), the fusion engine dynamically renormalizes the available weights.
- **Deterministic Floor Override:** If deterministic rules classify a transaction as `HIGH` or `CRITICAL` (e.g. `HIGH_AMOUNT_RELATIVE_TO_HISTORY`), the ML/NLP model cannot downgrade the intervention.

## 13. ML/NLP Failure Handling
If the ML model artifact is missing or throws an exception, or if the NLP analyzer fails:
- The system does NOT crash.
- `ml_available` or `social_engineering_available` is set to `False`.
- The fusion engine re-weights relying on available deterministic signals.

## 14. Known Limitations
- Caching is not implemented for Analyzer database queries. 
- The ML model is trained on a synthetic dataset; probabilities are uncalibrated.
- The NLP pattern analyzer relies on lexical regexes and basic negation mapping rather than deep semantic understanding.
- All testing relies on SQLite in-memory mocking due to the ongoing local Postgres unavailability.
