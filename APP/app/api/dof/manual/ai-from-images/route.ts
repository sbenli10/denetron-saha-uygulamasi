// APP/app/api/dof/manual/ai-from-images/route.ts

import { NextResponse } from "next/server";
import crypto from "crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* ================= CONFIG ================= */

const MODEL = process.env.GOOGLE_MODEL || "gemini-2.5-flash";
const API_KEY = process.env.GOOGLE_API_KEY;
const MAX_TOKENS = 1800;

/* ================= QUALITY CHECK ================= */
function evaluateQuality(text: string) {
  if (!text) return 0;
  let score = 0;

  if (text.length > 300) score += 25;
  if (text.includes("Genel Teknik Değerlendirme")) score += 20;
  if (text.includes("Risk")) score += 15;
  if (text.includes("Önerilen")) score += 20;
  if (!text.includes("```")) score += 10;
  if (!text.toLowerCase().includes("json")) score += 10;
  
  return score;
}
/* ================= ROUTE ================= */

export async function POST(req: Request) {
  const reqId = crypto.randomUUID();
  const startTime = Date.now();

  console.log(`[AI][${reqId}] ===== START =====`);

  try {
    if (!API_KEY) {
      return NextResponse.json(
        { error: "AI yapılandırma hatası." },
        { status: 500 }
      );
    }

    const formData = await req.formData();
    const files = formData.getAll("images") as File[];

    if (!files.length) {
      return NextResponse.json(
        { error: "En az bir fotoğraf yüklenmelidir." },
        { status: 400 }
      );
    }

    /* ================= BASE PROMPT ================= */

    const basePrompt = `
Sen deneyimli bir İş Güvenliği Uzmanısın.

Kurallar:
- Risk yoksa risk üretme.
- Emin değilsen varsayım yapma.
- Teknik ama sade yaz.
- Markdown veya JSON üretme.

Format:

1) Genel Teknik Değerlendirme
2) Tespit Edilen Risk / Uygunsuzluk (varsa)
3) Risk Seviyesi (varsa)
4) Önerilen Aksiyonlar
`;

    const parts: any[] = [{ text: basePrompt }];

    for (const file of files) {
      const buffer = Buffer.from(await file.arrayBuffer());

      parts.push({
        inlineData: {
          mimeType: file.type || "image/jpeg",
          data: buffer.toString("base64"),
        },
      });
    }

    /* ================= MODEL CALL ================= */

    async function callModel(promptParts: any[]) {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ role: "user", parts: promptParts }],
            generationConfig: {
              temperature: 0.2,
              maxOutputTokens: MAX_TOKENS,
              topP: 0.9,
            },
          }),
        }
      );

      const json = await res.json();

      if (!res.ok) {
        if (json?.error?.status === "RESOURCE_EXHAUSTED") {
          throw new Error("quota");
        }
        throw new Error("model_error");
      }

      return (
        json?.candidates?.[0]?.content?.parts
          ?.map((p: any) => p.text ?? "")
          .join("")
          .trim() ?? ""
      );
    }

    /* ================= FIRST PASS ================= */

    let text = await callModel(parts);
    let quality = evaluateQuality(text);

    console.log(`[AI][${reqId}] Quality score: ${quality}`);

    /* ================= AUTO-BOOST STRATEGY ================= */

    if (quality < 60) {
      console.log(`[AI][${reqId}] Low quality detected. Boosting output.`);

      const boostPrompt = [
        {
          text: `
Aşağıdaki analiz teknik olarak yetersiz.
Daha detaylı, daha sistematik ve teknik derinliği artırılmış şekilde yeniden yaz:

${text}
          `,
        },
      ];

      text = await callModel(boostPrompt);
      quality = evaluateQuality(text);

      console.log(`[AI][${reqId}] Boosted quality score: ${quality}`);
    }

    if (quality < 40) {
      console.warn(`[AI][${reqId}] Output rejected due to low quality.`);
      return NextResponse.json(
        { error: "AI yeterli kalitede analiz üretemedi." },
        { status: 500 }
      );
    }

    /* ================= CLEAN ================= */

    text = text
      .replace(/```/g, "")
      .replace(/json/gi, "")
      .trim();

    const latency = Date.now() - startTime;

    console.log(`[AI][${reqId}] SUCCESS`);
    console.log(`[AI][${reqId}] Latency: ${latency}ms`);
    console.log(`[AI][${reqId}] Final Quality: ${quality}`);

    return NextResponse.json({
      risk_description: text,
      ai_meta: {
        model: MODEL,
        quality_score: quality,
        latency_ms: latency,
      },
    });

  } catch (err: any) {
    console.error(`[AI][${reqId}] ERROR`, err);

    if (err.message === "quota") {
      return NextResponse.json(
        {
          error:
            "AI kullanım kotası dolmuştur. Lütfen daha sonra tekrar deneyiniz.",
        },
        { status: 429 }
      );
    }

    return NextResponse.json(
      {
        error:
          "AI analiz servisi geçici olarak kullanılamıyor.",
      },
      { status: 500 }
    );
  }
}