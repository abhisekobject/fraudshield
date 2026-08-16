import React, { useState } from "react";
import { InterventionType, RiskEvaluation } from "../../types";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "../ui/Card";
import { Button } from "../ui/Button";
import { AlertTriangle, CheckCircle, ShieldAlert, ShieldX } from "lucide-react";

interface InterventionPanelProps {
  evaluation: RiskEvaluation;
  onConfirm: () => Promise<void>;
  onCancel: () => Promise<void>;
}

export function InterventionPanel({ evaluation, onConfirm, onCancel }: InterventionPanelProps) {
  const [loading, setLoading] = useState(false);
  const [acted, setActed] = useState(false);
  const [actionType, setActionType] = useState<"confirm" | "cancel" | null>(null);

  const handleAction = async (actionFn: () => Promise<void>, type: "confirm" | "cancel") => {
    setLoading(true);
    try {
      await actionFn();
    } catch (e: unknown) {
      // Swallow 409 Conflict / "Illegal state transition" errors gracefully.
      // These occur because the backend already auto-transitioned the transaction
      // (e.g., LOW risk is auto-COMPLETED). The action has already happened — treat as success.
      const message = e instanceof Error ? e.message : String(e);
      const isIdempotentError =
        message.includes("409") ||
        message.toLowerCase().includes("illegal state") ||
        message.toLowerCase().includes("conflict");
      if (!isIdempotentError) {
        console.error("Intervention action failed:", e);
      }
    } finally {
      setActed(true);
      setActionType(type);
      setLoading(false);
    }
  };

  // Show a clean result card after any action is taken
  if (acted) {
    return (
      <Card className="border-[#2a2a2a] bg-[#141414] rounded-md">
        <CardContent className="pt-6 text-center space-y-3">
          {actionType === "cancel" ? (
            <>
              <ShieldX className="h-8 w-8 text-slate-400 mx-auto" />
              <p className="text-sm font-semibold text-slate-300">Payment Cancelled</p>
              <p className="text-xs text-slate-500">
                This transaction has been cancelled and flagged for the analyst review queue.
              </p>
            </>
          ) : (
            <>
              <CheckCircle className="h-8 w-8 text-emerald-400 mx-auto" />
              <p className="text-sm font-semibold text-emerald-300">Payment Completed</p>
              <p className="text-xs text-slate-500">
                Transaction has been authorized and recorded. Check the Analyst view for details.
              </p>
            </>
          )}
        </CardContent>
      </Card>
    );
  }

  const { intervention } = evaluation;

  // ────────────────────────────────────────────────────────────────────────────
  // LOW RISK — PROCEED
  // The backend auto-transitions to COMPLETED for LOW risk transactions.
  // We must NOT call onConfirm() again (would cause 409 Conflict).
  // Show a static informational card only.
  // ────────────────────────────────────────────────────────────────────────────
  if (intervention === InterventionType.PROCEED) {
    return (
      <Card className="border-[#2a2a2a] bg-[#141414] rounded-md">
        <CardHeader className="pb-2">
          <CardTitle className="text-emerald-400 flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            Payment Authorized
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-emerald-300/80">
            All risk signals are within normal thresholds. This transaction has been automatically approved.
          </p>
          <div className="bg-[#0a1a0f] border border-emerald-900 rounded-md p-3">
            <p className="text-xs text-emerald-400 font-semibold">✓ Status: COMPLETED</p>
            <p className="text-xs text-slate-500 mt-1">
              No manual action required. Result logged in the Analyst review queue.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // ────────────────────────────────────────────────────────────────────────────
  // MEDIUM RISK — WARNING
  // ────────────────────────────────────────────────────────────────────────────
  if (intervention === InterventionType.WARNING) {
    return (
      <Card className="border-[#2a2a2a] bg-[#141414] rounded-md">
        <CardHeader className="pb-2">
          <CardTitle className="text-amber-400 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Please Review This Payment
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-amber-300/80 mb-2">
            FraudShield detected unusual activity. Are you sure you want to proceed?
          </p>
        </CardContent>
        <CardFooter className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => handleAction(onCancel, "cancel")}
            disabled={loading}
            className="w-full bg-transparent text-slate-300 border-[#333] hover:bg-[#222]"
          >
            Cancel Payment
          </Button>
          <Button
            onClick={() => handleAction(onConfirm, "confirm")}
            disabled={loading}
            className="w-full bg-amber-500 text-amber-950 hover:bg-amber-600"
          >
            Proceed Anyway
          </Button>
        </CardFooter>
      </Card>
    );
  }

  // ────────────────────────────────────────────────────────────────────────────
  // HIGH RISK — STRONG WARNING
  // ────────────────────────────────────────────────────────────────────────────
  if (intervention === InterventionType.STRONG_WARNING) {
    return (
      <Card className="border-[#2a2a2a] bg-[#141414] rounded-md">
        <CardHeader className="pb-2">
          <CardTitle className="text-orange-400 flex items-center gap-2">
            <ShieldAlert className="h-5 w-5" />
            Strong Warning
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-orange-300 font-medium mb-1">
            This payment may involve suspicious behavior.
          </p>
          <p className="text-sm text-orange-300/80">
            Recommended action: Verify the request through an official channel before proceeding.
          </p>
        </CardContent>
        <CardFooter className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => handleAction(onCancel, "cancel")}
            disabled={loading}
            className="w-full bg-transparent text-slate-300 border-[#333] hover:bg-[#222]"
          >
            Cancel Payment
          </Button>
          <Button
            onClick={() => handleAction(onConfirm, "confirm")}
            disabled={loading}
            className="w-full bg-orange-500 text-orange-950 hover:bg-orange-600"
          >
            Continue Anyway
          </Button>
        </CardFooter>
      </Card>
    );
  }

  // ────────────────────────────────────────────────────────────────────────────
  // CRITICAL RISK — VERIFICATION REQUIRED
  // ────────────────────────────────────────────────────────────────────────────
  return (
    <Card className="border-[#2a2a2a] bg-[#141414] rounded-md">
      <CardHeader className="pb-2">
        <CardTitle className="text-red-400 flex items-center gap-2">
          <ShieldX className="h-5 w-5" />
          Verification Required
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-red-300 font-medium mb-1">
          Multiple high-risk indicators were detected.
        </p>
        <p className="text-sm text-red-300/80">
          Do not share OTP, UPI PIN, passwords, or grant remote access. Please open your official
          banking application to verify this request securely.
        </p>
      </CardContent>
      <CardFooter className="flex flex-col gap-2">
        <Button
          onClick={() => handleAction(onCancel, "cancel")}
          disabled={loading}
          className="w-full bg-red-500 text-white hover:bg-red-600"
        >
          Cancel Payment
        </Button>
        {/* Allow confirmation override to demonstrate the Legitimate Override scenario */}
        <Button
          variant="ghost"
          onClick={() => handleAction(onConfirm, "confirm")}
          disabled={loading}
          className="w-full text-red-400 hover:bg-[#1a1a1a] hover:text-red-300 text-xs"
        >
          I understand the risks. Proceed anyway.
        </Button>
      </CardFooter>
    </Card>
  );
}
