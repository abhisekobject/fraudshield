# Analyst Feedback & Review System

## Overview

FraudShield's **Analyst Review System** (Phase 7) provides a human-in-the-loop feedback loop for fraud analysts to review flagged transactions, investigate risk explanations, and classify outcomes. This feedback is stored as a structured audit trail and provides the conceptual foundation for future ML retraining cycles.

> **Core Design Principle:** Human feedback informs future model improvement but **never silently overrides** the current production risk decision. The original risk score and intervention recommendation are always preserved as-is.

---

## Architecture

```
Risk Engine → RiskEvent + RiskReasons (immutable after creation)
                    │
                    ▼
         Analyst Dashboard UI
         (reviews, investigates)
                    │
                    ▼
         POST /api/v1/risk-events/{id}/feedback
                    │
                    ▼
         AnalystFeedback (audit record, never modifies RiskEvent)
                    │
                    ▼
         ReviewedRiskSample (conceptual: future ML retraining boundary)
```

---

## Data Model

### `AnalystFeedback`

Stored in the `analyst_feedback` table. Multiple feedback records can exist for a single `RiskEvent`, forming an audit trail.

| Field | Type | Description |
|---|---|---|
| `id` | UUID | Primary key |
| `risk_event_id` | UUID (FK) | References `risk_events.id` (CASCADE DELETE) |
| `classification` | Enum | `LEGITIMATE`, `FALSE_POSITIVE`, `CONFIRMED_FRAUD`, `UNCERTAIN` |
| `comment` | VARCHAR(1024) | Optional free-text analyst note |
| `analyst_identifier` | VARCHAR(255) | Pseudonymous analyst ID (not stored with PII) |
| `created_at` | Datetime | When the feedback was recorded |

### Classification Labels

| Label | Meaning |
|---|---|
| `LEGITIMATE` | Transaction was genuine; risk system correctly processed a non-fraud case |
| `FALSE_POSITIVE` | System flagged the transaction but it was not fraud |
| `CONFIRMED_FRAUD` | System correctly caught a fraud attempt |
| `UNCERTAIN` | Evidence is ambiguous; requires Tier-2 escalation |

---

## API Endpoints

All endpoints are prefixed with `/api/v1/risk-events`.

### `GET /` — List Risk Events

Returns a paginated list of risk events, optionally filtered by risk level or feedback classification.

**Query Parameters:**

| Parameter | Type | Description |
|---|---|---|
| `page` | int | Page number (default: 1) |
| `page_size` | int | Items per page (default: 20, max: 100) |
| `risk_level` | enum | Filter: `LOW`, `MEDIUM`, `HIGH`, `CRITICAL` |
| `feedback_status` | enum | Filter by latest feedback classification |

**Response:** `RiskEventListResponse` — includes summary per event with `has_feedback` flag and `latest_feedback_classification`.

---

### `GET /statistics` — Dashboard Statistics

Returns aggregate counts for the analyst dashboard header.

**Response fields:**

| Field | Description |
|---|---|
| `total_events` | Total risk events in the system |
| `unreviewed_count` | Events with no analyst feedback |
| `reviewed_count` | Events that have at least one feedback record |
| `low/medium/high/critical_events` | Count by risk level |
| `false_positive_count` | Count of `FALSE_POSITIVE` classifications |
| `true_positive_count` | Count of `CONFIRMED_FRAUD` classifications |
| `legitimate_count` | Count of `LEGITIMATE` classifications |
| `uncertain_count` | Count of `UNCERTAIN` classifications |
| `false_positive_rate` | `false_positives / reviewed` (null if no reviews) |

---

### `GET /{event_id}` — Risk Event Detail

Returns the full detail of a single risk event including:
- Transaction context (amount, status, timestamps)
- All triggered `RiskReasons` with human-readable explanations
- Full `feedback_history` (ordered by `created_at`)

---

### `POST /{event_id}/feedback` — Submit Feedback

Records a new analyst classification for a risk event.

**Request Body:**

```json
{
  "label": "FALSE_POSITIVE",
  "notes": "User confirmed they were traveling and bought a new SIM."
}
```

**Headers:**

| Header | Description |
|---|---|
| `X-Analyst-ID` | Pseudonymous analyst identifier (defaults to `analyst_demo_001`) |

**Response:** `201 Created` — the `FeedbackResponse` record.

> Multiple feedback submissions are allowed for the same event. Each creates a new audit trail entry. The system does **not** overwrite previous verdicts.

---

## Privacy Constraints

The analyst system is designed with privacy by default:

- ❌ Do NOT store: raw voice recordings, transcripts, OTP values, passwords, PINs, CVV, or authentication secrets
- ❌ Do NOT store: the analyst's full name or contact details — only a pseudonymous `analyst_identifier`
- ✅ DO store: risk scores, reason codes, classification labels, and free-text investigation notes

---

## Future: ML Retraining Boundary

The `AnalystFeedback` table serves as the conceptual boundary for **future ML retraining** cycles:

1. Analyst reviews flagged events and classifies them
2. A future `ReviewedRiskSample` pipeline reads `CONFIRMED_FRAUD` and `FALSE_POSITIVE` records
3. These labelled samples are exported as training data for re-training the fraud detection model
4. A new model version is evaluated on held-out data before being promoted to production

This ensures the feedback loop is **explicit, auditable, and human-controlled** — not an automatic drift-correction mechanism.

---

## Demo Data

To seed the database with representative demo data for analyst review, run:

```bash
cd backend
DATABASE_URL=sqlite:///./fraudshield.db PYTHONPATH=. .venv/bin/python scripts/seed_demo_data.py
```

This creates 4 transactions (low-risk, new-device, voice-phishing, critical multi-signal) and pre-populates analyst feedback records to demonstrate the dashboard's review state.
