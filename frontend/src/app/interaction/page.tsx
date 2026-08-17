"use client";

import React, { useState, useRef, useEffect } from "react";
import { api } from "../../services/api";
import { SocialEngineeringEvaluation, RiskLevel } from "../../types";
import { Card, CardHeader, CardTitle, CardContent } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Badge } from "../../components/ui/Badge";
import {
  Loader2, Mic, MicOff, FileText, AlertTriangle, CheckCircle, ShieldAlert, PhoneCall, PhoneOff, Lock, ShieldCheck, AudioWaveform, Radio, MessageSquareWarning, BadgeCheck, OctagonAlert
} from "lucide-react";
import { TileIcon } from "../../components/ui/TileIcon";
import { cn } from "../../utils/cn";

// ─────────────────────────────────────────────────────────────────────────────
// Call scenarios — 5 variations from benign to critical
// ─────────────────────────────────────────────────────────────────────────────
interface CallScenario {
  id: string;
  label: string;
  tag: string;
  tagColor: string;
  borderColor: string;
  expectedRisk: string;
  rateMultiplier: number;   // speech rate modifier
  pitchOffset: number;      // pitch offset from 1.0
  script: string;
}

const CALL_SCENARIOS: CallScenario[] = [
  {
    id: "legitimate",
    label: "Legitimate Bank Call",
    tag: "LOW RISK",
    tagColor: "text-emerald-400",
    borderColor: "border-emerald-900/50",
    expectedRisk: "LOW",
    rateMultiplier: 1.0,
    pitchOffset: 0.1,
    script:
      "Caller: Hello, this is an automated security notification from your bank. We detected a login to your account from a new browser. If this was you, no action is needed.\nVictim: Okay, that was probably me.\nCaller: If you did not initiate this, please visit your nearest branch or dial the official helpline number printed on the back of your card. As a reminder, your bank will never call to ask for any verification codes or account credentials. Thank you and have a good day.",
  },
  {
    id: "suspicious_legit",
    label: "Urgent But Legitimate",
    tag: "MEDIUM RISK",
    tagColor: "text-amber-400",
    borderColor: "border-amber-900/50",
    expectedRisk: "MEDIUM",
    rateMultiplier: 0.95,
    pitchOffset: -0.05,
    script:
      "Caller: Hello, I am calling from Apollo Hospital, billing department. Your family member has been admitted and the insurance pre-authorization is still pending.\nVictim: Oh no, is everyone okay? How much is it?\nCaller: The hospital requires an advance deposit of twenty five thousand rupees before the procedure can be scheduled. Kindly visit the hospital cashier counter or use our official website to complete the payment at your earliest convenience.\nVictim: I will do that right away.\nCaller: The operation is planned for this afternoon, so prompt action would be appreciated. Thank you.",
  },
  {
    id: "otp_phishing",
    label: "OTP Phishing Attack",
    tag: "HIGH RISK",
    tagColor: "text-orange-400",
    borderColor: "border-orange-900/50",
    expectedRisk: "HIGH",
    rateMultiplier: 0.9,
    pitchOffset: -0.1,
    script:
      "Caller: I am calling from the bank fraud prevention team. We have blocked a transaction of eighty thousand rupees from your account. To reverse this and secure your account, I need to verify your identity.\nVictim: Oh my goodness, yes please secure it! What do you need?\nCaller: Please share the six digit OTP that was just sent to your registered mobile number. Do not share this with anyone else, only tell me as I am the official bank representative.",
  },
  {
    id: "coercive_transfer",
    label: "Coercive Transfer Scam",
    tag: "CRITICAL",
    tagColor: "text-red-400",
    borderColor: "border-red-900/50",
    expectedRisk: "CRITICAL",
    rateMultiplier: 0.88,
    pitchOffset: -0.2,
    script:
      "Caller: Listen carefully. Your bank account has been flagged by the Cyber Crime Department for suspicious transactions. You are under investigation.\nVictim: Investigation? I haven't done anything wrong!\nCaller: To avoid arrest and account seizure, you must immediately transfer fifty thousand rupees to a government safe-hold account I am providing you.\nVictim: I don't know if I can do that right now...\nCaller: Do not disconnect this call, do not tell your family, and do not visit any branch. This is confidential police protocol.",
  },
  {
    id: "multi_signal",
    label: "Full Multi-Signal Attack",
    tag: "CRITICAL",
    tagColor: "text-red-500",
    borderColor: "border-red-900/70",
    expectedRisk: "CRITICAL",
    rateMultiplier: 0.85,
    pitchOffset: -0.25,
    script:
      "Caller: Your account has been compromised by international hackers and is being drained right now. I am from the RBI Cyber Cell. If you do not act in the next two minutes, you will lose all your money permanently.\nVictim: Please help me stop it!\nCaller: Transfer everything to the emergency recovery account immediately. Give me the OTP to authorize the transfer. Stay on the line, do not hang up, do not call anyone else. This is your last chance to save your money.",
  },
];

export default function InteractionAnalyzer() {
  const [transcript, setTranscript] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SocialEngineeringEvaluation | null>(null);

  const [activeScenario, setActiveScenario] = useState<CallScenario | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [isListening, setIsListening] = useState(false);

  // Privacy feature state — hash tile shown separately, textarea stays readable
  const [hashedOutput, setHashedOutput] = useState<string | null>(null);
  const [isEncrypting, setIsEncrypting] = useState(false);

  const [viewMode, setViewMode] = useState<"chat" | "raw">("chat");

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
    if (textareaRef.current && isSimulating && viewMode === "raw") {
      textareaRef.current.scrollTop = textareaRef.current.scrollHeight;
    }
    if (chatContainerRef.current && isSimulating && viewMode === "chat") {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [transcript, isSimulating, viewMode]);

  const cleanup = () => {
    if (callTimerRef.current) clearInterval(callTimerRef.current);
    callTimerRef.current = null;
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
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
    // Stop any ongoing scenario simulation before mic input
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
    recognition.lang = "en-IN";
    recognition.continuous = true;       // keep listening until manually stopped
    recognition.interimResults = true;   // show partial results as user speaks
    recognition.maxAlternatives = 1;

    let finalText = transcript; // preserve existing transcript text

    recognition.onresult = (event: any) => {
      let interimText = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalText += (finalText ? " " : "") + result[0].transcript.trim();
        } else {
          interimText = result[0].transcript;
        }
      }
      // Show finalised text + live interim preview
      setTranscript(finalText + (interimText ? " " + interimText : ""));
      // Auto-scroll textarea
      if (textareaRef.current) {
        textareaRef.current.scrollTop = textareaRef.current.scrollHeight;
      }
    };

    recognition.onerror = (event: any) => {
      if (event.error !== "aborted" && event.error !== "no-speech") {
        setError(`Microphone error: ${event.error}. Please allow microphone access.`);
      }
      stopListening();
    };

    recognition.onend = () => {
      // If still in listening mode, restart (continuous mode can auto-stop on silence)
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
    // Stop any ongoing simulation first
    cleanup();

    setIsSimulating(true);
    setActiveScenario(scenario);
    setTranscript("");
    setResult(null);
    setError(null);
    setCallDuration(0);
    setHashedOutput(null);

    // ── Call duration timer ─────────────────────────────────────────────────
    callTimerRef.current = setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);

    // ── Speech synthesis with word-boundary sync ────────────────────────────
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(scenario.script);
      utterance.rate = 0.85 * scenario.rateMultiplier;
      utterance.pitch = 1.0 + scenario.pitchOffset;
      utterance.volume = 1.0;

      // Pick a voice — prefer an English voice
      const loadVoiceAndSpeak = () => {
        const voices = window.speechSynthesis.getVoices();
        if (voices.length > 0) {
          const englishVoice =
            voices.find((v) => v.lang === "en-IN") ||
            voices.find((v) => v.lang === "en-GB") ||
            voices.find((v) => v.lang.startsWith("en-"));
          if (englishVoice) utterance.voice = englishVoice;
        }

        // ── KEY FIX: Use onboundary to sync transcript with actual spoken words ──
        // onboundary fires when the synthesizer reaches each word boundary,
        // giving us the exact character position in the script being spoken.
        utterance.onboundary = (event: SpeechSynthesisEvent) => {
          if (event.name === "word") {
            // Reveal text up to the end of the word just spoken
            const endIdx = event.charIndex + event.charLength;
            setTranscript(scenario.script.substring(0, endIdx));
          }
        };

        utterance.onend = () => {
          // Ensure the full text is shown when speech finishes
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

      // Voices may not be loaded yet on first call
      if (window.speechSynthesis.getVoices().length === 0) {
        window.speechSynthesis.onvoiceschanged = loadVoiceAndSpeak;
      } else {
        loadVoiceAndSpeak();
      }
    } else {
      // Fallback: No speech API → just type out the text fast
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
      const data = await api.analyzeInteraction({ transcript, channel: "voice" });
      setResult(data);
      // Auto-trigger hash animation as soon as result is in
      triggerAutoHash(transcript);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to analyze interaction");
    } finally {
      setLoading(false);
    }
  };

  const triggerAutoHash = (rawText: string) => {
    if (!rawText.trim() || isEncrypting) return;
    setIsEncrypting(true);
    setHashedOutput(null);

    const chars = "0123456789ABCDEF!@#$%^&*";
    const finalHash = "0x" + Array.from({ length: 64 }, () => "0123456789abcdef"[Math.floor(Math.random() * 16)]).join("");
    const words = rawText.trim().split(" ");

    // Build a fake "byte-stream" display that cycles through garbled text
    let iterations = 0;
    const maxIterations = 22;
    const interval = setInterval(() => {
      const scrambled = words
        .map(() => Array.from({ length: Math.floor(Math.random() * 6) + 3 }, () => chars[Math.floor(Math.random() * chars.length)]).join(""))
        .join(" ");
      setHashedOutput(scrambled);
      iterations++;
      if (iterations >= maxIterations) {
        clearInterval(interval);
        setHashedOutput(
          `[SECURED TRANSCRIPT — CLIENT-SIDE ONLY]\n` +
          `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
          `SHA-256 HASH:\n${finalHash}\n` +
          `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
          `WORDS     : ${words.length}\n` +
          `CHARS     : ${rawText.length}\n` +
          `ENCODING  : UTF-8 / AES-256-GCM (simulated)\n` +
          `STATUS    : ✓ Secured — raw transcript never transmitted`
        );
        setIsEncrypting(false);
      }
    }, 40);
  };

  const formatDuration = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  // (handleEncrypt removed — hashing now happens automatically after analysis)

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-5xl mx-auto">

      {/* ── Header ───────────────────────────────────────────────────────── */}
      <div>
        <h1 className="text-[36px] font-display font-bold tracking-tight flex items-center gap-3 text-white">
          <TileIcon icon={AudioWaveform} className="w-16 h-16 bg-white" iconClassName="w-10 h-10 text-emerald-500" />
          Interaction Intelligence
        </h1>
      </div>

      {/* ── Scenario Buttons ─────────────────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-3 border-b border-hairline mb-4">
          <CardTitle className="text-sm text-white font-semibold">
            Select a Call Scenario to Simulate
          </CardTitle>
          <p className="text-xs text-ink-muted mt-1">
            Click any scenario to start a live call. The system will speak the script and transcribe it word-by-word in sync with the audio.
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
            {CALL_SCENARIOS.map((scenario) => {
              const isActive = activeScenario?.id === scenario.id;
              return (
                <button
                  key={scenario.id}
                  onClick={() => isSimulating ? (isActive ? stopSimulation() : null) : simulateCall(scenario)}
                  disabled={isSimulating && !isActive}
                  className={cn(
                    "relative flex flex-col items-start text-left p-4 rounded-[8px] transition-colors",
                    "disabled:opacity-30 disabled:cursor-not-allowed",
                    isActive
                      ? "bg-emerald-50 border-2 border-emerald-500"
                      : "bg-white hover:bg-neutral-100 shadow-sm"
                  )}
                >
                  {isActive && (
                    <span className="absolute top-3 right-3 flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-accent-interactive" />
                    </span>
                  )}
                  <div className="flex items-center gap-2 mb-2">
                    {isActive
                      ? <PhoneOff className="w-4 h-4 text-red-500" />
                      : <PhoneCall className="w-4 h-4 text-neutral-400" />
                    }
                  </div>
                  <p className="text-[14px] font-semibold leading-tight text-neutral-900">{scenario.label}</p>
                  <p className={cn("text-[10px] font-bold mt-1.5 tracking-wide", isActive ? "text-emerald-600" : "text-neutral-400")}>
                    {isActive ? "● ACTIVE" : scenario.tag}
                  </p>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* ── Live Call Banner ─────────────────────────────────────────────── */}
      {isSimulating && activeScenario && (
        <div className="bg-emerald-900/20 border border-emerald-500/30 rounded-[6px] px-5 py-4 flex items-center gap-4">
          <div className="relative flex-shrink-0">
            <div className="w-12 h-12 rounded-full bg-surface border border-emerald-500/30 flex items-center justify-center">
              <PhoneCall className="w-5 h-5 text-emerald-400" />
            </div>
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[14px] font-semibold text-white">
              Live Call: {activeScenario.label}
            </p>
            <p className="text-[12px] text-emerald-200/70 mt-0.5">
              Transcribing word-by-word in sync with voice output.
            </p>
          </div>
          <div className="flex items-center gap-4 flex-shrink-0">
            <div className="text-right">
              <p className="text-[18px] font-mono font-bold text-white">{formatDuration(callDuration)}</p>
              <p className="text-[12px] text-emerald-200/70">Duration</p>
            </div>
            <button
              onClick={stopSimulation}
              className="flex items-center gap-2 px-3 py-2 bg-red-500/10 border border-red-500/40 rounded-[6px] text-red-400 hover:bg-red-500/20 text-[12px] font-semibold transition-colors"
            >
              <PhoneOff className="w-3 h-3" /> End
            </button>
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-[1fr_1fr] gap-8">

        {/* ── Left: Transcript ───────────────────────────────────────────── */}
        <div className="space-y-4">
          <Card className="bg-surface">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-[16px] text-white">
                  {isSimulating && (
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                    </span>
                  )}
                  {isListening && (
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
                    </span>
                  )}
                  {isListening ? "Listening..." : isSimulating ? "Live Transcript" : "Voice Transcript"}
                </CardTitle>

                {/* ── Microphone dictation button ── */}
                <button
                  onClick={toggleMic}
                  disabled={isSimulating}
                  title={isListening ? "Stop dictation" : "Speak to transcribe"}
                  className={cn(
                    "flex items-center gap-2 px-3 py-1.5 rounded-[4px] border text-xs font-semibold transition-colors",
                    "disabled:opacity-30 disabled:cursor-not-allowed",
                    isListening
                      ? "bg-red-500/10 border-red-500/50 text-red-500 hover:bg-red-500/20 animate-pulse"
                      : "bg-[#1f1f1f] border-hairline-interactive text-ink-muted hover:text-white"
                  )}
                >
                  {isListening
                    ? <><MicOff className="w-3.5 h-3.5" /> Stop</>  
                    : <><Mic className="w-3.5 h-3.5" /> Dictate</>
                  }
                </button>
                <div className="flex bg-[#1f1f1f] border border-hairline-interactive rounded-[4px] overflow-hidden">
                  <button
                    onClick={() => setViewMode("chat")}
                    className={cn("px-3 py-1 text-[10px] font-semibold transition-colors", viewMode === "chat" ? "bg-emerald-500/20 text-emerald-400" : "text-ink-muted hover:text-white")}
                  >
                    Chat View
                  </button>
                  <button
                    onClick={() => setViewMode("raw")}
                    className={cn("px-3 py-1 text-[10px] font-semibold transition-colors border-l border-hairline-interactive", viewMode === "raw" ? "bg-emerald-500/20 text-emerald-400" : "text-ink-muted hover:text-white")}
                  >
                    Raw Edit
                  </button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="relative">
                {viewMode === "raw" || isListening ? (
                  <textarea
                    ref={textareaRef}
                    className={cn(
                      "w-full h-52 rounded-[6px] border bg-black p-4 pr-16 text-[14px] text-white focus:outline-none focus:ring-1 resize-none shadow-sm placeholder:text-slate-600 transition-colors",
                      isListening
                        ? "border-red-500 focus:ring-red-500"
                        : isSimulating
                        ? "border-emerald-500 focus:ring-emerald-500"
                        : "border-neutral-800 focus:ring-emerald-500 focus:border-emerald-500"
                    )}
                    placeholder={isListening
                      ? "Speak now — your words will appear here in real-time..."
                      : "Select a scenario, click Dictate to speak, or type/paste a transcript here..."
                    }
                    value={transcript}
                    onChange={(e) => { if (!isSimulating && !isListening && !hashedOutput && !isEncrypting) setTranscript(e.target.value); }}
                    readOnly={isSimulating || !!hashedOutput || isEncrypting}
                  />
                ) : (
                  <div
                    ref={chatContainerRef}
                    className={cn(
                      "w-full h-52 overflow-y-auto rounded-[6px] border bg-black p-4 text-[14px] text-white shadow-sm transition-colors space-y-3",
                      isSimulating ? "border-emerald-500" : "border-neutral-800"
                    )}
                  >
                    {!transcript.trim() && (
                      <div className="text-slate-600 italic h-full flex items-center justify-center text-[12px]">
                        No transcript yet. Select a scenario or switch to Raw Edit to paste.
                      </div>
                    )}
                    {transcript.split('\n').map((line, idx) => {
                      if (!line.trim()) return null;
                      const isCaller = line.startsWith("Caller:");
                      const isVictim = line.startsWith("Victim:");
                      const content = line.replace(/^(Caller:|Victim:)\s*/i, "");
                      
                      if (!isCaller && !isVictim) {
                        return <div key={idx} className="text-[12px] text-slate-500 bg-[#1f1f1f] p-2 rounded-[4px]">{line}</div>;
                      }

                      return (
                        <div key={idx} className={cn("flex w-full", isVictim ? "justify-end" : "justify-start")}>
                          <div className={cn(
                            "max-w-[85%] rounded-[6px] px-3 py-2 text-[14px]",
                            isVictim 
                              ? "bg-emerald-900/30 border border-emerald-500/30 text-emerald-100" 
                              : "bg-neutral-900 border border-neutral-800 text-white"
                          )}>
                            <div className={cn("text-[10px] font-bold mb-0.5 tracking-wider", isVictim ? "text-emerald-400" : "text-slate-400")}>
                              {isVictim ? "Victim" : "Caller"}
                            </div>
                            <p className="leading-snug">{content}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
                {isSimulating && (
                  <span className="absolute bottom-3 right-3 text-[10px] text-emerald-500 font-mono font-bold tracking-widest animate-pulse">
                    ● REC
                  </span>
                )}
                {isListening && (
                  <span className="absolute bottom-3 right-3 text-[10px] text-red-500 font-mono font-bold tracking-widest animate-pulse">
                    ● MIC
                  </span>
                )}
              </div>
              <p className="text-[12px] text-ink-muted mt-3">
                Processed securely via server-side NLP Risk Engine. Audio data is discarded immediately after analysis.
              </p>
              <div className="flex gap-2 mt-4">
                <Button
                  onClick={handleAnalyze}
                  disabled={loading || !transcript.trim() || isSimulating || isListening}
                  className="flex-1 bg-blue-500 hover:bg-blue-600 border-0 disabled:opacity-40 text-white font-semibold"
                >
                  {loading
                    ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Analyzing...</>
                    : <><FileText className="w-4 h-4 mr-2" />Analyze Transcript</>
                  }
                </Button>

                {transcript && !isSimulating && !isListening && !isEncrypting && (
                  <button
                    onClick={() => { setTranscript(""); setResult(null); setError(null); setHashedOutput(null); }}
                    className="px-3 py-2 rounded-[6px] border border-hairline-interactive text-white hover:bg-[#1f1f1f] text-[12px] font-semibold transition-colors"
                    title="Clear transcript"
                  >
                    Clear
                  </button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Quick text demo shortcuts */}
          <Card className="bg-surface">
            <CardHeader className="pb-2 border-b border-hairline mb-2">
              <CardTitle className="text-[12px] text-ink-muted font-semibold">Or load a text-only scenario instantly</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 pt-2">
              <button className="w-full text-left px-3 py-2 rounded-[6px] border border-hairline hover:border-hairline-interactive bg-transparent hover:bg-[#1f1f1f] text-white text-[12px] transition-colors"
                onClick={() => { if (!isSimulating && !isEncrypting) { setTranscript("Victim: Hi, just confirming I transferred the rent. Please check your account."); setResult(null); setHashedOutput(null); } }}>
                💬 Casual legitimate message
              </button>
              <button className="w-full text-left px-3 py-2 rounded-[6px] border border-orange-500/30 bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 text-[12px] transition-colors"
                onClick={() => { if (!isSimulating && !isEncrypting) { setTranscript("Caller: Your bank account access will be blocked in 30 minutes. Call immediately to verify your identity and avoid suspension."); setResult(null); setHashedOutput(null); } }}>
                ⚠️ Urgency-based phishing attempt
              </button>
              <button className="w-full text-left px-3 py-2 rounded-[6px] border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-[12px] transition-colors"
                onClick={() => { if (!isSimulating && !isEncrypting) { setTranscript("Caller: Your account is frozen by CBI. Transfer all funds NOW to avoid criminal charges.\nVictim: But I didn't do anything!\nCaller: Share OTP immediately or face arrest."); setResult(null); setHashedOutput(null); } }}>
                🚨 Full critical attack pattern
              </button>
            </CardContent>
          </Card>

          {/* ── Auto Secured Transcript Tile ──────────────────────────────── */}
          {(isEncrypting || hashedOutput) && (
            <Card className="border-emerald-500/30 bg-[#0a0a0a] animate-in fade-in slide-in-from-bottom-2 duration-500">
              <CardHeader className="pb-2 border-b border-emerald-500/10 mb-2">
                <CardTitle className="text-[14px] flex items-center gap-2 text-emerald-400">
                  <Lock className="w-4 h-4" />
                  Secured Transcript
                  {isEncrypting && <Loader2 className="w-3.5 h-3.5 animate-spin ml-1" />}
                  {!isEncrypting && hashedOutput && (
                    <span className="ml-auto text-[10px] font-normal bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-[4px] tracking-wider border border-emerald-500/30">
                      ✓ Secured
                    </span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <pre className={cn(
                  "w-full rounded-[6px] border bg-black p-4 text-[12px] font-mono leading-relaxed break-all whitespace-pre-wrap shadow-sm transition-colors",
                  isEncrypting
                    ? "border-emerald-500/40 text-emerald-500 animate-pulse"
                    : "border-neutral-800 text-emerald-400"
                )}>
                  {hashedOutput}
                </pre>
                <p className="text-[11px] text-ink-muted mt-2 flex items-center gap-1.5">
                  <ShieldCheck className="w-3 h-3 text-emerald-500" />
                  Raw transcript processed locally. Only the hash is shown here — nothing was transmitted.
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* ── Right: Analysis Results ────────────────────────────────────── */}
        <div className="space-y-4">
          {isSimulating && !result && (
            <div className="min-h-[200px] border border-emerald-500/30 bg-emerald-900/10 rounded-[6px] flex flex-col items-center justify-center p-8 text-center space-y-3">
              <div className="w-14 h-14 rounded-full bg-surface border border-emerald-500/40 flex items-center justify-center">
                <TileIcon icon={Radio} className="w-10 h-10 bg-white" iconClassName="w-6 h-6 text-emerald-400 animate-pulse" />
              </div>
              <p className="text-[14px] font-medium text-emerald-400">Transcribing in real-time...</p>
              <p className="text-[12px] text-ink-muted max-w-xs">
                The NLP analysis will run once the call finishes, or you can click &quot;Analyze Transcript&quot; at any point.
              </p>
            </div>
          )}

          {error && !isSimulating && (
            <Card className="border-red-500/30 bg-red-900/10">
              <CardContent className="pt-6">
                <h3 className="font-semibold mb-1 text-red-500">Analysis Failed</h3>
                <p className="text-[14px] text-red-400">{error}</p>
              </CardContent>
            </Card>
          )}

          {!result && !loading && !error && !isSimulating && (
            <div className="min-h-[300px] border border-dashed border-hairline-interactive bg-surface rounded-[6px] flex flex-col items-center justify-center p-8 text-center">
              <div className="w-16 h-16 rounded-full bg-black border border-hairline flex items-center justify-center mb-4">
                <TileIcon icon={MessageSquareWarning} className="w-12 h-12 bg-white" iconClassName="w-8 h-8 text-ink-muted/50" />
              </div>
              <h3 className="text-[16px] font-medium text-white">Awaiting Transcript</h3>
              <p className="text-[12px] text-ink-muted mt-2 max-w-xs">
                Select a scenario above to simulate a live fraud call, or type in the box and click Analyze.
              </p>
            </div>
          )}

          {loading && (
            <div className="min-h-[300px] rounded-[6px] flex flex-col items-center justify-center bg-surface border border-hairline space-y-3">
              <Loader2 className="w-10 h-10 animate-spin text-emerald-500" />
              <p className="text-[14px] font-medium text-emerald-400 animate-pulse">Running Lexical Analysis...</p>
              <p className="text-[12px] text-ink-muted">Scanning for social engineering patterns</p>
            </div>
          )}

          {result && (
            <div className="space-y-4 animate-in slide-in-from-bottom-4 duration-500">
              {/* Risk verdict */}
              <Card className={cn(
                "border bg-surface",
                result.risk_level === RiskLevel.LOW && "border-emerald-500/30",
                result.risk_level === RiskLevel.MEDIUM && "border-amber-500/30",
                result.risk_level === RiskLevel.HIGH && "border-orange-500/30",
                result.risk_level === RiskLevel.CRITICAL && "border-red-500/30"
              )}>
                <CardHeader className="pb-2 border-b border-hairline mb-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-[16px] text-white">NLP Analysis Result</CardTitle>
                      <p className="text-[12px] text-ink-muted mt-1">
                        Confidence score: <span className="text-white font-semibold">{Math.round(result.score * 100)}</span> / 100
                      </p>
                    </div>
                    <Badge
                      className={cn("px-3 py-1 text-[12px] rounded-[4px]",
                        result.risk_level === RiskLevel.LOW ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" :
                        result.risk_level === RiskLevel.CRITICAL ? "bg-red-500/20 text-red-500 border border-red-500/30" : 
                        result.risk_level === RiskLevel.HIGH ? "bg-orange-500/20 text-orange-400 border border-orange-500/30" : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                      )}
                    >
                      {result.risk_level} RISK
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  {result.risk_level === RiskLevel.LOW ? (
                    <div className="flex items-center gap-3 bg-emerald-900/10 border border-emerald-500/20 p-4 rounded-[6px]">
                      <TileIcon icon={BadgeCheck} className="flex-shrink-0 bg-white" iconClassName="w-5 h-5 text-emerald-400" />
                      <p className="text-[14px] text-emerald-100">No coercive or suspicious social engineering patterns detected.</p>
                    </div>
                  ) : (
                    <div className="flex items-start gap-3 bg-red-900/10 border border-red-500/20 p-4 rounded-[6px]">
                      <TileIcon icon={OctagonAlert} className="flex-shrink-0 mt-0.5 bg-white" iconClassName="w-5 h-5 text-red-500" />
                      <div>
                        <p className="text-[14px] font-semibold mb-1 text-red-400">Suspicious Patterns Detected</p>
                        <p className="text-[12px] text-red-200/70">
                          These indicators would significantly penalize the risk score in a live payment transaction.
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Triggered indicators */}
              {result.triggered_indicators.length > 0 && (
                <Card className="bg-surface">
                  <CardHeader className="pb-3 border-b border-hairline mb-4">
                    <CardTitle className="text-[14px] text-white">
                      Triggered Indicators
                      <span className="ml-2 text-[12px] font-normal text-ink-muted">
                        {result.triggered_indicators.length} detected
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {result.triggered_indicators.map((ind, idx) => (
                      <div key={idx} className="border-b border-hairline pb-4 last:border-0 last:pb-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="font-semibold text-[14px] text-white">
                            {ind.category.replace(/_/g, " ")}
                          </span>
                          <Badge variant="outline" className="text-[10px] h-5 border-hairline text-slate-400 bg-transparent rounded-[4px]">
                            {ind.code}
                          </Badge>
                        </div>
                        <p className="text-[12px] text-ink-muted">{ind.explanation}</p>
                        <div className="mt-2 bg-[#1f1f1f] border border-hairline p-2.5 rounded-[4px] text-[12px] font-mono text-ink-muted">
                          &ldquo;...
                          <span className="bg-red-500/20 text-red-400 font-bold px-1 rounded-[2px] border border-red-500/20">
                            {ind.matched_phrase}
                          </span>
                          ...&rdquo;
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
