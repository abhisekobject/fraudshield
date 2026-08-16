# FraudShield

> **Detect the fraud. Explain the risk. Protect the decision.**

FraudShield is a proof-of-concept for **SOAIDEATHON-S40**: *Explainable Real-Time Fraud Shield for UPI, Voice Phishing and Social Engineering*.

---

## ⚠️ Important Disclaimer

**This is a hackathon proof-of-concept.**

FraudShield operates in a **simulated UPI/payment environment**.

It does **NOT**:
- Connect to real UPI infrastructure
- Access live bank systems or private banking databases
- Process real financial transactions
- Claim production-level fraud detection accuracy

All payments shown are simulations. All data is synthetic or publicly available. Performance metrics are evaluated on synthetic/public datasets and **do not represent real-world banking accuracy**.

---

## What Is FraudShield?

FraudShield is a privacy-preserving, explainable, contextual fraud-risk layer that evaluates suspicious payment behaviour **before** a transaction is completed.

Unlike traditional transaction-blocking systems, FraudShield uses **adaptive intervention**:

| Risk Level | Action |
|---|---|
| 🟢 Low (0.00–0.29) | Proceed — no friction |
| 🟡 Medium (0.30–0.69) | Explain risk + confirm |
| 🔴 High (0.70–0.89) | Strong warning + verification |
| 🚨 Critical (0.90–1.00) | Strongest intervention |

The system also provides an **Institution / Fraud Analyst Dashboard** where authorized analysts can inspect flagged events, review contributing signals, and submit feedback (legitimate / false positive / confirmed fraud).

---

## Problem Statement

**ID:** SOAIDEATHON-S40

Existing payment authorization can be insufficient when the **user themselves is being manipulated** into authorizing a fraudulent transaction (social engineering, voice phishing).

The system must evaluate not just:
> *"Is this transaction unusual?"*

…but:
> *"Is the surrounding context suggesting this user may be experiencing fraud or social engineering?"*

---

## POC Scope

### In Scope
- Simulated UPI payment interface
- Contextual risk engine (transaction + device + behaviour + social-engineering signals)
- Explainable risk reasons
- Adaptive intervention UI
- Institution fraud analyst dashboard
- Analyst feedback loop (false-positive tracking)
- ML-based fraud probability estimation (synthetic data)
- Social-engineering NLP classification (modular)
- Privacy-by-design architecture

### Out of Scope
- Real UPI / NPCI integration
- Live bank API connections
- Real customer data
- Production deployment at scale
- Nationwide fraud infrastructure replacement

---

## High-Level Architecture

```
USER / SIMULATED UPI FRONTEND
        |
        v
    API LAYER (FastAPI)
        |
        v
  RISK ORCHESTRATOR
        |
        ├── Transaction Analyzer
        ├── Device Analyzer
        ├── Behavioral Analyzer
        ├── Voice/NLP Analyzer     (optional signal)
        ├── Rule Engine
        ├── ML Risk Model
        ├── Risk Fusion Engine
        ├── Explainability Engine
        └── Intervention Engine
        |
        v
  DATABASE / EVENT STORE (PostgreSQL)
        |
        v
  INSTITUTION DASHBOARD (Fraud Analyst UI)
```

See [`docs/architecture.md`](docs/architecture.md) for detailed component descriptions.

---

## Planned Technology Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 15, TypeScript, Tailwind CSS |
| Backend | Python 3.14, FastAPI, Pydantic, SQLAlchemy |
| Database | PostgreSQL |
| ORM migrations | Alembic |
| ML | scikit-learn (+ XGBoost/LightGBM comparison) |
| NLP / Voice | Modular Python component (replaceable) |
| Infrastructure | Docker (development) |
| Testing | pytest (backend), Jest/Testing Library (frontend) |

---

## Repository Structure

```
FraudShield/
│
├── frontend/               # Next.js user application & institution dashboard
│   └── src/
│       ├── app/            # Next.js App Router pages
│       ├── components/     # Reusable UI components
│       ├── services/       # API client functions
│       ├── hooks/          # Custom React hooks
│       ├── types/          # TypeScript type definitions
│       └── utils/          # Utility functions
│
├── backend/                # Python FastAPI application
│   └── app/
│       ├── main.py         # FastAPI entry point
│       ├── api/routes/     # Route handlers
│       ├── core/           # Config, security, logging
│       ├── risk/           # Risk orchestrator and analysis modules
│       ├── ml/             # ML model training and inference
│       ├── nlp/            # Voice/NLP analysis module
│       ├── database/       # SQLAlchemy models and repository
│       └── schemas/        # Pydantic request/response schemas
│
├── ml/                     # Standalone ML pipeline (training, evaluation)
│
├── data/
│   ├── raw/                # Source datasets (not committed)
│   ├── processed/          # Processed feature datasets (not committed)
│   └── synthetic/          # Synthetic scenarios for development/testing
│
├── docs/                   # Architecture and design documentation
│
├── tests/                  # Top-level integration and scenario tests
│
├── docker/                 # Dockerfile and service configs
│
├── .env.example            # Environment variable template
├── .gitignore
├── README.md
└── docker-compose.yml      # Development environment orchestration
```

---

## Development Setup

### Prerequisites

- Node.js ≥ 18
- Python ≥ 3.11
- PostgreSQL (local install or Docker)
- npm ≥ 9

### 1. Clone and navigate

```bash
git clone <repo-url>
cd fraudshield
```

### 2. Configure environment

```bash
cp .env.example .env
# Edit .env with your local database credentials and secret key
```

### 3. Backend

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate      # Windows: .venv\Scripts\activate
pip install -r requirements.txt

# Start the development server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 4. Frontend

```bash
cd frontend
npm install
npm run dev
# Accessible at http://localhost:3000
```

### 5. Database & Testing

PostgreSQL is required for the database foundation. Ensure a local instance is running, and configure the `DATABASE_URL` in `.env`.

```bash
# Create database
createdb fraudshield_db

# Run Alembic migrations (Phase 1 Initial Schema)
cd backend
alembic upgrade head

# Run backend database model tests and health checks
PYTHONPATH=. pytest tests/ -v
```

> **Current Phase:** Phase 10 (Hackathon Validation & Demo Readiness) is complete. The system satisfies all functional requirements defined in Phases 1 through 9. Models and migrations for the simulated payment environment, ML-based Risk Fusion, Social Engineering NLP, and Analyst Feedback are ready.

---

## Development Principles

1. **Inspect before changing** — understand existing code before modifying it
2. **Modular architecture** — each risk engine component is independently testable
3. **Explainability by design** — every risk score has structured reason codes
4. **Privacy by design** — prefer derived features over raw sensitive data
5. **Data minimization** — collect only what's needed for risk analysis
6. **Hybrid rules + ML** — deterministic rules + statistical learning
7. **Adaptive intervention** — explain and confirm; don't blindly block
8. **Graceful degradation** — the risk engine works even if optional signals (e.g., voice) are unavailable
9. **No hardcoded secrets** — all configuration via environment variables
10. **No fake accuracy claims** — model metrics are clearly labelled as synthetic-data results

---

## API Overview (Planned)

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

Full API contracts will be documented as each endpoint is implemented.

---

## Hackathon Team

Six-member team — SOAIDEATHON Participant

| Role | Responsibility |
|---|---|
| Product / Architecture | Requirements, system design, integration, demo |
| Risk / Rule Engine | Scoring, rules, intervention logic |
| ML Engineer | Dataset, feature engineering, model training/evaluation |
| NLP / Voice | Speech-to-text, social-engineering classification |
| Frontend | UPI simulation, warning UX, confirmation flow |
| Backend / Dashboard | APIs, database, institution portal |

---

## License

This project is a hackathon proof-of-concept and is not intended for production use.
