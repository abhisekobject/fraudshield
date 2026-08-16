"""
FraudShield — Domain Enumerations
===================================
All constrained domain state enumerations are defined here.

Design decision:
  Enums are centralised in this module so that:
  - They can be imported by ORM models, Pydantic schemas, and application
    logic without circular imports.
  - String literals are never duplicated across the codebase.
  - Adding a new state requires only one change (here + a migration).

These are Python str-enums, meaning the database stores the string VALUE
(e.g. "LOW"), not the integer ordinal.  This makes raw SQL queries human-
readable and migrations more understandable.
"""

import enum


# ---------------------------------------------------------------------------
# Transaction
# ---------------------------------------------------------------------------

class TransactionStatus(str, enum.Enum):
    """Lifecycle states of a simulated UPI payment."""

    INITIATED = "INITIATED"
    """Payment has been created but not yet evaluated."""

    EVALUATING = "EVALUATING"
    """Risk engine is currently assessing the payment."""

    PENDING_CONFIRMATION = "PENDING_CONFIRMATION"
    """Risk engine returned MEDIUM/HIGH — waiting for user decision."""

    COMPLETED = "COMPLETED"
    """User confirmed and the simulated payment succeeded."""

    CANCELLED = "CANCELLED"
    """User explicitly cancelled."""

    FAILED = "FAILED"
    """System failure during processing."""


class TransactionType(str, enum.Enum):
    """Category of the simulated payment."""

    UPI_SEND = "UPI_SEND"
    """Standard P2P UPI transfer (primary simulated flow)."""

    UPI_REQUEST = "UPI_REQUEST"
    """Collect/request money via UPI."""

    OTHER = "OTHER"
    """Catch-all for future extension."""


# ---------------------------------------------------------------------------
# Risk evaluation
# ---------------------------------------------------------------------------

class RiskLevel(str, enum.Enum):
    """Categorical risk classification output by the risk fusion engine."""

    LOW = "LOW"
    """0.00–0.29  — proceed without friction."""

    MEDIUM = "MEDIUM"
    """0.30–0.69  — warn and ask for confirmation."""

    HIGH = "HIGH"
    """0.70–0.89  — strong warning + verification."""

    CRITICAL = "CRITICAL"
    """0.90–1.00  — strongest intervention."""


class InterventionType(str, enum.Enum):
    """The UX action the intervention engine recommends."""

    PROCEED = "PROCEED"
    """Allow payment with no friction."""

    WARNING = "WARNING"
    """Show explanatory warning; one-click confirm."""

    STRONG_WARNING = "STRONG_WARNING"
    """Show detailed risk breakdown; explicit confirm required."""

    VERIFICATION = "VERIFICATION"
    """Maximum friction; additional confirmation step."""


class RiskDecision(str, enum.Enum):
    """The user's eventual response to the intervention screen."""

    PENDING = "PENDING"
    """Intervention was shown; user has not yet responded."""

    CONFIRMED = "CONFIRMED"
    """User explicitly acknowledged the risk and proceeded."""

    CANCELLED = "CANCELLED"
    """User cancelled after seeing the warning."""


# ---------------------------------------------------------------------------
# Risk reasons / explainability
# ---------------------------------------------------------------------------

class ReasonSeverity(str, enum.Enum):
    """How significantly this individual signal contributed to risk."""

    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


# ---------------------------------------------------------------------------
# Analyst feedback
# ---------------------------------------------------------------------------

class FeedbackClassification(str, enum.Enum):
    """An analyst's verdict on a flagged risk event."""

    LEGITIMATE = "LEGITIMATE"
    """Transaction was normal; false positive."""

    FALSE_POSITIVE = "FALSE_POSITIVE"
    """System flagged it but it was not fraud."""

    CONFIRMED_FRAUD = "CONFIRMED_FRAUD"
    """Analyst confirmed this was a fraudulent or manipulated payment."""

    UNCERTAIN = "UNCERTAIN"
    """Analyst could not determine with confidence."""
