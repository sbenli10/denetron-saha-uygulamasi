// APP/app/api/ai/_core/ai-fallback.ts

import { GoogleGenerativeAI } from "@google/generative-ai";
import OpenAI from "openai";

const gemini = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);
const geminiModel = gemini.getGenerativeModel({ model: process.env.GOOGLE_MODEL! });

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function aiFallback(prompt: string) {
  try {
    const result = await geminiModel.generateContent(prompt);
    return result.response.text();
  } catch (err: any) {
    // If Gemini rate limit or error → fallback
    console.warn("Gemini failed, fallback to GPT:", err?.message);

    const out = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 60,
    });

    return out.choices[0].message.content ?? "";
  }
}
