import React, { useState } from "react";
import { InterventionType, RiskEvaluation } from "../../types";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "../ui/Card";
import { Button } from "../ui/Button";
import { TriangleAlert, BadgeCheck, ShieldOff, ShieldX } from "lucide-react";
import { TileIcon } from "../ui/TileIcon";

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

  if (acted) {
    return (
      <Card className="bg-surface">
        <CardContent className="pt-6 text-center space-y-3">
          {actionType === "cancel" ? (
            <>
              <ShieldX className="h-8 w-8 text-slate-500 mx-auto" />
              <p className="text-sm font-semibold text-white">Payment Cancelled</p>
              <p className="text-[12px] text-ink-muted">
                This transaction has been cancelled and flagged for the analyst review queue.
              </p>
            </>
          ) : (
            <>
              <BadgeCheck className="h-8 w-8 text-emerald-500 mx-auto" />
              <p className="text-sm font-semibold text-emerald-400">Payment Completed</p>
              <p className="text-[12px] text-ink-muted">
                Transaction has been authorized and recorded. Check the Analyst view for details.
              </p>
            </>
          )}
        </CardContent>
      </Card>
    );
  }

  const { intervention } = evaluation;

  // LOW RISK — PROCEED
  if (intervention === InterventionType.PROCEED) {
    return (
      <Card className="bg-surface">
        <CardHeader className="pb-2 mb-4">
          <CardTitle className="text-emerald-400 flex items-center gap-3 text-[16px]">
            <TileIcon icon={BadgeCheck} className="bg-white" iconClassName="w-5 h-5 text-emerald-500" />
            Payment Authorized
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-[14px] text-white">
            All risk signals are within normal thresholds. This transaction has been automatically approved.
          </p>
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-[4px] p-3">
            <p className="text-[12px] text-emerald-400 font-semibold">✓ Status: COMPLETED</p>
            <p className="text-[12px] text-ink-muted mt-1">
              No manual action required. Result logged in the Analyst review queue.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // MEDIUM RISK — WARNING
  if (intervention === InterventionType.WARNING) {
    return (
      <Card className="bg-surface">
        <CardHeader className="pb-2 mb-4">
          <CardTitle className="text-amber-400 flex items-center gap-3 text-[16px]">
            <TileIcon icon={TriangleAlert} className="bg-white" iconClassName="w-5 h-5 text-amber-500" />
            Please Review This Payment
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-[14px] text-white mb-2">
            FraudShield detected unusual activity. Are you sure you want to proceed?
          </p>
        </CardContent>
        <CardFooter className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => handleAction(onCancel, "cancel")}
            disabled={loading}
            className="w-full bg-transparent border-hairline text-white hover:bg-[#1f1f1f]"
          >
            Cancel Payment
          </Button>
          <Button
            onClick={() => handleAction(onConfirm, "confirm")}
            disabled={loading}
            className="w-full bg-amber-500 hover:bg-amber-600 text-black border-0 font-semibold"
          >
            Proceed Anyway
          </Button>
        </CardFooter>
      </Card>
    );
  }

  // HIGH RISK — STRONG WARNING
  if (intervention === InterventionType.STRONG_WARNING) {
    return (
      <Card className="bg-surface">
        <CardHeader className="pb-2 mb-4">
          <CardTitle className="text-orange-400 flex items-center gap-3 text-[16px]">
            <TileIcon icon={ShieldOff} className="bg-white" iconClassName="w-5 h-5 text-orange-500" />
            Strong Warning
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-[14px] text-white font-medium mb-1">
            This payment may involve suspicious behavior.
          </p>
          <p className="text-[14px] text-ink-muted">
            Recommended action: Verify the request through an official channel before proceeding.
          </p>
        </CardContent>
        <CardFooter className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => handleAction(onCancel, "cancel")}
            disabled={loading}
            className="w-full bg-transparent border-hairline text-white hover:bg-[#1f1f1f]"
          >
            Cancel Payment
          </Button>
          <Button
            onClick={() => handleAction(onConfirm, "confirm")}
            disabled={loading}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white border-0 font-semibold"
          >
            Continue Anyway
          </Button>
        </CardFooter>
      </Card>
    );
  }

  // CRITICAL RISK — VERIFICATION REQUIRED
  return (
    <Card className="bg-surface">
      <CardHeader className="pb-2 mb-4">
        <CardTitle className="text-red-500 flex items-center gap-3 text-[16px]">
          <TileIcon icon={ShieldX} className="bg-white" iconClassName="w-5 h-5 text-red-500" />
          Verification Required
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-[14px] text-red-400 font-medium mb-1">
          Multiple high-risk indicators were detected.
        </p>
        <p className="text-[14px] text-ink-muted">
          Do not share OTP, UPI PIN, passwords, or grant remote access. Please open your official
          banking application to verify this request securely.
        </p>
      </CardContent>
      <CardFooter className="flex flex-col gap-2">
        <Button
          onClick={() => handleAction(onCancel, "cancel")}
          disabled={loading}
          variant="destructive"
          className="w-full bg-red-600 hover:bg-red-700 text-white border-0 font-semibold"
        >
          Cancel Payment
        </Button>
        <Button
          variant="ghost"
          onClick={() => handleAction(onConfirm, "confirm")}
          disabled={loading}
          className="w-full text-red-400 text-xs hover:text-red-300 hover:bg-red-500/10"
        >
          I understand the risks. Proceed anyway.
        </Button>
      </CardFooter>
    </Card>
  );
}
