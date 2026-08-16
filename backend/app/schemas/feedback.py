from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, ConfigDict, Field

from app.database.models.enums import FeedbackClassification

class FeedbackCreateRequest(BaseModel):
    """Payload for submitting analyst feedback on a risk event."""
    label: FeedbackClassification = Field(..., description="The analyst's classification of the risk event")
    notes: str | None = Field(None, max_length=1024, description="Optional qualitative notes")

class FeedbackResponse(BaseModel):
    """Response model for an analyst feedback record."""
    id: UUID
    risk_event_id: UUID
    classification: FeedbackClassification
    comment: str | None
    analyst_identifier: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
