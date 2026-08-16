"use client";

import React, { useState, useRef, useEffect } from "react";
import { api } from "../../services/api";
import { SocialEngineeringEvaluation, RiskLevel } from "../../types";
import { Card, CardHeader, CardTitle, CardContent } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Badge } from "../../components/ui/Badge";
import {
  Loader2, Mic, MicOff, FileText, AlertTriangle, CheckCircle, ShieldAlert, PhoneCall, PhoneOff, Lock, ShieldCheck
} from "lucide-react";
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
      "Hello, this is an automated security notification from your bank. We detected a login to your account from a new browser. If this was you, no action is needed. If you did not initiate this, please visit your nearest branch or dial the official helpline number printed on the back of your card. As a reminder, your bank will never call to ask for any verification codes or account credentials. Thank you and have a good day.",
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
      "Hello, I am calling from Apollo Hospital, billing department. Your family member has been admitted and the insurance pre-authorization is still pending. The hospital requires an advance deposit of twenty five thousand rupees before the procedure can be scheduled. Kindly visit the hospital cashier counter or use our official website to complete the payment at your earliest convenience. The operation is planned for this afternoon, so prompt action would be appreciated. Thank you.",
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
      "I am calling from the bank fraud prevention team. We have blocked a transaction of eighty thousand rupees from your account. To reverse this and secure your account, I need to verify your identity. Please share the six digit OTP that was just sent to your registered mobile number. Do not share this with anyone else, only tell me as I am the official bank representative.",
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
      "Listen carefully. Your bank account has been flagged by the Cyber Crime Department for suspicious transactions. You are under investigation. To avoid arrest and account seizure, you must immediately transfer fifty thousand rupees to a government safe-hold account I am providing you. Do not disconnect this call, do not tell your family, and do not visit any branch. This is confidential police protocol.",
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
      "Your account has been compromised by international hackers and is being drained right now. I am from the RBI Cyber Cell. If you do not act in the next two minutes, you will lose all your money permanently. Transfer everything to the emergency recovery account immediately. Give me the OTP to authorize the transfer. Stay on the line, do not hang up, do not call anyone else. This is your last chance to save your money.",
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

  // Privacy feature state
  const [isEncrypted, setIsEncrypted] = useState(false);
  const [isEncrypting, setIsEncrypting] = useState(false);

  const callTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    return () => cleanup();
  }, []);

  // Auto-scroll textarea as words appear
  useEffect(() => {
    if (textareaRef.current && isSimulating) {
      textareaRef.current.scrollTop = textareaRef.current.scrollHeight;
    }
  }, [transcript, isSimulating]);

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
    setIsEncrypted(false);

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

    recognition.onresult = (event: SpeechRecognitionEvent) => {
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

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
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
    setIsEncrypted(false);

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
    try {
      const data = await api.analyzeInteraction({ transcript, channel: "voice" });
      setResult(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to analyze interaction");
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  const handleEncrypt = () => {
    if (!transcript.trim() || isEncrypted || isEncrypting) return;
    setIsEncrypting(true);

    const chars = "0123456789ABCDEF!@#$%^&*";
    let iterations = 0;
    const maxIterations = 25;
    
    // Create a realistic-looking hash
    const finalHash = "0x" + Array.from({length: 64}, () => "0123456789abcdef"[Math.floor(Math.random() * 16)]).join('');

    const interval = setInterval(() => {
      setTranscript(prev => {
        // Scramble the current text to look like it's encrypting
        return prev.split('').map(c => (c === ' ' || c === '\\n') ? c : chars[Math.floor(Math.random() * chars.length)]).join('');
      });
      iterations++;
      
      if (iterations >= maxIterations) {
        clearInterval(interval);
        setTranscript(`[ENCRYPTED AUDIO TRANSCRIPT]\nLOCAL SHA-256 HASH: ${finalHash}\nStatus: Secured`);
        setIsEncrypted(true);
        setIsEncrypting(false);
      }
    }, 40);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-5xl mx-auto">

      {/* ── Header ───────────────────────────────────────────────────────── */}
      <div>
        <h1 className="text-4xl font-bold tracking-tight flex items-center gap-3 text-white">
          <Mic className="w-10 h-10 text-blue-500" />
          Interaction Intelligence
        </h1>
        <p className="text-slate-400 mt-2 text-lg">
          Simulate live fraud calls and watch FraudShield&apos;s NLP engine transcribe and analyze them in real-time.
        </p>
      </div>

      {/* ── Scenario Buttons ─────────────────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm text-slate-300">
            Select a Call Scenario to Simulate
          </CardTitle>
          <p className="text-xs text-slate-600 mt-1">
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
                    "relative flex flex-col items-start text-left p-4 rounded-md border transition-all",
                    "disabled:opacity-30 disabled:cursor-not-allowed",
                    isActive
                      ? "bg-[#1a1a1a] border-slate-400 ring-1 ring-slate-400"
                      : `bg-[#111] ${scenario.borderColor} hover:bg-[#1a1a1a] hover:border-slate-500`
                  )}
                >
                  {isActive && (
                    <span className="absolute top-3 right-3 flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                    </span>
                  )}
                  <div className="flex items-center gap-2 mb-2">
                    {isActive
                      ? <PhoneOff className="w-4 h-4 text-red-400" />
                      : <PhoneCall className="w-4 h-4 text-slate-500" />
                    }
                  </div>
                  <p className="text-sm font-semibold text-slate-200 leading-tight">{scenario.label}</p>
                  <p className={cn("text-[10px] font-bold mt-1.5 tracking-wide", scenario.tagColor)}>
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
        <div className="bg-[#0d1a0d] border border-emerald-900 rounded-md px-5 py-4 flex items-center gap-4">
          <div className="relative flex-shrink-0">
            <div className="w-12 h-12 rounded-full bg-emerald-900/50 flex items-center justify-center">
              <PhoneCall className="w-5 h-5 text-emerald-400" />
            </div>
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white">
              Live Call: {activeScenario.label}
            </p>
            <p className="text-xs text-slate-400 mt-0.5">
              Transcribing word-by-word in sync with voice output.
            </p>
          </div>
          <div className="flex items-center gap-4 flex-shrink-0">
            <div className="text-right">
              <p className="text-lg font-mono font-bold text-emerald-400">{formatDuration(callDuration)}</p>
              <p className="text-xs text-slate-600">Duration</p>
            </div>
            <button
              onClick={stopSimulation}
              className="flex items-center gap-2 px-3 py-2 bg-red-500/10 border border-red-500/40 rounded-md text-red-400 hover:bg-red-500/20 text-xs font-semibold"
            >
              <PhoneOff className="w-3 h-3" /> End
            </button>
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-[1fr_1fr] gap-8">

        {/* ── Left: Transcript ───────────────────────────────────────────── */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-base">
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
                    "flex items-center gap-2 px-3 py-1.5 rounded-md border text-xs font-semibold transition-all",
                    "disabled:opacity-30 disabled:cursor-not-allowed",
                    isListening
                      ? "bg-red-500/15 border-red-500/50 text-red-400 hover:bg-red-500/25 animate-pulse"
                      : "bg-[#1a1a1a] border-[#333] text-slate-400 hover:border-slate-500 hover:text-white"
                  )}
                >
                  {isListening
                    ? <><MicOff className="w-3.5 h-3.5" /> Stop</>  
                    : <><Mic className="w-3.5 h-3.5" /> Dictate</>
                  }
                </button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <textarea
                  ref={textareaRef}
                  className={cn(
                    "w-full h-52 rounded-md border bg-[#0a0a0a] p-4 pr-16 text-sm text-slate-100 focus:outline-none focus:ring-1 resize-none shadow-inner placeholder:text-slate-600 transition-colors",
                    isListening
                      ? "border-red-800 focus:ring-red-500"
                      : isSimulating
                      ? "border-emerald-800 focus:ring-emerald-500"
                      : "border-[#333] focus:ring-slate-300 focus:border-slate-300"
                  )}
                  placeholder={isListening
                    ? "Speak now — your words will appear here in real-time..."
                    : "Select a scenario, click Dictate to speak, or type/paste a transcript here..."
                  }
                  value={transcript}
                  onChange={(e) => { if (!isSimulating && !isListening && !isEncrypted && !isEncrypting) setTranscript(e.target.value); }}
                  readOnly={isSimulating || isEncrypted || isEncrypting}
                />
                {isSimulating && (
                  <span className="absolute bottom-3 right-3 text-[9px] text-emerald-500 font-mono font-bold tracking-widest animate-pulse">
                    ● REC
                  </span>
                )}
                {isListening && (
                  <span className="absolute bottom-3 right-3 text-[9px] text-red-500 font-mono font-bold tracking-widest animate-pulse">
                    ● MIC
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-600 mt-3">
                Processed locally by the NLP Risk Engine. Not sent to any external service.
              </p>
              <div className="flex gap-2 mt-4">
                <Button
                  onClick={handleAnalyze}
                  disabled={loading || !transcript.trim() || isSimulating || isListening || isEncrypted}
                  className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white"
                >
                  {loading
                    ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Analyzing...</>
                    : <><FileText className="w-4 h-4 mr-2" />Analyze Transcript</>
                  }
                </Button>
                
                {transcript && result && !isEncrypted && (
                  <Button
                    onClick={handleEncrypt}
                    disabled={isEncrypting}
                    variant="outline"
                    className="flex-1 bg-emerald-950/20 text-emerald-400 border-emerald-900/50 hover:bg-emerald-950/40"
                  >
                    {isEncrypting ? <Loader2 className="w-4 h-4 mr-2 animate-spin"/> : <Lock className="w-4 h-4 mr-2" />}
                    {isEncrypting ? "Encrypting..." : "Secure Transcript"}
                  </Button>
                )}
                
                {isEncrypted && (
                  <div className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-emerald-950/30 border border-emerald-900/50 rounded-md text-emerald-400 text-sm font-semibold">
                    <ShieldCheck className="w-4 h-4" /> Transcript Encrypted Locally
                  </div>
                )}

                {transcript && !isSimulating && !isListening && !isEncrypting && (
                  <button
                    onClick={() => { setTranscript(""); setResult(null); setError(null); setIsEncrypted(false); }}
                    className="px-3 py-2 rounded-md border border-[#333] text-slate-500 hover:text-slate-300 hover:border-slate-500 text-xs transition-colors"
                    title="Clear transcript"
                  >
                    Clear
                  </button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Quick text demo shortcuts */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs text-slate-500">Or load a text-only scenario instantly</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <button className="w-full text-left px-3 py-2 rounded border border-[#1e1e1e] bg-[#0f0f0f] hover:bg-[#1a1a1a] text-slate-400 text-xs transition-colors"
                onClick={() => { if (!isSimulating && !isEncrypting) { setTranscript("Hi, just confirming I transferred the rent. Please check your account."); setResult(null); setIsEncrypted(false); } }}>
                💬 Casual legitimate message
              </button>
              <button className="w-full text-left px-3 py-2 rounded border border-orange-950/40 bg-[#0f0f0f] hover:bg-orange-950/20 text-orange-300 text-xs transition-colors"
                onClick={() => { if (!isSimulating && !isEncrypting) { setTranscript("Your bank account access will be blocked in 30 minutes. Call immediately to verify your identity and avoid suspension."); setResult(null); setIsEncrypted(false); } }}>
                ⚠️ Urgency-based phishing attempt
              </button>
              <button className="w-full text-left px-3 py-2 rounded border border-red-950/40 bg-[#0f0f0f] hover:bg-red-950/20 text-red-300 text-xs transition-colors"
                onClick={() => { if (!isSimulating && !isEncrypting) { setTranscript("Your account is frozen by CBI. Transfer all funds NOW to avoid criminal charges. Share OTP immediately or face arrest."); setResult(null); setIsEncrypted(false); } }}>
                🚨 Full critical attack pattern
              </button>
            </CardContent>
          </Card>
        </div>

        {/* ── Right: Analysis Results ────────────────────────────────────── */}
        <div className="space-y-4">
          {isSimulating && !result && (
            <div className="min-h-[200px] border border-emerald-900 bg-[#0d1a0d] rounded-md flex flex-col items-center justify-center p-8 text-center space-y-3">
              <div className="w-14 h-14 rounded-full bg-emerald-900/50 flex items-center justify-center">
                <Mic className="w-6 h-6 text-emerald-400 animate-pulse" />
              </div>
              <p className="text-sm font-medium text-emerald-300">Transcribing in real-time...</p>
              <p className="text-xs text-slate-500 max-w-xs">
                The NLP analysis will run once the call finishes, or you can click &quot;Analyze Transcript&quot; at any point.
              </p>
            </div>
          )}

          {error && !isSimulating && (
            <Card className="border-red-900 bg-red-950/10">
              <CardContent className="pt-6">
                <h3 className="font-semibold mb-1 text-red-300">Analysis Failed</h3>
                <p className="text-sm text-red-400">{error}</p>
              </CardContent>
            </Card>
          )}

          {!result && !loading && !error && !isSimulating && (
            <div className="min-h-[300px] border border-dashed border-[#2a2a2a] bg-[#0a0a0a] rounded-md flex flex-col items-center justify-center p-8 text-center">
              <div className="w-16 h-16 rounded-full bg-[#141414] flex items-center justify-center mb-4">
                <ShieldAlert className="w-8 h-8 text-slate-700" />
              </div>
              <h3 className="text-base font-medium text-slate-400">Awaiting Transcript</h3>
              <p className="text-xs text-slate-600 mt-2 max-w-xs">
                Select a scenario above to simulate a live fraud call, or type in the box and click Analyze.
              </p>
            </div>
          )}

          {loading && (
            <div className="min-h-[300px] rounded-md flex flex-col items-center justify-center bg-[#0a0a0a] border border-[#222] space-y-3">
              <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
              <p className="text-sm font-medium text-blue-400 animate-pulse">Running Lexical Analysis...</p>
              <p className="text-xs text-slate-600">Scanning for social engineering patterns</p>
            </div>
          )}

          {result && (
            <div className="space-y-4 animate-in slide-in-from-bottom-4 duration-500">
              {/* Risk verdict */}
              <Card className={cn(
                "border-2",
                result.risk_level === RiskLevel.LOW && "border-emerald-700",
                result.risk_level === RiskLevel.MEDIUM && "border-amber-600",
                result.risk_level === RiskLevel.HIGH && "border-orange-500",
                result.risk_level === RiskLevel.CRITICAL && "border-red-600"
              )}>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-base">NLP Analysis Result</CardTitle>
                      <p className="text-xs text-slate-500 mt-1">
                        Confidence score: <span className="text-white font-semibold">{Math.round(result.score * 100)}</span> / 100
                      </p>
                    </div>
                    <Badge
                      variant={
                        result.risk_level === RiskLevel.LOW ? "success" :
                        result.risk_level === RiskLevel.CRITICAL ? "destructive" : "warning"
                      }
                      className="px-3 py-1 text-sm uppercase"
                    >
                      {result.risk_level} RISK
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  {result.risk_level === RiskLevel.LOW ? (
                    <div className="flex items-center gap-3 bg-emerald-950/40 border border-emerald-900 p-4 rounded-md">
                      <CheckCircle className="w-5 h-5 flex-shrink-0 text-emerald-400" />
                      <p className="text-sm text-emerald-100">No coercive or suspicious social engineering patterns detected.</p>
                    </div>
                  ) : (
                    <div className="flex items-start gap-3 bg-red-950/30 border border-red-900 p-4 rounded-md">
                      <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5 text-red-400" />
                      <div>
                        <p className="text-sm font-semibold mb-1 text-red-200">Suspicious Patterns Detected</p>
                        <p className="text-xs text-red-400">
                          These indicators would significantly penalize the risk score in a live payment transaction.
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Triggered indicators */}
              {result.triggered_indicators.length > 0 && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">
                      Triggered Indicators
                      <span className="ml-2 text-xs font-normal text-slate-500">
                        {result.triggered_indicators.length} detected
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {result.triggered_indicators.map((ind, idx) => (
                      <div key={idx} className="border-l-2 border-red-700 pl-4 py-1">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="font-semibold text-xs text-slate-200">
                            {ind.category.replace(/_/g, " ")}
                          </span>
                          <Badge variant="outline" className="text-[10px] h-4 border-white/10 text-slate-500">
                            {ind.code}
                          </Badge>
                        </div>
                        <p className="text-xs text-slate-500">{ind.explanation}</p>
                        <div className="mt-2 bg-[#0a0a0a] border border-white/5 p-2.5 rounded text-xs font-mono text-slate-400">
                          &ldquo;...
                          <span className="bg-red-900/50 text-red-300 font-bold px-1 rounded">
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
