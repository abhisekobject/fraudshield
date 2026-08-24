import re

with open("src/app/interaction/page.tsx", "r") as f:
    content = f.read()

new_simulate_call = """ const simulateCall = (scenario: CallScenario) => {
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
 };"""

# Using regex to find the old simulateCall block and replace it
pattern = re.compile(r' const simulateCall = \(scenario: CallScenario\) => \{.*?\n \};\n', re.DOTALL)
content = pattern.sub(new_simulate_call + "\n", content)

with open("src/app/interaction/page.tsx", "w") as f:
    f.write(content)
