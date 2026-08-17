"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { PhoneSimulator } from "../../components/mobile/PhoneSimulator";
import { Shield, ShieldAlert, HeartPulse, HelpCircle, Terminal, Mic, AlertTriangle } from "lucide-react";
import { cn } from "../../utils/cn";
import { PaymentResponse, SocialEngineeringEvaluation } from "../../types";
import { CALL_SCENARIOS, CallScenario } from "../../utils/callScenarios";

export interface MobileScenario {
  id: string;
  label: string;
  description: string;
  requesterName: string;
  amount: number;
  icon: React.ElementType;
  color: string;
  paymentPayload: {
    user_id: string;
    device_id: string;
    recipient_id: string;
    amount: number;
  };
}

const MOBILE_SCENARIOS: MobileScenario[] = [
  {
    id: "legitimate",
    label: "Legitimate (Mother)",
    description: "Standard safe transfer",
    requesterName: "Mother",
    amount: 5000,
    icon: Shield,
    color: "emerald",
    paymentPayload: {
      user_id: "c0000000-0000-0000-0000-000000000001",
      device_id: "c0000000-0000-0000-0000-000000000010",
      recipient_id: "c0000000-0000-0000-0000-000000000020",
      amount: 5000
    }
  },
  {
    id: "urgent",
    label: "Urgent (Hospital)",
    description: "Large legitimate transfer",
    requesterName: "City Hospital",
    amount: 150000,
    icon: HeartPulse,
    color: "blue",
    paymentPayload: {
      user_id: "a0000000-0000-0000-0000-000000000001",
      device_id: "a0000000-0000-0000-0000-000000000010",
      recipient_id: "a0000000-0000-0000-0000-000000000022",
      amount: 150000
    }
  },
  {
    id: "phishing",
    label: "Phishing Risk",
    description: "Request from unknown",
    requesterName: "Unknown User",
    amount: 12000,
    icon: HelpCircle,
    color: "orange",
    paymentPayload: {
      user_id: "a0000000-0000-0000-0000-000000000001",
      device_id: "a0000000-0000-0000-0000-000000000010",
      recipient_id: "a0000000-0000-0000-0000-000000000023",
      amount: 12000
    }
  },
  {
    id: "critical",
    label: "Critical Scam",
    description: "Known fraud pattern",
    requesterName: "Urgent Payment Dept",
    amount: 50000,
    icon: ShieldAlert,
    color: "red",
    paymentPayload: {
      user_id: "a0000000-0000-0000-0000-000000000001",
      device_id: "a0000000-0000-0000-0000-000000000010",
      recipient_id: "a0000000-0000-0000-0000-000000000020",
      amount: 50000
    }
  }
];

// ─── Typewriter hook ───────────────────────────────────────────────────────────
interface LogLine {
  text: string;
  color: "white" | "green" | "red" | "yellow" | "cyan" | "muted";
}

function useTypewriterLog(lines: LogLine[], speed = 18) {
  const [displayed, setDisplayed] = useState<{ line: LogLine; text: string }[]>([]);
  const lineIdx = useRef(0);
  const charIdx = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const linesKey = JSON.stringify(lines);

  useEffect(() => {
    // Reset
    setDisplayed([]);
    lineIdx.current = 0;
    charIdx.current = 0;
    if (timer.current) clearTimeout(timer.current);
    if (lines.length === 0) return;

    function type() {
      const li = lineIdx.current;
      const ci = charIdx.current;
      if (li >= lines.length) return;

      const currentLine = lines[li];
      const partial = currentLine.text.slice(0, ci + 1);

      setDisplayed(prev => {
        const next = [...prev];
        if (next.length <= li) {
          next.push({ line: currentLine, text: partial });
        } else {
          next[li] = { line: currentLine, text: partial };
        }
        return next;
      });

      if (ci < currentLine.text.length - 1) {
        charIdx.current++;
        timer.current = setTimeout(type, speed);
      } else {
        lineIdx.current++;
        charIdx.current = 0;
        timer.current = setTimeout(type, speed * 4);
      }
    }

    timer.current = setTimeout(type, 200);
    return () => { if (timer.current) clearTimeout(timer.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [linesKey, speed]);

  return displayed;
}

// ─── Build log lines from API result ──────────────────────────────────────────
function buildPaymentLogLines(result: PaymentResponse, scenario: MobileScenario): LogLine[] {
  const riskLevel = result.risk_evaluation.risk_level;
  const score = (result.risk_evaluation.final_risk_score * 100).toFixed(0);
  const isHigh = riskLevel === 'CRITICAL' || riskLevel === 'HIGH';

  const lines: LogLine[] = [
    { text: `> FraudShield ML Engine v${result.risk_evaluation.model_version ?? "1.0"}`, color: "cyan" },
    { text: `> Evaluating payment: ₹${scenario.amount.toLocaleString('en-IN')} → ${scenario.requesterName}`, color: "white" },
    { text: `> Scanning recipient profile...`, color: "muted" },
    { text: `> Analyzing device fingerprint...`, color: "muted" },
    { text: `> Running GBC Classifier...`, color: "muted" },
    { text: `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`, color: "muted" },
    { text: `  ML Risk Score   : ${score}%`, color: isHigh ? "red" : "green" },
    { text: `  Risk Level      : ${riskLevel}`, color: isHigh ? "red" : "green" },
    { text: `  ML Available    : ${result.risk_evaluation.ml_available ? "YES" : "NO"}`, color: result.risk_evaluation.ml_available ? "green" : "yellow" },
    { text: `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`, color: "muted" },
  ];

  if (result.risk_evaluation.triggered_rules.length > 0) {
    lines.push({ text: `> Triggered Rules:`, color: "yellow" });
    result.risk_evaluation.triggered_rules.forEach(rule => {
      const isRedFlag = rule.severity === 'CRITICAL' || rule.severity === 'HIGH';
      lines.push({ text: `  [${isRedFlag ? '✗' : '✓'}] ${rule.reason_code}`, color: isRedFlag ? "red" : "green" });
      lines.push({ text: `      ${rule.explanation}`, color: "muted" });
    });
  }

  lines.push({ text: `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`, color: "muted" });
  if (isHigh) {
    lines.push({ text: `> ⚠  INTERVENTION: Payment blocked.`, color: "red" });
    lines.push({ text: `> User notified via in-app SDK alert.`, color: "red" });
  } else {
    lines.push({ text: `> ✓  CLEARED: Payment authorised.`, color: "green" });
    lines.push({ text: `> Transaction recorded successfully.`, color: "green" });
  }

  return lines;
}

function buildCallLogLines(result: SocialEngineeringEvaluation, scenario: CallScenario): LogLine[] {
  const riskLevel = result.risk_level;
  const score = (result.score * 100).toFixed(0);
  const isHigh = riskLevel === 'CRITICAL' || riskLevel === 'HIGH';

  const lines: LogLine[] = [
    { text: `> FraudShield NLP Audio Monitor`, color: "cyan" },
    { text: `> Analyzing incoming call stream...`, color: "white" },
    { text: `> Running voice transcription...`, color: "muted" },
    { text: `> Extracting context features...`, color: "muted" },
    { text: `> Running DistilBERT classifier...`, color: "muted" },
    { text: `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`, color: "muted" },
    { text: `  NLP Threat Score : ${score}%`, color: isHigh ? "red" : "green" },
    { text: `  Risk Level       : ${riskLevel}`, color: isHigh ? "red" : "green" },
    { text: `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`, color: "muted" },
  ];

  if (result.triggered_indicators && result.triggered_indicators.length > 0) {
    lines.push({ text: `> Detected NLP Patterns:`, color: "yellow" });
    result.triggered_indicators.forEach(ind => {
      const isRedFlag = ind.severity === 'CRITICAL' || ind.severity === 'HIGH';
      lines.push({ text: `  [${isRedFlag ? '✗' : '✓'}] ${ind.code?.replace(/_/g, " ")}`, color: isRedFlag ? "red" : "green" });
      lines.push({ text: `      ${ind.explanation}`, color: "muted" });
    });
  }

  lines.push({ text: `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`, color: "muted" });
  if (isHigh) {
    lines.push({ text: `> ⚠  INTERVENTION: Call flagged as SCAM.`, color: "red" });
    lines.push({ text: `> Warning displayed on mobile screen.`, color: "red" });
  } else {
    lines.push({ text: `> ✓  CLEARED: Call appears legitimate.`, color: "green" });
  }

  return lines;
}

// ─── Analysis Panel Component ──────────────────────────────────────────────────
function AnalysisPanel({ 
  paymentResult, 
  paymentScenario,
  callResult,
  callScenario
}: { 
  paymentResult: PaymentResponse | null; 
  paymentScenario: MobileScenario | null;
  callResult: SocialEngineeringEvaluation | null;
  callScenario: CallScenario | null;
}) {
  
  const logLines = useMemo(() => {
    if (paymentResult && paymentScenario) return buildPaymentLogLines(paymentResult, paymentScenario);
    if (callResult && callScenario) return buildCallLogLines(callResult, callScenario);
    return [];
  }, [paymentResult, paymentScenario, callResult, callScenario]);
  
  const displayed = useTypewriterLog(logLines, 14);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [displayed]);

  const colorClass: Record<LogLine["color"], string> = {
    white: "text-slate-100",
    green: "text-emerald-400",
    red: "text-red-400",
    yellow: "text-amber-400",
    cyan: "text-cyan-400",
    muted: "text-slate-500",
  };

  return (
    <div className="absolute left-8 top-1/2 -translate-y-1/2 w-[300px] z-20">
      <h3 className="text-[14px] font-bold text-slate-900 mb-2 tracking-wide">
        Backend & ML Model
      </h3>
      <div className="bg-slate-950 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.2)] border border-slate-800 p-4 font-mono overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-2 mb-3 border-b border-slate-800 pb-2">
          <span className="text-[11px] text-slate-500 flex items-center gap-1.5">
            <Terminal className="w-3 h-3" /> fraudshield — risk-engine
          </span>
        </div>

        {/* Log output */}
      <div ref={scrollRef} className="h-[440px] overflow-y-auto space-y-0.5 scrollbar-none">
        {logLines.length === 0 && (
          <div className="flex items-center gap-1.5 mt-4">
            <div className="w-2 h-3.5 bg-emerald-400 animate-pulse rounded-sm"></div>
            <span className="text-[12px] text-slate-500">Awaiting transaction or call...</span>
          </div>
        )}
        {displayed.map((entry, i) => (
          <div key={i} className={cn("text-[11px] leading-[1.7] whitespace-pre-wrap break-all", colorClass[entry.line.color])}>
            {entry.text}
            {/* Blinking cursor on the last line */}
            {i === displayed.length - 1 && (
              <span className="inline-block w-1.5 h-3 bg-emerald-400 ml-0.5 animate-pulse align-middle"></span>
            )}
          </div>
        ))}
      </div>
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function MobileSimulationPage() {
  // Payment State
  const [activeScenario, setActiveScenario] = useState<MobileScenario | null>(null);
  const [lastPaymentResult, setLastPaymentResult] = useState<PaymentResponse | null>(null);
  const [lastPaymentScenario, setLastPaymentScenario] = useState<MobileScenario | null>(null);

  // Call State
  const [activeCallScenario, setActiveCallScenario] = useState<CallScenario | null>(null);
  const [lastCallResult, setLastCallResult] = useState<SocialEngineeringEvaluation | null>(null);
  const [lastCallScenarioSnapshot, setLastCallScenarioSnapshot] = useState<CallScenario | null>(null);

  const handlePaymentResult = (result: PaymentResponse | null) => {
    setLastPaymentResult(result);
    setLastPaymentScenario(activeScenario);
  };

  const handleCallResult = (result: SocialEngineeringEvaluation | null) => {
    setLastCallResult(result);
    setLastCallScenarioSnapshot(activeCallScenario);
  };

  const handleReset = () => {
    setActiveScenario(null);
  };

  const handleCallReset = () => {
    setActiveCallScenario(null);
  };

  const handleScenarioClick = (scenario: MobileScenario) => {
    // Clear Call states
    setActiveCallScenario(null);
    setLastCallResult(null);
    setLastCallScenarioSnapshot(null);
    // Clear Payment states
    setLastPaymentResult(null); 
    setLastPaymentScenario(null);
    setActiveScenario(scenario);
  };

  const handleCallScenarioClick = (scenario: CallScenario) => {
    // Clear Payment states
    setActiveScenario(null);
    setLastPaymentResult(null);
    setLastPaymentScenario(null);
    // Clear Call states
    setLastCallResult(null);
    setLastCallScenarioSnapshot(null);
    setActiveCallScenario(scenario);
  };

  return (
    <div className="fixed top-0 right-0 bottom-0 left-0 md:left-64 bg-white z-50 flex items-center justify-center overflow-hidden">

      {/* ── LEFT: Analysis Log Panel ── */}
      <AnalysisPanel 
        paymentResult={lastPaymentResult} 
        paymentScenario={lastPaymentScenario}
        callResult={lastCallResult}
        callScenario={lastCallScenarioSnapshot}
      />

      {/* ── CENTER: Phone Simulator ── */}
      <div className="relative z-10 flex items-center justify-center transform scale-[0.78] lg:scale-[0.82] origin-center">
        <PhoneSimulator
          scenario={activeScenario}
          onReset={handleReset}
          onResult={handlePaymentResult}
          callScenario={activeCallScenario}
          onCallReset={handleCallReset}
          onCallResult={handleCallResult}
        />
      </div>

      {/* ── RIGHT: Trigger Tiles ── */}
      <div className="absolute right-8 top-1/2 -translate-y-1/2 w-[240px] space-y-6 z-20">
        
        {/* Payments Tile */}
        <div className="bg-transparent rounded-2xl border border-slate-200 p-3.5">
          <h3 className="text-[12px] font-bold text-slate-900 mb-2.5 text-center tracking-wide">
            Payment Scenarios
          </h3>
          <div className="space-y-1.5">
            {MOBILE_SCENARIOS.map((scenario) => {
              const isActive = activeScenario?.id === scenario.id;
              const Icon = scenario.icon;

              return (
                <button
                  key={scenario.id}
                  onClick={() => handleScenarioClick(scenario)}
                  className={cn(
                    "w-full flex items-center gap-2.5 p-2 rounded-xl border transition-all duration-200 bg-transparent",
                    isActive
                      ? "border-slate-900 ring-1 ring-slate-900 shadow-sm"
                      : "border-slate-200 hover:border-slate-400"
                  )}
                >
                  <div className={cn("p-1.5 shrink-0 transition-colors duration-200", isActive ? "text-slate-900" : "text-slate-500")}>
                    <Icon className="w-4 h-4" strokeWidth={isActive ? 2.5 : 2} />
                  </div>
                  <div className="flex-1 text-left">
                    <h4 className="text-[11px] font-semibold text-slate-900 leading-tight">{scenario.label}</h4>
                    <p className="text-[10px] text-slate-400 mt-0.5">{scenario.description}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Voice Phishing Tile */}
        <div className="bg-transparent rounded-2xl border border-slate-200 p-3.5">
          <div className="flex items-center justify-center gap-1.5 mb-2.5">
            <Mic className="w-3 h-3 text-slate-400" />
            <h3 className="text-[12px] font-bold text-slate-900 text-center tracking-wide">
              Voice Phishing NLP
            </h3>
          </div>
          <div className="space-y-1.5">
            {CALL_SCENARIOS.map((scenario) => {
              const isActive = activeCallScenario?.id === scenario.id;
              const isRed = scenario.tagColor.includes('red') || scenario.tagColor.includes('orange');
              const isAmber = scenario.tagColor.includes('amber');
              
              return (
                <button
                  key={scenario.id}
                  onClick={() => handleCallScenarioClick(scenario)}
                  className={cn(
                    "w-full flex items-center gap-2.5 p-2 rounded-xl border transition-all duration-200 bg-transparent",
                    isActive
                      ? "border-slate-900 ring-1 ring-slate-900 shadow-sm"
                      : "border-slate-200 hover:border-slate-400"
                  )}
                >
                  <div className={cn("p-1.5 shrink-0 transition-colors duration-200", isActive ? "text-slate-900" : "text-slate-500")}>
                    {isRed ? <AlertTriangle className="w-4 h-4" strokeWidth={isActive ? 2.5 : 2} /> : <Shield className="w-4 h-4" strokeWidth={isActive ? 2.5 : 2} />}
                  </div>
                  <div className="flex-1 text-left">
                    <h4 className="text-[11px] font-semibold text-slate-900 leading-tight truncate">{scenario.label}</h4>
                    <p className="text-[10px] text-slate-400 mt-0.5">{scenario.tag}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

      </div>

    </div>
  );
}
