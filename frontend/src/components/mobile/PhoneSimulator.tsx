"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  Wifi, Battery, Signal,
  ScanLine, Users, Landmark, Wallet,
  Bell, QrCode, ShieldAlert, CheckCircle2, 
  XCircle, ShieldQuestion, Loader2,
  PhoneCall, PhoneOff, Phone, MicOff
} from "lucide-react";
import { api } from "../../services/api";
import { PaymentResponse, SocialEngineeringEvaluation } from "../../types";
import { MobileScenario } from "../../app/mobile/page";
import { CallScenario } from "../../utils/callScenarios";
import { cn } from "../../utils/cn";

// ── Hook to play a phone ringtone using Web Audio API ──
function useRingtone(isRinging: boolean) {
  const audioCtxRef = useRef<AudioContext | null>(null);
  const oscillatorRefs = useRef<OscillatorNode[]>([]);
  const gainNodeRef = useRef<GainNode | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!isRinging) {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (gainNodeRef.current && audioCtxRef.current) {
         gainNodeRef.current.gain.setTargetAtTime(0, audioCtxRef.current.currentTime, 0.1);
      }
      setTimeout(() => {
        oscillatorRefs.current.forEach(o => { try { o.stop(); o.disconnect(); } catch {} });
        oscillatorRefs.current = [];
        if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
          audioCtxRef.current.close();
        }
        audioCtxRef.current = null;
      }, 200);
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    audioCtxRef.current = ctx;

    const gainNode = ctx.createGain();
    gainNode.gain.value = 0; // start silent
    gainNode.connect(ctx.destination);
    gainNodeRef.current = gainNode;

    // Dual tone for European/UK style ring (400Hz + 450Hz)
    const osc1 = ctx.createOscillator();
    osc1.type = 'sine';
    osc1.frequency.value = 400;
    osc1.connect(gainNode);
    
    const osc2 = ctx.createOscillator();
    osc2.type = 'sine';
    osc2.frequency.value = 450;
    osc2.connect(gainNode);

    osc1.start();
    osc2.start();
    oscillatorRefs.current = [osc1, osc2];

    // UK ringing pattern (0.4s on, 0.2s off, 0.4s on, 2s off)
    let step = 0;
    const toggleRing = () => {
      if (ctx.state === 'closed') return;
      
      if (step === 0 || step === 2) {
        // ON
        gainNode.gain.setTargetAtTime(0.3, ctx.currentTime, 0.05);
        timeoutRef.current = setTimeout(toggleRing, 400);
      } else if (step === 1) {
        // Short OFF
        gainNode.gain.setTargetAtTime(0, ctx.currentTime, 0.05);
        timeoutRef.current = setTimeout(toggleRing, 200);
      } else if (step === 3) {
        // Long OFF
        gainNode.gain.setTargetAtTime(0, ctx.currentTime, 0.05);
        timeoutRef.current = setTimeout(toggleRing, 2000);
      }
      step = (step + 1) % 4;
    };
    
    toggleRing();

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      try { osc1.stop(); osc2.stop(); } catch {}
      ctx.close();
    };
  }, [isRinging]);
}

type Screen = "home" | "request_received" | "processing" | "result" | "success";

interface PhoneSimulatorProps {
  scenario: MobileScenario | null;
  onReset: () => void;
  onResult: (result: PaymentResponse | null) => void;
  callScenario: CallScenario | null;
  onCallReset: () => void;
  onCallResult: (result: SocialEngineeringEvaluation | null) => void;
}

export function PhoneSimulator({ scenario, onReset, onResult, callScenario, onCallReset, onCallResult }: PhoneSimulatorProps) {
  const [screen, setScreen] = useState<Screen>("home");
  const [result, setResult] = useState<PaymentResponse | null>(null);

  // ── Voice call state ──────────────────────────────────────────────────────
  type CallScreen = "idle" | "ringing" | "active" | "call_result";
  const [callScreen, setCallScreen] = useState<CallScreen>("idle");
  const [callTranscript, setCallTranscript] = useState<string>("");
  const [callDuration, setCallDuration] = useState(0);
  const [callResult, setCallResult] = useState<SocialEngineeringEvaluation | null>(null);
  const [callLoading, setCallLoading] = useState(false);
  const callTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useRingtone(callScreen === "ringing");

  // When a payment scenario is selected externally
  useEffect(() => {
    if (scenario) {
      setScreen("request_received");
      setResult(null);
    } else {
      setScreen("home");
      setResult(null);
    }
  }, [scenario]);

  // When a call scenario is selected externally — trigger incoming ring
  useEffect(() => {
    if (callScenario) {
      setCallScreen("ringing");
      setCallTranscript("");
      setCallResult(null);
      setCallDuration(0);
    } else {
      // Stop any speech and cleanup
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
      if (callTimerRef.current) clearInterval(callTimerRef.current);
      setCallScreen("idle");
      setCallTranscript("");
      setCallDuration(0);
    }
  }, [callScenario]);

  const handlePay = async () => {
    if (!scenario) return;
    setScreen("processing");
    try {
      const response = await api.createPayment({
        ...scenario.paymentPayload,
        interaction_context: undefined
      });
      setResult(response);
      onResult(response);
      if (response.risk_evaluation.risk_level === 'CRITICAL' || response.risk_evaluation.risk_level === 'HIGH') {
        setScreen("result");
      } else {
        setScreen("success");
      }
    } catch (e) {
      console.error(e);
      setScreen("home");
    }
  };

  const handleBlock = () => {
    onReset();
  };

  const handleProceed = () => {
    setScreen("success");
  };

  const handleVerify = () => {
    onReset();
  };

  // ── Accept call: play TTS + sync transcript ──────────────────────────────
  const handleAcceptCall = () => {
    if (!callScenario) return;
    setCallScreen("active");
    callTimerRef.current = setInterval(() => setCallDuration(d => d + 1), 1000);

    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

    const utterance = new SpeechSynthesisUtterance(callScenario.script);
    utterance.rate = 0.85 * callScenario.rateMultiplier;
    utterance.pitch = 1.0 + callScenario.pitchOffset;
    utterance.volume = 1.0;

    const speak = () => {
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        const v = voices.find(v => v.lang === "en-IN") || voices.find(v => v.lang.startsWith("en-"));
        if (v) utterance.voice = v;
      }
      utterance.onboundary = (event: SpeechSynthesisEvent) => {
        if (event.name === "word") {
          const endIdx = event.charIndex + event.charLength;
          setCallTranscript(callScenario.script.substring(0, endIdx));
        }
      };
      utterance.onend = async () => {
        setCallTranscript(callScenario.script);
        if (callTimerRef.current) clearInterval(callTimerRef.current);
        // Analyse with NLP
        setCallLoading(true);
        try {
          const nlp = await api.analyzeInteraction({ transcript: callScenario.script, channel: "voice" });
          setCallResult(nlp);
          onCallResult(nlp);
        } catch (e) { console.error(e); }
        finally { setCallLoading(false); setCallScreen("call_result"); }
      };
      utterance.onerror = () => {
        if (callTimerRef.current) clearInterval(callTimerRef.current);
        setCallScreen("idle");
      };
      utteranceRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    };

    if (window.speechSynthesis.getVoices().length === 0) {
      window.speechSynthesis.onvoiceschanged = speak;
    } else {
      speak();
    }
  };

  const handleDeclineCall = () => { onCallReset(); };

  const handleEndCall = () => {
    window.speechSynthesis.cancel();
    if (callTimerRef.current) clearInterval(callTimerRef.current);
    onCallReset();
  };

  const formatDuration = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;


  return (
    <div className="relative w-[375px] h-[812px] bg-white rounded-[42px] shadow-[0_32px_64px_rgba(0,0,0,0.28)] border-[8px] border-slate-800 overflow-hidden flex flex-col font-sans ring-1 ring-slate-700/30">
      
      {/* ── Phone side buttons (decorative) ── */}
      {/* Volume up */}
      <div className="absolute -left-[10px] top-24 w-[4px] h-8 bg-slate-700 rounded-l-full z-50"></div>
      {/* Volume down */}
      <div className="absolute -left-[10px] top-36 w-[4px] h-8 bg-slate-700 rounded-l-full z-50"></div>
      {/* Power button */}
      <div className="absolute -right-[10px] top-28 w-[4px] h-12 bg-slate-700 rounded-r-full z-50"></div>

      {/* ── Status Bar with punch-hole camera ── */}
      <div className="relative h-11 flex items-center justify-between px-6 text-black z-40 bg-white flex-shrink-0">
        <span className="text-[14px] font-semibold">9:41</span>
        {/* Punch-hole camera — centered */}
        <div className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 w-3 h-3 bg-slate-900 rounded-full ring-2 ring-slate-800"></div>
        <div className="flex gap-1.5 items-center">
          <Signal className="w-3.5 h-3.5" />
          <Wifi className="w-3.5 h-3.5" />
          <Battery className="w-5 h-5" />
        </div>
      </div>

      {/* ── SCREEN CONTENT ── */}
      <div className="flex-1 bg-slate-50 flex flex-col relative overflow-hidden">
        
        {/* 1. HOME SCREEN (Idle) */}
        {(screen === "home" || screen === "request_received") && (
          <div className="flex-1 flex flex-col absolute inset-0 animate-in fade-in duration-300">
            {/* Header */}
            <div className="bg-blue-600 p-6 pt-2 pb-8 rounded-b-[32px] text-white">
              <div className="flex justify-between items-center mb-6">
                <div className="w-11 h-11 bg-white/20 rounded-full flex items-center justify-center font-bold text-[18px]">
                  AK
                </div>
                <div className="flex gap-4">
                  <QrCode className="w-7 h-7" />
                  <Bell className="w-7 h-7" />
                </div>
              </div>
              <h2 className="text-[22px] font-semibold">PayShield</h2>
              <p className="text-blue-100 text-[15px]">Ready to pay</p>
            </div>

            {/* Quick Actions */}
            <div className="px-5 -mt-6 relative z-10">
              <div className="bg-white rounded-[20px] shadow-sm p-5 grid grid-cols-4 gap-4 border border-slate-100">
                <button className="flex flex-col items-center gap-2">
                  <div className="w-14 h-14 bg-blue-50 rounded-full flex items-center justify-center text-blue-600">
                    <ScanLine className="w-7 h-7" />
                  </div>
                  <span className="text-[12px] font-medium text-slate-700 text-center leading-tight">Scan &<br/>Pay</span>
                </button>
                <button className="flex flex-col items-center gap-2">
                  <div className="w-14 h-14 bg-blue-50 rounded-full flex items-center justify-center text-blue-600">
                    <Users className="w-7 h-7" />
                  </div>
                  <span className="text-[12px] font-medium text-slate-700 text-center leading-tight">To<br/>Contact</span>
                </button>
                <button className="flex flex-col items-center gap-2">
                  <div className="w-14 h-14 bg-blue-50 rounded-full flex items-center justify-center text-blue-600">
                    <Landmark className="w-7 h-7" />
                  </div>
                  <span className="text-[12px] font-medium text-slate-700 text-center leading-tight">To<br/>Bank</span>
                </button>
                <button className="flex flex-col items-center gap-2">
                  <div className="w-14 h-14 bg-blue-50 rounded-full flex items-center justify-center text-blue-600">
                    <Wallet className="w-7 h-7" />
                  </div>
                  <span className="text-[12px] font-medium text-slate-700 text-center leading-tight">Self<br/>Transfer</span>
                </button>
              </div>
            </div>

            {/* Recent Contacts */}
            <div className="p-5 mt-4">
              <h3 className="text-[15px] font-semibold text-slate-900 mb-4">People</h3>
              <div className="flex gap-5 overflow-x-hidden">
                {['Mother', 'Father', 'Brother'].map((name, i) => (
                  <div key={i} className="flex flex-col items-center gap-2 min-w-[64px]">
                    <div className="w-16 h-16 bg-slate-200 rounded-full flex items-center justify-center text-slate-600 text-xl font-bold">
                      {name[0]}
                    </div>
                    <span className="text-[13px] font-medium text-slate-700">{name}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* 2. INCOMING REQUEST OVERLAY */}
        {screen === "request_received" && scenario && (
          <div className="absolute inset-0 bg-slate-900/60 z-20 flex items-end animate-in fade-in duration-300">
            <div className="w-full bg-white rounded-t-[32px] p-6 pb-12 animate-in slide-in-from-bottom-full duration-300 shadow-2xl">
              
              <div className="w-12 h-1 bg-slate-200 rounded-full mx-auto mb-6"></div>
              
              <div className="text-center mb-6">
                <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl font-bold text-slate-400">
                  {scenario.requesterName[0]}
                </div>
                <h3 className="text-[20px] font-semibold text-slate-900">{scenario.requesterName}</h3>
                <p className="text-[14px] text-slate-500 mt-1">is requesting money from you</p>
              </div>

              <div className="bg-slate-50 rounded-[20px] p-6 text-center mb-8 border border-slate-100">
                <div className="text-[42px] font-bold text-slate-900">
                  ₹{scenario.amount.toLocaleString('en-IN')}
                </div>
                <div className="text-[13px] text-slate-500 mt-2">
                  Message: "Please send this urgently."
                </div>
              </div>

              <div className="flex gap-3">
                <button 
                  onClick={onReset}
                  className="flex-1 py-4 bg-slate-100 text-slate-700 font-semibold rounded-[16px] text-[16px]"
                >
                  Decline
                </button>
                <button 
                  onClick={handlePay}
                  className="flex-1 py-4 bg-blue-600 text-white font-semibold rounded-[16px] text-[16px]"
                >
                  Pay Now
                </button>
              </div>
              
            </div>
          </div>
        )}

        {/* 3. PROCESSING (FraudShield analyzing) */}
        {screen === "processing" && (
          <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-white p-6 animate-in fade-in">
            <Loader2 className="w-16 h-16 text-blue-600 animate-spin mb-6" />
            <h2 className="text-[22px] font-semibold text-slate-900">Secure Payment...</h2>
            <p className="text-[15px] text-slate-500 mt-2 text-center">Protected by FraudShield ML.</p>
          </div>
        )}

        {/* 4. RESULT (Intervention Popup for High Risk) */}
        {screen === "result" && result && (
          <div className="absolute inset-0 z-30 flex items-center justify-center bg-slate-900 p-6 animate-in fade-in">
            <div className="w-full bg-white rounded-[28px] p-6 shadow-2xl relative overflow-hidden">
              
              {/* Red warning top border */}
              <div className="absolute top-0 inset-x-0 h-2 bg-red-500"></div>

              <div className="flex flex-col items-center text-center mt-4">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center text-red-600 mb-4">
                  <ShieldAlert className="w-8 h-8" />
                </div>
                <h2 className="text-[24px] font-bold text-slate-900 mb-2">High Risk Alert</h2>
                
                <p className="text-[14px] text-slate-600 mb-6 px-2">
                  FraudShield has flagged this transaction as highly suspicious based on real-time ML analysis.
                </p>
                
                <div className="w-full bg-slate-50 rounded-[16px] p-4 mb-6 border border-slate-100 text-left space-y-3">
                  <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                    <span className="text-[13px] text-slate-500">Risk Score</span>
                    <span className="text-[14px] font-bold text-red-600">{(result.risk_evaluation.final_risk_score * 100).toFixed(0)}%</span>
                  </div>
                  <div>
                    <span className="text-[12px] text-slate-400 font-semibold uppercase tracking-wider block mb-1.5">Reasons</span>
                    <ul className="space-y-1.5">
                      {result.risk_evaluation.triggered_rules.slice(0, 2).map((r, idx) => (
                        <li key={idx} className="text-[12px] text-slate-700 flex items-start gap-2">
                          <span className="text-red-500 mt-0.5">•</span> {r.explanation}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="w-full space-y-3">
                  <button 
                    onClick={handleBlock}
                    className="w-full h-14 bg-red-600 hover:bg-red-700 text-white rounded-[16px] font-semibold text-[16px] flex items-center justify-center gap-2"
                  >
                    <XCircle className="w-5 h-5" /> Block Payment
                  </button>
                  <button 
                    onClick={handleVerify}
                    className="w-full h-14 bg-slate-100 hover:bg-slate-200 text-slate-900 rounded-[16px] font-semibold text-[16px] flex items-center justify-center gap-2"
                  >
                    <ShieldQuestion className="w-5 h-5 text-slate-500" /> Verify Identity
                  </button>
                  <button 
                    onClick={handleProceed}
                    className="w-full py-2 text-slate-400 hover:text-slate-600 font-medium text-[13px]"
                  >
                    I trust this person. Proceed anyway.
                  </button>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* 5. SUCCESS SCREEN */}
        {screen === "success" && (
          <div className="absolute inset-0 z-30 bg-emerald-500 flex flex-col animate-in fade-in">
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-white text-center">
              <CheckCircle2 className="w-24 h-24 mb-6" strokeWidth={1.5} />
              <h2 className="text-[32px] font-bold mb-2">Paid Successfully</h2>
              <p className="text-[18px] opacity-90 mb-8">
                ₹{scenario?.amount.toLocaleString('en-IN')} to {scenario?.requesterName}
              </p>
              
              <div className="bg-emerald-600/50 rounded-2xl p-4 w-full backdrop-blur-sm">
                <p className="text-[13px] opacity-80 uppercase tracking-wider font-semibold mb-1">Transaction ID</p>
                <p className="text-[15px] font-mono">TXN{Math.random().toString().slice(2, 12)}</p>
              </div>
            </div>
            
            <div className="p-6">
              <button 
                onClick={onReset}
                className="w-full h-14 bg-white text-emerald-600 rounded-[16px] font-semibold text-[16px]"
              >
                Done
              </button>
            </div>
          </div>
        )}

      </div>

      {/* ── VOICE CALL OVERLAYS (z-40, always on top of payment screens) ── */}

        {/* RINGING SCREEN */}
        {callScreen === "ringing" && callScenario && (
          <div className="absolute inset-0 z-40 bg-slate-900 flex flex-col items-center justify-between p-8 pb-16 animate-in fade-in duration-300">
            <div className="flex-1 flex flex-col items-center justify-center text-white text-center">
              <div className="w-24 h-24 bg-white/10 rounded-full flex items-center justify-center mb-6 ring-4 ring-white/20 animate-pulse">
                <Phone className="w-12 h-12 text-white" />
              </div>
              <div className="text-[13px] text-white/50 font-medium mb-2 uppercase tracking-widest">Incoming Call</div>
              <h2 className="text-[28px] font-bold mb-1">Unknown Caller</h2>
              <p className="text-white/60 text-[14px]">Mobile · India</p>
              <div className="mt-4 px-4 py-1.5 bg-amber-500/20 border border-amber-500/30 rounded-full">
                <span className="text-[12px] text-amber-400 font-medium">FraudShield Monitoring Active</span>
              </div>
            </div>
            <div className="flex gap-16 items-center">
              <button onClick={handleDeclineCall} className="flex flex-col items-center gap-2">
                <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center shadow-lg">
                  <PhoneOff className="w-7 h-7 text-white" />
                </div>
                <span className="text-white/60 text-[12px]">Decline</span>
              </button>
              <button onClick={handleAcceptCall} className="flex flex-col items-center gap-2">
                <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg animate-bounce">
                  <PhoneCall className="w-7 h-7 text-white" />
                </div>
                <span className="text-white/60 text-[12px]">Accept</span>
              </button>
            </div>
          </div>
        )}

        {/* ACTIVE CALL SCREEN */}
        {callScreen === "active" && callScenario && (
          <div className="absolute inset-0 z-40 bg-slate-900 flex flex-col animate-in fade-in duration-300">
            {/* Call header */}
            <div className="text-center pt-10 pb-4 px-6 border-b border-white/10">
              <div className="text-[12px] text-white/40 mb-1">{formatDuration(callDuration)}</div>
              <h2 className="text-[20px] font-bold text-white">Unknown Caller</h2>
              <div className="flex items-center justify-center gap-1.5 mt-2">
                <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></div>
                <span className="text-[12px] text-emerald-400 font-medium">FraudShield listening…</span>
              </div>
            </div>

            {/* Live transcript scroll area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2 text-[13px] leading-relaxed">
              {callTranscript ? (
                callTranscript.split("\n").map((line, i) => {
                  const isCaller = line.startsWith("Caller:");
                  const isVictim = line.startsWith("Victim:");
                  return (
                    <div key={i} className={cn(
                      "rounded-xl px-3 py-2 max-w-[85%] text-[12px]",
                      isCaller ? "bg-slate-700 text-white self-start" :
                      isVictim ? "bg-blue-600 text-white ml-auto" :
                      "text-white/40 text-[11px]"
                    )}>
                      {line}
                    </div>
                  );
                })
              ) : (
                <div className="text-white/30 text-center pt-8 text-[13px]">Call connected…</div>
              )}
            </div>

            {/* End call button */}
            <div className="p-6 flex justify-center border-t border-white/10">
              <button onClick={handleEndCall} className="flex flex-col items-center gap-2">
                <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center shadow-lg">
                  <PhoneOff className="w-7 h-7 text-white" />
                </div>
                <span className="text-white/50 text-[12px]">End Call</span>
              </button>
            </div>
          </div>
        )}

        {/* PROCESSING NLP */}
        {callLoading && (
          <div className="absolute inset-0 z-40 bg-slate-900/80 flex flex-col items-center justify-center animate-in fade-in">
            <Loader2 className="w-10 h-10 text-emerald-400 animate-spin mb-3" />
            <p className="text-white text-[14px] font-medium">Analysing with NLP…</p>
          </div>
        )}

        {/* CALL RESULT SCREEN */}
        {callScreen === "call_result" && callResult && callScenario && (
          <div className="absolute inset-0 z-40 bg-slate-900 flex flex-col overflow-y-auto animate-in fade-in duration-300">
            <div className="p-6 border-b border-white/10">
              <div className="text-[11px] text-white/40 uppercase tracking-widest mb-1">NLP Analysis Complete</div>
              <h2 className="text-[20px] font-bold text-white">{callScenario.label}</h2>
            </div>

            <div className="p-4 space-y-3">
              {/* Score */}
              <div className="bg-white/5 rounded-xl p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[12px] text-white/60">Social Engineering Score</span>
                  <span className={cn("text-[18px] font-bold", callResult.risk_level === "LOW" ? "text-emerald-400" : callResult.risk_level === "CRITICAL" ? "text-red-400" : "text-amber-400")}>
                    {(callResult.score * 100).toFixed(0)}%
                  </span>
                </div>
                <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className={cn("h-full rounded-full transition-all", callResult.risk_level === "LOW" ? "bg-emerald-400" : callResult.risk_level === "CRITICAL" ? "bg-red-400" : "bg-amber-400")}
                    style={{ width: `${callResult.score * 100}%` }}
                  />
                </div>
              </div>

              {/* Verdict */}
              <div className={cn("rounded-xl p-3 text-center font-bold text-[14px]", callResult.risk_level === "LOW" ? "bg-emerald-500/20 text-emerald-400" : callResult.risk_level === "CRITICAL" ? "bg-red-500/20 text-red-400" : "bg-amber-500/20 text-amber-400")}>
                {callResult.risk_level === "LOW" ? "✓ Legitimate Call" : callResult.risk_level === "CRITICAL" ? "⚠ Highly Suspicious — Scam Detected" : "⚠ Suspicious Activity Detected"}
              </div>

              {/* Indicators */}
              {callResult.triggered_indicators && callResult.triggered_indicators.length > 0 && (
                <div className="space-y-2">
                  <div className="text-[11px] text-white/40 uppercase tracking-widest px-1">Detected Patterns</div>
                  {callResult.triggered_indicators.map((ind, i) => {
                    const isRed = ind.severity === "CRITICAL" || ind.severity === "HIGH";
                    return (
                      <div key={i} className={cn("flex items-start gap-2 bg-white/5 rounded-lg px-3 py-2")}>
                        <span className={cn("text-[11px] font-bold mt-0.5", isRed ? "text-red-400" : "text-emerald-400")}>{isRed ? "✗" : "✓"}</span>
                        <div>
                          <div className={cn("text-[11px] font-semibold", isRed ? "text-red-300" : "text-emerald-300")}>{ind.code?.replace(/_/g, " ")}</div>
                          <div className="text-[10px] text-white/50 mt-0.5">{ind.explanation}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="p-6 mt-auto">
              <button onClick={onCallReset} className="w-full h-12 bg-white/10 text-white rounded-[14px] font-semibold text-[14px]">
                Close
              </button>
            </div>
          </div>
        )}

      {/* Home Indicator */}
      <div className="absolute bottom-2 inset-x-0 flex justify-center z-50 pointer-events-none">
        <div className="w-1/3 h-1 bg-slate-900 rounded-full opacity-30"></div>
      </div>
    </div>
  );
}
