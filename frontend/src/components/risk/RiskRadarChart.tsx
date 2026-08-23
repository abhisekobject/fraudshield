import React from"react";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from"recharts";
import { RiskEvaluation } from"../../types";

interface RiskRadarChartProps {
 evaluation: RiskEvaluation;
}

export function RiskRadarChart({ evaluation }: RiskRadarChartProps) {
 // Derive signals for the radar chart from the evaluation object
 const deviceAnomalies = evaluation.triggered_rules.filter(r => r.rule_id.includes("DEVICE") || r.reason_code.includes("DEVICE")).length * 30;
 const velocityAnomalies = evaluation.triggered_rules.filter(r => r.rule_id.includes("VELOCITY") || r.reason_code.includes("VELOCITY")).length * 30;

 const data = [
 {
 subject:"Rule Engine",
 score: Math.round(evaluation.rule_score * 100),
 fullMark: 100,
 },
 {
 subject:"ML Intelligence",
 score: evaluation.ml_available && evaluation.ml_probability ? Math.round(evaluation.ml_probability * 100) : 0,
 fullMark: 100,
 },
 {
 subject:"NLP Analysis",
 score: evaluation.social_engineering_available && evaluation.social_engineering_score ? Math.round(evaluation.social_engineering_score * 100) : 0,
 fullMark: 100,
 },
 {
 subject:"Device Trust",
 score: Math.min(100, deviceAnomalies + 20),
 fullMark: 100,
 },
 {
 subject:"Velocity Risk",
 score: Math.min(100, velocityAnomalies + 10),
 fullMark: 100,
 },
 ];

 // Determine radar fill color based on risk level
 const getFillColor = (level: string) => {
 switch (level) {
 case"LOW": return"#10b981"; // emerald-400
 case"MEDIUM": return"#f59e0b"; // amber-400
 case"HIGH": return"#f97316"; // orange-400
 case"CRITICAL": return"#ef4444"; // red-400
 default: return"#3b82f6"; // blue-400
 }
 };

 const color = getFillColor(evaluation.risk_level);

 return (
 <div className="w-full h-[300px] bg-[#1C1C1E] -2xl relative p-2">
 <ResponsiveContainer width="100%"height="100%">
 <RadarChart cx="50%"cy="50%"outerRadius="70%"data={data}>
 <PolarGrid stroke="rgba(255, 255, 255, 0.12)"/>
 <PolarAngleAxis 
 dataKey="subject"
 tick={{ fill:'#cbd5e1', fontSize: 11, fontWeight: 500, fontFamily:'monospace'}} 
 />
 <PolarRadiusAxis 
 angle={30} 
 domain={[0, 100]} 
 tick={{ fill:'#64748b', fontSize: 10 }}
 axisLine={false}
 />
 <Tooltip 
 contentStyle={{ backgroundColor:'#0a0e1c', borderColor:'rgba(255, 255, 255, 0.15)', borderRadius:'12px', fontSize:'12px', color:'#ffffff', boxShadow:'0 8px 30px rgba(0,0,0,0.5)'}}
 itemStyle={{ color: color, fontWeight: 600 }}
 />
 <Radar
 name="Risk Signal"
 dataKey="score"
 stroke={color}
 fill={color}
 fillOpacity={0.35}
 animationDuration={1500}
 animationEasing="ease-out"
 />
 </RadarChart>
 </ResponsiveContainer>
 <div className="absolute top-3 right-4 text-[10px] text-white font-mono font-semibold uppercase tracking-widest">
 Signal Vector Space
 </div>
 </div>
 );
}
