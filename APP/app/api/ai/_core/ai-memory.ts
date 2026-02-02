// APP/app/api/ai/_core/ai-memory.ts

let MEMORY: { intent: string; pattern: string; boost: number }[] = [];

export function learnWrongIntent(query: string, correctIntent: string) {
  MEMORY.push({
    intent: correctIntent,
    pattern: query.toLowerCase(),
    boost: 0.15,
  });
}

export function memoryBoost(query: string, intent: string) {
  const entry = MEMORY.find(
    (m) => query.includes(m.pattern) && m.intent === intent
  );
  return entry ? entry.boost : 0;
}
