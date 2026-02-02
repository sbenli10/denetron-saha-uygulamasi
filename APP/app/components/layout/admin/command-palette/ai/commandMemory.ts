let memory: Record<string, string> = {};

export function learnAttempt(query: string, intent: string) {
  memory[query.toLowerCase()] = intent;
}

export function resolveFromMemory(query: string): string | null {
  return memory[query.toLowerCase()] ?? null;
}
