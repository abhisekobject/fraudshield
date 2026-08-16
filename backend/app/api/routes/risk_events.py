import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, Header, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.database.models.enums import RiskLevel, FeedbackClassification
from app.schemas.feedback import FeedbackCreateRequest, FeedbackResponse
from app.schemas.risk_event import RiskEventListResponse, RiskEventDetail, RiskEventStatistics
from app.services.risk_event_service import RiskEventService, RiskEventNotFoundError

router = APIRouter(tags=["Analyst Review & Feedback"])


def get_risk_event_service(db: Session = Depends(get_db)) -> RiskEventService:
    return RiskEventService(db)


@router.get("/", response_model=RiskEventListResponse)
def list_risk_events(
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    risk_level: RiskLevel | None = Query(None, description="Filter by risk level"),
    feedback_status: FeedbackClassification | None = Query(None, description="Filter by analyst feedback status"),
    service: RiskEventService = Depends(get_risk_event_service),
):
    """
    List risk events with optional filtering for the analyst dashboard.
    """
    return service.get_risk_events(
        page=page, 
        page_size=page_size, 
        risk_level=risk_level, 
        feedback_status=feedback_status
    )


@router.get("/statistics", response_model=RiskEventStatistics)
def get_risk_event_statistics(
    service: RiskEventService = Depends(get_risk_event_service),
):
    """
    Get aggregate statistics for the analyst dashboard.
    """
    return service.get_statistics()


@router.get("/{event_id}", response_model=RiskEventDetail)
def get_risk_event_detail(
    event_id: uuid.UUID,
    service: RiskEventService = Depends(get_risk_event_service),
):
    """
    Fetch a detailed view of a single risk event, including history and reasons.
    """
    try:
        return service.get_risk_event_detail(event_id)
    except RiskEventNotFoundError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Risk event not found")


@router.post("/{event_id}/feedback", response_model=FeedbackResponse, status_code=status.HTTP_201_CREATED)
def submit_feedback(
    event_id: uuid.UUID,
    request: FeedbackCreateRequest,
    x_analyst_id: Annotated[str, Header(description="Simulated analyst identifier for POC")] = "analyst_demo_001",
    service: RiskEventService = Depends(get_risk_event_service),
):
    """
    Submit human feedback for a risk event (e.g. marking false positive).
    This creates an immutable audit record and does NOT modify the original risk score.
    """
    try:
        return service.add_feedback(event_id, analyst_id=x_analyst_id, request=request)
    except RiskEventNotFoundError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Risk event not found")
