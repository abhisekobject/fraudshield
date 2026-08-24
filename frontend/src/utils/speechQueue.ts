/**
 * Robust TTS Speech Queue for FraudShield.
 * 
 * Solves these known browser issues:
 * 1. Chrome silently drops queued utterances when you call speak() multiple times
 * 2. Chrome's 15-second pause bug (pauses long utterances mid-speech)
 * 3. cancel() + speak() in the same tick causes the new utterance to be cancelled
 * 4. Empty voices list on first call
 * 5. Garbage collection of utterance objects mid-speech
 * 
 * Strategy: Speak ONE sentence at a time, wait for onend, then speak the next.
 * Also apply Chrome's pause/resume workaround for long sentences.
 */

type SpeechLine = {
  text: string;
  pitch: number;
  rate: number;
  voice: SpeechSynthesisVoice | null;
};

let currentQueue: SpeechLine[] = [];
let isSpeaking = false;
let currentUtterance: SpeechSynthesisUtterance | null = null;
let keepAliveInterval: ReturnType<typeof setInterval> | null = null;

// Chrome pauses speech after ~15 seconds. This workaround prevents that.
function startKeepAlive() {
  stopKeepAlive();
  keepAliveInterval = setInterval(() => {
    if (window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
      window.speechSynthesis.pause();
      window.speechSynthesis.resume();
    }
  }, 10000); // every 10 seconds
}

function stopKeepAlive() {
  if (keepAliveInterval) {
    clearInterval(keepAliveInterval);
    keepAliveInterval = null;
  }
}

function speakNext() {
  if (currentQueue.length === 0) {
    isSpeaking = false;
    stopKeepAlive();
    return;
  }

  const line = currentQueue.shift()!;
  const utterance = new SpeechSynthesisUtterance(line.text);
  utterance.rate = line.rate;
  utterance.pitch = line.pitch;
  utterance.volume = 1.0;
  if (line.voice) utterance.voice = line.voice;

  // Prevent garbage collection
  currentUtterance = utterance;

  utterance.onend = () => {
    speakNext();
  };
  utterance.onerror = (e) => {
    console.warn("TTS utterance error, skipping to next:", e);
    // Wait a tiny bit then try the next one
    setTimeout(() => speakNext(), 100);
  };

  window.speechSynthesis.speak(utterance);
}

/**
 * Cancel all queued and currently playing speech.
 */
export function cancelSpeech() {
  currentQueue = [];
  isSpeaking = false;
  currentUtterance = null;
  stopKeepAlive();
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }
}

/**
 * Get the best available voices for caller and victim.
 * Returns [callerVoice, victimVoice].
 */
function getVoices(): [SpeechSynthesisVoice | null, SpeechSynthesisVoice | null] {
  const voices = window.speechSynthesis.getVoices();
  if (voices.length === 0) return [null, null];

  // Try to find distinct voices for caller vs victim
  const enVoices = voices.filter(v => v.lang.startsWith("en-"));
  
  // Caller: prefer a deeper/male-ish voice
  const callerVoice = 
    enVoices.find(v => v.name.includes("Daniel")) ||
    enVoices.find(v => v.name.includes("Rishi")) ||
    enVoices.find(v => v.name.includes("Male")) ||
    enVoices.find(v => v.lang === "en-IN") ||
    enVoices.find(v => v.lang === "en-GB") ||
    enVoices[0] || null;
  
  // Victim: prefer a different voice
  const victimVoice = 
    enVoices.find(v => v.name.includes("Samantha")) ||
    enVoices.find(v => v.name.includes("Karen")) ||
    enVoices.find(v => v.name.includes("Veena")) ||
    enVoices.find(v => v.name.includes("Female")) ||
    enVoices.find(v => v.lang === "en-US" && v !== callerVoice) ||
    enVoices.find(v => v !== callerVoice) ||
    callerVoice;

  return [callerVoice, victimVoice];
}

/**
 * Pre-load voices. Call this in useEffect on mount.
 */
export function preloadVoices() {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  window.speechSynthesis.getVoices();
  window.speechSynthesis.onvoiceschanged = () => {
    window.speechSynthesis.getVoices();
  };
}

/**
 * Parse a script into speech lines and start speaking them sequentially.
 * MUST be called synchronously from a click handler (user gesture context).
 */
export function speakScript(
  scriptText: string,
  rateMultiplier: number = 1.0,
  pitchOffset: number = 0.0
) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

  // Cancel anything currently playing
  cancelSpeech();

  // Small delay after cancel to let the browser actually clear the queue
  // This is the KEY fix — cancel() is async internally in Chrome
  setTimeout(() => {
    const [callerVoice, victimVoice] = getVoices();
    
    // Split by newlines first for multi-line scripts
    const rawLines = scriptText.split('\n').filter(l => l.trim() !== '');
    
    // If no newlines found, split by sentences instead
    const lines = rawLines.length > 1 
      ? rawLines 
      : scriptText.split(/(?<=[.!?])\s+/).filter(l => l.trim() !== '');

    const queue: SpeechLine[] = lines.map(line => {
      let text = line;
      let isVictim = false;

      if (line.toLowerCase().startsWith("victim:")) {
        text = line.substring(7).trim();
        isVictim = true;
      } else if (line.toLowerCase().startsWith("caller:")) {
        text = line.substring(7).trim();
      }

      return {
        text,
        rate: 0.85 * rateMultiplier,
        pitch: isVictim ? 1.3 : 1.0 + pitchOffset,
        voice: isVictim ? victimVoice : callerVoice,
      };
    });

    currentQueue = queue;
    isSpeaking = true;
    startKeepAlive();
    speakNext();
  }, 50);
}
