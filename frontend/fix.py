import os

file_path = '/Users/abhisekpatra/Desktop/fraudshield/frontend/src/app/interaction/page.tsx'
with open(file_path, 'r') as f:
    content = f.read()

start_marker = ' const simulateCall = (scenario: CallScenario) => {'
end_marker = '    callTimerRef.current = simInterval;\n  };\n'

start_idx = content.find(start_marker)
end_idx = content.find(end_marker, start_idx) + len(end_marker)

new_func = """ const simulateCall = (scenario: CallScenario) => {
    if (callTimerRef.current) clearInterval(callTimerRef.current);
    callTimerRef.current = null;
    utteranceRef.current = null;

    setIsSimulating(true);
    setActiveScenario(scenario);
    setTranscript("");
    setResult(null);
    setError(null);
    setCallDuration(0);
    setHashedOutput(null);

    const scriptText = scenario.script;

    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel(); 

      const lines = scriptText.split('\\n').filter(l => l.trim() !== '');
      const voices = window.speechSynthesis.getVoices();
      
      const callerVoice = voices.find(v => v.lang === "en-IN" && (v.name.includes("Male") || v.name.includes("Rishi"))) || voices.find(v => v.lang === "en-IN") || voices.find(v => v.lang.startsWith("en-"));
      const victimVoice = voices.find(v => v.lang === "en-IN" && (v.name.includes("Female") || v.name.includes("Veena"))) || voices.find(v => v.lang === "en-US" || v.lang === "en-GB") || callerVoice;

      lines.forEach((line) => {
        let text = line;
        let isVictim = false;
        
        if (line.toLowerCase().startsWith("victim:")) {
          text = line.substring(7).trim();
          isVictim = true;
        } else if (line.toLowerCase().startsWith("caller:")) {
          text = line.substring(7).trim();
        }

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 0.85 * scenario.rateMultiplier;
        utterance.volume = 1.0;
        
        if (isVictim) {
          utterance.pitch = 1.3;
          if (victimVoice) utterance.voice = victimVoice;
        } else {
          utterance.pitch = 1.0 + scenario.pitchOffset;
          if (callerVoice) utterance.voice = callerVoice;
        }

        utteranceRef.current = utterance;
        window.speechSynthesis.speak(utterance);
      });
    }

    const words = scriptText.split(" ");
    let wordIdx = 0;
    const wordIntervalMs = Math.max(160, (60000 / 220) / (0.85 * scenario.rateMultiplier));

    const durationTimer = setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);

    const simInterval = setInterval(() => {
      wordIdx++;
      if (wordIdx <= words.length) {
        setTranscript(words.slice(0, wordIdx).join(" "));
      } else {
        clearInterval(simInterval);
        clearInterval(durationTimer);
        callTimerRef.current = null;
        setIsSimulating(false);
        setActiveScenario(null);
      }
    }, wordIntervalMs);

    callTimerRef.current = simInterval;
  };
"""

with open(file_path, 'w') as f:
    f.write(content[:start_idx] + new_func + content[end_idx:])

print('Fixed Interaction page!')
