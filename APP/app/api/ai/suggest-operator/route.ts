// APP/app/api/ai/suggest-operator/route.ts
import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);
const model = genAI.getGenerativeModel({ model: process.env.GOOGLE_MODEL! });

export async function POST(req: Request) {
  try {
    const { templateName, operators } = await req.json();

    const prompt = `
Görev atamada en uygun operatörü seç.
Operatör listesi JSON formatında verilmiş.
Şablon adı: "${templateName}"

Operatörler:
${JSON.stringify(operators, null, 2)}

Sadece şu formatta dön:
{
  "operatorId": "id",
  "confidence": 0-1
}
`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    try {
      const parsed = JSON.parse(text);
      return NextResponse.json(parsed);
    } catch {
      return NextResponse.json({ operatorId: null, confidence: 0 });
    }
  } catch (err) {
    return NextResponse.json({ operatorId: null, confidence: 0 });
  }
}
