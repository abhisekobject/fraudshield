"use client";

import React, { useState, useEffect, useRef, useCallback } from"react";
import { PhoneCall, PhoneOff, Loader2 } from"lucide-react";
import { api } from"../../services/api";
import { SocialEngineeringEvaluation } from"../../types";
import { CallScenario } from"../../utils/callScenarios";
import { cn } from"../../utils/cn";

// ─── Ringtone (Nokia-style beep pattern via Web Audio API) ────────────────────
function useKeypadRingtone(isRinging: boolean) {
 const audioCtxRef = useRef<AudioContext | null>(null);
 const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

 useEffect(() => {
 if (!isRinging) {
 if (timerRef.current) clearTimeout(timerRef.current);
 if (audioCtxRef.current && audioCtxRef.current.state !=="closed") {
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
 if (!audioCtxRef.current || audioCtxRef.current.state ==="closed") return;
 const osc = ctx.createOscillator();
 const gain = ctx.createGain();
 osc.type ="square";
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
 color ="text-amber-400",
 blink = false,
 small = false,
}: {
 text: string;
 color?: string;
 blink?: boolean;
 small?: boolean;
}) {
 return (
 <div className={cn("font-mono leading-tight truncate", small ?"text-[9px]":"text-[11px]", color)}>
 {text}
 {blink && (
 <span className="inline-block w-[2px] h-[10px] bg-amber-400 ml-[1px] align-middle animate-[lcdBlink_1s_step-end_infinite]"/>
 )}
 </div>
 );
}

// ─── Key Button ──────────────────────────────────────────────────────────────
function Key({
 label,
 sub,
 onPress,
 wide = false,
}: {
 label: string;
 sub?: string;
 onPress?: () => void;
 wide?: boolean;
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
"flex flex-col items-center justify-center -md select-none",
"transition-all duration-100 cursor-pointer",
"active:scale-95",
 wide ?"col-span-3 h-7 text-[12px]":"h-8 text-[13px]",
 pressed
 ?"bg-zinc-500 translate-y-[1px]"
 :"bg-gradient-to-b from-zinc-600 to-zinc-700 hover:from-zinc-500 hover:to-zinc-600 _2px_0_rgba(0,0,0,0.5)]"
 )}
 >
 <span className="font-bold text-black leading-none">{label}</span>
 {sub && <span className="text-[7px] text-black leading-none mt-0.5">{sub}</span>}
 </button>
 );
}

// ─── Types ───────────────────────────────────────────────────────────────────
type PhoneState ="idle"|"ringing"|"active"|"analyzing"|"result";

export interface KeypadPhoneSimulatorProps {
 callScenario: CallScenario | null;
 onCallReset: () => void;
 onCallResult: (result: SocialEngineeringEvaluation | null) => void;
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function KeypadPhoneSimulator({
 callScenario,
 onCallReset,
 onCallResult,
}: KeypadPhoneSimulatorProps) {
 const [state, setState] = useState<PhoneState>("idle");
 const [callDuration, setCallDuration] = useState(0);
 const [transcript, setTranscript] = useState("");
 const [result, setResult] = useState<SocialEngineeringEvaluation | null>(null);
 const [dialDisplay, setDialDisplay] = useState("");
 const [signalBars, setSignalBars] = useState(4);

 const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
 const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

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
 if (typeof window !=="undefined"&&"speechSynthesis"in window) {
 window.speechSynthesis.cancel();
 }
 if (timerRef.current) clearInterval(timerRef.current);
 setState("idle");
 setTranscript("");
 setCallDuration(0);
 }
 }, [callScenario]);

 const formatDuration = (s: number) =>
`${String(Math.floor(s / 60)).padStart(2,"0")}:${String(s % 60).padStart(2,"0")}`;

 const handleAnswer = useCallback(() => {
 if (!callScenario) return;
 setState("active");
 timerRef.current = setInterval(() => setCallDuration((d) => d + 1), 1000);

 if (typeof window ==="undefined"|| !("speechSynthesis"in window)) return;

 const utterance = new SpeechSynthesisUtterance(callScenario.script);
 utterance.rate = 0.85 * callScenario.rateMultiplier;
 utterance.pitch = 1.0 + callScenario.pitchOffset;
 utterance.volume = 1.0;

 const speak = () => {
 const voices = window.speechSynthesis.getVoices();
 if (voices.length > 0) {
 const v =
 voices.find((v) => v.lang ==="en-IN") ||
 voices.find((v) => v.lang.startsWith("en-"));
 if (v) utterance.voice = v;
 }

 utterance.onboundary = (e: SpeechSynthesisEvent) => {
 if (e.name ==="word") {
 setTranscript(callScenario.script.substring(0, e.charIndex + e.charLength));
 }
 };

 utterance.onend = async () => {
 setTranscript(callScenario.script);
 if (timerRef.current) clearInterval(timerRef.current);
 setState("analyzing");
 try {
 const nlp = await api.analyzeInteraction({
 transcript: callScenario.script,
 channel:"voice",
 });
 setResult(nlp);
 onCallResult(nlp);
 setState("result");
 } catch (e) {
 console.error(e);
 setState("idle");
 }
 };

 utterance.onerror = () => {
 if (timerRef.current) clearInterval(timerRef.current);
 setState("idle");
 };

 utteranceRef.current = utterance;
 window.speechSynthesis.speak(utterance);
 };

 if (window.speechSynthesis.getVoices().length === 0) {
 window.speechSynthesis.onvoiceschanged = speak;
 } else {
 speak();
 }
 }, [callScenario, onCallResult]);

 const handleReject = useCallback(() => {
 window.speechSynthesis?.cancel();
 if (timerRef.current) clearInterval(timerRef.current);
 onCallReset();
 }, [onCallReset]);

 const handleKeyPress = (key: string) => {
 if (state ==="idle") {
 setDialDisplay((prev) => (prev + key).slice(-12));
 }
 };

 // ── Helpers for LCD content ──────────────────────────────────────────────
 const riskColor =
 result?.risk_level ==="LOW"
 ?"text-emerald-400"
 : result?.risk_level ==="CRITICAL"
 ?"text-red-400"
 :"text-amber-400";

 const riskEmoji =
 result?.risk_level ==="LOW"?"SAFE": result?.risk_level ==="CRITICAL"?"SCAM!":"WARN";

 const scoreStr = result ?`${(result.score * 100).toFixed(0)}%`:"";

 // Top indicators for LCD (max 2)
 const topIndicators = result?.triggered_indicators?.slice(0, 2) ?? [];

 return (
 <>
 {/* Inject keyframe for LCD blink and ring pulse */}
 <style>{`
 @keyframes lcdBlink { 0%,100%{opacity:1} 50%{opacity:0} }
 @keyframes ringPulse { 0%{box-:0 0 0 0 rgba(34,197,94,0.5)} 70%{box-:0 0 0 12px rgba(34,197,94,0)} 100%{box-:0 0 0 0 rgba(34,197,94,0)} }
 @keyframes ringPulseRed { 0%{box-:0 0 0 0 rgba(239,68,68,0.5)} 70%{box-:0 0 0 12px rgba(239,68,68,0)} 100%{box-:0 0 0 0 rgba(239,68,68,0)} }
 @keyframes lcdFlicker { 0%,100%{opacity:1} 92%{opacity:0.97} 95%{opacity:0.92} }
 .ring-pulse-green { animation: ringPulse 1.2s ease-out infinite; }
 .ring-pulse-red { animation: ringPulseRed 1.4s ease-out infinite; }
 .lcd-flicker { animation: lcdFlicker 4s ease-in-out infinite; }
`}</style>

 {/* ── Phone Body ─────────────────────────────────────────────────────── */}
 <div className="relative flex flex-col items-center"style={{ width: 200 }}>

 {/* Label */}
 <div className="mb-2 text-[10px] font-mono text-black uppercase tracking-widest">
 Feature Phone
 </div>

 {/* Phone shell */}
 <div
 className="relative flex flex-col -[20px] overflow-hidden _24px_48px_rgba(0,0,0,0.6)] border-[6px] border-black"
 style={{
 width: 200,
 background:"linear-gradient(160deg, #2a2a2a 0%, #1a1a1a 60%, #111 100%)",
 }}
 >
 {/* ── Top speaker grille ─────────────────────────────────── */}
 <div className="flex justify-center pt-4 pb-1">
 <div className="flex gap-[3px]">
 {Array.from({ length: 9 }).map((_, i) => (
 <div key={i} className="w-[3px] h-[3px] bg-zinc-700 rounded-full"/>
 ))}
 </div>
 </div>

 {/* ── Brand text ─────────────────────────────────────────── */}
 <div className="text-center mb-1">
 <span className="text-[8px] font-bold tracking-[4px] text-black uppercase">
 FRAUDSHIELD
 </span>
 </div>

 {/* ── LCD Display ────────────────────────────────────────── */}
 <div className="mx-3 mb-2">
 <div
 className="lcd-flicker -[6px] overflow-hidden"
 style={{
 background:"linear-gradient(180deg, #1a1a0a 0%, #0d0d00 100%)",
 boxShadow:"inset 0 2px 8px rgba(0,0,0,0.8), 0 0 8px rgba(180,130,0,0.08)",
 minHeight: 110,
 padding:"8px 10px",
 }}
 >
 {/* Status bar */}
 <div className="flex justify-between items-center mb-1.5">
 {/* Signal bars */}
 <div className="flex items-end gap-[2px]">
 {[1, 2, 3, 4].map((bar) => (
 <div
 key={bar}
 className={cn(
"w-[3px] -sm",
 signalBars >= bar ?"bg-amber-500":"bg-amber-900"
 )}
 style={{ height: bar * 3 }}
 />
 ))}
 </div>
 <div className="text-[8px] font-mono text-amber-600">
 {state ==="idle"&&"IDEA IN"}
 {state ==="ringing"&&"CALLING"}
 {state ==="active"&& formatDuration(callDuration)}
 {state ==="analyzing"&&"NLP..."}
 {state ==="result"&&"RESULT"}
 </div>
 {/* Battery */}
 <div className="flex items-center gap-[1px]">
 <div className="w-5 h-2.5 -[2px] flex overflow-hidden p-[1px]">
 <div className="bg-amber-500 -[1px]"style={{ width:"75%"}} />
 </div>
 <div className="w-[2px] h-1.5 bg-amber-700 -r-sm"/>
 </div>
 </div>

 {/* Divider */}
 <div className="h-px bg-amber-900/50 mb-2"/>

 {/* ── Screen content by state ── */}
 {state ==="idle"&& (
 <div className="space-y-1">
 <LcdLine text="READY"color="text-amber-500"/>
 {dialDisplay ? (
 <LcdLine text={dialDisplay} color="text-amber-300"blink />
 ) : (
 <LcdLine text="Enter number..."color="text-amber-800"small />
 )}
 <div className="mt-2 pt-1 border-t">
 <LcdLine text="Vishing Guard: ON"color="text-amber-600"small />
 </div>
 </div>
 )}

 {state ==="ringing"&& (
 <div className="space-y-1.5">
 <LcdLine text="INCOMING CALL"color="text-amber-400"/>
 <LcdLine text="Unknown Caller"color="text-amber-300"/>
 <LcdLine text="+91 98XXXXXX"color="text-amber-500"small />
 <div className="mt-1.5 pt-1 border-t">
 <LcdLine text="▲ FraudShield ON"color="text-amber-600"small blink />
 </div>
 </div>
 )}

 {state ==="active"&& (
 <div className="space-y-1">
 <LcdLine text="CONNECTED"color="text-emerald-400"/>
 <LcdLine text={formatDuration(callDuration)} color="text-amber-300"/>
 <div className="mt-1 pt-1 border-t space-y-0.5">
 <LcdLine text="NLP Listening..."color="text-amber-600"small blink />
 {transcript && (
 <div className="text-[8px] font-mono text-amber-700 leading-tight line-clamp-2">
 {transcript.slice(-80)}
 </div>
 )}
 </div>
 </div>
 )}

 {state ==="analyzing"&& (
 <div className="flex flex-col items-center justify-center py-3 space-y-2">
 <LcdLine text="ANALYZING..."color="text-amber-400"blink />
 <LcdLine text="NLP + ML Engine"color="text-amber-600"small />
 <LcdLine text="Processing audio"color="text-amber-800"small />
 </div>
 )}

 {state ==="result"&& result && (
 <div className="space-y-1">
 <div className="flex justify-between">
 <LcdLine text={riskEmoji} color={riskColor} />
 <LcdLine text={scoreStr} color={riskColor} />
 </div>
 <LcdLine
 text={result.risk_level}
 color={riskColor}
 small
 />
 <div className="h-px bg-amber-900/40 my-1"/>
 {topIndicators.map((ind, i) => (
 <div key={i} className="text-[8px] font-mono text-amber-700 leading-tight truncate">
 {(ind.severity ==="CRITICAL"|| ind.severity ==="HIGH") ?"✗":"✓"}{""}
 {ind.code?.replace(/_/g,"").slice(0, 22)}
 </div>
 ))}
 {topIndicators.length === 0 && (
 <LcdLine text="No threats found"color="text-emerald-700"small />
 )}
 </div>
 )}
 </div>
 </div>

 {/* ── Navigation D-pad row ─────────────────────────────────── */}
 <div className="px-3 mb-1.5">
 <div className="flex justify-between items-center">
 <div className="text-[8px] text-black font-mono w-10 text-center">Menu</div>
 <div className="w-10 h-10 bg-zinc-700 rounded-full flex items-center justify-center">
 <div className="w-7 h-7 bg-zinc-800 rounded-full flex items-center justify-center text-[8px] text-black font-bold select-none">
 OK
 </div>
 </div>
 <div className="text-[8px] text-black font-mono w-10 text-center">Back</div>
 </div>
 </div>

 {/* ── Call accept / reject buttons ─────────────────────────── */}
 <div className="px-3 mb-2">
 <div className="grid grid-cols-2 gap-2">
 {/* Answer / Green */}
 <button
 onClick={state ==="ringing"? handleAnswer : undefined}
 className={cn(
"flex items-center justify-center gap-1.5 h-9 -[10px]",
"font-bold text-[12px] text-black select-none transition-all duration-150",
 state ==="ringing"
 ?"bg-gradient-to-b from-emerald-500 to-emerald-700 ring-pulse-green cursor-pointer hover:from-emerald-400"
 :"bg-gradient-to-b from-emerald-900/40 to-emerald-900/20 text-emerald-900 cursor-default"
 )}
 >
 <PhoneCall className="w-3.5 h-3.5"/>
 </button>

 {/* Reject / Red */}
 <button
 onClick={state !=="idle"? handleReject : undefined}
 className={cn(
"flex items-center justify-center gap-1.5 h-9 -[10px]",
"font-bold text-[12px] text-black select-none transition-all duration-150",
 state !=="idle"
 ?"bg-gradient-to-b from-red-500 to-red-700 ring-pulse-red cursor-pointer hover:from-red-400"
 :"bg-gradient-to-b from-red-900/40 to-red-900/20 text-red-900 cursor-default"
 )}
 >
 <PhoneOff className="w-3.5 h-3.5"/>
 </button>
 </div>
 </div>

 {/* ── 12-Key Keypad ─────────────────────────────────────────── */}
 <div className="px-3 pb-4">
 <div className="grid grid-cols-3 gap-1.5">
 {[
 { label:"1", sub:""},
 { label:"2", sub:"ABC"},
 { label:"3", sub:"DEF"},
 { label:"4", sub:"GHI"},
 { label:"5", sub:"JKL"},
 { label:"6", sub:"MNO"},
 { label:"7", sub:"PQRS"},
 { label:"8", sub:"TUV"},
 { label:"9", sub:"WXYZ"},
 { label:"*", sub:""},
 { label:"0", sub:"+"},
 { label:"#", sub:""},
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

 {/* ── Bottom mic grille ──────────────────────────────────────── */}
 <div className="flex justify-center pb-4">
 <div className="flex gap-[3px]">
 {Array.from({ length: 11 }).map((_, i) => (
 <div key={i} className="w-[3px] h-[3px] bg-zinc-700 rounded-full"/>
 ))}
 </div>
 </div>
 </div>

 {/* ── Analyzing spinner below phone ─────────────────────────── */}
 {state ==="analyzing"&& (
 <div className="mt-3 flex items-center gap-2">
 <Loader2 className="w-3.5 h-3.5 text-amber-400 animate-spin"/>
 <span className="text-[10px] font-mono text-amber-500">NLP Engine…</span>
 </div>
 )}

 {/* ── Risk result badge below phone ──────────────────────────── */}
 {state ==="result"&& result && (
 <div
 className={cn(
"mt-3 px-3 py-1.5 -lg text-[10px] font-mono font-bold",
 result.risk_level ==="LOW"
 ?"bg-emerald-500/10 text-emerald-400"
 : result.risk_level ==="CRITICAL"
 ?"bg-red-500/10 text-red-400"
 :"bg-amber-500/10 text-amber-400"
 )}
 >
 {result.risk_level ==="LOW"
 ?"✓ Call Legitimate"
 : result.risk_level ==="CRITICAL"
 ?"⚠ SCAM DETECTED"
 :"⚠ Suspicious Call"}
 </div>
 )}
 </div>
 </>
 );
}
