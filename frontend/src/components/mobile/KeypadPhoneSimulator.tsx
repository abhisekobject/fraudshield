"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { preloadVoices, speakScript, cancelSpeech } from "@/utils/speechQueue";
import { PhoneCall, PhoneOff, Loader2 } from "lucide-react";
import { api } from "../../services/api";
import { SocialEngineeringEvaluation } from "../../types";
import { CallScenario } from "../../utils/callScenarios";
import { cn } from "../../utils/cn";

// ─── Ringtone (Nokia-style beep pattern via Web Audio API) ────────────────────
function useKeypadRingtone(isRinging: boolean) {
  const audioCtxRef = useRef<AudioContext | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!isRinging) {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (audioCtxRef.current && audioCtxRef.current.state !== "closed") {
        audioCtxRef.current.close();
      }
      audioCtxRef.current = null;
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const AC = window.AudioContext || (window as any).webkitAudioContext;
    if (!AC) return;

    const ctx = new AC() as AudioContext;
    audioCtxRef.current = ctx;

    // Classic Nokia Grande Valse approximation — short beep bursts
    const notes = [659, 587, 370, 415, 554, 494, 294, 330, 523, 466, 233, 262];
    let noteIdx = 0;

    function playNote() {
      if (!audioCtxRef.current || audioCtxRef.current.state === "closed") return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "square";
      osc.frequency.value = notes[noteIdx % notes.length];
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.13);
      noteIdx++;
      if (noteIdx < notes.length) {
        timerRef.current = setTimeout(playNote, 150);
      } else {
        // pause then repeat
        timerRef.current = setTimeout(() => {
          noteIdx = 0;
          playNote();
        }, 1800);
      }
    }

    playNote();

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      try { ctx.close(); } catch {}
      audioCtxRef.current = null;
    };
  }, [isRinging]);
}

// ─── LCD Text line with blinking cursor ───────────────────────────────────────
function LcdLine({
  text,
  color = "text-black/80",
  blink = false,
  small = false,
}: {
  text: string;
  color?: string;
  blink?: boolean;
  small?: boolean;
}) {
  return (
    <div className={cn("font-mono leading-tight truncate uppercase font-bold", small ? "text-[9px]" : "text-[12px]", color)}>
      {text}
      {blink && (
        <span className="inline-block w-[4px] h-[10px] bg-black/80 ml-[2px] align-middle animate-[lcdBlink_1s_step-end_infinite]"/>
      )}
    </div>
  );
}

// ─── Key Button ──────────────────────────────────────────────────────────────
function Key({
  label,
  sub,
  onPress,
}: {
  label: string;
  sub?: string;
  onPress?: () => void;
}) {
  const [pressed, setPressed] = useState(false);

  const handlePress = () => {
    setPressed(true);
    setTimeout(() => setPressed(false), 120);
    onPress?.();
  };

  return (
    <button
      onMouseDown={handlePress}
      onTouchStart={handlePress}
      className={cn(
        "flex flex-col items-center justify-center rounded-[40%] select-none h-7 w-12 mx-auto",
        "transition-all duration-75 cursor-pointer shadow-[0_3px_0_rgba(150,150,150,1)]",
        "active:scale-95 active:shadow-none active:translate-y-[3px]",
        pressed
          ? "bg-[#b0b0b0]"
          : "bg-[#e5e5e5]"
      )}
    >
      <div className="flex items-end gap-1">
        <span className="font-bold text-slate-800 text-[14px] leading-none">{label}</span>
        {sub && <span className="text-[7px] text-slate-600 font-bold leading-none mb-[2px]">{sub}</span>}
      </div>
    </button>
  );
}

// ─── Types ───────────────────────────────────────────────────────────────────
type PhoneState ="idle"|"ringing"|"active"|"analyzing"|"result";

export interface KeypadPhoneSimulatorProps {
 callScenario: CallScenario | null;
 onCallReset: () => void;
 onCallResult: (result: SocialEngineeringEvaluation | null) => void;
 onAccepted?: () => void;
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function KeypadPhoneSimulator({
 callScenario,
 onCallReset,
 onCallResult,
 onAccepted,
}: KeypadPhoneSimulatorProps) {
 const [state, setState] = useState<PhoneState>("idle");
 const [callDuration, setCallDuration] = useState(0);
 const [transcript, setTranscript] = useState("");
 const [result, setResult] = useState<SocialEngineeringEvaluation | null>(null);
 const [dialDisplay, setDialDisplay] = useState("");
 const [signalBars, setSignalBars] = useState(4);

 const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
 const simTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
 const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

 useEffect(() => {
 preloadVoices();
 }, []);

 useKeypadRingtone(state ==="ringing");

 // Fluctuate signal bars for realism
 useEffect(() => {
 const id = setInterval(() => {
 setSignalBars(Math.floor(Math.random() * 2) + 3); // 3 or 4
 }, 3000);
 return () => clearInterval(id);
 }, []);

 // React to external scenario change
 useEffect(() => {
 if (callScenario) {
 setState("ringing");
 setTranscript("");
 setResult(null);
 setCallDuration(0);
 setDialDisplay("");
 } else {
 // Do NOT cancel speechSynthesis here — the other phone may be actively speaking.
 // Only stop our own timers.
 if (timerRef.current) clearInterval(timerRef.current);
 if (simTimerRef.current) clearInterval(simTimerRef.current);
 setState("idle");
 setTranscript("");
 setCallDuration(0);
 }
 }, [callScenario]);

 const formatDuration = (s: number) =>
`${String(Math.floor(s / 60)).padStart(2,"0")}:${String(s % 60).padStart(2,"0")}`;

 const handleAnswer = useCallback(() => {
 if (!callScenario) return;
 onAccepted?.();
 setState("active");
 timerRef.current = setInterval(() => setCallDuration((d) => d + 1), 1000);

 const scriptText = callScenario.script;

 // TTS via centralized speech queue (sequential, Chrome-safe)
 speakScript(scriptText, callScenario.rateMultiplier, callScenario.pitchOffset);

    // Guaranteed UI Simulation Flow
    const words = scriptText.split(" ");
    // Start at a negative index to create an initial lag (simulates real-time transcription delay)
    let currentWordIdx = -1;
    // Match the speech rate closely to maintain a conversational, real-time feel
    const wordIntervalMs = Math.max(200, (60000 / 220) / (0.85 * callScenario.rateMultiplier));

    simTimerRef.current = setInterval(() => {
      currentWordIdx++;
      if (currentWordIdx <= 0) {
        return; // Still in the delay phase
      }

      if (currentWordIdx <= words.length) {
        setTranscript(words.slice(0, currentWordIdx).join(" "));
      } else {
        if (simTimerRef.current) clearInterval(simTimerRef.current);
        if (timerRef.current) clearInterval(timerRef.current);
        setState("analyzing");
        
        api.analyzeInteraction({ transcript: scriptText, channel: "voice" })
          .then((nlp) => {
            setResult(nlp);
            onCallResult(nlp);
            setState("result");
          })
          .catch((e) => {
            console.error(e);
            setState("idle");
          });
      }
    }, wordIntervalMs);

 }, [callScenario, onCallResult, onAccepted]);

 const handleReject = useCallback(() => {
 cancelSpeech();
 if (timerRef.current) clearInterval(timerRef.current);
 onCallReset();
 }, [onCallReset]);

 const handleKeyPress = (key: string) => {
 if (state ==="idle") {
 setDialDisplay((prev) => (prev + key).slice(-12));
 }
 };

 // ── Helpers for LCD content ──────────────────────────────────────────────
  const riskEmoji = result?.risk_level === "LOW" ? "SAFE" : result?.risk_level === "CRITICAL" ? "SCAM!" : "WARN";
  const scoreStr = result ? `${(result.score * 100).toFixed(0)}%` : "";
  const topIndicators = result?.triggered_indicators?.slice(0, 2) ?? [];

  return (
    <>
      <style>{`
        @keyframes lcdBlink { 0%,100%{opacity:1} 50%{opacity:0} }
        @keyframes ringPulse { 0%{box-shadow:0 0 0 0 rgba(11,36,71,0.5)} 70%{box-shadow:0 0 0 12px rgba(11,36,71,0)} 100%{box-shadow:0 0 0 0 rgba(11,36,71,0)} }
        @keyframes ringPulseRed { 0%{box-shadow:0 0 0 0 rgba(239,68,68,0.5)} 70%{box-shadow:0 0 0 12px rgba(239,68,68,0)} 100%{box-shadow:0 0 0 0 rgba(239,68,68,0)} }
        .ring-pulse-green { animation: ringPulse 1.2s ease-out infinite; }
        .ring-pulse-red { animation: ringPulseRed 1.4s ease-out infinite; }
      `}</style>

      {/* ── Phone Body ─────────────────────────────────────────────────────── */}
      <div className="relative flex flex-col items-center" style={{ width: 220 }}>

        {/* Label */}
        <div className="mb-2 text-[10px] font-mono text-black uppercase tracking-widest">
          Nokia 3310
        </div>

        {/* Phone shell */}
        <div
          className="relative flex flex-col overflow-hidden shadow-[0_24px_48px_rgba(0,0,0,0.6)] border-[4px] border-[#0a1a3a] bg-[#0B2447] pb-8 pt-4 px-2"
          style={{ width: 220, borderRadius: "40px 40px 50px 50px" }}
        >
          {/* Inner faceplate */}
          <div className="bg-[#D9D9D9] rounded-[24px] p-2 pb-6 border-b-4 border-r-2 border-white/20 shadow-inner">
            
            {/* ── Top speaker grille ─────────────────────────────────── */}
            <div className="flex justify-center pt-2 pb-2">
              <div className="flex gap-[3px]">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="w-[12px] h-[3px] bg-black/80 rounded-full" />
                ))}
              </div>
            </div>

            {/* ── Brand text ─────────────────────────────────────────── */}
            <div className="text-center mb-1 text-black/60 font-bold text-[8px] tracking-[2px]">
              FRAUDSHIELD
            </div>

            {/* ── LCD Screen Bezel ────────────────────────────────────── */}
            <div className="bg-[#222] p-[12px] rounded-[16px] mb-3 border-t-[4px] border-l-[2px] border-black/40 shadow-sm">
              {/* LCD Screen */}
              <div
                className="rounded-[4px] overflow-hidden bg-[#87A96B] p-2 relative shadow-inner"
                style={{ minHeight: 120 }}
              >
                {/* Status bar */}
                <div className="flex justify-between items-start mb-2">
                  {/* Signal bars */}
                  <div className="flex flex-col items-start gap-[1px]">
                    {[4, 3, 2, 1].map((bar) => (
                      <div
                        key={bar}
                        className={cn(
                          "h-[2px] bg-black/80",
                          signalBars >= bar ? "opacity-100" : "opacity-0"
                        )}
                        style={{ width: bar * 4 + 2 }}
                      />
                    ))}
                  </div>
                  <div className="text-[8px] font-mono font-bold text-black/80 flex-1 text-center px-1">
                    {state === "idle" && "MENU"}
                    {state === "ringing" && "CALL"}
                    {state === "active" && formatDuration(callDuration)}
                    {state === "analyzing" && "NLP"}
                    {state === "result" && "DONE"}
                  </div>
                  {/* Battery */}
                  <div className="flex flex-col items-end gap-[1px]">
                    {[4, 3, 2, 1].map((bar) => (
                      <div
                        key={bar}
                        className="h-[2px] bg-black/80"
                        style={{ width: bar * 4 + 2 }}
                      />
                    ))}
                  </div>
                </div>

                {/* ── Screen content by state ── */}
                <div className="text-center w-full pt-1">
                  {state === "idle" && (
                    <div className="space-y-1 mt-2">
                      <LcdLine text="FRAUD" color="text-black/90" />
                      <LcdLine text="SHIELD" color="text-black/90" />
                      {dialDisplay ? (
                        <LcdLine text={dialDisplay} color="text-black/80" blink />
                      ) : (
                        <LcdLine text="Enter no." color="text-black/60" small />
                      )}
                    </div>
                  )}

                  {state === "ringing" && (
                    <div className="space-y-1.5 mt-1">
                      <LcdLine text="CALLING" color="text-black/90" small />
                      <LcdLine text="Unknown" color="text-black/90" />
                      <div className="pt-2">
                        <LcdLine text="▲ Shield ON" color="text-black/80" small blink />
                      </div>
                    </div>
                  )}

                  {state === "active" && (
                    <div className="space-y-1 mt-1 text-left">
                      <LcdLine text="CONNECTED" color="text-black/90" />
                      <LcdLine text={formatDuration(callDuration)} color="text-black/80" />
                      <div className="pt-2">
                        <LcdLine text="Listening" color="text-black/80" small blink />
                        {transcript && (
                          <div className="text-[9px] font-bold font-mono text-black/80 leading-tight line-clamp-2">
                            {transcript.slice(-40)}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {state === "analyzing" && (
                    <div className="flex flex-col items-center justify-center py-4 space-y-1">
                      <LcdLine text="ANALYZING" color="text-black/90" />
                      <LcdLine text="Audio..." color="text-black/80" small blink />
                    </div>
                  )}

                  {state === "result" && result && (
                    <div className="space-y-1 mt-1 text-left">
                      <div className="flex justify-between items-center mb-1">
                        <LcdLine text={riskEmoji} color="text-black/90" />
                        <LcdLine text={scoreStr} color="text-black/90" />
                      </div>
                      <LcdLine text={result.risk_level} color="text-black/90" small />
                      <div className="h-px bg-black/40 my-1" />
                      {topIndicators.map((ind, i) => (
                        <div key={i} className="text-[8px] font-bold font-mono text-black/80 leading-tight truncate">
                          {(ind.severity === "CRITICAL" || ind.severity === "HIGH") ? "X" : "V"} {""}
                          {ind.code?.replace(/_/g, "").slice(0, 16)}
                        </div>
                      ))}
                      {topIndicators.length === 0 && (
                        <LcdLine text="SAFE CALL" color="text-black/90" small />
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* ── Navigation Keys ─────────────────────────────────── */}
            <div className="px-2 mb-4 mt-2 flex justify-center relative">
              <div className="flex items-center gap-2">
                 {/* Left: C (Clear / Reject) */}
                 <button 
                    onClick={state !== "idle" ? handleReject : undefined}
                    className="w-10 h-8 rounded-l-[50%] rounded-r-md bg-[#d0d0d0] shadow-[0_3px_0_#999] active:translate-y-[3px] active:shadow-none flex items-center justify-center text-[12px] font-bold text-slate-700 transition-transform"
                 >
                   C
                 </button>
                 
                 {/* Center: Blue Select / Answer Button */}
                 <button 
                    onClick={state === "ringing" ? handleAnswer : undefined}
                    className={cn(
                      "w-16 h-10 rounded-[40%] bg-[#0B2447] shadow-[0_3px_0_#05152a] active:translate-y-[3px] active:shadow-none border-[1.5px] border-[#1a3866] flex flex-col items-center justify-center transition-transform",
                      state === "ringing" && "ring-pulse-green"
                    )}
                 >
                   <div className="w-6 h-1 bg-[#4A72B2] rounded-full mb-1"></div>
                   <div className="w-8 h-1 bg-[#4A72B2] rounded-full"></div>
                 </button>

                 {/* Right: Arrows */}
                 <button 
                    className="w-10 h-12 rounded-r-[50%] rounded-l-md bg-[#d0d0d0] shadow-[0_3px_0_#999] active:translate-y-[3px] active:shadow-none flex flex-col items-center justify-between py-1.5 transition-transform"
                 >
                    <span className="text-[10px] font-bold text-slate-700 leading-none">▲</span>
                    <span className="text-[10px] font-bold text-slate-700 leading-none">▼</span>
                 </button>
              </div>
            </div>

            {/* ── 12-Key Keypad ─────────────────────────────────────────── */}
            <div className="px-1">
              <div className="grid grid-cols-3 gap-y-3 gap-x-1">
                {[
                  { label: "1", sub: "" },
                  { label: "2", sub: "ABC" },
                  { label: "3", sub: "DEF" },
                  { label: "4", sub: "GHI" },
                  { label: "5", sub: "JKL" },
                  { label: "6", sub: "MNO" },
                  { label: "7", sub: "PQRS" },
                  { label: "8", sub: "TUV" },
                  { label: "9", sub: "WXYZ" },
                  { label: "*", sub: "" },
                  { label: "0", sub: "+" },
                  { label: "#", sub: "" },
                ].map(({ label, sub }) => (
                  <Key
                    key={label}
                    label={label}
                    sub={sub}
                    onPress={() => handleKeyPress(label)}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* ── Bottom mic grille ──────────────────────────────────────── */}
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2">
            <div className="w-[4px] h-[4px] bg-black/40 rounded-full" />
          </div>
        </div>
      </div>
    </>
  );
}
