# FraudShield Frontend Architecture (Phase 6)

## 1. Overview
The frontend is a Next.js App Router application built to visualize the intelligence of the FraudShield backend. It does not perform any local fraud scoring or intelligence gathering; instead, it acts as the interface for submitting contexts (payments or transcripts) and visualizing the resulting deterministic, ML, and NLP signals.

## 2. Tech Stack
- **Framework**: Next.js (App Router)
- **Styling**: Tailwind CSS v4
- **Components**: Reusable atomic UI (Card, Button, Badge, Input)
- **Icons**: Lucide React
- **API Client**: Standard `fetch` via a centralized `services/api.ts`

## 3. Pages

### `/` (Dashboard)
The main landing view that pings the backend `/health` endpoint to verify the status of the Core API, Rule Engine, ML Engine, and NLP Intelligence layers.

### `/payment` (Payment Simulator)
Allows users to simulate a transaction flow. By entering varying combinations of amounts, devices, and optional interactions (voice transcripts), users trigger the backend `RiskFusionEngine`. The page visualizes the `RiskScore`, `SignalBreakdown`, and final `InterventionPanel`.

### `/interaction` (Social Engineering Demo)
A dedicated environment to test the `DeterministicPatternAnalyzer` independently of a payment. It submits a transcript and receives a `SocialEngineeringEvaluation` detailing any coercive patterns (e.g., OTP requests, urgency, threats).

### `/analyst` (Analyst View)
Simulates a security center dashboard. It queries recent transactions and lists them with their statuses. It provides the foundation for Phase 7 (Analyst Feedback loops).

## 4. Privacy & Security UX
- **No Credentials**: No fake credentials or sensitive data are rendered or exposed.
- **Transcript Handling**: Clear microcopy explains that the transcript is processed locally by the risk engine and not sent to generic black-box LLMs.
- **Score Representation**: The backend's heuristic risk score (0.0 - 1.0) is rendered as a `Risk Score (0-100)` rather than a "probability of fraud", strictly adhering to the uncalibrated nature of the underlying models.

## 5. Demo Mode
The UI includes pre-built synthetic scenarios (Normal, New Device, Voice Phishing, Multi-Signal) to quickly populate forms for demonstrations without requiring manual data entry.

## 6. Limitations
- Does not persist analyst reviews or overrides globally (this requires Phase 7 backend implementations).
- Assumes the backend is available at `http://localhost:8000`.
- The Analyst View currently simulates fetching the queue by querying a specific demo user's transaction history, as a global `/events` list endpoint is pending.
