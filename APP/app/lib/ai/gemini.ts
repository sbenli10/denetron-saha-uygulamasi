//APP\app\lib\ai\gemini.ts
import { GoogleGenerativeAI } from "@google/generative-ai";

export const geminiClient = new GoogleGenerativeAI(
  process.env.GOOGLE_API_KEY!
);

export function getGeminiModel(model?: string) {
  return geminiClient.getGenerativeModel({
    model: model || process.env.GOOGLE_MODEL || "gemini-2.5-flash",
  });
}
