import React from"react";
import { RiskLevel } from"../../types";
import { cn } from"../../utils/cn";

interface RiskScoreProps {
 score: number;
 level: RiskLevel;
}

export function RiskScore({ score, level }: RiskScoreProps) {
 // Convert 0.0-1.0 to 0-100
 const displayScore = Math.round(score * 100);

 const levelStyles = {
 [RiskLevel.LOW]:"text-emerald-500",
 [RiskLevel.MEDIUM]:"text-amber-500",
 [RiskLevel.HIGH]:"text-orange-500",
 [RiskLevel.CRITICAL]:"text-red-500",
 };

 const ringStyles = {
 [RiskLevel.LOW]:"",
 [RiskLevel.MEDIUM]:"",
 [RiskLevel.HIGH]:"",
 [RiskLevel.CRITICAL]:"",
 };

 return (
 <div className="flex flex-col items-center justify-center space-y-4">
 <div className={cn("flex h-32 w-32 items-center justify-center -full", ringStyles[level])}>
 <div className="text-center">
 <span className={cn("text-4xl font-bold tracking-tight", levelStyles[level])}>
 {displayScore}
 </span>
 <span className="block text-xs text-white">/ 100</span>
 </div>
 </div>
 <div className="text-center">
 <h4 className="text-lg font-semibold text-white">Risk Score</h4>
 <p className="text-sm text-white max-w-xs mt-1">
 Heuristic security score combining behavior, ML, and social signals. Not a calibrated probability.
 </p>
 </div>
 </div>
 );
}
