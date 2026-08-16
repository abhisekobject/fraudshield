import React from "react";
import { RiskEvaluation } from "../../types";
import { Card, CardHeader, CardTitle, CardContent } from "../ui/Card";
import { Badge } from "../ui/Badge";
import { Activity, Brain, ShieldAlert } from "lucide-react";

interface SignalBreakdownProps {
  evaluation: RiskEvaluation;
}

export function SignalBreakdown({ evaluation }: SignalBreakdownProps) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {/* 1. Deterministic Rule Engine */}
      <Card>
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Activity className="h-4 w-4 text-slate-500" />
            Rule Engine
          </CardTitle>
          <Badge variant="secondary">rules-v1</Badge>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold mb-2 text-white">
            {Math.round(evaluation.rule_score * 100)}<span className="text-sm font-normal text-slate-400">/100</span>
          </div>
          <div className="space-y-2">
            {evaluation.triggered_rules.filter(r => r.rule_id !== "NLP-PATTERN").length > 0 ? (
              evaluation.triggered_rules
                .filter(r => r.rule_id !== "NLP-PATTERN")
                .map((rule, idx) => (
                  <div key={idx} className="text-sm border-l-2 border-amber-400 pl-2">
                    <p className="font-medium text-slate-200">{rule.reason_code}</p>
                    <p className="text-slate-400 text-xs">{rule.explanation}</p>
                  </div>
              ))
            ) : (
              <p className="text-sm text-slate-400">No anomalous behavior rules triggered.</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 2. Machine Learning */}
      <Card>
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Brain className="h-4 w-4 text-slate-500" />
            ML Intelligence
          </CardTitle>
          {evaluation.ml_available ? (
             <Badge variant="secondary">{evaluation.model_version}</Badge>
          ) : (
             <Badge variant="destructive">Offline</Badge>
          )}
        </CardHeader>
        <CardContent>
          {evaluation.ml_available && evaluation.ml_probability !== null ? (
            <>
              <div className="text-2xl font-bold mb-2 text-white">
                {Math.round(evaluation.ml_probability * 100)}<span className="text-sm font-normal text-slate-400">/100</span>
              </div>
              <p className="text-xs text-slate-400">
                RandomForest uncalibrated anomaly probability.
              </p>
            </>
          ) : (
            <p className="text-sm text-slate-400">ML model failed or is unavailable. Skipped in fusion.</p>
          )}
        </CardContent>
      </Card>

      {/* 3. Social Engineering */}
      <Card>
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-slate-500" />
            Social Engineering
          </CardTitle>
          {evaluation.social_engineering_available ? (
             <Badge variant="secondary">social-v1</Badge>
          ) : (
             <Badge variant="outline">Unavailable</Badge>
          )}
        </CardHeader>
        <CardContent>
           {evaluation.social_engineering_available && evaluation.social_engineering_score !== null ? (
            <>
              <div className="text-2xl font-bold mb-2 text-white">
                {Math.round(evaluation.social_engineering_score * 100)}<span className="text-sm font-normal text-slate-400">/100</span>
              </div>
              <div className="space-y-2">
                {evaluation.triggered_rules.filter(r => r.rule_id === "NLP-PATTERN").length > 0 ? (
                  evaluation.triggered_rules
                    .filter(r => r.rule_id === "NLP-PATTERN")
                    .map((rule, idx) => (
                      <div key={idx} className="text-sm border-l-2 border-red-400 pl-2">
                        <p className="font-medium text-slate-200">{rule.reason_code}</p>
                        <p className="text-slate-400 text-xs">{rule.explanation}</p>
                      </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-400">No coercive interaction patterns detected.</p>
                )}
              </div>
            </>
          ) : (
            <p className="text-sm text-slate-400">No interaction transcript provided for this payment.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
