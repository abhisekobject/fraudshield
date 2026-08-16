from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, ConfigDict, Field

from app.database.models.enums import RiskLevel, InterventionType, TransactionStatus
from app.schemas.feedback import FeedbackResponse
from app.schemas.payment import TransactionDetailResponse

# Re-use the existing reason responses, but we need to define them if they aren't already exported.
# Looking at the original repo, the detailed payment response had a RiskEvaluation payload.
# Let's define the components needed for Analyst view.

class TriggeredRuleResponse(BaseModel):
    rule_id: UUID = Field(validation_alias="id")
    reason_code: str
    explanation: str = Field(validation_alias="message")
    severity: str

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    model_config = ConfigDict(from_attributes=True)

class RiskEventSummary(BaseModel):
    """Summary of a risk event for list views."""
    id: UUID
    transaction_id: UUID
    user_id: str
    amount: float
    status: TransactionStatus
    risk_score: float
    risk_level: RiskLevel
    intervention: InterventionType
    evaluated_at: datetime
    has_feedback: bool
    latest_feedback_classification: str | None = None

    model_config = ConfigDict(from_attributes=True)

class RiskEventListResponse(BaseModel):
    """Paginated list of risk events."""
    items: list[RiskEventSummary]
    total: int
    page: int
    page_size: int
    has_next: bool
    has_previous: bool

class RiskEventDetail(BaseModel):
    """Detailed view of a risk event for the analyst dashboard."""
    id: UUID
    transaction_id: UUID
    risk_score: float
    confidence: float | None
    risk_level: RiskLevel
    intervention: InterventionType
    evaluation_version: str | None
    evaluated_at: datetime
    
    # Context
    transaction: TransactionDetailResponse
    
    # Explainability
    risk_reasons: list[TriggeredRuleResponse]
    feedback_history: list[FeedbackResponse] = Field(default_factory=list, validation_alias="analyst_feedback")

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

class RiskEventStatistics(BaseModel):
    """Aggregate statistics for the analyst dashboard."""
    total_events: int
    unreviewed_count: int
    reviewed_count: int
    
    low_events: int
    medium_events: int
    high_events: int
    critical_events: int
    
    false_positive_count: int
    true_positive_count: int
    legitimate_count: int
    uncertain_count: int
    
    false_positive_rate: float | None = Field(
        None, description="False positives / Total reviewed (None if 0 reviewed)"
    )
