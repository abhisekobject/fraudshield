import re

with open("src/app/interaction/page.tsx", "r") as f:
    content = f.read()

# Replace the utteranceRef definition if it exists
content = re.sub(r'const utteranceRef = useRef<SpeechSynthesisUtterance \| null>\(null\);\n', '', content)

# 1. Add import
if 'speechQueue' not in content:
    content = content.replace(
        'import React, { useState, useRef, useEffect, useMemo } from "react";',
        'import React, { useState, useRef, useEffect, useMemo } from "react";\nimport { preloadVoices, speakScript, cancelSpeech } from "@/utils/speechQueue";'
    )

# 2. Replace preload
content = re.sub(
    r'// Pre-load TTS voices in the background.*?}\s*return \(\) => cleanup\(\);',
    'preloadVoices();\n    return () => cleanup();',
    content,
    flags=re.DOTALL
)

# 3. Replace cleanup
content = re.sub(
    r'if \(typeof window !== "undefined" && "speechSynthesis" in window\) {\n\s*window\.speechSynthesis\.cancel\(\);\n\s*}',
    'cancelSpeech();',
    content
)
content = re.sub(r'utteranceRef\.current = null;\n', '', content)

# 4. Find simulateCall and replace its entire body
def replace_simulate_call(match):
    return """  const simulateCall = (scenario: CallScenario) => {
    if (callTimerRef.current) clearInterval(callTimerRef.current);
    callTimerRef.current = null;

    setIsSimulating(true);
    setActiveScenario(scenario);
    setTranscript("");
    setResult(null);
    setError(null);
    setCallDuration(0);
    setHashedOutput(null);

    const scriptText = scenario.script;
    
    // Speak via centralized queue
    speakScript(scriptText, scenario.rateMultiplier, scenario.pitchOffset);

    const words = scriptText.split(" ");
    let wordIdx = 0;
    const wordIntervalMs = Math.max(160, (60000 / 220) / (0.85 * scenario.rateMultiplier));

    callTimerRef.current = setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);

    const simInterval = setInterval(() => {
      wordIdx++;
      if (wordIdx <= words.length) {
        setTranscript(words.slice(0, wordIdx).join(" "));
      } else {
        clearInterval(simInterval);
        if (callTimerRef.current) clearInterval(callTimerRef.current);
        callTimerRef.current = null;
        setIsSimulating(false);
        setActiveScenario(null);
      }
    }, wordIntervalMs);
  };"""

content = re.sub(r'  const simulateCall = \(scenario: CallScenario\) => \{.*?\n  \};\n', replace_simulate_call, content, flags=re.DOTALL)

with open("src/app/interaction/page.tsx", "w") as f:
    f.write(content)
