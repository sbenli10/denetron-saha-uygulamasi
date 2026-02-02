// APP/app/api/ai/_core/intent-engine.ts

import { aiFallback } from "./ai-fallback";
import { calibrateConfidence } from "./calibrate";

export async function aiIntent(query: string) {
  const prompt = `
Extract ONLY intent from the command below.
Return valid JSON ONLY.

{
  "intent": "...",
  "confidence": 0-1
}

Command: "${query}"
`;

  const text = await aiFallback(prompt);

  try {
    const parsed = JSON.parse(text);
    return {
      intent: parsed.intent || "unknown",
      confidence: calibrateConfidence(parsed.confidence ?? 0),
    };
  } catch {
    return { intent: "unknown", confidence: 0.2 };
  }
}
