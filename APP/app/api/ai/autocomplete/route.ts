import { NextResponse } from "next/server";
import { aiFallback } from "../_core/ai-fallback";

export async function POST(req: Request) {
  try {
    const { query } = await req.json();
    const prompt = `Autocomplete user command: "${query}". Output only the finished text.`;

    const out = await aiFallback(prompt);
    return NextResponse.json({ suggestion: out.trim() });
  } catch {
    return NextResponse.json({ suggestion: "" });
  }
}
