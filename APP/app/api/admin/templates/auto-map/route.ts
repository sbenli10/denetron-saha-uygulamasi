// APP/app/api/admin/templates/auto-map/route.ts
import { NextResponse } from "next/server";
import { getGeminiModel } from "@/lib/ai/gemini";

export async function POST(req: Request) {
  const { clean, template } = await req.json();

  const model = getGeminiModel();

  const prompt = `
OCR JSON ve Template alanlarını analiz et.

Template.fields içindeki her "key" için OCR JSON içinden en uygun bilgiyi eşleştir.
SADECE JSON üret.

OCR:
${JSON.stringify(clean)}

Template:
${JSON.stringify(template)}
`;

  const res = await model.generateContent(prompt);
  const text = res.response.text();

  let parsed = template;
  try {
    parsed = JSON.parse(text);
  } catch {
    parsed = template;
  }

  return NextResponse.json({ mappedTemplate: parsed });
}
