"""
FraudShield — Social Engineering Patterns
=========================================
Centralized lexical/pattern matching definitions for social engineering indicators.
"""

from typing import List, Dict, Any
import re
from app.database.models.enums import ReasonSeverity

# Simple negation prefixes to avoid false positives on defensive statements.
# e.g., "don't share your otp", "never transfer money"
NEGATION_TOKENS = r"\b(don'?t|do not|never|should not|shouldn'?t|without|no)\b"

class PatternDefinition:
    def __init__(self, code: str, category: str, severity: ReasonSeverity, 
                 patterns: List[str], explanation: str):
        self.code = code
        self.category = category
        self.severity = severity
        # Compile patterns with word boundaries and case insensitivity
        self.patterns = [re.compile(rf"\b({p})\b", re.IGNORECASE) for p in patterns]
        self.explanation = explanation

INDICATOR_PATTERNS = [
    PatternDefinition(
        code="SE-001",
        category="URGENCY",
        severity=ReasonSeverity.MEDIUM,
        patterns=[
            r"immediately", r"right now", r"within \d+ minutes?", r"urgent",
            r"final warning", r"last chance", r"before your account is blocked",
            r"act quickly", r"do it now", r"without delay", r"hurry"
        ],
        explanation="The interaction creates strong time pressure and discourages careful verification."
    ),
    PatternDefinition(
        code="SE-002",
        category="AUTHORITY_IMPERSONATION",
        severity=ReasonSeverity.MEDIUM,
        patterns=[
            r"bank officer", r"police officer", r"government official", r"rbi official",
            r"npci", r"cyber crime (?:cell|division|department)",
            r"fraud (?:prevention )?(?:cell|department|team|division)",
            r"bank security (?:team|department|officer)",
            r"calling from (?:the )?(?:rbi|npci|cbi|police|crime)",
            r"official from (?:the )?(?:bank|government|rbi)",
            r"i am (?:a |an )?(?:bank|government|police|rbi) (?:officer|representative|official|agent)"
        ],
        explanation="The caller appears to claim authority associated with a trusted institution."
    ),
    PatternDefinition(
        code="SE-003",
        category="THREAT_COERCION",
        severity=ReasonSeverity.HIGH,
        patterns=[
            r"account closure", r"legal action", r"arrest", r"penalty",
            r"account block(ed|ing)?", r"account is blocked", r"police action", r"financial loss",
            r"suspend your account", r"freeze your account", r"frozen", r"lose everything",
            r"trai disconnection", r"sim blocked", r"server sync failure", r"safeguard account"
        ],
        explanation="The interaction contains language intended to create fear or coercion."
    ),
    PatternDefinition(
        code="SE-004",
        category="CREDENTIAL_REQUEST",
        severity=ReasonSeverity.HIGH, # OTP requests alone are highly suspicious in voice
        patterns=[
            r"otp", r"pin", r"upi pin", r"cvv", r"password",
            r"verification code", r"security code", r"card details",
            r"login credentials"
        ],
        explanation="The interaction requested a sensitive authentication code."
    ),
    PatternDefinition(
        code="SE-011",
        category="TECHNICAL_JARGON_MANIPULATION",
        severity=ReasonSeverity.HIGH,
        patterns=[
            r"ip address", r"mac address", r"device id", r"imei number",
            r"install certificates?", r"apk file", r"developer options",
            r"usb debugging", r"network configuration", r"proxy settings"
        ],
        explanation="The interaction attempts to manipulate technical settings or requests sensitive technical identifiers."
    ),
    PatternDefinition(
        code="SE-005",
        category="PAYMENT_INSTRUCTION",
        severity=ReasonSeverity.MEDIUM,
        patterns=[
            r"transfer money", r"transfer the money", r"transfer all funds", r"send money", r"pay this account",
            r"scan this qr", r"transfer to a safe account", r"move funds",
            r"refund transfer", r"reverse transaction by sending money",
            r"send the amount", r"deposit \d+", r"deposit (?:the )?(?:money|funds)"
        ],
        explanation="The interaction attempts to influence the user to initiate a financial transaction."
    ),
    PatternDefinition(
        code="SE-006",
        category="SECURITY_BYPASS",
        severity=ReasonSeverity.HIGH,
        patterns=[
            r"disable security", r"turn off verification", r"ignore the warning",
            r"disable antivirus", r"allow remote access", r"install an unknown application",
            r"share screen", r"bypass bank verification", r"click anyway"
        ],
        explanation="The interaction encourages the user to bypass normal security controls."
    ),
    PatternDefinition(
        code="SE-007",
        category="SECRECY_ISOLATION",
        severity=ReasonSeverity.MEDIUM,
        patterns=[
            r"don'?t tell anyone", r"keep this confidential", r"don'?t contact the bank",
            r"don'?t speak to your family", r"stay on the call", r"do not disconnect",
            r"do not verify this independently", r"just between us"
        ],
        explanation="The interaction discourages independent verification or outside assistance."
    ),
    PatternDefinition(
        code="SE-008",
        category="REMOTE_ACCESS",
        severity=ReasonSeverity.HIGH,
        patterns=[
            r"anydesk", r"teamviewer", r"remote desktop", r"screen sharing",
            r"remote control", r"install support app", r"grant remote access",
            r"download this app"
        ],
        explanation="The interaction requests remote access or screen control that could expose sensitive information."
    ),
    PatternDefinition(
        code="SE-009",
        category="REFUND_MANIPULATION",
        severity=ReasonSeverity.MEDIUM,
        patterns=[
            r"refund requires payment", r"refund requires otp", 
            r"reverse transaction by transferring money", r"failed transaction compensation",
            r"send money to receive money"
        ],
        explanation="The interaction describes an unusual payment or refund procedure."
    ),
    PatternDefinition(
        code="SE-010",
        category="EMOTIONAL_MANIPULATION",
        severity=ReasonSeverity.LOW,
        patterns=[
            r"panic", r"reward", r"prize", r"account emergency",
            r"family emergency", r"you won", r"lucky winner"
        ],
        explanation="The interaction appears designed to influence the user's decision through emotional pressure."
    )
]
