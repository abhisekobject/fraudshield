import uuid
import logging
from datetime import datetime
from sqlalchemy import select, func, desc, or_
from sqlalchemy.orm import Session, joinedload

from app.database.models.risk_event import RiskEvent
from app.database.models.feedback import AnalystFeedback
from app.database.models.transaction import Transaction
from app.database.models.enums import RiskLevel, FeedbackClassification
from app.schemas.risk_event import RiskEventListResponse, RiskEventSummary, RiskEventStatistics, RiskEventDetail
from app.schemas.feedback import FeedbackCreateRequest

logger = logging.getLogger(__name__)

class RiskEventNotFoundError(Exception):
    pass

class RiskEventService:
    def __init__(self, db: Session):
        self.db = db

    def get_risk_events(
        self,
        page: int = 1,
        page_size: int = 20,
        risk_level: RiskLevel | None = None,
        feedback_status: FeedbackClassification | None = None,
    ) -> RiskEventListResponse:
        """Fetch a paginated list of risk events with optional filtering."""
        
        # Base query joining Transaction and Feedback
        query = select(RiskEvent).join(Transaction).outerjoin(AnalystFeedback)
        
        # Apply filters
        if risk_level:
            query = query.where(RiskEvent.risk_level == risk_level)
            
        if feedback_status:
            # Need to find events where the latest feedback matches the status
            # For simplicity in this SQLite/Postgres hybrid POC without complex window functions,
            # we check if any feedback matches. In a production app, we'd look at the most recent.
            query = query.where(AnalystFeedback.classification == feedback_status)
            
        # Total count before pagination
        count_query = select(func.count()).select_from(query.subquery())
        total = self.db.execute(count_query).scalar() or 0
        
        # Sorting & Pagination
        query = query.order_by(desc(RiskEvent.evaluated_at))
        offset = (page - 1) * page_size
        query = query.limit(page_size).offset(offset)
        
        # Load related data eagerly to avoid N+1
        query = query.options(
            joinedload(RiskEvent.transaction),
            joinedload(RiskEvent.analyst_feedback)
        )
        
        events = self.db.execute(query).unique().scalars().all()
        
        # Map to summary schemas
        items = []
        for event in events:
            # Sort feedback to get the latest
            sorted_fb = sorted(event.analyst_feedback, key=lambda f: f.created_at, reverse=True)
            latest_classification = sorted_fb[0].classification if sorted_fb else None
            
            items.append(RiskEventSummary(
                id=event.id,
                transaction_id=event.transaction_id,
                user_id=str(event.transaction.user_id),
                amount=float(event.transaction.amount),
                status=event.transaction.status,
                risk_score=event.risk_score,
                risk_level=event.risk_level,
                intervention=event.intervention,
                evaluated_at=event.evaluated_at,
                has_feedback=len(sorted_fb) > 0,
                latest_feedback_classification=latest_classification,
                case_status=event.case_status,
                assigned_to=event.assigned_to
            ))
            
        return RiskEventListResponse(
            items=items,
            total=total,
            page=page,
            page_size=page_size,
            has_next=(page * page_size) < total,
            has_previous=page > 1
        )

    def get_risk_event_detail(self, event_id: uuid.UUID) -> RiskEventDetail:
        """Fetch full details for a single risk event, including reasons and history."""
        query = (
            select(RiskEvent)
            .where(RiskEvent.id == event_id)
            .options(
                joinedload(RiskEvent.transaction),
                joinedload(RiskEvent.risk_reasons),
                joinedload(RiskEvent.analyst_feedback)
            )
        )
        event = self.db.execute(query).unique().scalar_one_or_none()
        
        if not event:
            raise RiskEventNotFoundError(f"RiskEvent {event_id} not found")
            
        # Pydantic will map this properly due to from_attributes=True on RiskEventDetail
        # But we need to make sure feedback is sorted newest first
        event.analyst_feedback.sort(key=lambda f: f.created_at, reverse=True)
        
        logger.info(f"risk_event_viewed: event_id={event_id}")
        return event  # type: ignore

    def add_feedback(
        self, 
        event_id: uuid.UUID, 
        analyst_id: str, 
        request: FeedbackCreateRequest
    ) -> AnalystFeedback:
        """Add a new feedback record to the risk event's audit history."""
        # Verify event exists
        event = self.db.execute(select(RiskEvent).where(RiskEvent.id == event_id)).scalar_one_or_none()
        if not event:
            raise RiskEventNotFoundError(f"RiskEvent {event_id} not found")
            
        # We append an immutable record to preserve history (Option B from requirements)
        feedback = AnalystFeedback(
            risk_event_id=event_id,
            classification=request.label,
            comment=request.notes,
            analyst_identifier=analyst_id
        )
        self.db.add(feedback)
        self.db.commit()
        self.db.refresh(feedback)
        
        logger.info(f"feedback_submitted: event_id={event_id} analyst={analyst_id} label={request.label}")
        return feedback

    def get_statistics(self) -> RiskEventStatistics:
        """Calculate global risk event and feedback statistics."""
        
        total_events = self.db.execute(select(func.count(RiskEvent.id))).scalar() or 0
        
        # Levels
        low_events = self.db.execute(select(func.count(RiskEvent.id)).where(RiskEvent.risk_level == RiskLevel.LOW)).scalar() or 0
        medium_events = self.db.execute(select(func.count(RiskEvent.id)).where(RiskEvent.risk_level == RiskLevel.MEDIUM)).scalar() or 0
        high_events = self.db.execute(select(func.count(RiskEvent.id)).where(RiskEvent.risk_level == RiskLevel.HIGH)).scalar() or 0
        critical_events = self.db.execute(select(func.count(RiskEvent.id)).where(RiskEvent.risk_level == RiskLevel.CRITICAL)).scalar() or 0
        
        # Feedback counts
        # We get the distinct risk_event_ids that have feedback
        reviewed_query = select(func.count(func.distinct(AnalystFeedback.risk_event_id)))
        reviewed_count = self.db.execute(reviewed_query).scalar() or 0
        unreviewed_count = total_events - reviewed_count
        
        # To get accurate labels without complex grouping, we'll just count all feedback labels for the POC stats
        # A more complex query would fetch the *latest* feedback per event, but this suffices for the demo
        fp_count = self.db.execute(select(func.count(AnalystFeedback.id)).where(AnalystFeedback.classification == FeedbackClassification.FALSE_POSITIVE)).scalar() or 0
        tp_count = self.db.execute(select(func.count(AnalystFeedback.id)).where(AnalystFeedback.classification == FeedbackClassification.CONFIRMED_FRAUD)).scalar() or 0
        legit_count = self.db.execute(select(func.count(AnalystFeedback.id)).where(AnalystFeedback.classification == FeedbackClassification.LEGITIMATE)).scalar() or 0
        uncert_count = self.db.execute(select(func.count(AnalystFeedback.id)).where(AnalystFeedback.classification == FeedbackClassification.UNCERTAIN)).scalar() or 0
        
        fpr = None
        # We use fp_count vs reviewed_count. If an event has multiple FP feedbacks, this might slightly skew the FPR,
        # but for the POC this conveys the mechanism clearly.
        if reviewed_count > 0:
            fpr = fp_count / reviewed_count
            
        return RiskEventStatistics(
            total_events=total_events,
            unreviewed_count=unreviewed_count,
            reviewed_count=reviewed_count,
            low_events=low_events,
            medium_events=medium_events,
            high_events=high_events,
            critical_events=critical_events,
            false_positive_count=fp_count,
            true_positive_count=tp_count,
            legitimate_count=legit_count,
            uncertain_count=uncert_count,
            false_positive_rate=fpr
        )
