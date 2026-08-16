export interface DemoScenario {
  id: string;
  name: string;
  description: string;
  payload: {
    userId: string;
    deviceId: string;
    recipientId: string;
    amount: string;
    includeContext: boolean;
    transcript: string;
  };
  expectedResult: {
    level: string;
    reason: string;
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Deterministic demo UUIDs — seeded by reset_demo_data.py
// ─────────────────────────────────────────────────────────────────────────────
const DEMO_USER     = "a0000000-0000-0000-0000-000000000001"; // Seeded user (has history, avg ≈ ₹1,300)
const DEV_TRUSTED   = "a0000000-0000-0000-0000-000000000010"; // Seeded: trusted device
const DEV_NEW       = "a0000000-0000-0000-0000-000000000011"; // Seeded: brand new device
const DEV_UNTRUSTED = "a0000000-0000-0000-0000-000000000012"; // Seeded: untrusted device
const REC_TRUSTED   = "a0000000-0000-0000-0000-000000000020"; // Seeded: known recipient
const REC_NEW_001   = "a0000000-0000-0000-0000-000000000021"; // Seeded: new recipient A
const REC_NEW_002   = "a0000000-0000-0000-0000-000000000022"; // Seeded: new recipient B

// ─────────────────────────────────────────────────────────────────────────────
// Isolated user IDs for scenarios that need a clean velocity history.
// Using unique users per scenario means repeated demo runs don't accumulate
// velocity counts and change the expected risk outcome.
// The backend auto-creates these users on first call.
// ─────────────────────────────────────────────────────────────────────────────
const USER_NORMAL   = DEMO_USER;                              // Uses seeded history (avg, device trust)
const USER_VELOCITY = DEMO_USER;                              // Shares seeded 4 recent txns
const USER_AMOUNT   = "b0000000-0000-0000-0000-000000000002"; // Isolated for amount anomaly demo
const USER_PHISHING = "b0000000-0000-0000-0000-000000000003"; // Isolated for NLP phishing demo
const USER_COERCIVE = "b0000000-0000-0000-0000-000000000004"; // Isolated for coercive transfer
const USER_MULTI    = "b0000000-0000-0000-0000-000000000005"; // Isolated for multi-signal attack

export const DEMO_SCENARIOS: DemoScenario[] = [
  // ──────────────────────────────────────────────────────────────────────────
  // Scenario 1: Normal Payment → Expected: LOW
  // All signals clean: trusted device + known recipient + normal amount.
  // ──────────────────────────────────────────────────────────────────────────
  {
    id: "normal_payment",
    name: "Normal Payment",
    description:
      "An ordinary transaction using an established trusted device and a known recipient. Amount is within the user's historical average. All signals normal — ML predicts LOW fraud probability.",
    payload: {
      userId: USER_NORMAL,
      deviceId: DEV_TRUSTED,
      recipientId: REC_TRUSTED,
      amount: "500",
      includeContext: false,
      transcript: "",
    },
    expectedResult: {
      level: "LOW",
      reason: "All signals normal. Auto-approved by FraudShield.",
    },
  },

  // ──────────────────────────────────────────────────────────────────────────
  // Scenario 2: New Device → Expected: MEDIUM
  // RULE-001: device_is_new = true → deterministic medium flag.
  // ──────────────────────────────────────────────────────────────────────────
  {
    id: "new_device",
    name: "New Device",
    description:
      "A payment from a device that has never been used for this account before. RULE-001 (NEW_DEVICE) triggers with MEDIUM severity. Requires user confirmation.",
    payload: {
      userId: USER_NORMAL,
      deviceId: DEV_NEW,
      recipientId: REC_TRUSTED,
      amount: "2000",
      includeContext: false,
      transcript: "",
    },
    expectedResult: {
      level: "MEDIUM",
      reason: "RULE-001: New device detected.",
    },
  },

  // ──────────────────────────────────────────────────────────────────────────
  // Scenario 3: High Amount Anomaly → Expected: HIGH
  // Isolated user: no velocity history. Only RULE-004 fires (amount 50x+ avg).
  // ──────────────────────────────────────────────────────────────────────────
  {
    id: "high_amount",
    name: "High Amount Anomaly",
    description:
      "A transaction vastly exceeding the user's historical spending average (₹85,000 vs ₹1,300 baseline). RULE-004 (HIGH_AMOUNT_RELATIVE_TO_HISTORY) fires at HIGH severity.",
    payload: {
      userId: USER_AMOUNT,
      deviceId: DEV_TRUSTED,
      recipientId: REC_TRUSTED,
      amount: "85000",
      includeContext: false,
      transcript: "",
    },
    expectedResult: {
      level: "HIGH",
      reason: "RULE-004: Amount 65x the historical average.",
    },
  },

  // ──────────────────────────────────────────────────────────────────────────
  // Scenario 4: High Velocity → Expected: MEDIUM / HIGH
  // Uses DEMO_USER who has 4 seeded recent transactions.
  // The 5th transaction (this one) triggers RULE-005.
  // ──────────────────────────────────────────────────────────────────────────
  {
    id: "high_velocity",
    name: "High Velocity",
    description:
      "The user already has 4 recent transactions in the last 10 minutes (from seed data). This 5th transaction triggers RULE-005 (HIGH_TRANSACTION_VELOCITY) at HIGH severity.",
    payload: {
      userId: USER_VELOCITY,
      deviceId: DEV_TRUSTED,
      recipientId: REC_TRUSTED,
      amount: "1000",
      includeContext: false,
      transcript: "",
    },
    expectedResult: {
      level: "MEDIUM / HIGH",
      reason: "RULE-005: High transaction velocity (≥5 in last 10 minutes).",
    },
  },

  // ──────────────────────────────────────────────────────────────────────────
  // Scenario 5: Voice Phishing → Expected: HIGH
  // NLP engine detects: Authority + Urgency + Credential Request.
  // ──────────────────────────────────────────────────────────────────────────
  {
    id: "voice_phishing",
    name: "Voice Phishing",
    description:
      "A payment accompanied by a coercive voice interaction. The NLP engine detects Authority Impersonation + Urgency + OTP/Credential Request — classic vishing attack indicators.",
    payload: {
      userId: USER_PHISHING,
      deviceId: DEV_TRUSTED,
      recipientId: REC_TRUSTED,
      amount: "4000",
      includeContext: true,
      transcript:
        "I am calling from bank security. Your account needs urgent verification. Tell me the OTP so I can secure the account.",
    },
    expectedResult: {
      level: "HIGH",
      reason: "NLP: Authority Impersonation + Urgency + Credential Request.",
    },
  },

  // ──────────────────────────────────────────────────────────────────────────
  // Scenario 6: Coercive Transfer → Expected: CRITICAL
  // New recipient + threatening interaction = multi-signal critical.
  // ──────────────────────────────────────────────────────────────────────────
  {
    id: "coercive_transfer",
    name: "Coercive Transfer",
    description:
      "Transfer to a brand-new unknown recipient combined with a threatening, coercive voice interaction. NLP detects Threat + Payment Instruction + Urgency. RULE-002 also fires.",
    payload: {
      userId: USER_COERCIVE,
      deviceId: DEV_TRUSTED,
      recipientId: REC_NEW_001,
      amount: "25000",
      includeContext: true,
      transcript:
        "The bank account has been compromised. Move your money immediately to this safe account or you will lose everything.",
    },
    expectedResult: {
      level: "CRITICAL",
      reason: "NLP: Threat + Payment Instruction. RULE-002: New recipient.",
    },
  },

  // ──────────────────────────────────────────────────────────────────────────
  // Scenario 7: Multi-Signal Attack → Expected: CRITICAL
  // Every fraud signal fires simultaneously — the flagship hackathon demo.
  // ──────────────────────────────────────────────────────────────────────────
  {
    id: "multi_signal_attack",
    name: "Multi-Signal Attack",
    description:
      "The primary hackathon demo: untrusted device + completely unknown recipient + 73x amount anomaly + full coercive interaction. Every rule and NLP signal fires simultaneously.",
    payload: {
      userId: USER_MULTI,
      deviceId: DEV_UNTRUSTED,
      recipientId: REC_NEW_002,
      amount: "95000",
      includeContext: true,
      transcript:
        "Your account is frozen. Do not hang up. Transfer all funds to the safe account right now to prevent legal action.",
    },
    expectedResult: {
      level: "CRITICAL",
      reason: "Untrusted device + unknown recipient + extreme amount + coercive interaction.",
    },
  },
];
