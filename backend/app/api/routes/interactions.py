from enum import Enum
import uuid
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.nlp.analyzer import DeterministicPatternAnalyzer
from app.nlp.types import InteractionContext, SocialEngineeringEvaluation

router = APIRouter()
analyzer = DeterministicPatternAnalyzer()

class ChannelType(str, Enum):
    VOICE = "voice"
    TEXT = "text"
    SMS = "sms"

class InteractionAnalyzeRequest(BaseModel):
    transcript: str
    channel: ChannelType = ChannelType.VOICE
    transaction_id: Optional[uuid.UUID] = None

@router.post("/analyze", response_model=SocialEngineeringEvaluation)
def analyze_interaction(request: InteractionAnalyzeRequest, db: Session = Depends(get_db)):
    """
    Analyzes an interaction transcript for social engineering patterns.
    This is an offline deterministic pattern analysis.
    """
    
    if len(request.transcript) > 5000:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Transcript length exceeds 5000 character POC limit."
        )
        
    context = InteractionContext(
        interaction_id=uuid.uuid4(),
        transaction_id=request.transaction_id,
        transcript=request.transcript,
        channel=request.channel.value
    )
    
    try:
        evaluation = analyzer.analyze(context)
        return evaluation
    except Exception as e:
        import logging
        logging.getLogger(__name__).error(f"Interaction analysis failed: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Interaction analysis failed. Please try again."
        )
