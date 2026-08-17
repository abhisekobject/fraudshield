import React from "react";
import { RiskEvaluation } from "../../types";
import { Card, CardHeader, CardTitle, CardContent } from "../ui/Card";
import { Badge } from "../ui/Badge";
import { ListTree, Network, MessageSquareWarning } from "lucide-react";
import { TileIcon } from "../ui/TileIcon";

interface SignalBreakdownProps {
  evaluation: RiskEvaluation;
}

export function SignalBreakdown({ evaluation }: SignalBreakdownProps) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {/* 1. Deterministic Rule Engine */}
      <Card className="bg-surface">
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <CardTitle className="text-[14px] font-semibold flex items-center gap-2 text-white">
            Rule Engine
          </CardTitle>
          <TileIcon icon={ListTree} />
        </CardHeader>
        <CardContent className="pt-4">
          <div className="text-[32px] font-display font-bold mb-4 text-white">
            {Math.round(evaluation.rule_score * 100)}<span className="text-sm font-normal text-ink-muted">/100</span>
          </div>
          <div className="flex flex-col">
            {evaluation.triggered_rules.filter(r => r.rule_id !== "NLP-PATTERN").length > 0 ? (
              evaluation.triggered_rules
                .filter(r => r.rule_id !== "NLP-PATTERN")
                .map((rule, idx) => (
                  <div key={idx} className="text-sm border-b border-hairline py-3 last:border-0 flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                    <div>
                      <p className="font-mono text-white text-xs mb-1">{rule.reason_code}</p>
                      <p className="text-ink-muted text-[12px] leading-relaxed">{rule.explanation}</p>
                    </div>
                  </div>
              ))
            ) : (
              <p className="text-[12px] text-ink-muted py-2">No anomalous behavior rules triggered.</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 2. Machine Learning */}
      <Card className="bg-surface">
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <CardTitle className="text-[14px] font-semibold flex items-center gap-2 text-white">
            ML Intelligence
          </CardTitle>
          <TileIcon icon={Network} />
        </CardHeader>
        <CardContent className="pt-4">
          {evaluation.ml_available && evaluation.ml_probability !== null ? (
            <>
              <div className="text-[32px] font-display font-bold mb-4 text-white">
                {Math.round(evaluation.ml_probability * 100)}<span className="text-sm font-normal text-ink-muted">/100</span>
              </div>
              <p className="text-[12px] text-ink-muted py-2 border-t border-hairline">
                RandomForest uncalibrated anomaly probability.
              </p>
            </>
          ) : (
            <p className="text-[12px] text-ink-muted py-2">ML model failed or is unavailable. Skipped in fusion.</p>
          )}
        </CardContent>
      </Card>

      {/* 3. Social Engineering */}
      <Card className="bg-surface">
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <CardTitle className="text-[14px] font-semibold flex items-center gap-2 text-white">
            Social Engineering
          </CardTitle>
          <TileIcon icon={MessageSquareWarning} />
        </CardHeader>
        <CardContent className="pt-4">
           {evaluation.social_engineering_available && evaluation.social_engineering_score !== null ? (
            <>
              <div className="text-[32px] font-display font-bold mb-4 text-white">
                {Math.round(evaluation.social_engineering_score * 100)}<span className="text-sm font-normal text-ink-muted">/100</span>
              </div>
              <div className="flex flex-col">
                {evaluation.triggered_rules.filter(r => r.rule_id === "NLP-PATTERN").length > 0 ? (
                  evaluation.triggered_rules
                    .filter(r => r.rule_id === "NLP-PATTERN")
                    .map((rule, idx) => (
                      <div key={idx} className="text-sm border-b border-hairline py-3 last:border-0 flex items-start gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 shrink-0" />
                        <div>
                          <p className="font-mono text-white text-xs mb-1">{rule.reason_code}</p>
                          <p className="text-ink-muted text-[12px] leading-relaxed">{rule.explanation}</p>
                        </div>
                      </div>
                  ))
                ) : (
                  <p className="text-[12px] text-ink-muted py-2 border-t border-hairline">No coercive interaction patterns detected.</p>
                )}
              </div>
            </>
          ) : (
            <p className="text-[12px] text-ink-muted py-2 border-t border-hairline">No interaction transcript provided for this payment.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
