"use client";
import React, { useEffect, useRef, useCallback, useState } from "react";
import { Area, AreaChart, ResponsiveContainer, XAxis, YAxis, Tooltip, ReferenceLine } from "recharts";

interface DataPoint { time: number; risk: number }

interface RealTimeSentimentChartProps {
  isSimulating: boolean;
  callDuration: number;
  expectedRiskLevel: string;
}

function computeNextRisk(prev: DataPoint[], callDuration: number, expectedRiskLevel: string): DataPoint[] {
  let targetRisk = 20;
  let volatility = 5;
  switch (expectedRiskLevel) {
    case "LOW":    targetRisk = 15; volatility = 5;  break;
    case "MEDIUM": targetRisk = 50; volatility = 15; break;
    case "HIGH":   targetRisk = 80; volatility = 10; break;
    case "CRITICAL": targetRisk = 95; volatility = 5; break;
  }
  const progress = Math.min(callDuration / 15, 1);
  const currentBaseRisk = expectedRiskLevel === "LOW" ? targetRisk : targetRisk * progress;
  const noise = (Math.random() - 0.5) * volatility;
  let newRisk = Math.max(0, Math.min(100, currentBaseRisk + noise));
  if (prev.length > 0) {
    const lastRisk = prev[prev.length - 1].risk;
    newRisk = lastRisk * 0.7 + newRisk * 0.3;
  }
  const newData = [...prev, { time: callDuration, risk: newRisk }];
  return newData.length > 30 ? newData.slice(newData.length - 30) : newData;
}

const FILL_COLORS: Record<string, string> = {
  LOW: "#10b981",
  MEDIUM: "#f59e0b",
  HIGH: "#f97316",
  CRITICAL: "#ef4444",
};

export function RealTimeSentimentChart({ isSimulating, callDuration, expectedRiskLevel }: RealTimeSentimentChartProps) {
  const [data, setData] = useState<DataPoint[]>([]);
  // Keep a stable ref to latest data for the updater
  const dataRef = useRef<DataPoint[]>([]);

  const update = useCallback(() => {
    const next = computeNextRisk(dataRef.current, callDuration, expectedRiskLevel);
    dataRef.current = next;
    setData(next);
  }, [callDuration, expectedRiskLevel]);

  const reset = useCallback(() => {
    dataRef.current = [];
    setData([]);
  }, []);

  useEffect(() => {
    if (!isSimulating) {
      if (callDuration === 0) {
        const t = setTimeout(reset, 0);
        return () => clearTimeout(t);
      }
      return;
    }
    const t = setTimeout(update, 0);
    return () => clearTimeout(t);
  }, [callDuration, isSimulating, update, reset]);

  const color = FILL_COLORS[expectedRiskLevel] ?? "#10b981";

  return (
    <div className="w-full h-[250px] bg-black/20 rounded-[8px] border border-hairline relative mt-4 overflow-hidden">
      <div className="absolute top-3 left-4 z-10 flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${isSimulating ? "animate-pulse bg-red-500" : "bg-slate-600"}`} />
        <span className="text-[11px] font-mono text-ink-muted uppercase tracking-wider">Live NLP Sentiment Analysis</span>
      </div>
      {data.length === 0 ? (
        <div className="w-full h-full flex items-center justify-center text-ink-muted text-sm font-mono">
          Awaiting audio stream...
        </div>
      ) : (
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 40, right: 0, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorRisk" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor={color} stopOpacity={0.4} />
                <stop offset="95%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="time" hide />
            <YAxis domain={[0, 100]} hide />
            <Tooltip
              contentStyle={{ backgroundColor: "#1f1f1f", borderColor: "#333", borderRadius: "8px", fontSize: "12px", color: "#fff" }}
              labelFormatter={(val) => `T+${String(val)}s`}
            />
            <ReferenceLine y={80} stroke="#ef4444" strokeDasharray="3 3" strokeOpacity={0.3} />
            <ReferenceLine y={50} stroke="#f59e0b" strokeDasharray="3 3" strokeOpacity={0.3} />
            <Area
              type="monotone"
              dataKey="risk"
              stroke={color}
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorRisk)"
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
