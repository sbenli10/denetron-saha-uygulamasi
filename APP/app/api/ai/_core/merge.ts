// APP/app/api/ai/_core/merge.ts

import { matchKeywordIntent } from "./keyword-map";
import { memoryBoost } from "./ai-memory";

export function mergeIntents({
  query,
  keywordIntent,
  aiIntent,
}: {
  query: string;
  keywordIntent: { intent: string; confidence: number } | null;
  aiIntent: { intent: string; confidence: number };
}) {
  let best = aiIntent;

  if (keywordIntent && keywordIntent.confidence > aiIntent.confidence) {
    best = keywordIntent;
  }

  const boost = memoryBoost(query, best.intent);

  return {
    intent: best.intent,
    confidence: Math.min(best.confidence + boost, 1),
  };
}
