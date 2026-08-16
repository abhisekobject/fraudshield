# FraudShield Database Architecture

## Purpose
The FraudShield database serves as the persistent foundation of the domain model. It represents the simulated payment environment (Users, Devices, Recipients, Transactions) and the risk evaluation output (Risk Events, Risk Reasons, Analyst Feedback). 

The schema is designed around the **domain**, not the UI, with a primary focus on auditability, explainability, and future extensibility.

## Technology
*   **Database:** PostgreSQL (via SQLAlchemy 2.0 ORM)
*   **Migrations:** Alembic
*   **Configuration:** Loaded via `pydantic-settings` (`DATABASE_URL`)
*   **Identifiers:** UUID (v4) for all primary keys
*   **Amounts:** `NUMERIC(14,2)` to prevent floating-point errors

## Entities and Relationships

```text
User
 ├── Device
 ├── Recipient
 └── Transaction
       └── RiskEvent
              ├── RiskReason
              └── AnalystFeedback
```

### 1. `users`
*   **Purpose:** The identity of a simulated payment sender.
*   **Primary Key:** `id` (UUID)
*   **Important Fields:** `email` (Unique), `name`, `is_active`
*   **Relationships:** One-to-many with `devices`, `recipients`, `transactions`

### 2. `devices`
*   **Purpose:** Supports detection of unknown or changing devices (a strong fraud signal).
*   **Primary Key:** `id` (UUID)
*   **Foreign Keys:** `user_id` -> `users.id`
*   **Important Fields:** `device_fingerprint` (simulated identifier), `is_trusted` (defaults False)

### 3. `recipients`
*   **Purpose:** Tracks payment beneficiaries to evaluate recipient familiarity and velocity.
*   **Primary Key:** `id` (UUID)
*   **Foreign Keys:** `user_id` -> `users.id`
*   **Important Fields:** `recipient_identifier` (simulated VPA/Phone), `transaction_count`
*   **Constraints:** `(user_id, recipient_identifier)` must be unique

### 4. `transactions`
*   **Purpose:** Represents a simulated UPI payment attempt.
*   **Primary Key:** `id` (UUID)
*   **Foreign Keys:** `user_id` -> `users.id`, `recipient_id` -> `recipients.id`, `device_id` -> `devices.id`
*   **Important Fields:** `amount` (NUMERIC), `currency` (defaults to INR), `status`
*   **Constraints:** `amount > 0`

### 5. `risk_events`
*   **Purpose:** The evaluation outcome produced by the FraudShield risk engine.
*   **Primary Key:** `id` (UUID)
*   **Foreign Keys:** `transaction_id` -> `transactions.id`
*   **Important Fields:** `risk_score`, `confidence`, `risk_level`, `intervention`, `decision`
*   **Constraints:** `risk_score` and `confidence` must be between `0.0` and `1.0`

### 6. `risk_reasons`
*   **Purpose:** Individual explainability signals (e.g., NEW_DEVICE, AMOUNT_ANOMALY).
*   **Primary Key:** `id` (UUID)
*   **Foreign Keys:** `risk_event_id` -> `risk_events.id`
*   **Important Fields:** `reason_code`, `severity`, `message`, `signal_value`

### 7. `analyst_feedback`
*   **Purpose:** Closes the feedback loop by recording institutional manual review.
*   **Primary Key:** `id` (UUID)
*   **Foreign Keys:** `risk_event_id` -> `risk_events.id`
*   **Important Fields:** `classification` (e.g., CONFIRMED_FRAUD), `analyst_identifier`

---

## Policies

### Timestamp Policy
All persisted timestamps (`created_at`, `updated_at`, `initiated_at`, etc.) are stored in **UTC** and are timezone-aware. They should be converted to local presentation time at the UI layer.

### Money / Amount Policy
Amounts are stored as **exact decimals** using PostgreSQL's `NUMERIC(14,2)`. Floating point (e.g., `FLOAT`, `REAL`) is strictly forbidden for monetary values to prevent rounding errors.

### Deletion / Cascade Policy
Because FraudShield is a fraud/audit-oriented system, data casual deletion is restricted:
*   **RESTRICT on Transactions:** A user, device, or recipient cannot be deleted if transactions reference them. Transactions are immutable audit logs.
*   **CASCADE on Risk Events:** Risk events belong exclusively to a transaction.
*   **CASCADE on Devices/Recipients:** A device or recipient is exclusively owned by a user, but again, actual deletion fails if transactions exist due to the transaction RESTRICT policy.

### Enum Strategy
Constrained domain states (e.g., `RiskLevel`, `TransactionStatus`, `InterventionType`) are defined as centralized Python `str`-based `Enum`s in `app.database.models.enums`. This prevents magic strings across the codebase while keeping raw SQL queries highly readable (as strings are stored in the DB, not integer ordinals).

### Indexing Strategy
*   Foreign keys are indexed to support joins and relationship loading.
*   High-value lookups (`users.email`, `devices.device_fingerprint`, `recipients.recipient_identifier`).
*   Common filter targets (`transactions.status`, `risk_events.risk_level`).
*   **Composite Index:** `(transactions.user_id, transactions.initiated_at)` to support rapid velocity checks by the risk engine.

---

## Migrations Strategy (Alembic)
*   Alembic uses the project's SQLAlchemy metadata (`Base.metadata`).
*   `DATABASE_URL` is parsed dynamically from the environment configuration (not hardcoded in `alembic.ini`).
*   A manual initial schema has been created as the source of truth in `alembic/versions/`.

## Test Strategy
*   Unit tests validate the Python-level instantiation, typings, and constraints.
*   Integration tests involving a real PostgreSQL instance are pending until Docker is available.

## Known Limitations & Environment State
*   **Docker Pending:** Docker is not currently installed on the development machine. Consequently, real PostgreSQL integration testing is deferred. The database logic relies on static validation and unit testing.
*   **Authentication:** The `analyst_identifier` is simulated; there is no real analyst identity provider integrated yet.
*   **Seed Data:** The initial migration does *not* contain seed data. A synthetic seeding mechanism will be introduced in a future phase.

## Future Extensions
*   Additional risk signals (e.g., NLP `urgency_score`, `authority_impersonation_score`) will be added to the schema in future phases via Alembic migrations once concrete requirements for the voice layer are finalized. Do not preemptively pollute the schema with speculative features.
