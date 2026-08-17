// Shared call scenario definitions used by both the Interaction page
// and the Mobile Simulation page.

export interface CallScenario {
  id: string;
  label: string;
  tag: string;
  tagColor: string;
  expectedRisk: string;
  rateMultiplier: number;
  pitchOffset: number;
  script: string;
}

export const CALL_SCENARIOS: CallScenario[] = [
  {
    id: "legitimate",
    label: "Legitimate Bank Call",
    tag: "Low Risk",
    tagColor: "emerald",
    expectedRisk: "LOW",
    rateMultiplier: 1.0,
    pitchOffset: 0.1,
    script:
      "Caller: Hello, this is an automated security notification from your bank. We detected a login to your account from a new browser. If this was you, no action is needed.\nVictim: Okay, that was probably me.\nCaller: If you did not initiate this, please visit your nearest branch or dial the official helpline number printed on the back of your card. As a reminder, your bank will never call to ask for any verification codes or account credentials. Thank you and have a good day.",
  },
  {
    id: "suspicious_legit",
    label: "Urgent But Legitimate",
    tag: "Medium Risk",
    tagColor: "amber",
    expectedRisk: "MEDIUM",
    rateMultiplier: 0.95,
    pitchOffset: -0.05,
    script:
      "Caller: Hello, I am calling from Apollo Hospital, billing department. Your family member has been admitted and the insurance pre-authorization is still pending.\nVictim: Oh no, is everyone okay? How much is it?\nCaller: The hospital requires an advance deposit of twenty five thousand rupees before the procedure can be scheduled. Kindly visit the hospital cashier counter or use our official website to complete the payment at your earliest convenience.\nVictim: I will do that right away.\nCaller: The operation is planned for this afternoon, so prompt action would be appreciated. Thank you.",
  },
  {
    id: "otp_phishing",
    label: "OTP Phishing Attack",
    tag: "High Risk",
    tagColor: "orange",
    expectedRisk: "HIGH",
    rateMultiplier: 0.9,
    pitchOffset: -0.1,
    script:
      "Caller: I am calling from the bank fraud prevention team. We have blocked a transaction of eighty thousand rupees from your account. To reverse this and secure your account, I need to verify your identity.\nVictim: Oh my goodness, yes please secure it! What do you need?\nCaller: Please share the six digit OTP that was just sent to your registered mobile number. Do not share this with anyone else, only tell me as I am the official bank representative.",
  },
  {
    id: "coercive_transfer",
    label: "Coercive Transfer Scam",
    tag: "Critical",
    tagColor: "red",
    expectedRisk: "CRITICAL",
    rateMultiplier: 0.88,
    pitchOffset: -0.2,
    script:
      "Caller: Listen carefully. Your bank account has been flagged by the Cyber Crime Department for suspicious transactions. You are under investigation.\nVictim: Investigation? I haven't done anything wrong!\nCaller: To avoid arrest and account seizure, you must immediately transfer fifty thousand rupees to a government safe-hold account I am providing you.\nVictim: I don't know if I can do that right now...\nCaller: Do not disconnect this call, do not tell your family, and do not visit any branch. This is confidential police protocol.",
  },
  {
    id: "multi_signal",
    label: "Multi-Signal Attack",
    tag: "Critical",
    tagColor: "red",
    expectedRisk: "CRITICAL",
    rateMultiplier: 0.85,
    pitchOffset: -0.25,
    script:
      "Caller: Your account has been compromised by international hackers and is being drained right now. I am from the RBI Cyber Cell. If you do not act in the next two minutes, you will lose all your money permanently.\nVictim: Please help me stop it!\nCaller: Transfer everything to the emergency recovery account immediately. Give me the OTP to authorize the transfer. Stay on the line, do not hang up, do not call anyone else. This is your last chance to save your money.",
  },
];
