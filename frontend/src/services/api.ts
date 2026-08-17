import {
  CreatePaymentRequest,
  PaymentResponse,
  Transaction,
  AnalyzeInteractionRequest,
  SocialEngineeringEvaluation,
  HealthResponse,
  RiskEventListResponse,
  RiskEventStatistics,
  RiskEventDetail,
  FeedbackClassification,
  FeedbackResponse
} from "../types";

const API_BASE = "http://localhost:8000/api/v1";

// Helper to handle API responses consistently
async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let errorMessage = "An error occurred";
    try {
      const errorData = await response.json();
      if (Array.isArray(errorData.detail)) {
        // FastAPI 422 validation errors: detail is an array of {loc, msg, type}
        errorMessage = errorData.detail
          .map((e: { loc?: string[]; msg?: string }) => {
            const field = e.loc ? e.loc.filter(s => s !== "body").join(".") : "unknown";
            return `${field}: ${e.msg || "invalid"}`;
          })
          .join("; ");
      } else if (typeof errorData.detail === "string") {
        errorMessage = errorData.detail;
      } else if (typeof errorData.message === "string") {
        errorMessage = errorData.message;
      } else {
        errorMessage = JSON.stringify(errorData);
      }
    } catch {
      errorMessage = `HTTP Error ${response.status}: ${response.statusText}`;
    }
    throw new Error(errorMessage);
  }
  return response.json();
}

export const api = {
  // System
  async getHealth(): Promise<HealthResponse> {
    const res = await fetch(`http://localhost:8000/health`, { cache: 'no-store' });
    return handleResponse<HealthResponse>(res);
  },

  // Users (Assuming an endpoint exists, if not we'll hardcode some demos in components)
  // Payments
  async createPayment(request: CreatePaymentRequest): Promise<PaymentResponse> {
    // Simulate ML/NLP processing time for dramatic effect in demo
    await new Promise(resolve => setTimeout(resolve, 2500));
    const res = await fetch(`${API_BASE}/payments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
    });
    return handleResponse<PaymentResponse>(res);
  },

  async confirmPayment(transactionId: string): Promise<Transaction> {
    const res = await fetch(`${API_BASE}/payments/${transactionId}/transition`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ target_status: "COMPLETED" }),
    });
    return handleResponse<Transaction>(res);
  },

  async cancelPayment(transactionId: string): Promise<Transaction> {
    const res = await fetch(`${API_BASE}/payments/${transactionId}/transition`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ target_status: "CANCELLED" }),
    });
    return handleResponse<Transaction>(res);
  },

  async getTransactionHistory(userId: string): Promise<Transaction[]> {
    const res = await fetch(`${API_BASE}/payments/user/${userId}`);
    return handleResponse<Transaction[]>(res);
  },
  
  // To get all risk events, we might need a dedicated endpoint. 
  // If not implemented on backend yet, we'll fetch transaction history and extract it.
  
  // Interactions
  async analyzeInteraction(request: AnalyzeInteractionRequest): Promise<SocialEngineeringEvaluation> {
    // Simulate ML/NLP processing time for dramatic effect in demo
    await new Promise(resolve => setTimeout(resolve, 2500));
    const res = await fetch(`${API_BASE}/interactions/analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
    });
    return handleResponse<SocialEngineeringEvaluation>(res);
  },

  // ---------------------------------------------------------------------------
  // Phase 7: Risk Events & Analyst Feedback
  // ---------------------------------------------------------------------------

  async getRiskEvents(
    page: number = 1,
    pageSize: number = 20,
    riskLevel?: string,
    feedbackStatus?: string
  ): Promise<RiskEventListResponse> {
    const params = new URLSearchParams({
      page: page.toString(),
      page_size: pageSize.toString(),
    });
    if (riskLevel) params.append("risk_level", riskLevel);
    if (feedbackStatus) params.append("feedback_status", feedbackStatus);

    const res = await fetch(`${API_BASE}/risk-events/?${params.toString()}`);
    return handleResponse<RiskEventListResponse>(res);
  },

  async getRiskEventStatistics(): Promise<RiskEventStatistics> {
    const res = await fetch(`${API_BASE}/risk-events/statistics`);
    return handleResponse<RiskEventStatistics>(res);
  },

  async getRiskEventDetail(eventId: string): Promise<RiskEventDetail> {
    const res = await fetch(`${API_BASE}/risk-events/${eventId}`);
    return handleResponse<RiskEventDetail>(res);
  },

  async submitFeedback(
    eventId: string,
    classification: FeedbackClassification,
    notes: string,
    analystId: string = "analyst_demo_001"
  ): Promise<FeedbackResponse> {
    const res = await fetch(`${API_BASE}/risk-events/${eventId}/feedback`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "X-Analyst-ID": analystId
      },
      body: JSON.stringify({ label: classification, notes }),
    });
    return handleResponse<FeedbackResponse>(res);
  }
};
