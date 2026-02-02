import { resolveKeywordIntent } from "./keywordResolver";
import { resolveFromMemory, learnAttempt } from "./commandMemory";

/**
 * Çok katmanlı: Memory → Keyword → Gemini fallback
 */
export async function resolveGPTIntent(query: string): Promise<{
  intent: string;
  confidence: number;
}> {
  const text = query.trim().toLowerCase();
  if (!text) return { intent: "unknown", confidence: 0 };

  // 1) MEMORY (en hızlı)
  const mem = resolveFromMemory(text);
  if (mem) {
    return { intent: mem, confidence: 0.95 };
  }

  // 2) KEYWORD resolver
  const key = resolveKeywordIntent(text);
  if (key.intent) {
    learnAttempt(text, key.intent);
    return { intent: key.intent, confidence: key.score };
  }

  // 3) GEMINI fallback
  try {
    const res = await fetch("/api/ai/command", {
      method: "POST",
      body: JSON.stringify({ query }),
    });

    if (!res.ok) {
      return { intent: "unknown", confidence: 0 };
    }

    const ai = await res.json();

    // AI doğruysa öğren
    if (ai.intent && ai.confidence > 0.65) {
      learnAttempt(text, ai.intent);
    }

    return ai;
  } catch (err: any) {
    if (err.name === "AbortError") {
      return { intent: "unknown", confidence: 0 };
    }

    console.error("GPT intent fallback error:", err);
    return { intent: "unknown", confidence: 0 };
  }
}
