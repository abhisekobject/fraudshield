import React from"react";
import { RiskEvaluation } from"../../types";
import { Card, CardHeader, CardTitle, CardContent } from"../ui/Card";
import { ListTree, Network, MessageSquareWarning } from"lucide-react";

interface SignalBreakdownProps {
 evaluation: RiskEvaluation;
}

export function SignalBreakdown({ evaluation }: SignalBreakdownProps) {
 return (
 <div className="grid gap-4 md:grid-cols-3">
 {/* 1. Deterministic Rule Engine */}
 <Card>
 <CardHeader className="pb-2 flex flex-row items-center justify-between">
 <CardTitle className="text-sm font-semibold flex items-center gap-2 text-white">
 Rule Engine
 </CardTitle>
 <div className="w-8 h-8 -lg bg-amber-500/15 flex items-center justify-center">
 <ListTree className="w-4 h-4 text-amber-400"/>
 </div>
 </CardHeader>
 <CardContent className="pt-2">
 <div className="text-[28px] font-bold mb-3 text-white">
 {Math.round(evaluation.rule_score * 100)}<span className="text-xs font-normal text-white">/100</span>
 </div>
 <div className="flex flex-col">
 {evaluation.triggered_rules.filter(r => r.rule_id !=="NLP-PATTERN").length > 0 ? (
 evaluation.triggered_rules
 .filter(r => r.rule_id !=="NLP-PATTERN")
 .map((rule, idx) => (
 <div key={idx} className="text-xs border-b py-2.5 last:border-0 flex items-start gap-2">
 <div className="w-1.5 h-1.5 -full bg-amber-400 mt-1 shrink-0"/>
 <div className="min-w-0 flex-1">
 <p className="font-mono text-white text-[11px] font-semibold mb-0.5 break-words">{rule.reason_code}</p>
 <p className="text-white text-[11px] leading-relaxed break-words">{rule.explanation}</p>
 </div>
 </div>
 ))
 ) : (
 <p className="text-xs text-white py-2">No anomalous behavior rules triggered.</p>
 )}
 </div>
 </CardContent>
 </Card>

 {/* 2. Machine Learning */}
 <Card>
 <CardHeader className="pb-2 flex flex-row items-center justify-between">
 <CardTitle className="text-sm font-semibold flex items-center gap-2 text-white">
 ML Intelligence
 </CardTitle>
 <div className="w-8 h-8 -lg bg-blue-500/15 flex items-center justify-center">
 <Network className="w-4 h-4 text-white"/>
 </div>
 </CardHeader>
 <CardContent className="pt-2">
 {evaluation.ml_available && evaluation.ml_probability !== null ? (
 <>
 <div className="text-[28px] font-bold mb-3 text-white">
 {Math.round(evaluation.ml_probability * 100)}<span className="text-xs font-normal text-white">/100</span>
 </div>
 <p className="text-xs text-white py-2 border-t">
 RandomForest calibrated anomaly probability.
 </p>
 </>
 ) : (
 <p className="text-xs text-white py-2">ML model failed or is unavailable. Skipped in fusion.</p>
 )}
 </CardContent>
 </Card>

 {/* 3. Social Engineering */}
 <Card>
 <CardHeader className="pb-2 flex flex-row items-center justify-between">
 <CardTitle className="text-sm font-semibold flex items-center gap-2 text-white">
 Social Engineering
 </CardTitle>
 <div className="w-8 h-8 -lg bg-cyan-500/15 flex items-center justify-center">
 <MessageSquareWarning className="w-4 h-4 text-white"/>
 </div>
 </CardHeader>
 <CardContent className="pt-2">
 {evaluation.social_engineering_available && evaluation.social_engineering_score !== null ? (
 <>
 <div className="text-[28px] font-bold mb-3 text-white">
 {Math.round(evaluation.social_engineering_score * 100)}<span className="text-xs font-normal text-white">/100</span>
 </div>
 <div className="flex flex-col">
 {evaluation.triggered_rules.filter(r => r.rule_id ==="NLP-PATTERN").length > 0 ? (
 evaluation.triggered_rules
 .filter(r => r.rule_id ==="NLP-PATTERN")
 .map((rule, idx) => (
 <div key={idx} className="text-xs border-b py-2.5 last:border-0 flex items-start gap-2">
 <div className="w-1.5 h-1.5 -full bg-cyan-400 mt-1 shrink-0"/>
 <div className="min-w-0 flex-1">
 <p className="font-mono text-white text-[11px] font-semibold mb-0.5 break-words">{rule.reason_code}</p>
 <p className="text-white text-[11px] leading-relaxed break-words">{rule.explanation}</p>
 </div>
 </div>
 ))
 ) : (
 <p className="text-xs text-white py-2 border-t">No coercive interaction patterns detected.</p>
 )}
 </div>
 </>
 ) : (
 <p className="text-xs text-white py-2 border-t">No interaction transcript provided for this payment.</p>
 )}
 </CardContent>
 </Card>
 </div>
 );
}
