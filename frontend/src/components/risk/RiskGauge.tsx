"use client";

import React, { useEffect, useState } from "react";
import { cn } from "../../utils/cn";
import { RiskLevel } from "../../types";

interface RiskGaugeProps {
  score: number; // 0.0 to 1.0
  level: RiskLevel;
}

export function RiskGauge({ score, level }: RiskGaugeProps) {
  // Respect prefers-reduced-motion
  const [animatedScore, setAnimatedScore] = useState(0);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) {
      const t = setTimeout(() => setAnimatedScore(score), 0);
      return () => clearTimeout(t);
    } else {
      const timeout = setTimeout(() => setAnimatedScore(score), 50);
      return () => clearTimeout(timeout);
    }
  }, [score]);

  const size = 128;
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - animatedScore * circumference;

  const displayScore = Math.round(score * 100);

  const getColorClass = () => {
    switch (level) {
      case RiskLevel.LOW: return "text-emerald-500";
      case RiskLevel.MEDIUM: return "text-amber-500";
      case RiskLevel.HIGH: return "text-orange-500";
      case RiskLevel.CRITICAL: return "text-red-500";
      default: return "text-slate-500";
    }
  };

  return (
    <div className="flex flex-col items-center justify-center space-y-4">
      <div className="relative w-[128px] h-[128px] flex items-center justify-center">
        {/* Background track */}
        <svg viewBox="0 0 128 128" className="absolute top-0 left-0 w-full h-full -rotate-90">
          <circle
            cx="64"
            cy="64"
            r={radius}
            className="stroke-hairline fill-transparent"
            strokeWidth={strokeWidth}
          />
          {/* Progress ring */}
          <circle
            cx="64"
            cy="64"
            r={radius}
            className={cn("fill-transparent transition-all duration-1000 ease-out", getColorClass())}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            stroke="currentColor"
          />
        </svg>
        
        {/* Score Display */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="font-display font-bold text-[36px] text-white tracking-tight">
            {displayScore}
          </span>
        </div>
      </div>
      
      <div className="text-center">
        <h4 className="text-[14px] font-semibold text-white">Risk Score</h4>
        <p className="text-[12px] text-ink-muted max-w-[200px] mt-1 leading-relaxed">
          Heuristic security score combining behavior, ML, and social signals.
        </p>
      </div>
    </div>
  );
}
