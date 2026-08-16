# FraudShield — Social Engineering Intelligence Layer (Phase 5)

## 1. Objective
The Social Engineering Intelligence Layer analyzes interaction context (e.g., simulated phone call transcripts) to identify coercive patterns, authority impersonation, and fraudulent instructions before a transaction is authorized. It introduces interaction risk as a novel parallel signal alongside traditional transaction anomaly detection.

## 2. Scope
This is a **Proof of Concept (POC)**. 
- It uses deterministic lexical/pattern matching combined with basic negation awareness.
- It does **not** rely on a heavy LLM or black-box ML model, ensuring maximum testability, transparency, and offline-capability.
- It does **not** perform actual Speech-to-Text (STT) inference; it operates on simulated transcript strings.

## 3. Privacy Model
Privacy is a core tenet of this architecture:
- **Ephemeral Processing**: The system consumes the transcript, extracts structured `SocialEngineeringIndicator` signals, and immediately discards the raw text.
- **Credential Masking**: Sensitive authentication tokens (e.g. OTP, PIN, CVV) requested by the attacker are flagged by category, but the actual values are never stored or logged.

## 4. Supported Input
The system accepts an `InteractionContext` which may be bundled directly into the `evaluate` method of the `RiskOrchestrator`, or tested via the standalone `/api/v1/interactions/analyze` simulation endpoint.
*   **Transcript**: Up to 5000 characters.
*   **Channel**: `voice`, `chat`, etc.
*   **Transaction ID**: Optional link to an active payment context.

## 5. Indicator Categories
The system currently tracks 10 distinct, explainable categories:
*   `SE-001`: Urgency / Time Pressure
*   `SE-002`: Authority Impersonation
*   `SE-003`: Threat / Coercion
*   `SE-004`: OTP / Credential Request
*   `SE-005`: Payment Transfer Instruction
*   `SE-006`: Security Bypass
*   `SE-007`: Secrecy / Isolation
*   `SE-008`: Remote Access
*   `SE-009`: Refund / Reversal Manipulation
*   `SE-010`: Emotional Manipulation

## 6. Scoring
Each indicator carries a pre-defined severity (LOW, MEDIUM, HIGH, CRITICAL).
The `DeterministicPatternAnalyzer` calculates a normalized `social_engineering_score` (0.0 to 1.0).
*   Multiple HIGH severity indicators (e.g., OTP request + Threat) combine to trigger a CRITICAL risk level.
*   *Note: This is a heuristic risk score, not a statistically calibrated probability.*

## 7. Explainability
Every matched indicator produces a human-readable `explanation` without exposing internal regex logic. These explanations map back directly to `RiskReason` records in the database, allowing future security analysts to understand exactly why a transaction was flagged.

## 8. False-Positive Handling
- **Basic Negation**: The analyzer looks at the preceding 30 characters for negation tokens (e.g., "never", "do not"). "Do not share your OTP" will not trigger the OTP Credential Request alert.
- **Deduplication**: Repeating the same trigger word multiple times does not artificially inflate the score; it is capped per category.

## 9. Limitations
- Does not inherently understand sarcasm, complex rhetorical questions, or deeply obfuscated phrasing.
- Lacks semantic understanding of entities (e.g., distinguishing "I am transferring the money" [user intent] vs "Transfer the money" [attacker command] beyond basic lexical matches).

## 10. Future Speech-to-Text Architecture
The architecture is designed to accept transcripts from an STT edge layer. In a production deployment, a service like Whisper (OpenAI) or Google Cloud Speech-to-Text would transcribe the audio stream and feed the text into this `InteractionAnalyzer` in near real-time.

## 11. Future Multilingual Architecture
The current patterns are English-only. The `DeterministicPatternAnalyzer` can be easily extended by instantiating language-specific `INDICATOR_PATTERNS` arrays (e.g., Hindi, Odia) based on the `language` field in the `InteractionContext`.

## 12. Demo Scenarios
*   **Benign**: "Hello, I just sent the money for dinner yesterday." → LOW Risk.
*   **Urgency + Threat**: "You must transfer the money immediately before your account is blocked!" → HIGH Risk.
*   **Multi-Signal Attack**: "I am a bank officer. Your account is frozen. Do not disconnect the call and tell me the verification code." → CRITICAL Risk.
