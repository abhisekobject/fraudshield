import React from "react";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from "recharts";
import { RiskEvaluation } from "../../types";

interface RiskRadarChartProps {
  evaluation: RiskEvaluation;
}

export function RiskRadarChart({ evaluation }: RiskRadarChartProps) {
  // Derive signals for the radar chart from the evaluation object
  // Recharts radar looks best with at least 5 points
  
  // Calculate some derived metrics for visual complexity from triggered rules
  const deviceAnomalies = evaluation.triggered_rules.filter(r => r.rule_id.includes("DEVICE") || r.reason_code.includes("DEVICE")).length * 30;
  const velocityAnomalies = evaluation.triggered_rules.filter(r => r.rule_id.includes("VELOCITY") || r.reason_code.includes("VELOCITY")).length * 30;

  const data = [
    {
      subject: "Rule Engine",
      score: Math.round(evaluation.rule_score * 100),
      fullMark: 100,
    },
    {
      subject: "ML Intelligence",
      score: evaluation.ml_available && evaluation.ml_probability ? Math.round(evaluation.ml_probability * 100) : 0,
      fullMark: 100,
    },
    {
      subject: "NLP Analysis",
      score: evaluation.social_engineering_available && evaluation.social_engineering_score ? Math.round(evaluation.social_engineering_score * 100) : 0,
      fullMark: 100,
    },
    {
      subject: "Device Trust",
      score: Math.min(100, deviceAnomalies + 20), // Baseline 20, plus any anomalies
      fullMark: 100,
    },
    {
      subject: "Velocity Risk",
      score: Math.min(100, velocityAnomalies + 10), // Baseline 10
      fullMark: 100,
    },
  ];

  // Determine radar fill color based on risk level
  const getFillColor = (level: string) => {
    switch (level) {
      case "LOW": return "#10b981"; // emerald-500
      case "MEDIUM": return "#f59e0b"; // amber-500
      case "HIGH": return "#f97316"; // orange-500
      case "CRITICAL": return "#ef4444"; // red-500
      default: return "#3b82f6"; // blue-500
    }
  };

  const color = getFillColor(evaluation.risk_level);

  return (
    <div className="w-full h-[300px] bg-black/20 rounded-[8px] border border-hairline relative">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
          <PolarGrid stroke="#333" />
          <PolarAngleAxis 
            dataKey="subject" 
            tick={{ fill: '#94a3b8', fontSize: 11, fontFamily: 'monospace' }} 
          />
          <PolarRadiusAxis 
            angle={30} 
            domain={[0, 100]} 
            tick={{ fill: '#475569', fontSize: 10 }}
            axisLine={false}
          />
          <Tooltip 
            contentStyle={{ backgroundColor: '#1f1f1f', borderColor: '#333', borderRadius: '8px', fontSize: '12px', color: '#fff' }}
            itemStyle={{ color: color }}
          />
          <Radar
            name="Risk Signal"
            dataKey="score"
            stroke={color}
            fill={color}
            fillOpacity={0.4}
            animationDuration={1500}
            animationEasing="ease-out"
          />
        </RadarChart>
      </ResponsiveContainer>
      <div className="absolute top-2 right-3 text-[10px] text-ink-muted font-mono tracking-widest uppercase">
        Signal Vector Space
      </div>
    </div>
  );
}
