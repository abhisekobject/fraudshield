"""
FraudShield — Social Engineering Analyzer
=========================================
Analyzes transcripts against social engineering patterns, filters negations, 
and produces a structured risk evaluation score.
"""

import re
import logging
from typing import List

from app.database.models.enums import RiskLevel, ReasonSeverity
from app.nlp.types import InteractionContext, SocialEngineeringIndicator, SocialEngineeringEvaluation
from app.nlp.patterns import INDICATOR_PATTERNS, NEGATION_TOKENS

logger = logging.getLogger(__name__)

# Weight contributions for scoring
SEVERITY_WEIGHTS = {
    ReasonSeverity.LOW: 0.15,
    ReasonSeverity.MEDIUM: 0.35,
    ReasonSeverity.HIGH: 0.60,
    ReasonSeverity.CRITICAL: 0.90
}

# ---------------------------------------------------------------------------
# Exception contexts — if any of these phrases are found in the SAME SENTENCE
# as a matched indicator keyword, the match is treated as a defensive/
# educational statement and suppressed. This handles cases like:
#   "We will NEVER ask you for your OTP"
#   "Your bank will NEVER request your PIN"
#   "Do not share your password with anyone"
# ---------------------------------------------------------------------------
EXCEPTION_CONTEXT_PATTERNS = [
    re.compile(r"\bnever ask\b", re.IGNORECASE),
    re.compile(r"\bnever request\b", re.IGNORECASE),
    re.compile(r"\bnever require\b", re.IGNORECASE),
    re.compile(r"\bwill not ask\b", re.IGNORECASE),
    re.compile(r"\bdo not share\b", re.IGNORECASE),
    re.compile(r"\bnever share\b", re.IGNORECASE),
    re.compile(r"\bdo not give\b", re.IGNORECASE),
    re.compile(r"\bdo not provide\b", re.IGNORECASE),
    re.compile(r"\bnever provide\b", re.IGNORECASE),
    re.compile(r"\bbeware\b", re.IGNORECASE),
    re.compile(r"\bfraud.{0,15}warning\b", re.IGNORECASE),
    re.compile(r"\bsecurity (tip|advice|reminder|warning|alert)\b", re.IGNORECASE),
]


def _get_containing_sentence(transcript: str, match_start: int, match_end: int) -> str:
    """
    Returns the full sentence that contains the character at match_start.
    Sentence boundaries are defined by: . ! ? followed by whitespace, or ; or ,
    This is more reliable than a fixed-width window for negation detection.
    """
    # Find the start of the containing sentence
    sentence_start = 0
    for i in range(match_start - 1, -1, -1):
        if transcript[i] in ".!?" and (i + 1 >= len(transcript) or transcript[i + 1] == " "):
            sentence_start = i + 1
            break

    # Find the end of the containing sentence
    sentence_end = len(transcript)
    for i in range(match_end, len(transcript)):
        if transcript[i] in ".!?":
            sentence_end = i + 1
            break

    return transcript[sentence_start:sentence_end].strip()


class DeterministicPatternAnalyzer:
    """Analyzes a transcript for social engineering indicators using regex and context."""
    
    def analyze(self, context: InteractionContext) -> SocialEngineeringEvaluation:
        transcript = context.transcript.lower().strip()
        
        if not transcript:
            return SocialEngineeringEvaluation(available=False)
            
        triggered = []
        
        for pattern_def in INDICATOR_PATTERNS:
            for regex in pattern_def.patterns:
                # Find all matches for the specific pattern
                for match in regex.finditer(transcript):
                    phrase = match.group(0)

                    # ── Sentence-level negation check ──────────────────────────────
                    # Get the full sentence containing this match, then check
                    # if it contains a negation token anywhere in that sentence.
                    # This is far more reliable than a fixed 35-char window,
                    # especially for sentences like:
                    #   "We will never ask you for your PIN, OTP, or password"
                    # where "never" is 20+ chars before "password".
                    containing_sentence = _get_containing_sentence(
                        transcript, match.start(), match.end()
                    )

                    if re.search(NEGATION_TOKENS, containing_sentence, re.IGNORECASE):
                        logger.debug(
                            f"NLP: Skipped negated match '{phrase}' "
                            f"in sentence: '{containing_sentence[:80]}...'"
                        )
                        continue

                    # ── Exception context check ────────────────────────────────────
                    # If the sentence has a known safe/educational context pattern
                    # (e.g. "we will never ask you for your OTP"), suppress the
                    # indicator — this prevents educational statements from being
                    # flagged as social engineering signals.
                    if any(exc.search(containing_sentence) for exc in EXCEPTION_CONTEXT_PATTERNS):
                        logger.debug(
                            f"NLP: Skipped exception-context match '{phrase}' "
                            f"in sentence: '{containing_sentence[:80]}...'"
                        )
                        continue

                    # If not negated and not an exception context, record indicator
                    triggered.append(SocialEngineeringIndicator(
                        code=pattern_def.code,
                        category=pattern_def.category,
                        severity=pattern_def.severity,
                        matched_phrase=phrase,
                        explanation=pattern_def.explanation
                    ))
                    # Only trigger once per pattern to avoid score inflation
                    break
                    
        # ── Dynamic Entity Extraction ──────────────────────────────────────────
        # Extract raw IP addresses (e.g. 192.168.1.1) which shouldn't be in normal payments
        ip_pattern = re.compile(r"\b(?:[0-9]{1,3}\.){3}[0-9]{1,3}\b")
        for match in ip_pattern.finditer(transcript):
            triggered.append(SocialEngineeringIndicator(
                code="SE-012",
                category="RAW_TECHNICAL_ENTITY",
                severity=ReasonSeverity.HIGH,
                matched_phrase=match.group(0),
                explanation="Detected a raw IP address in the conversation, highly indicative of technical manipulation."
            ))
            
        # Extract MAC addresses or similar hex strings
        mac_pattern = re.compile(r"\b(?:[0-9A-Fa-f]{2}[:-]){5}(?:[0-9A-Fa-f]{2})\b")
        for match in mac_pattern.finditer(transcript):
            triggered.append(SocialEngineeringIndicator(
                code="SE-013",
                category="RAW_TECHNICAL_ENTITY",
                severity=ReasonSeverity.HIGH,
                matched_phrase=match.group(0),
                explanation="Detected a hardware MAC address in the conversation, strongly implying technical manipulation."
            ))

        # Deduplicate by category code
        unique_triggered = {ind.code: ind for ind in triggered}.values()
        triggered_indicators = list(unique_triggered)
        
        if not triggered_indicators:
            return SocialEngineeringEvaluation(
                available=True,
                score=0.0,
                risk_level=RiskLevel.LOW,
                triggered_indicators=[],
                explanation="No social engineering indicators detected.",
                channel=context.channel
            )
            
        # Calculate Risk Score and Level
        score, risk_level = self._calculate_risk(triggered_indicators)
        
        # Build explanation
        explanations = [ind.explanation for ind in triggered_indicators]
        summary = "Detected potential social engineering patterns. " + " ".join(explanations)
        
        return SocialEngineeringEvaluation(
            available=True,
            score=score,
            risk_level=risk_level,
            triggered_indicators=triggered_indicators,
            explanation=summary,
            channel=context.channel
        )

    def _calculate_risk(self, indicators: List[SocialEngineeringIndicator]) -> tuple[float, RiskLevel]:
        """Calculates a normalized score (0-1) and assigns a deterministic risk level."""
        score = 0.0
        severities = set()
        
        for ind in indicators:
            score += SEVERITY_WEIGHTS.get(ind.severity, 0.0)
            severities.add(ind.severity)
            
        # Normalize
        score = min(score, 1.0)
        
        # Determine Level. Combinations elevate risk.
        if ReasonSeverity.HIGH in severities and len(indicators) >= 2:
            # High severity + any other indicator = CRITICAL risk of social engineering
            level = RiskLevel.CRITICAL
        elif ReasonSeverity.HIGH in severities:
            level = RiskLevel.HIGH
        elif ReasonSeverity.MEDIUM in severities and len(indicators) >= 2:
            # Multiple mediums become HIGH
            level = RiskLevel.HIGH
        elif ReasonSeverity.MEDIUM in severities:
            level = RiskLevel.MEDIUM
        else:
            # Only LOW indicators
            level = RiskLevel.LOW if score < 0.3 else RiskLevel.MEDIUM
            
        return score, level
