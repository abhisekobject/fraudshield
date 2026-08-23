import React, { useState } from"react";
import { InterventionType, RiskEvaluation } from"../../types";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from"../ui/Card";
import { Button } from"../ui/Button";
import { TriangleAlert, BadgeCheck, ShieldOff, ShieldX } from"lucide-react";

interface InterventionPanelProps {
 evaluation: RiskEvaluation;
 onConfirm: () => Promise<void>;
 onCancel: () => Promise<void>;
}

export function InterventionPanel({ evaluation, onConfirm, onCancel }: InterventionPanelProps) {
 const [loading, setLoading] = useState(false);
 const [acted, setActed] = useState(false);
 const [actionType, setActionType] = useState<"confirm"|"cancel"| null>(null);

 const handleAction = async (actionFn: () => Promise<void>, type:"confirm"|"cancel") => {
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
 <Card>
 <CardContent className="pt-6 text-center space-y-2">
 {actionType ==="cancel"? (
 <>
 <div className="w-12 h-12 -full bg-[#1C1C1E] flex items-center justify-center mx-auto mb-2 text-white">
 <ShieldX className="h-6 w-6 text-white"/>
 </div>
 <p className="text-sm font-semibold text-white">Payment Cancelled</p>
 <p className="text-xs text-white max-w-sm mx-auto">
 This transaction has been cancelled and flagged for the analyst review queue.
 </p>
 </>
 ) : (
 <>
 <div className="w-12 h-12 -full bg-emerald-500/20 flex items-center justify-center mx-auto mb-2 text-emerald-400">
 <BadgeCheck className="h-6 w-6 text-emerald-400"/>
 </div>
 <p className="text-sm font-semibold text-emerald-300">Payment Completed</p>
 <p className="text-xs text-white max-w-sm mx-auto">
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
 <Card>
 <CardHeader className="pb-2 mb-2">
 <CardTitle className="text-emerald-400 flex items-center gap-2.5 text-base">
 <div className="w-8 h-8 -lg bg-emerald-500/20 flex items-center justify-center">
 <BadgeCheck className="w-4 h-4 text-emerald-400"/>
 </div>
 Payment Authorized
 </CardTitle>
 </CardHeader>
 <CardContent className="space-y-3">
 <p className="text-xs text-white leading-relaxed">
 All risk signals are within normal thresholds. This transaction has been automatically approved.
 </p>
 <div className="bg-emerald-500/10 -xl p-3">
 <p className="text-xs text-emerald-300 font-semibold font-mono">✓ Status: COMPLETED</p>
 <p className="text-[11px] text-white mt-0.5">
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
 <Card>
 <CardHeader className="pb-2 mb-2">
 <CardTitle className="text-amber-400 flex items-center gap-2.5 text-base">
 <div className="w-8 h-8 -lg bg-amber-500/20 flex items-center justify-center">
 <TriangleAlert className="w-4 h-4 text-amber-400"/>
 </div>
 Please Review This Payment
 </CardTitle>
 </CardHeader>
 <CardContent>
 <p className="text-xs text-white mb-2 leading-relaxed">
 FraudShield detected unusual activity. Are you sure you want to proceed?
 </p>
 </CardContent>
 <CardFooter className="flex gap-2">
 <Button
 variant="outline"
 onClick={() => handleAction(onCancel,"cancel")}
 disabled={loading}
 className="w-full"
 >
 Cancel Payment
 </Button>
 <Button
 onClick={() => handleAction(onConfirm,"confirm")}
 disabled={loading}
 className="w-full bg-amber-500 hover:bg-amber-600 text-black font-semibold"
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
 <Card>
 <CardHeader className="pb-2 mb-2">
 <CardTitle className="text-orange-400 flex items-center gap-2.5 text-base">
 <div className="w-8 h-8 -lg bg-orange-500/20 flex items-center justify-center">
 <ShieldOff className="w-4 h-4 text-orange-400"/>
 </div>
 Strong Warning
 </CardTitle>
 </CardHeader>
 <CardContent>
 <p className="text-xs text-white font-semibold mb-1">
 This payment may involve suspicious behavior.
 </p>
 <p className="text-xs text-white leading-relaxed">
 Recommended action: Verify the request through an official channel before proceeding.
 </p>
 </CardContent>
 <CardFooter className="flex gap-2">
 <Button
 variant="outline"
 onClick={() => handleAction(onCancel,"cancel")}
 disabled={loading}
 className="w-full"
 >
 Cancel Payment
 </Button>
 <Button
 onClick={() => handleAction(onConfirm,"confirm")}
 disabled={loading}
 className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold"
 >
 Continue Anyway
 </Button>
 </CardFooter>
 </Card>
 );
 }

 // CRITICAL RISK — VERIFICATION REQUIRED
 return (
 <Card>
 <CardHeader className="pb-2 mb-2">
 <CardTitle className="text-red-400 flex items-center gap-2.5 text-base">
 <div className="w-8 h-8 -lg bg-red-500/20 flex items-center justify-center">
 <ShieldX className="w-4 h-4 text-red-400"/>
 </div>
 Verification Required
 </CardTitle>
 </CardHeader>
 <CardContent>
 <p className="text-xs text-red-400 font-semibold mb-1">
 Multiple high-risk indicators were detected.
 </p>
 <p className="text-xs text-white leading-relaxed">
 Do not share OTP, UPI PIN, passwords, or grant remote access. Please open your official
 banking application to verify this request securely.
 </p>
 </CardContent>
 <CardFooter className="flex flex-col gap-2">
 <Button
 onClick={() => handleAction(onCancel,"cancel")}
 disabled={loading}
 variant="destructive"
 className="w-full"
 >
 Cancel Payment
 </Button>
 <Button
 variant="ghost"
 onClick={() => handleAction(onConfirm,"confirm")}
 disabled={loading}
 className="w-full text-red-400 text-xs hover:bg-red-500/10"
 >
 I understand the risks. Proceed anyway.
 </Button>
 </CardFooter>
 </Card>
 );
}
