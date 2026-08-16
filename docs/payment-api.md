# FraudShield — Simulated Payment API

## 1. Purpose
This document outlines the simulated payment API layer. It defines the boundaries where payment requests are received, validated, and persisted, creating the transaction lifecycle that the future Risk Engine will evaluate.

The API is strictly separated from fraud intelligence. It does NOT generate risk scores, ML predictions, or anomaly flags. It only exposes a clean abstraction for the risk orchestrator to hook into.

## 2. API Architecture
- **Namespace:** `/api/v1/payments`
- **Router:** `app.api.routes.payments`
- **Service Layer:** `app.services.payment_service`
- **Schemas:** `app.schemas.payment`
- **Validation:** Pydantic strict mode, domain-level ownership checks via SQLAlchemy.

## 3. Endpoint List

| Method | Path | Purpose |
|---|---|---|
| `POST` | `/api/v1/payments` | Initiate a new payment attempt. |
| `GET` | `/api/v1/payments/{id}` | Retrieve transaction details. |
| `GET` | `/api/v1/payments/user/{user_id}` | Retrieve paginated history for a user. |
| `POST` | `/api/v1/payments/{id}/transition` | Manually progress state (e.g. user confirmation). |

## 4. Request Schemas

### `CreatePaymentRequest`
```json
{
  "user_id": "uuid",
  "recipient_id": "uuid",
  "device_id": "uuid",
  "amount": 1000.50,
  "currency": "INR"
}
```
*Note: Amount must be > 0. Maximum 14 digits with 2 decimal places. Client cannot submit risk data.*

### `TransactionStateTransitionRequest`
```json
{
  "target_status": "COMPLETED" // or CANCELLED, EVALUATING, etc.
}
```

## 5. Response Schemas

### `PaymentResponse` (and `TransactionDetailResponse`)
```json
{
  "id": "uuid",
  "user_id": "uuid",
  "recipient_id": "uuid",
  "device_id": "uuid",
  "amount": "1000.50",
  "currency": "INR",
  "status": "INITIATED",
  "initiated_at": "2026-08-15T10:00:00Z",
  "completed_at": null,
  "transaction_type": "UPI_SEND",
  "created_at": "2026-08-15T10:00:00Z",
  "updated_at": "2026-08-15T10:00:00Z"
}
```
*Note: Amounts are serialized as strings by Pydantic to ensure zero precision loss in JSON.*

## 6. Transaction Lifecycle & State Transition Rules
The transaction state machine strictly enforces legal transitions to prevent accidental overwrites or bypasses.

*   `INITIATED` → `EVALUATING` | `CANCELLED`
*   `EVALUATING` → `PENDING_CONFIRMATION` | `COMPLETED` | `CANCELLED`
*   `PENDING_CONFIRMATION` → `COMPLETED` | `CANCELLED`
*   Terminal states (`COMPLETED`, `CANCELLED`, `FAILED`) cannot be transitioned out of. Entering a terminal state populates `completed_at`.

## 7. Validation and Ownership Rules
Domain constraints enforce strict ownership:
1.  **User Existence:** `user_id` must exist.
2.  **Recipient Ownership:** `recipient_id` must belong to `user_id`. Cannot send money to another user's recipient book to spoof familiarity.
3.  **Device Ownership:** `device_id` must belong to `user_id`. Cannot initiate from another user's device.
*Failure results in HTTP 400 (Bad Request) or 404 (Not Found).*

## 8. Error Handling
- **400 Bad Request:** Ownership violation (e.g. wrong device).
- **404 Not Found:** Referenced entity missing.
- **409 Conflict:** Illegal state transition (e.g. `COMPLETED` → `INITIATED`).
- **422 Unprocessable Entity:** Malformed request (e.g. negative amount, invalid UUID).

## 9. Pagination
History endpoint (`/api/v1/payments/user/{user_id}`) supports `limit` (max 100, default 20) and `offset`. Transactions are ordered newest-first by `initiated_at`.

## 10. Database Interaction
Database interaction is isolated in `payment_service.py`. The API router has no raw SQL. Rollbacks happen automatically via FastAPI's `Depends(get_db)` session context if an exception occurs mid-transaction.

## 11. Future Risk-Engine Integration Boundary
In `routes/payments.py`, the `create_payment` endpoint currently creates a transaction in the `INITIATED` state and returns. 

**PLANNED FUTURE RISK-AWARE BEHAVIOR:**
In the next phase, the Risk Orchestrator will be injected immediately after the transaction is persisted. 
```python
transaction = payment_service.create_transaction(db, request)
# [FUTURE] risk_result = orchestrator.evaluate(transaction)
# [FUTURE] transaction = payment_service.apply_intervention(transaction, risk_result)
```

## 12. Security & Privacy Considerations
- **No Risk Spoofing:** API does not accept `risk_score` or `risk_level` from clients. 
- **Money Handling:** Amounts are strictly `Decimal`.
- **Privacy:** Endpoint only passes UUID identifiers. Real UPI PINs, banking info, or raw audio are never handled by the payment layer.

## 13. Current Limitations
- **Idempotency:** A strict idempotency-key header is not yet implemented. Creating two identical requests will create two unique transactions.
- **PostgreSQL:** While thoroughly unit-tested via in-memory SQLite (via overridden dependency), actual PostgreSQL deployment testing is pending Docker availability.
