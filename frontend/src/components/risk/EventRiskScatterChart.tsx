import React from"react";
import {
 ScatterChart, Scatter, XAxis, YAxis, ZAxis,
 CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from"recharts";
import { TooltipContentProps } from"recharts/types/component/Tooltip";
import { ValueType, NameType } from"recharts/types/component/DefaultTooltipContent";
import { RiskEventSummary } from"../../types";

const getFillColor = (level: string) => {
 switch (level) {
 case"LOW": return"#10b981";
 case"MEDIUM": return"#f59e0b";
 case"HIGH": return"#f97316";
 case"CRITICAL": return"#ef4444";
 default: return"#3b82f6";
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
 <div className="bg-[#0a0e1c] p-3.5 -xl text-xs">
 <p className="font-mono text-white font-semibold mb-1">ID: {entry.id.split("-")[0]}</p>
 <p className="text-emerald-400 font-bold">Amount: ₹{entry.amount.toFixed(2)}</p>
 <p className="text-amber-400 font-bold">Risk Score: {entry.riskScore}</p>
 <p className="text-white mt-1 font-mono">Level: <span style={{ color: getFillColor(entry.level) }}>{entry.level}</span></p>
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
 <div className="w-full h-[350px] bg-[#1C1C1E] -2xl relative p-5 mb-8">
 <h3 className="text-sm font-semibold text-white mb-4">Risk Distribution Analysis</h3>
 <div className="absolute top-5 right-5 flex gap-3 text-[11px] font-mono font-semibold text-white">
 <div className="flex items-center gap-1.5"><div className="w-2 h-2 -full bg-[#10b981]"/>Low</div>
 <div className="flex items-center gap-1.5"><div className="w-2 h-2 -full bg-[#f59e0b]"/>Medium</div>
 <div className="flex items-center gap-1.5"><div className="w-2 h-2 -full bg-[#f97316]"/>High</div>
 <div className="flex items-center gap-1.5"><div className="w-2 h-2 -full bg-[#ef4444]"/>Critical</div>
 </div>

 <ResponsiveContainer width="100%"height="88%">
 <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
 <CartesianGrid strokeDasharray="3 3"stroke="rgba(255, 255, 255, 0.08)"/>
 <XAxis
 type="number"
 dataKey="amount"
 name="Transaction Amount"
 unit="₹"
 tick={{ fill:"#94a3b8", fontSize: 11, fontFamily:"monospace"}}
 stroke="rgba(255, 255, 255, 0.15)"
 label={{ value:"Amount (INR)", position:"insideBottom", offset: -10, fill:"#94a3b8", fontSize: 11, fontFamily:"monospace"}}
 />
 <YAxis
 type="number"
 dataKey="riskScore"
 name="Risk Score"
 domain={[0, 100]}
 tick={{ fill:"#94a3b8", fontSize: 11, fontFamily:"monospace"}}
 stroke="rgba(255, 255, 255, 0.15)"
 label={{ value:"Risk Score (0-100)", angle: -90, position:"insideLeft", fill:"#94a3b8", fontSize: 11, fontFamily:"monospace"}}
 />
 <ZAxis type="number"range={[50, 450]} />
 <Tooltip content={(props) => CustomTooltip(props)} cursor={{ strokeDasharray:"3 3", stroke:"rgba(255, 255, 255, 0.2)"}} />
 <Scatter name="Risk Events"data={data} opacity={0.9}>
 {data.map((entry, index) => (
 <Cell key={`cell-${index}`} fill={getFillColor(entry.level)} />
 ))}
 </Scatter>
 </ScatterChart>
 </ResponsiveContainer>
 </div>
 );
}
