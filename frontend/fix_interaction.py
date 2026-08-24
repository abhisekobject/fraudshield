import re

with open("src/app/interaction/page.tsx", "r") as f:
    content = f.read()

# 1. Add import
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

# 4. Replace utteranceRef
content = content.replace('const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);\n', '')
content = content.replace('utteranceRef.current = null;\n', '')

# 5. Replace TTS in simulateCall
tts_block = r'if \(typeof window !== "undefined" && "speechSynthesis" in window\) {\n\s*window\.speechSynthesis\.cancel\(\);.*?\n\s*}\n'
content = re.sub(
    tts_block,
    'speakScript(scriptText, scenario.rateMultiplier, scenario.pitchOffset);\n',
    content,
    flags=re.DOTALL
)

with open("src/app/interaction/page.tsx", "w") as f:
    f.write(content)
