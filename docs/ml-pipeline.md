# FraudShield — ML Pipeline Documentation

## 1. ML Objective
This ML component supplements the deterministic Risk Engine (Phase 3) by learning complex, non-linear relationships between transaction features. It generates an `ml_probability` to flag suspicious activities that simple thresholds might miss, without overriding the critical safety nets provided by deterministic rules.

## 2. Synthetic Dataset Design
Because real banking data is unavailable, the ML model is trained on a **synthetic demonstration dataset**.
*   **Total Size:** 20,000 transactions.
*   **Class Distribution:** 92% Legitimate (Class 0), 8% Suspicious (Class 1).
*   **Generation Methodology:** Scenarios are generated to ensure realistic overlapping distributions (e.g. occasional large legitimate payments vs. large payments to a new recipient from a new device). This prevents the model from trivially memorizing a single threshold.

## 3. Features
The features strictly correspond to the `RiskFeature` objects extracted by the deterministic Analyzers.

| Feature Name | Type | Missing Handling | Source Analyzer |
| :--- | :--- | :--- | :--- |
| `amount` | Float | 0.0 | TransactionAnalyzer |
| `amount_ratio_to_average` | Float | 1.0 (if no history) | TransactionAnalyzer |
| `device_is_trusted` | Float (0/1) | 1.0 | DeviceAnalyzer |
| `device_transaction_count`| Float | 0.0 | DeviceAnalyzer |
| `device_is_new` | Float (0/1) | 1.0 | DeviceAnalyzer |
| `recipient_transaction_count`| Float | 0.0 | RecipientAnalyzer |
| `recipient_is_new` | Float (0/1) | 1.0 | RecipientAnalyzer |
| `transactions_last_10_minutes`| Float | 0.0 | BehaviorAnalyzer |
| `transactions_last_1_hour` | Float | 0.0 | BehaviorAnalyzer |

## 4. Label Generation & Leakage Prevention
*   **Label:** `is_fraud` (binary).
*   **Leakage:** No target fields, risk scores, or deterministic rule outputs are passed into the training features.

## 5. Preprocessing & Pipeline
*   **StandardScaler** is used for continuous numerical data.
*   The identical `sklearn.pipeline.Pipeline` is used during training and live inference to ensure perfect preprocessing symmetry.

## 6. Model Selection
*   **Baseline:** Logistic Regression with `class_weight='balanced'`.
*   **Candidate:** RandomForestClassifier. (XGBoost is supported but automatically bypassed due to missing OpenMP/`libomp` dependencies on this OS).

## 7. Training & Evaluation
The dataset was split using stratified selection (70% train / 30% combined validation+test).
*   **Random Seed:** 42.

**RandomForest Performance (Synthetic Data):**
*   **Precision:** 0.9959
*   **Recall:** 1.0000
*   **F1 Score:** 0.9979
*   **ROC AUC:** 1.0000
*   *Note: These high metrics reflect the simplicity of the synthetic dataset, NOT real banking fraud detection accuracy.*

## 8. Model Artifact
*   **Persistence:** Saved via `joblib`.
*   **Version:** `ml-v1`
*   **Location:** `backend/ml/models/model_v1.joblib`

## 9. Inference & Explainability
*   The `MLInferenceService` loads the model artifact synchronously at startup.
*   The model consumes the exact `RiskFeature` dictionary evaluated by the rules.
*   **Failure Handling:** If the artifact is missing or an exception is thrown during inference, `ml_available` is set to `False`, and the system gracefully degrades to 100% deterministic rule evaluation without disrupting the payment API.

## 10. Risk Fusion
The `RiskFusionEngine` combines `rule_score` and `ml_probability`:
*   Final Score = `(rule_score * 0.5) + (ml_probability * 0.5)`
*   **Deterministic Override:** If the deterministic `RuleEngine` produces a `HIGH` or `CRITICAL` risk level, the fusion layer will NEVER silently downgrade it to a lower severity.

## 11. Limitations & Future Work
*   **Calibration:** The random forest outputs probabilities based on leaf-node fractions. In production, this needs explicit calibration (e.g. Platt Scaling or Isotonic Regression).
*   **Feature Store:** Features are extracted synchronously. A production system should use a low-latency feature store.
*   **Synthetic Limits:** The model performance is guaranteed to degrade significantly on real data with heavier class imbalance and adversarial shifts.
