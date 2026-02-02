// APP/app/api/admin/templates/ai-suggest/route.ts
import { NextResponse } from "next/server";
import { getGeminiModel } from "@/lib/ai/gemini";

export async function POST(req: Request) {
  const { fields } = await req.json();

  const model = getGeminiModel();

  const prompt = `
Form alanlarını analiz et ve SADECE JSON üret:

{
  "name": "Önerilen Form Adı",
  "icon": "clipboard-check"
}

Fields:
${JSON.stringify(fields)}
`;

  const res = await model.generateContent(prompt);
  const text = res.response.text();

  let parsed = {};
  try {
    parsed = JSON.parse(text);
  } catch {
    parsed = {};
  }

  return NextResponse.json(parsed);
}
