# FraudShield — Architecture Documentation

> **Status:** Architectural design — hackathon POC
> **Version:** 0.1.0 — Initialization phase

---

## Overview

FraudShield is a modular fraud-risk evaluation system.

At the highest level it consists of three parts:

```
┌─────────────────────────────────────────────┐
│         SIMULATED UPI FRONTEND              │
│         (Next.js — User App + Admin)        │
└──────────────────────┬──────────────────────┘
                       │ HTTPS / REST
                       ▼
┌─────────────────────────────────────────────┐
│             API LAYER (FastAPI)             │
└──────────────────────┬──────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────┐
│           RISK ORCHESTRATOR                 │
│   (coordinates all analysis modules)        │
└──────────────────────┬──────────────────────┘
           ┌───────────┼───────────┐
           ▼           ▼           ▼
   ┌──────────┐ ┌──────────┐ ┌──────────┐
   │Transaction│ │  Device  │ │Behavioral│
   │Analyzer  │ │Analyzer  │ │Analyzer  │
   └──────────┘ └──────────┘ └──────────┘
           │           │           │
           └───────────┼───────────┘
                       ▼
              ┌─────────────────┐
              │ Voice/NLP       │  ← optional signal
              │ Analyzer        │
              └────────┬────────┘
                       │
              ┌─────────────────┐
              │   Rule Engine   │
              └────────┬────────┘
              ┌─────────────────┐
              │  ML Risk Model  │
              └────────┬────────┘
                       │
              ┌─────────────────┐
              │  Risk Fusion    │
              └────────┬────────┘
                       │
              ┌─────────────────┐
              │ Explainability  │
              └────────┬────────┘
              ┌─────────────────┐
              │  Intervention   │
              └────────┬────────┘
                       │
                  Risk Decision
                       │
┌──────────────────────▼──────────────────────┐
│         PostgreSQL — Event Store            │
└──────────────────────┬──────────────────────┘
                       │
┌──────────────────────▼──────────────────────┐
│      INSTITUTION DASHBOARD                  │
│      (Fraud Analyst UI)                     │
└─────────────────────────────────────────────┘
```

---

## Component Descriptions

### Frontend

**Technology:** Next.js 15, TypeScript, Tailwind CSS

**Decision:** Next.js was selected over plain React because:
- App Router provides a clean page/layout structure
- TypeScript is enforced from the start
- Server components are available if needed for performance
- Tailwind CSS is bundled for rapid UI development

**Two logical interfaces within one application:**

#### User / Simulated UPI Interface
Pages (planned):
- `/` — Home / dashboard
- `/pay` — Initiate payment
- `/pay/review` — Risk warning display
- `/pay/confirm` — Confirmation step
- `/pay/success` — Payment success
- `/history` — Transaction history

#### Institution Dashboard
Pages (planned):
- `/admin` — Overview statistics
- `/admin/events` — Flagged risk events
- `/admin/events/[id]` — Event detail + signals + explanation
- `/admin/analytics` — Model metrics and trends
- `/admin/feedback` — Review analyst feedback submissions

---

### API Layer

**Technology:** FastAPI, Python, Pydantic v2

**Responsibility:**
- Request validation (Pydantic schemas)
- Authentication and authorization (JWT — planned)
- Route handling
- Delegating to the Risk Orchestrator
- Persisting risk events to the database
- Returning structured risk decisions to the frontend

**Planned API routes:**
```
POST /api/v1/auth/login
POST /api/v1/payments/evaluate
POST /api/v1/payments/confirm
GET  /api/v1/payments/history
POST /api/v1/voice/analyze
GET  /api/v1/risk/events
GET  /api/v1/risk/events/{id}
POST /api/v1/risk/events/{id}/feedback
GET  /api/v1/analytics/overview
```

---

### Risk Orchestrator

**File:** `backend/app/risk/orchestrator.py`

**Responsibility:**
The orchestrator is the **conductor** — it does not perform analysis itself. It calls each analysis module in sequence, collects outputs, and passes them to the fusion and decision engines.

**Pipeline:**
```
RiskRequest
    → TransactionAnalyzer
    → DeviceAnalyzer
    → BehaviorAnalyzer
    → VoiceAnalyzer (optional)
    → RuleEngine
    → MLRiskModel
    → RiskFusion
    → ExplainabilityEngine
    → InterventionEngine
    → RiskResult
```

**Graceful degradation:** If an optional signal source (e.g., voice) is unavailable, the orchestrator proceeds without it rather than failing.

---

### Transaction Analyzer

**Status:** 🔵 PLANNED

**File:** `backend/app/risk/transaction.py`

**Responsibility:**
Extract risk-relevant features from the payment request.

**Planned features:**
- `amount`
- `amount_deviation` (vs. user baseline)
- `amount_z_score`
- `recipient_known`
- `recipient_frequency`
- `transaction_velocity` (transactions in last N minutes)
- `time_of_day`
- `recent_transaction_count`

---

### Device Analyzer

**Status:** 🔵 PLANNED

**File:** `backend/app/risk/device.py`

**Responsibility:**
Evaluate whether the payment is being made from a known, trusted device.

**Planned features:**
- `known_device`
- `new_device`
- `device_age`
- `recent_device_change`
- `sim_change`
- `network_change`
- `location_deviation`

---

### Behavioral Analyzer

**Status:** 🔵 PLANNED

**File:** `backend/app/risk/behavior.py`

**Responsibility:**
Compare the current transaction against the user's historical behavioral baseline.

**Planned features:**
- `average_transaction_amount`
- `transaction_amount_variance`
- `typical_transaction_time`
- `recipient_distribution`
- `transaction_frequency`
- `behavioral_anomaly_score`

**Baseline approach:**
A lightweight user profile is maintained that captures normal transaction patterns. Statistical deviation (z-score, Isolation Forest, or similar) is used to quantify how far the current behavior is from normal.

---

### Voice/NLP Analyzer

**Status:** 🔵 PLANNED (Optional signal)

**File:** `backend/app/nlp/`

**Responsibility:**
Detect social-engineering indicators in a voice/text interaction.

**Privacy principle:**
Raw audio/transcripts are NOT forwarded to the central risk engine. The NLP layer extracts derived risk features only.

**Planned output features:**
```json
{
  "urgency": 0.92,
  "authority_impersonation": 0.84,
  "financial_request": 0.96,
  "credential_request": 0.62,
  "threat": 0.54,
  "secrecy": 0.76
}
```

**Sub-components:**
- `nlp/speech.py` — Speech-to-text transcription
- `nlp/classifier.py` — Social-engineering classification
- `nlp/features.py` — Feature extraction and normalization

---

### Rule Engine

**Status:** 🔵 PLANNED

**File:** `backend/app/risk/rules.py`

**Responsibility:**
Apply deterministic, explainable rules that contribute to the overall risk score.

**Design principle:**
Rules are transparent and human-readable. They provide an explainable baseline that complements the ML model.

**Example rules (prototype — not final):**
```
IF new_device         → risk += 0.10
IF recipient_unknown  → risk += 0.10
IF amount > baseline × 5 → risk += 0.20
IF social_engineering_score > 0.70 → risk += 0.25
```

Thresholds will be calibrated experimentally.

---

### ML Risk Model

**Status:** 🔵 PLANNED

**Files:** `backend/app/ml/`, `ml/` (standalone training pipeline)

**Responsibility:**
Estimate fraud probability from combined features using a trained classifier.

**Candidate models (to be compared empirically):**
1. Logistic Regression (baseline)
2. Random Forest
3. XGBoost / LightGBM

**Model selection:** Based on Precision, Recall, F1, PR-AUC on evaluation dataset.

**Important note:**
The model is trained on synthetic and/or public datasets. Any reported metrics are clearly labelled as synthetic-data results and do not represent real UPI fraud detection accuracy.

---

### Risk Fusion Engine

**Status:** 🔵 PLANNED

**File:** `backend/app/risk/fusion.py`

**Responsibility:**
Combine outputs from Rule Engine, Anomaly Detection, ML Model and Social-Engineering Analyzer into a single final risk score.

**Planned approach:**
```
Final Risk =
    Rule Score      × 0.20
  + Anomaly Score   × 0.20
  + ML Score        × 0.35
  + Social Score    × 0.25
```

**Critical signal logic:**
Certain high-risk combinations trigger a minimum risk floor regardless of individual component scores (e.g., credential request + unknown recipient + highly anomalous amount).

**Output:** Risk score clamped to `[0.0, 1.0]` with a confidence value.

---

### Explainability Engine

**Status:** 🔵 PLANNED

**File:** `backend/app/risk/explainability.py`

**Responsibility:**
Convert raw risk scores and contributing feature values into structured, human-readable reason codes.

**Reason codes (planned):**
- `NEW_DEVICE`
- `NEW_RECIPIENT`
- `AMOUNT_ANOMALY`
- `BEHAVIOR_ANOMALY`
- `TRANSACTION_VELOCITY`
- `VOICE_URGENCY`
- `AUTHORITY_IMPERSONATION`
- `CREDENTIAL_REQUEST`

**Output format:**
```json
{
  "reasons": [
    {
      "code": "NEW_DEVICE",
      "severity": "HIGH",
      "message": "Payment initiated from a new device."
    }
  ]
}
```

---

### Intervention Engine

**Status:** 🔵 PLANNED

**File:** `backend/app/risk/intervention.py`

**Responsibility:**
Determine the appropriate intervention level based on risk score, confidence and signal quality.

**Risk levels and interventions:**

| Score | Level | Intervention |
|---|---|---|
| 0.00–0.29 | LOW | PROCEED |
| 0.30–0.69 | MEDIUM | WARNING |
| 0.70–0.89 | HIGH | STRONG_WARNING |
| 0.90–1.00 | CRITICAL | VERIFICATION |

**Design principle:** Increase friction proportionally. Do NOT automatically block — always allow user to make an informed decision with context.

---

### Database / Event Store

**Technology:** PostgreSQL, SQLAlchemy, Alembic

**Status:** 🔵 SCHEMA PLANNED (next task)

**Planned entities:**
- `users`
- `devices`
- `recipients`
- `transactions`
- `risk_events`
- `risk_reasons`
- `analyst_feedback`

---

### Institution Dashboard

**Status:** 🔵 PLANNED

**Technology:** Next.js (same application, `/admin` routes)

**Responsibility:**
- Display aggregate risk statistics
- List flagged transactions
- Show risk event detail: score, reasons, contributing signals
- Allow analysts to classify events: `FRAUD | LEGITIMATE | UNCERTAIN`
- Record feedback for false-positive analysis

---

## Architectural Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Frontend framework | Next.js 15 | App Router, TypeScript, SSR capability |
| Backend framework | FastAPI | Native async, Pydantic v2, auto-docs |
| Architecture style | Modular monolith | Avoids microservice overhead for hackathon POC |
| Database | PostgreSQL | Relational model fits event + feedback data |
| ORM | SQLAlchemy 2.0 | Mature, supports async |
| Migrations | Alembic | Standard with SQLAlchemy |
| Risk approach | Hybrid rules + ML | Rules are explainable; ML learns patterns |
| Intervention style | Adaptive | Don't block — explain and confirm |
| Privacy | Data minimization | Derived features preferred over raw data |
| Docker | Deferred (no Docker installed) | docker-compose.yml prepared for future use |

---

## Phase 7: Analyst Feedback & Review (Implemented)

**New API Routes (`/api/v1/risk-events`):**

| Endpoint | Method | Description |
|---|---|---|
| `/` | GET | Paginated list of risk events with filtering |
| `/statistics` | GET | Aggregate dashboard stats (FP rate, counts by level) |
| `/{event_id}` | GET | Full risk event detail with reasons + feedback history |
| `/{event_id}/feedback` | POST | Submit analyst classification |

**New Database Table:** `analyst_feedback`  
**Privacy:** Analyst identified only by pseudonymous `analyst_identifier`. No PII stored.  
**Principle:** Feedback is an audit trail. It never retroactively changes the original risk decision.  
**Future:** `AnalystFeedback` records serve as the labelled dataset boundary for future ML retraining cycles.

See [`docs/analyst-feedback.md`](analyst-feedback.md) for full details.

---

## Status Legend

- ✅ Implemented
- 🟡 In progress
- 🔵 Planned (not yet implemented)
- ❌ Out of scope for POC
