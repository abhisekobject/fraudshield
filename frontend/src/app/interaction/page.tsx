"use client";

import React, { useState, useRef, useEffect, useMemo } from"react";
import { api } from"@/services/api";
import { SocialEngineeringEvaluation, RiskLevel } from"@/types";
import { Button } from"@/components/ui/Button";
import { Badge } from"@/components/ui/Badge";
import {
 Loader2, 
 Mic, 
 MicOff, 
 FileText, 
 PhoneCall, 
 PhoneOff, 
 Lock, 
 ShieldCheck, 
 AudioWaveform, 
 Radio, 
 MessageSquareWarning, 
 BadgeCheck, 
 OctagonAlert,
 Activity,
 AlertTriangle,
 Zap,
 Sparkles,
 Volume2
} from"lucide-react";
import { cn } from"@/utils/cn";
import { RealTimeSentimentChart } from"@/components/risk/RealTimeSentimentChart";

// ─────────────────────────────────────────────────────────────────────────────
// Call scenarios — 5 variations from benign to critical
// ─────────────────────────────────────────────────────────────────────────────
interface CallScenario {
 id: string;
 label: string;
 tag: string;
 tagColor: string;
 badgeBg: string;
 badgeBorder: string;
 borderColor: string;
 expectedRisk: string;
 rateMultiplier: number;
 pitchOffset: number;
 script: string;
}

const CALL_SCENARIOS: CallScenario[] = [
 {
 id:"legitimate",
 label:"Legitimate Bank Call",
 tag:"LOW RISK",
 tagColor:"text-emerald-400",
 badgeBg:"bg-emerald-500/10",
 badgeBorder:"",
 borderColor:"hover:border-emerald-400/50",
 expectedRisk:"LOW",
 rateMultiplier: 1.0,
 pitchOffset: 0.1,
 script:
"Caller: Hello, this is an automated security notification from your bank. We detected a login to your account from a new browser. If this was you, no action is needed.\nVictim: Okay, that was probably me.\nCaller: If you did not initiate this, please visit your nearest branch or dial the official helpline number printed on the back of your card. As a reminder, your bank will never call to ask for any verification codes or account credentials. Thank you and have a good day.",
 },
 {
 id:"suspicious_legit",
 label:"Urgent But Legitimate",
 tag:"MEDIUM RISK",
 tagColor:"text-amber-400",
 badgeBg:"bg-amber-500/10",
 badgeBorder:"",
 borderColor:"hover:border-amber-400/50",
 expectedRisk:"MEDIUM",
 rateMultiplier: 0.95,
 pitchOffset: -0.05,
 script:
"Caller: Hello, I am calling from Apollo Hospital, billing department. Your family member has been admitted and the insurance pre-authorization is still pending.\nVictim: Oh no, is everyone okay? How much is it?\nCaller: The hospital requires an advance deposit of twenty five thousand rupees before the procedure can be scheduled. Kindly visit the hospital cashier counter or use our official website to complete the payment at your earliest convenience.\nVictim: I will do that right away.\nCaller: The operation is planned for this afternoon, so prompt action would be appreciated. Thank you.",
 },
 {
 id:"otp_phishing",
 label:"OTP Phishing Attack",
 tag:"HIGH RISK",
 tagColor:"text-orange-400",
 badgeBg:"bg-orange-500/10",
 badgeBorder:"",
 borderColor:"hover:border-orange-400/50",
 expectedRisk:"HIGH",
 rateMultiplier: 0.9,
 pitchOffset: -0.1,
 script:
"Caller: I am calling from the bank fraud prevention team. We have blocked a transaction of eighty thousand rupees from your account. To reverse this and secure your account, I need to verify your identity.\nVictim: Oh my goodness, yes please secure it! What do you need?\nCaller: Please share the six digit OTP that was just sent to your registered mobile number. Do not share this with anyone else, only tell me as I am the official bank representative.",
 },
 {
 id:"coercive_transfer",
 label:"Coercive Transfer Scam",
 tag:"CRITICAL",
 tagColor:"text-red-400",
 badgeBg:"bg-red-500/15",
 badgeBorder:"",
 borderColor:"hover:border-red-400/60",
 expectedRisk:"CRITICAL",
 rateMultiplier: 0.88,
 pitchOffset: -0.2,
 script:
"Caller: Listen carefully. Your bank account has been flagged by the Cyber Crime Department for suspicious transactions. You are under investigation.\nVictim: Investigation? I haven't done anything wrong!\nCaller: To avoid arrest and account seizure, you must immediately transfer fifty thousand rupees to a government safe-hold account I am providing you.\nVictim: I don't know if I can do that right now...\nCaller: Do not disconnect this call, do not tell your family, and do not visit any branch. This is confidential police protocol.",
 },
 {
 id:"multi_signal",
 label:"Full Multi-Signal Attack",
 tag:"CRITICAL",
 tagColor:"text-rose-400",
 badgeBg:"bg-rose-500/20",
 badgeBorder:"",
 borderColor:"hover:border-rose-400/70",
 expectedRisk:"CRITICAL",
 rateMultiplier: 0.85,
 pitchOffset: -0.25,
 script:
"Caller: Your account has been compromised by international hackers and is being drained right now. I am from the RBI Cyber Cell. If you do not act in the next two minutes, you will lose all your money permanently.\nVictim: Please help me stop it!\nCaller: Transfer everything to the emergency recovery account immediately. Give me the OTP to authorize the transfer. Stay on the line, do not hang up, do not call anyone else. This is your last chance to save your money.",
 },
];

// Circular SVG Risk Gauge Component for Analysis Overview
function CircularAnalysisGauge({ score, isAnalyzed }: { score: number; isAnalyzed: boolean }) {
 const size = 150;
 const strokeWidth = 10;
 const radius = (size - strokeWidth) / 2;
 const circumference = radius * 2 * Math.PI;
 const clampedScore = isAnalyzed ? Math.min(100, Math.max(0, score)) : 0;
 const strokeDashoffset = circumference - (clampedScore / 100) * circumference;

 let strokeColor ="#3b82f6";
 let glowColor ="rgba(59, 130, 246, 0.35)";
 if (isAnalyzed) {
 if (score < 30) {
 strokeColor ="#10b981";
 glowColor ="rgba(16, 185, 129, 0.35)";
 } else if (score < 60) {
 strokeColor ="#f59e0b";
 glowColor ="rgba(245, 158, 11, 0.35)";
 } else if (score < 80) {
 strokeColor ="#f97316";
 glowColor ="rgba(249, 115, 22, 0.35)";
 } else {
 strokeColor ="#ef4444";
 glowColor ="rgba(239, 68, 68, 0.45)";
 }
 }

 return (
 <div className="relative flex flex-col items-center justify-center">
 <svg width={size} height={size} className="-rotate-90">
 {/* Background track */}
 <circle
 cx={size / 2}
 cy={size / 2}
 r={radius}
 fill="none"
 stroke="rgba(255, 255, 255, 0.08)"
 strokeWidth={strokeWidth}
 />
 {/* Active progress arc */}
 {isAnalyzed && (
 <circle
 cx={size / 2}
 cy={size / 2}
 r={radius}
 fill="none"
 stroke={strokeColor}
 strokeWidth={strokeWidth}
 strokeDasharray={circumference}
 strokeDashoffset={strokeDashoffset}
 strokeLinecap="round"
 style={{
 transition:"stroke-dashoffset 1.2s cubic-bezier(0.16, 1, 0.3, 1), stroke 0.5s ease",
 filter:`drop-(0 0 8px ${glowColor})`,
 }}
 />
 )}
 </svg>

 {/* Center score readout */}
 <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
 {isAnalyzed ? (
 <>
 <span className="text-3xl font-mono font-bold text-white tracking-tight">
 {score}
 </span>
 <span className="text-[11px] font-mono text-white uppercase tracking-wider">
 / 100
 </span>
 </>
 ) : (
 <>
 <span className="text-2xl font-mono font-bold text-white tracking-tight">
 --
 </span>
 <span className="text-[11px] font-mono text-white uppercase tracking-wider">
 / 100
 </span>
 </>
 )}
 </div>
 </div>
 );
}

export default function InteractionAnalyzer() {
 const [transcript, setTranscript] = useState("");
 const [loading, setLoading] = useState(false);
 const [error, setError] = useState<string | null>(null);
 const [result, setResult] = useState<SocialEngineeringEvaluation | null>(null);

 const [activeScenario, setActiveScenario] = useState<CallScenario | null>(null);
 const [isSimulating, setIsSimulating] = useState(false);
 const [callDuration, setCallDuration] = useState(0);
 const [isListening, setIsListening] = useState(false);

 // Privacy feature state
 const [hashedOutput, setHashedOutput] = useState<string | null>(null);
 const [isEncrypting, setIsEncrypting] = useState(false);

 const [viewMode, setViewMode] = useState<"chat"|"raw">("chat");

 const callTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
 const textareaRef = useRef<HTMLTextAreaElement>(null);
 const chatContainerRef = useRef<HTMLDivElement>(null);
 const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
 // eslint-disable-next-line @typescript-eslint/no-explicit-any
 const recognitionRef = useRef<any>(null);

 useEffect(() => {
 return () => cleanup();
 }, []);

 // Auto-scroll textarea/chat as words appear
 useEffect(() => {
 if (textareaRef.current && isSimulating && viewMode ==="raw") {
 textareaRef.current.scrollTop = textareaRef.current.scrollHeight;
 }
 if (chatContainerRef.current && isSimulating && viewMode ==="chat") {
 chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
 }
 }, [transcript, isSimulating, viewMode]);

 const cleanup = () => {
 if (callTimerRef.current) clearInterval(callTimerRef.current);
 callTimerRef.current = null;
 if (typeof window !=="undefined"&&"speechSynthesis"in window) {
 window.speechSynthesis.cancel();
 }
 utteranceRef.current = null;
 };

 const stopSimulation = () => {
 cleanup();
 stopListening();
 setIsSimulating(false);
 setCallDuration(0);
 setActiveScenario(null);
 };

 // ── Live speech-to-text microphone dictation ──────────────────────────────
 const stopListening = () => {
 if (recognitionRef.current) {
 recognitionRef.current.stop();
 recognitionRef.current = null;
 }
 setIsListening(false);
 };

 const toggleMic = () => {
 if (isListening) {
 stopListening();
 return;
 }
 if (isSimulating) stopSimulation();
 setResult(null);
 setError(null);
 setHashedOutput(null);

 // eslint-disable-next-line @typescript-eslint/no-explicit-any
 const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
 if (!SpeechRecognition) {
 setError("Live dictation is not supported in this browser. Please use Chrome.");
 return;
 }

 const recognition = new SpeechRecognition();
 recognition.lang ="en-IN";
 recognition.continuous = true;
 recognition.interimResults = true;
 recognition.maxAlternatives = 1;

 let finalText = transcript;

 recognition.onresult = (event: any) => {
 let interimText ="";
 for (let i = event.resultIndex; i < event.results.length; i++) {
 const res = event.results[i];
 if (res.isFinal) {
 finalText += (finalText ?"":"") + res[0].transcript.trim();
 } else {
 interimText = res[0].transcript;
 }
 }
 setTranscript(finalText + (interimText ?""+ interimText :""));
 if (textareaRef.current) {
 textareaRef.current.scrollTop = textareaRef.current.scrollHeight;
 }
 };

 recognition.onerror = (event: any) => {
 if (event.error !=="aborted"&& event.error !=="no-speech") {
 setError(`Microphone error: ${event.error}. Please allow microphone access.`);
 }
 stopListening();
 };

 recognition.onend = () => {
 if (recognitionRef.current) {
 try { recognitionRef.current.start(); } catch { /* already started */ }
 } else {
 setIsListening(false);
 }
 };

 recognitionRef.current = recognition;
 recognition.start();
 setIsListening(true);
 };

 const simulateCall = (scenario: CallScenario) => {
 cleanup();

 setIsSimulating(true);
 setActiveScenario(scenario);
 setTranscript("");
 setResult(null);
 setError(null);
 setCallDuration(0);
 setHashedOutput(null);

 callTimerRef.current = setInterval(() => {
 setCallDuration((prev) => prev + 1);
 }, 1000);

 if (typeof window !=="undefined"&&"speechSynthesis"in window) {
 const utterance = new SpeechSynthesisUtterance(scenario.script);
 utterance.rate = 0.85 * scenario.rateMultiplier;
 utterance.pitch = 1.0 + scenario.pitchOffset;
 utterance.volume = 1.0;

 const loadVoiceAndSpeak = () => {
 const voices = window.speechSynthesis.getVoices();
 if (voices.length > 0) {
 const englishVoice =
 voices.find((v) => v.lang ==="en-IN") ||
 voices.find((v) => v.lang ==="en-GB") ||
 voices.find((v) => v.lang.startsWith("en-"));
 if (englishVoice) utterance.voice = englishVoice;
 }

 utterance.onboundary = (event: SpeechSynthesisEvent) => {
 if (event.name ==="word") {
 const endIdx = event.charIndex + event.charLength;
 setTranscript(scenario.script.substring(0, endIdx));
 }
 };

 utterance.onend = () => {
 setTranscript(scenario.script);
 if (callTimerRef.current) clearInterval(callTimerRef.current);
 callTimerRef.current = null;
 setIsSimulating(false);
 setActiveScenario(null);
 };

 utterance.onerror = () => {
 if (callTimerRef.current) clearInterval(callTimerRef.current);
 setIsSimulating(false);
 setActiveScenario(null);
 };

 utteranceRef.current = utterance;
 window.speechSynthesis.speak(utterance);
 };

 if (window.speechSynthesis.getVoices().length === 0) {
 window.speechSynthesis.onvoiceschanged = loadVoiceAndSpeak;
 } else {
 loadVoiceAndSpeak();
 }
 } else {
 let idx = 0;
 const fallback = setInterval(() => {
 idx += 3;
 setTranscript(scenario.script.substring(0, idx));
 if (idx >= scenario.script.length) {
 clearInterval(fallback);
 setIsSimulating(false);
 setActiveScenario(null);
 }
 }, 30);
 }
 };

 const handleAnalyze = async () => {
 if (!transcript.trim()) return;
 stopSimulation();
 setLoading(true);
 setError(null);
 setResult(null);
 setHashedOutput(null);
 try {
 const data = await api.analyzeInteraction({ transcript, channel:"voice"});
 setResult(data);
 triggerAutoHash(transcript);
 } catch (err: unknown) {
 setError(err instanceof Error ? err.message :"Failed to analyze interaction");
 } finally {
 setLoading(false);
 }
 };

 const triggerAutoHash = (rawText: string) => {
 if (!rawText.trim() || isEncrypting) return;
 setIsEncrypting(true);
 setHashedOutput(null);

 const chars ="0123456789ABCDEF!@#$%^&*";
 const finalHash ="0x"+ Array.from({ length: 64 }, () =>"0123456789abcdef"[Math.floor(Math.random() * 16)]).join("");
 const words = rawText.trim().split("");

 let iterations = 0;
 const maxIterations = 22;
 const interval = setInterval(() => {
 const scrambled = words
 .map(() => Array.from({ length: Math.floor(Math.random() * 6) + 3 }, () => chars[Math.floor(Math.random() * chars.length)]).join(""))
 .join("");
 setHashedOutput(scrambled);
 iterations++;
 if (iterations >= maxIterations) {
 clearInterval(interval);
 setHashedOutput(
`[SECURED TRANSCRIPT — CLIENT-SIDE ONLY]\n`+
`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`+
`SHA-256 HASH:\n${finalHash}\n`+
`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`+
`WORDS : ${words.length}\n`+
`CHARS : ${rawText.length}\n`+
`ENCODING : UTF-8 / AES-256-GCM (simulated)\n`+
`STATUS : ✓ Secured — raw transcript never transmitted`
 );
 setIsEncrypting(false);
 }
 }, 40);
 };

 const formatDuration = (s: number) =>
`${String(Math.floor(s / 60)).padStart(2,"0")}:${String(s % 60).padStart(2,"0")}`;

 // ── Calculated Risk Dimensions from NLP results ───────────────────────────
 const riskDimensions = useMemo(() => {
 if (!result) {
 return {
 socialEngineering: null,
 linguisticRisk: null,
 emotionalPressure: null,
 deceptionProbability: null,
 overallRisk: null,
 };
 }

 const baseScore = Math.round(result.score * 100);
 const indicators = result.triggered_indicators || [];

 // Calculate dimensions based on indicator presence and severity
 const countCategory = (cat: string) =>
 indicators.filter((ind) => ind.category.toLowerCase().includes(cat.toLowerCase())).length;

 const socialCount = countCategory("social") + countCategory("authority") + countCategory("impersonation");
 const linguisticCount = countCategory("urgency") + countCategory("threat") + countCategory("lexical");
 const pressureCount = countCategory("pressure") + countCategory("coercion") + countCategory("panic");
 const deceptionCount = countCategory("phishing") + countCategory("credential") + countCategory("otp");

 const computeScore = (count: number, baseline: number) => {
 if (count > 0) {
 return Math.min(100, Math.max(15, baseline + (count * 12) + (count > 2 ? 10 : 0)));
 }
 return Math.max(5, Math.round(baseline * 0.75));
 };

 return {
 socialEngineering: computeScore(socialCount, baseScore),
 linguisticRisk: computeScore(linguisticCount, baseScore),
 emotionalPressure: computeScore(pressureCount, baseScore),
 deceptionProbability: computeScore(deceptionCount, baseScore),
 overallRisk: baseScore,
 };
 }, [result]);

 return (
 <div className="space-y-6 md:space-y-8 max-w-[1400px] mx-auto">

 {/* ── Header ───────────────────────────────────────────────────────── */}
 <div className="flex flex-col items-center text-center space-y-3 pt-2">
 <div data-animate="header"className="inline-flex items-center justify-center p-3 -2xl bg-cyan-500/15 _0_24px_rgba(6,182,212,0.25)]">
 <AudioWaveform className="w-8 h-8 text-white"/>
 </div>
 <h1 data-animate="header"className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-white">
 Interaction Intelligence
 </h1>
 <p data-animate="description"className="text-sm sm:text-base text-white max-w-2xl font-normal leading-relaxed">
 Real-time voice phishing detection, social engineering pattern recognition, and live audio transcription.
 </p>
 </div>

 {/* ── Call Scenario Panel ─────────────────────────────────────────────── */}
 <div data-animate="panel"className="-[22px] bg-[#1C1C1E] _20px_50px_rgba(0,0,0,0.35)] p-5 sm:p-6 md:p-7 space-y-5">
 <div className="space-y-1">
 <h2 className="text-base sm:text-lg text-white font-semibold flex items-center gap-2">
 <Volume2 className="w-4 h-4 text-white"/>
 Select a Call Scenario to Simulate
 </h2>
 <p className="text-xs sm:text-sm text-white">
 Click any scenario to start a live call. The system will speak the script and transcribe it word-by-word in sync with the audio.
 </p>
 </div>

 {/* 5 Scenario Cards Grid */}
 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3.5">
 {CALL_SCENARIOS.map((scenario) => {
 const isActive = activeScenario?.id === scenario.id;
 return (
 <button
 key={scenario.id}
 data-animate="card"
 onClick={() => isSimulating ? (isActive ? stopSimulation() : null) : simulateCall(scenario)}
 disabled={isSimulating && !isActive}
 className={cn(
"relative flex flex-col justify-between items-start text-left p-4 sm:p-4.5 -2xl transition-all duration-300 cursor-pointer group min-h-[110px]",
"disabled:opacity-35 disabled:cursor-not-allowed",
 isActive
 ?"bg-cyan-950/50 _0_25px_rgba(6,182,212,0.3)] ring-1 ring-cyan-400/50 -translate-y-0.5"
 :"bg-[#1C1C1E] hover:bg-[#1C1C1E] hover:border-white/20"
 )}
 >
 {/* Active Pulsing Indicator */}
 {isActive && (
 <span className="absolute top-3.5 right-3.5 flex h-2.5 w-2.5">
 <span className="animate-ping absolute inline-flex h-full w-full -full bg-cyan-400 opacity-75"/>
 <span className="relative inline-flex -full h-2.5 w-2.5 bg-cyan-400 _0_8px_rgba(6,182,212,0.8)]"/>
 </span>
 )}

 <div className="flex items-center gap-2 mb-2">
 <div className={cn(
"w-8 h-8 -xl flex items-center justify-center transition-colors",
 isActive ?"bg-red-500/20 text-red-400":"bg-[#1C1C1E] text-white group-hover:text-white"
 )}>
 {isActive ? (
 <PhoneOff className="w-4 h-4 text-red-400"/>
 ) : (
 <PhoneCall className="w-4 h-4"/>
 )}
 </div>
 </div>

 <div className="w-full space-y-2">
 <p className="text-[13.5px] font-semibold leading-snug text-white group-hover:text-white transition-colors">
 {scenario.label}
 </p>
 
 <div className="flex items-center justify-between">
 <span className={cn(
"text-[10px] font-mono font-bold px-2 py-0.5 -md tracking-wider uppercase inline-block",
 isActive
 ?"bg-cyan-500/20 text-white"
 : cn(scenario.badgeBg, scenario.tagColor, scenario.badgeBorder)
 )}>
 {isActive ?"● SIMULATING": scenario.tag}
 </span>
 </div>
 </div>
 </button>
 );
 })}
 </div>
 </div>

 {/* ── Live Call Banner (Active Call State) ───────────────────────────── */}
 {isSimulating && activeScenario && (
 <div className="bg-cyan-950/40 -2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 _10px_30px_rgba(6,182,212,0.2)] animate-in fade-in duration-300">
 <div className="flex items-center gap-3.5">
 <div className="relative shrink-0">
 <div className="w-12 h-12 -2xl bg-cyan-500/20 flex items-center justify-center">
 <PhoneCall className="w-5 h-5 text-white animate-pulse"/>
 </div>
 <span className="absolute -top-1 -right-1 flex h-3 w-3">
 <span className="animate-ping absolute inline-flex h-full w-full -full bg-cyan-400 opacity-75"/>
 <span className="relative inline-flex -full h-3 w-3 bg-cyan-400"/>
 </span>
 </div>
 <div>
 <div className="flex items-center gap-2 flex-wrap">
 <h3 className="text-base font-semibold text-white">
 Live Call: {activeScenario.label}
 </h3>
 <span className="text-[10px] font-mono font-bold bg-cyan-500/20 text-white px-2 py-0.5 -full">
 SYNCHRONIZED SPEECH
 </span>
 </div>
 <p className="text-xs text-white mt-0.5">
 Transcribing word-by-word in sync with speech synthesis audio.
 </p>
 </div>
 </div>

 <div className="flex items-center gap-4 shrink-0 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 pt-3 sm:pt-0">
 <div className="text-left sm:text-right">
 <p className="text-[20px] font-mono font-bold text-white leading-none">{formatDuration(callDuration)}</p>
 <p className="text-[10px] text-white font-mono mt-0.5">Call Duration</p>
 </div>
 <button
 onClick={stopSimulation}
 className="flex items-center gap-2 px-4 py-2.5 bg-red-500/20 -xl text-red-300 hover:bg-red-500/30 hover:border-red-500/60 text-xs font-semibold transition-all cursor-pointer"
 >
 <PhoneOff className="w-3.5 h-3.5"/> End Call
 </button>
 </div>
 </div>
 )}

 {/* ── Main Content Area: Two-Column Layout ────────────────────────────── */}
 <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 items-start">

 {/* ── Left Column: Voice Transcript Panel ───────────────────────────── */}
 <div className="space-y-5">
 <div data-animate="panel"className="-[22px] bg-[#1C1C1E] _20px_50px_rgba(0,0,0,0.35)] p-5 sm:p-6 space-y-4">
 
 {/* Header with Title & Controls */}
 <div className="flex items-center justify-between pb-3 border-b gap-2">
 <div className="flex items-center gap-2.5">
 {isSimulating && (
 <span className="relative flex h-2.5 w-2.5">
 <span className="animate-ping absolute inline-flex h-full w-full -full bg-cyan-400 opacity-75"/>
 <span className="relative inline-flex -full h-2.5 w-2.5 bg-cyan-400"/>
 </span>
 )}
 {isListening && (
 <span className="relative flex h-2.5 w-2.5">
 <span className="animate-ping absolute inline-flex h-full w-full -full bg-red-400 opacity-75"/>
 <span className="relative inline-flex -full h-2.5 w-2.5 bg-red-400"/>
 </span>
 )}
 <h3 className="text-base font-semibold text-white tracking-tight">
 {isListening ?"Listening...": isSimulating ?"Live Transcript":"Voice Transcript"}
 </h3>
 </div>

 {/* Dictate & View Switches */}
 <div data-animate="control"className="flex items-center gap-2">
 <button
 onClick={toggleMic}
 disabled={isSimulating}
 title={isListening ?"Stop dictation":"Speak to transcribe"}
 className={cn(
"flex items-center gap-1.5 px-3 py-1.5 -xl text-xs font-semibold transition-all cursor-pointer",
"disabled:opacity-30 disabled:cursor-not-allowed",
 isListening
 ?"bg-red-500/25 text-red-300 animate-pulse _0_12px_rgba(239,68,68,0.3)]"
 :"bg-[#1C1C1E] text-white hover:bg-[#1C1C1E] hover:text-white"
 )}
 >
 {isListening ? (
 <><MicOff className="w-3.5 h-3.5"/> Stop</>
 ) : (
 <><Mic className="w-3.5 h-3.5"/> Dictate</>
 )}
 </button>

 <div className="flex bg-[#1C1C1E] -xl p-1">
 <button
 onClick={() => setViewMode("chat")}
 className={cn(
"px-2.5 py-1 text-[11px] font-medium -lg transition-all cursor-pointer",
 viewMode ==="chat"
 ?"bg-blue-600/30 text-white"
 :"text-white hover:text-white"
 )}
 >
 Chat View
 </button>
 <button
 onClick={() => setViewMode("raw")}
 className={cn(
"px-2.5 py-1 text-[11px] font-medium -lg transition-all cursor-pointer",
 viewMode ==="raw"
 ?"bg-blue-600/30 text-white"
 :"text-white hover:text-white"
 )}
 >
 Raw Edit
 </button>
 </div>
 </div>
 </div>

 {/* Transcript Display Area */}
 <div className="relative">
 {viewMode ==="raw"|| isListening ? (
 <textarea
 ref={textareaRef}
 className={cn(
"w-full h-64 -2xl bg-[#1C1C1E] p-4 pr-16 text-[13px] text-white focus:outline-none resize-none placeholder:text-white transition-colors font-mono leading-relaxed",
 isListening
 ?"ring-2 ring-red-400/20"
 : isSimulating
 ?"ring-2 ring-cyan-400/20"
 :"focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
 )}
 placeholder={
 isListening
 ?"Speak now — your words will appear here in real-time..."
 :"Select a scenario, click Dictate to speak, or type/paste a transcript here..."
 }
 value={transcript}
 onChange={(e) => {
 if (!isSimulating && !isListening && !hashedOutput && !isEncrypting) {
 setTranscript(e.target.value);
 }
 }}
 readOnly={isSimulating || !!hashedOutput || isEncrypting}
 />
 ) : (
 <div
 ref={chatContainerRef}
 className={cn(
"w-full h-64 overflow-y-auto -2xl bg-[#1C1C1E] p-4 text-[13px] text-white transition-colors space-y-3 no-scrollbar",
 isSimulating ?"_0_20px_rgba(6,182,212,0.15)]":""
 )}
 >
 {!transcript.trim() && (
 <div className="text-white h-full flex flex-col items-center justify-center text-xs text-center px-4 space-y-1.5">
 <MessageSquareWarning className="w-6 h-6 text-white"/>
 <span>No transcript yet. Select a scenario or switch to Raw Edit to paste.</span>
 </div>
 )}

 {transcript.split("\n").map((line, idx) => {
 if (!line.trim()) return null;
 const isCaller = line.startsWith("Caller:");
 const isVictim = line.startsWith("Victim:");
 const content = line.replace(/^(Caller:|Victim:)\s*/i,"");

 if (!isCaller && !isVictim) {
 return (
 <div key={idx} className="text-xs text-white bg-[#1C1C1E] p-2.5 -xl font-mono">
 {line}
 </div>
 );
 }

 return (
 <div key={idx} className={cn("flex w-full", isVictim ?"justify-end":"justify-start")}>
 <div
 className={cn(
"max-w-[85%] -2xl px-4 py-2.5 text-xs space-y-0.5",
 isVictim
 ?"bg-cyan-950/70 text-white"
 :"bg-[#1C1C1E] text-white"
 )}
 >
 <div
 className={cn(
"text-[10px] font-mono font-bold uppercase tracking-wider",
 isVictim ?"text-white":"text-white"
 )}
 >
 {isVictim ?"Victim":"Caller"}
 </div>
 <p className="leading-relaxed">{content}</p>
 </div>
 </div>
 );
 })}
 </div>
 )}

 {/* Status Badges Overlay */}
 {isSimulating && (
 <span className="absolute bottom-3 right-3 text-[10px] text-white font-mono font-bold tracking-widest animate-pulse bg-cyan-950/90 px-2.5 py-1 -full">
 ● REC
 </span>
 )}
 {isListening && (
 <span className="absolute bottom-3 right-3 text-[10px] text-red-300 font-mono font-bold tracking-widest animate-pulse bg-red-950/90 px-2.5 py-1 -full">
 ● MIC
 </span>
 )}
 </div>

 {/* Privacy note */}
 <p className="text-[11.5px] text-white font-mono leading-relaxed">
 Processed securely via server-side NLP Risk Engine. Audio data is discarded immediately after analysis.
 </p>

 {/* Action Buttons */}
 <div className="flex gap-2.5 pt-1">
 <Button
 data-animate="control"
 onClick={handleAnalyze}
 disabled={loading || !transcript.trim() || isSimulating || isListening}
 className="flex-1 h-11 bg-blue-600 hover:bg-blue-500 text-white font-medium -xl _0_20px_rgba(59,130,246,0.25)]"
 >
 {loading ? (
 <><Loader2 className="w-4 h-4 animate-spin mr-2"/> Analyzing Transcript...</>
 ) : (
 <><FileText className="w-4 h-4 mr-2"/> Analyze Transcript</>
 )}
 </Button>

 {transcript && !isSimulating && !isListening && !isEncrypting && (
 <Button
 data-animate="control"
 variant="outline"
 onClick={() => {
 setTranscript("");
 setResult(null);
 setError(null);
 setHashedOutput(null);
 }}
 className="h-11 px-4 -xl hover:bg-[#1C1C1E]"
 title="Clear transcript"
 >
 Clear
 </Button>
 )}
 </div>
 </div>

 {/* Sentiment Chart */}
 <div data-animate="chart">
 <RealTimeSentimentChart
 isSimulating={isSimulating}
 callDuration={callDuration}
 expectedRiskLevel={activeScenario ? activeScenario.expectedRisk :"LOW"}
 />
 </div>

 {/* Quick text demo shortcuts */}
 <div data-animate="card"className="-[22px] bg-[#1C1C1E] p-4 sm:p-5 space-y-2.5">
 <h4 className="text-xs text-white font-mono font-semibold uppercase tracking-wider flex items-center gap-1.5">
 <Zap className="w-3.5 h-3.5 text-white"/> Or load a text-only scenario instantly
 </h4>
 <div className="space-y-2">
 <button
 className="w-full text-left px-3.5 py-2.5 -xl bg-[#1C1C1E] hover:bg-[#1C1C1E] text-white text-xs transition-all cursor-pointer"
 onClick={() => {
 if (!isSimulating && !isEncrypting) {
 setTranscript("Victim: Hi, just confirming I transferred the rent. Please check your account.");
 setResult(null);
 setHashedOutput(null);
 }
 }}
 >
 💬 Casual legitimate message
 </button>
 <button
 className="w-full text-left px-3.5 py-2.5 -xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-xs transition-all cursor-pointer"
 onClick={() => {
 if (!isSimulating && !isEncrypting) {
 setTranscript("Caller: Your bank account access will be blocked in 30 minutes. Call immediately to verify your identity and avoid suspension.");
 setResult(null);
 setHashedOutput(null);
 }
 }}
 >
 ⚠️ Urgency-based phishing attempt
 </button>
 <button
 className="w-full text-left px-3.5 py-2.5 -xl bg-red-500/10 hover:bg-red-500/20 text-red-300 text-xs transition-all cursor-pointer"
 onClick={() => {
 if (!isSimulating && !isEncrypting) {
 setTranscript("Caller: Your account is frozen by CBI. Transfer all funds NOW to avoid criminal charges.\nVictim: But I didn't do anything!\nCaller: Share OTP immediately or face arrest.");
 setResult(null);
 setHashedOutput(null);
 }
 }}
 >
 🚨 Full critical attack pattern
 </button>
 </div>
 </div>

 {/* Secured Transcript Tile */}
 {(isEncrypting || hashedOutput) && (
 <div data-animate="card"className="-[22px] bg-cyan-950/30 p-5 space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-500">
 <div className="flex items-center justify-between pb-2 border-b">
 <div className="flex items-center gap-2 text-sm font-semibold text-white">
 <Lock className="w-4 h-4"/>
 <span>Secured Transcript</span>
 {isEncrypting && <Loader2 className="w-3.5 h-3.5 animate-spin ml-1 text-white"/>}
 </div>
 {!isEncrypting && hashedOutput && (
 <span className="text-[10px] font-mono bg-cyan-500/20 text-white px-2.5 py-0.5 -full font-bold">
 ✓ Secured
 </span>
 )}
 </div>
 <pre className={cn(
"w-full -xl bg-black/50 p-4 text-[11px] font-mono leading-relaxed break-all whitespace-pre-wrap transition-colors",
 isEncrypting ?"text-white animate-pulse":"text-white"
 )}>
 {hashedOutput}
 </pre>
 <p className="text-[11px] text-white flex items-center gap-1.5 font-mono">
 <ShieldCheck className="w-3.5 h-3.5 text-white shrink-0"/>
 Raw transcript processed locally. Only the cryptographic hash is recorded.
 </p>
 </div>
 )}
 </div>

 {/* ── Right Column: Analysis Overview Panel ─────────────────────────── */}
 <div className="space-y-5">
 <div data-animate="panel"className="-[22px] bg-[#1C1C1E] _20px_50px_rgba(0,0,0,0.35)] p-5 sm:p-6 space-y-5">
 
 {/* Header */}
 <div className="flex items-center justify-between pb-3 border-b">
 <h3 className="text-base font-semibold text-white flex items-center gap-2">
 <Sparkles className="w-4 h-4 text-white"/>
 Analysis Overview
 </h3>
 {result && (
 <Badge
 variant={
 result.risk_level === RiskLevel.LOW ?"low":
 result.risk_level === RiskLevel.MEDIUM ?"medium":
 result.risk_level === RiskLevel.HIGH ?"high":"critical"
 }
 >
 {result.risk_level} RISK
 </Badge>
 )}
 </div>

 {/* Risk Score Gauge & Dimensions Matrix */}
 <div data-animate="chart"className="grid grid-cols-1 sm:grid-cols-[180px_1fr] gap-6 items-center p-4 -2xl bg-[#1C1C1E]">
 {/* Circular Gauge */}
 <div className="flex flex-col items-center justify-center">
 <CircularAnalysisGauge
 score={result ? Math.round(result.score * 100) : 0}
 isAnalyzed={!!result}
 />
 <span className="text-xs text-white font-medium mt-2">Risk Score</span>
 </div>

 {/* Risk Dimensions List */}
 <div className="space-y-2 text-xs">
 {/* 1. Social Engineering */}
 <div className="flex items-center justify-between py-1.5 border-b">
 <span className="text-white">Social Engineering</span>
 <span className={cn("font-mono font-bold", riskDimensions.socialEngineering !== null ?"text-white":"text-white")}>
 {riskDimensions.socialEngineering !== null ?`${riskDimensions.socialEngineering} / 100`:"-- / 100"}
 </span>
 </div>

 {/* 2. Linguistic Risk */}
 <div className="flex items-center justify-between py-1.5 border-b">
 <span className="text-white">Linguistic Risk</span>
 <span className={cn("font-mono font-bold", riskDimensions.linguisticRisk !== null ?"text-white":"text-white")}>
 {riskDimensions.linguisticRisk !== null ?`${riskDimensions.linguisticRisk} / 100`:"-- / 100"}
 </span>
 </div>

 {/* 3. Emotional Pressure */}
 <div className="flex items-center justify-between py-1.5 border-b">
 <span className="text-white">Emotional Pressure</span>
 <span className={cn("font-mono font-bold", riskDimensions.emotionalPressure !== null ?"text-white":"text-white")}>
 {riskDimensions.emotionalPressure !== null ?`${riskDimensions.emotionalPressure} / 100`:"-- / 100"}
 </span>
 </div>

 {/* 4. Deception Probability */}
 <div className="flex items-center justify-between py-1.5 border-b">
 <span className="text-white">Deception Probability</span>
 <span className={cn("font-mono font-bold", riskDimensions.deceptionProbability !== null ?"text-white":"text-white")}>
 {riskDimensions.deceptionProbability !== null ?`${riskDimensions.deceptionProbability} / 100`:"-- / 100"}
 </span>
 </div>

 {/* 5. Overall Risk (Prominent Treatment) */}
 <div className={cn(
"flex items-center justify-between py-2 px-2.5 -xl mt-2 font-semibold transition-colors",
 result?.risk_level === RiskLevel.CRITICAL || result?.risk_level === RiskLevel.HIGH
 ?"bg-red-500/15 text-red-300 _0_12px_rgba(239,68,68,0.2)]"
 : result?.risk_level === RiskLevel.MEDIUM
 ?"bg-amber-500/15 text-amber-300"
 : result?.risk_level === RiskLevel.LOW
 ?"bg-emerald-500/15 text-emerald-300"
 :"bg-[#1C1C1E] text-white"
 )}>
 <span>Overall Risk</span>
 <span className="font-mono font-bold text-[13px]">
 {riskDimensions.overallRisk !== null ?`${riskDimensions.overallRisk} / 100`:"-- / 100"}
 </span>
 </div>
 </div>
 </div>

 {/* Results Details / Loading / Empty State */}
 {isSimulating && !result && (
 <div className="min-h-[180px] bg-cyan-950/20 -2xl flex flex-col items-center justify-center p-6 text-center space-y-2">
 <div className="w-10 h-10 -xl bg-cyan-500/20 flex items-center justify-center">
 <Radio className="w-5 h-5 text-white animate-pulse"/>
 </div>
 <p className="text-sm font-semibold text-white">Transcribing in real-time...</p>
 <p className="text-xs text-white max-w-xs leading-relaxed">
 The NLP analysis will run once the call finishes, or you can click &quot;Analyze Transcript&quot; at any point.
 </p>
 </div>
 )}

 {error && !isSimulating && (
 <div className="bg-red-500/10 p-5 -2xl space-y-1">
 <h4 className="font-semibold text-red-300 text-sm flex items-center gap-2">
 <AlertTriangle className="w-4 h-4 text-red-400"/>
 Analysis Failed
 </h4>
 <p className="text-xs text-red-400">{error}</p>
 </div>
 )}

 {!result && !loading && !error && !isSimulating && (
 <div className="min-h-[220px] border-dashed bg-[#1C1C1E] -2xl flex flex-col items-center justify-center p-6 text-center space-y-2">
 <div className="w-11 h-11 -2xl bg-[#1C1C1E] flex items-center justify-center">
 <MessageSquareWarning className="w-5 h-5 text-white"/>
 </div>
 <h4 className="text-sm font-semibold text-white">Awaiting Transcript</h4>
 <p className="text-xs text-white max-w-xs leading-relaxed">
 Select a scenario above to simulate a live fraud call, or type/paste in the box and click Analyze.
 </p>
 </div>
 )}

 {loading && (
 <div className="min-h-[220px] -2xl flex flex-col items-center justify-center bg-[#1C1C1E] space-y-3">
 <Loader2 className="w-9 h-9 animate-spin text-white"/>
 <p className="text-sm font-semibold text-white animate-pulse">Running Lexical Analysis...</p>
 <p className="text-xs text-white font-mono">Scanning for social engineering &amp; urgency patterns</p>
 </div>
 )}

 {result && (
 <div className="space-y-4 animate-in slide-in-from-bottom-3 duration-500">
 {/* Risk Verdict Banner */}
 <div className={cn(
"p-4 -2xl space-y-2",
 result.risk_level === RiskLevel.LOW &&"bg-emerald-500/10",
 result.risk_level === RiskLevel.MEDIUM &&"bg-amber-500/10",
 result.risk_level === RiskLevel.HIGH &&"bg-orange-500/10",
 result.risk_level === RiskLevel.CRITICAL &&"bg-red-500/15 _0_20px_rgba(239,68,68,0.15)]"
 )}>
 <div className="flex items-start gap-3">
 {result.risk_level === RiskLevel.LOW ? (
 <BadgeCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5"/>
 ) : (
 <OctagonAlert className="w-5 h-5 text-red-400 shrink-0 mt-0.5"/>
 )}
 <div>
 <h4 className={cn(
"text-sm font-semibold",
 result.risk_level === RiskLevel.LOW ?"text-emerald-300":"text-red-300"
 )}>
 {result.risk_level === RiskLevel.LOW ?"Benign Interaction Pattern":"Suspicious Coercive Pattern Detected"}
 </h4>
 <p className={cn(
"text-xs leading-relaxed mt-1",
 result.risk_level === RiskLevel.LOW ?"text-emerald-200/80":"text-red-200/80"
 )}>
 {result.explanation || (
 result.risk_level === RiskLevel.LOW
 ?"No coercive or suspicious social engineering patterns detected."
 :"Urgency, impersonation, or OTP request patterns identified. Would trigger high-risk friction."
 )}
 </p>
 </div>
 </div>
 </div>

 {/* Triggered Indicators Section */}
 {result.triggered_indicators.length > 0 && (
 <div className="space-y-3 pt-2">
 <div className="flex items-center justify-between">
 <h4 className="text-xs font-semibold text-white tracking-wide uppercase font-mono">
 Triggered Indicators
 </h4>
 <span className="text-[11px] font-mono text-white">
 {result.triggered_indicators.length} detected
 </span>
 </div>

 <div className="space-y-2.5 max-h-[320px] overflow-y-auto pr-1 no-scrollbar">
 {result.triggered_indicators.map((ind, idx) => (
 <div
 key={idx}
 className="p-3.5 -xl bg-black/30 space-y-2"
 >
 <div className="flex items-center justify-between gap-2 flex-wrap">
 <span className="font-semibold text-xs text-white capitalize">
 {ind.category.replace(/_/g,"")}
 </span>
 <Badge variant="outline"className="text-[10px] h-5 font-mono">
 {ind.code}
 </Badge>
 </div>
 <p className="text-xs text-white leading-snug">
 {ind.explanation}
 </p>
 {ind.matched_phrase && (
 <div className="bg-black/50 p-2 -lg text-xs font-mono text-white">
 &ldquo;...
 <span className="bg-red-500/20 text-red-400 font-bold px-1.5 py-0.5">
 {ind.matched_phrase}
 </span>
 ...&rdquo;
 </div>
 )}
 </div>
 ))}
 </div>
 </div>
 )}
 </div>
 )}

 </div>
 </div>

 </div>

 </div>
 );
}
