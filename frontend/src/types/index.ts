// Enums mapping from Backend

export enum RiskLevel {
  LOW = "LOW",
  MEDIUM = "MEDIUM",
  HIGH = "HIGH",
  CRITICAL = "CRITICAL",
}

export enum InterventionType {
  PROCEED = "PROCEED",
  WARNING = "WARNING",
  STRONG_WARNING = "STRONG_WARNING",
  VERIFICATION = "VERIFICATION",
}

export enum ReasonSeverity {
  LOW = "LOW",
  MEDIUM = "MEDIUM",
  HIGH = "HIGH",
  CRITICAL = "CRITICAL",
}

export enum TransactionStatus {
  INITIATED = "INITIATED",
  PROCESSING = "PROCESSING",
  COMPLETED = "COMPLETED",
  FAILED = "FAILED",
  CANCELLED = "CANCELLED",
  BLOCKED = "BLOCKED",
  REQUIRES_VERIFICATION = "REQUIRES_VERIFICATION",
}

// Data Models

export interface User {
  id: string;
  email: string;
  name?: string;
  created_at: string;
}

export interface Device {
  id: string;
  user_id: string;
  device_fingerprint: string;
  trusted: boolean;
  created_at: string;
}

export interface Recipient {
  id: string;
  user_id: string;
  identifier: string;
  trusted: boolean;
  count: number;
}

export interface Transaction {
  id: string;
  user_id: string;
  recipient_id: string;
  device_id: string;
  amount: number;
  currency: string;
  status: TransactionStatus;
  initiated_at: string;
  completed_at?: string;
}

// Risk Models

export interface TriggeredRule {
  rule_id: string;
  reason_code: string;
  severity: ReasonSeverity;
  explanation: string;
  signal_value?: string;
  source_engine?: string;
  contribution?: number;
  evidence?: string;
}

export interface RiskEvaluation {
  risk_level: RiskLevel;
  intervention: InterventionType;
  rule_score: number;
  ml_probability: number | null;
  ml_available: boolean;
  social_engineering_score: number | null;
  social_engineering_available: boolean;
  final_risk_score: number;
  triggered_rules: TriggeredRule[];
  features_used: Record<string, unknown>;
  evaluation_version: string;
  model_version: string | null;
}

export interface SocialEngineeringIndicator {
  code: string;
  category: string;
  severity: ReasonSeverity;
  matched_phrase: string;
  explanation: string;
}

export interface SocialEngineeringEvaluation {
  available: boolean;
  score: number;
  risk_level: RiskLevel;
  triggered_indicators: SocialEngineeringIndicator[];
  explanation: string;
  evaluation_version: string;
  channel: string;
  method: string;
}

export interface RiskReason {
  id: string;
  risk_event_id: string;
  reason_code: string;
  severity: ReasonSeverity;
  message: string;
  signal_value?: string;
  source_engine?: string;
  contribution?: number;
  evidence?: string;
}

export interface RiskEvent {
  id: string;
  transaction_id: string;
  risk_score: number;
  confidence?: number;
  risk_level: RiskLevel;
  intervention: InterventionType;
  evaluation_version: string;
  evaluated_at: string;
  reasons: RiskReason[];
}

export interface SimulationResult {
  transaction: Transaction;
  risk_evaluation: RiskEvaluation | null;
  social_engineering: SocialEngineeringEvaluation | null;
}

// ---------------------------------------------------------------------------
// Phase 7: Analyst Feedback & Risk Events
// ---------------------------------------------------------------------------

export enum FeedbackClassification {
  LEGITIMATE = "LEGITIMATE",
  FALSE_POSITIVE = "FALSE_POSITIVE",
  CONFIRMED_FRAUD = "CONFIRMED_FRAUD",
  UNCERTAIN = "UNCERTAIN",
}

export interface FeedbackResponse {
  id: string;
  risk_event_id: string;
  classification: FeedbackClassification;
  comment: string | null;
  analyst_identifier: string;
  created_at: string;
}

export interface RiskEventSummary {
  id: string;
  transaction_id: string;
  user_id: string;
  amount: number;
  status: TransactionStatus;
  risk_score: number;
  risk_level: RiskLevel;
  intervention: InterventionType;
  evaluated_at: string;
  has_feedback: boolean;
  latest_feedback_classification: FeedbackClassification | null;
  case_status: string;
  assigned_to?: string;
}

export interface RiskEventListResponse {
  items: RiskEventSummary[];
  total: number;
  page: number;
  page_size: number;
  has_next: boolean;
  has_previous: boolean;
}

export interface RiskEventDetail {
  id: string;
  transaction_id: string;
  risk_score: number;
  confidence: number | null;
  risk_level: RiskLevel;
  intervention: InterventionType;
  evaluation_version: string | null;
  evaluated_at: string;
  transaction: Transaction;
  risk_reasons: TriggeredRule[];
  feedback_history: FeedbackResponse[];
  case_status: string;
  assigned_to?: string;
  case_notes?: string;
}

export interface RiskEventStatistics {
  total_events: number;
  unreviewed_count: number;
  reviewed_count: number;
  low_events: number;
  medium_events: number;
  high_events: number;
  critical_events: number;
  false_positive_count: number;
  true_positive_count: number;
  legitimate_count: number;
  uncertain_count: number;
  false_positive_rate: number | null;
}

export interface PaymentResponse {
  transaction: Transaction;
  risk_evaluation: RiskEvaluation;
}

export interface CreatePaymentRequest {
  user_id: string;
  recipient_id: string;
  device_id: string;
  amount: number;
  currency?: string;
  interaction_context?: {
    transcript: string;
    channel?: string;
  };
}

export interface AnalyzeInteractionRequest {
  transcript: string;
  channel?: string;
  transaction_id?: string;
}

export interface HealthResponse {
  status: string;
  version: string;
  services: {
    database: string;
    ml_engine: string;
  };
}
