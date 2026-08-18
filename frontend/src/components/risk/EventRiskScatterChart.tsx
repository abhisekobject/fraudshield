import React from "react";
import {
  ScatterChart, Scatter, XAxis, YAxis, ZAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from "recharts";
import { TooltipContentProps } from "recharts/types/component/Tooltip";
import { ValueType, NameType } from "recharts/types/component/DefaultTooltipContent";
import { RiskEventSummary } from "../../types";

const getFillColor = (level: string) => {
  switch (level) {
    case "LOW":      return "#10b981";
    case "MEDIUM":   return "#f59e0b";
    case "HIGH":     return "#f97316";
    case "CRITICAL": return "#ef4444";
    default:         return "#3b82f6";
  }
};

interface ScatterPayload {
  id: string;
  amount: number;
  riskScore: number;
  level: string;
}

const CustomTooltip = ({ active, payload }: TooltipContentProps<ValueType, NameType>) => {
  if (active && payload && payload.length) {
    const entry = payload[0].payload as ScatterPayload;
    return (
      <div className="bg-[#1f1f1f] border border-[#333] p-3 rounded-[8px] text-xs shadow-lg">
        <p className="font-mono text-white mb-1">ID: {entry.id.split("-")[0]}</p>
        <p className="text-emerald-400 font-bold">Amount: ₹{entry.amount.toFixed(2)}</p>
        <p className="text-amber-400 font-bold">Risk Score: {entry.riskScore}</p>
        <p className="text-slate-400 mt-1">Level: <span style={{ color: getFillColor(entry.level) }}>{entry.level}</span></p>
      </div>
    );
  }
  return null;
};

interface EventRiskScatterChartProps {
  events: RiskEventSummary[];
}

export function EventRiskScatterChart({ events }: EventRiskScatterChartProps) {
  const data = events.map(ev => ({
    id: ev.id,
    amount: ev.amount,
    riskScore: Math.round(ev.risk_score * 100),
    level: ev.risk_level,
    userId: ev.user_id,
  }));

  if (!events || events.length === 0) return null;

  return (
    <div className="w-full h-[350px] bg-surface rounded-[8px] border border-hairline relative p-4 mb-8">
      <h3 className="text-[14px] font-semibold text-white mb-4">Risk Distribution Analysis</h3>
      <div className="absolute top-4 right-4 flex gap-3 text-[10px] font-mono text-ink-muted">
        <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-[#10b981]" /> LOW</div>
        <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-[#f59e0b]" /> MEDIUM</div>
        <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-[#f97316]" /> HIGH</div>
        <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-[#ef4444]" /> CRITICAL</div>
      </div>

      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#333" />
          <XAxis
            type="number"
            dataKey="amount"
            name="Transaction Amount"
            unit="₹"
            tick={{ fill: "#64748b", fontSize: 11 }}
            stroke="#333"
            label={{ value: "Amount (INR)", position: "insideBottom", offset: -10, fill: "#64748b", fontSize: 11 }}
          />
          <YAxis
            type="number"
            dataKey="riskScore"
            name="Risk Score"
            domain={[0, 100]}
            tick={{ fill: "#64748b", fontSize: 11 }}
            stroke="#333"
            label={{ value: "Risk Score (0-100)", angle: -90, position: "insideLeft", fill: "#64748b", fontSize: 11 }}
          />
          <ZAxis type="number" range={[40, 400]} />
          <Tooltip content={(props) => CustomTooltip(props)} cursor={{ strokeDasharray: "3 3" }} />
          <Scatter name="Risk Events" data={data} opacity={0.8}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={getFillColor(entry.level)} />
            ))}
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}
