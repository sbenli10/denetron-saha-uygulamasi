//APP\app\lib\ai\provider.ts
export type AiProvider = "openai" | "google";

export function getAiProvider(): AiProvider {
  const forced = process.env.AI_PROVIDER;

  if (forced === "google") {
    if (!process.env.GOOGLE_API_KEY || !process.env.GOOGLE_MODEL) {
      throw new Error("GOOGLE AI env eksik");
    }
    return "google";
  }

  if (forced === "openai") {
    if (!process.env.OPENAI_API_KEY || !process.env.OPENAI_MODEL) {
      throw new Error("OPENAI env eksik");
    }
    return "openai";
  }

  // fallback (zorunlu değil)
  if (process.env.GOOGLE_API_KEY && process.env.GOOGLE_MODEL) {
    return "google";
  }

  if (process.env.OPENAI_API_KEY && process.env.OPENAI_MODEL) {
    return "openai";
  }

  throw new Error("AI provider yapılandırılmamış");
}
