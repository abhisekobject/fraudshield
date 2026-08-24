with open("src/app/interaction/page.tsx", "r") as f:
    lines = f.readlines()

new_func = """  const simulateCall = (scenario: CallScenario) => {
    cleanup();

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
  };
"""

# Find start of simulateCall and handleAnalyze
start_idx = -1
end_idx = -1

for i, line in enumerate(lines):
    if "const simulateCall = (scenario: CallScenario) => {" in line:
        start_idx = i
    if "const handleAnalyze = async () => {" in line:
        end_idx = i - 1
        break

if start_idx != -1 and end_idx != -1:
    lines = lines[:start_idx] + [new_func, "\n"] + lines[end_idx + 1:]

with open("src/app/interaction/page.tsx", "w") as f:
    f.writelines(lines)
