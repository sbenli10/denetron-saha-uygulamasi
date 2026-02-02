// APP/app/api/ai/vision-snapshot/route.ts
import { GoogleGenerativeAI } from "@google/generative-ai";
import { randomUUID } from "crypto";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);

export async function POST(req: Request) {
  const requestId = randomUUID();
  const start = Date.now();

  try {
    console.log(`[vision-snapshot][${requestId}] request_started`);

    const { imageBase64 } = await req.json();

    if (!imageBase64) {
      console.log(`[vision-snapshot][${requestId}] image_missing`);
      return Response.json({ error: "imageBase64_required" }, { status: 400 });
    }

    console.log(
      `[vision-snapshot][${requestId}] image_received size=${imageBase64.length}`
    );

    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
    });

    const prompt = `
Sen bir İş Sağlığı ve Güvenliği (İSG) uzmanısın.

Bu görüntü, OPERATÖR tarafından BİLİNÇLİ olarak analiz edilmek üzere seçilmiştir.

KURALLAR:
- Yalnızca fotoğrafta açıkça görülen riskleri belirt
- Varsayım yapma
- Kesin hüküm kurma
- "olabilir", "potansiyel" gibi ifadeler kullan
- Çıktı SADECE farkındalık amaçlıdır

FORMAT (JSON):
{
  "risks": [
    {
      "label": "kısa risk adı",
      "severity": "low | medium | high",
      "confidence": 0.0
    }
  ]
}
`.trim();

    console.log(`[vision-snapshot][${requestId}] gemini_call_started`);

    const result = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [
            { text: prompt },
            {
              inlineData: {
                data: imageBase64,
                mimeType: "image/jpeg",
              },
            },
          ],
        },
      ],
    });

    const rawText = result.response.text();
    const parsed = safeJsonParse(rawText);

    console.log(
      `[vision-snapshot][${requestId}] success duration=${
        Date.now() - start
      }ms`
    );

    return Response.json({
      risks: parsed?.risks ?? [],
      ai_used: true,
    });
  } catch (e: any) {
    const msg = String(e?.message || "");

    if (msg.includes("429")) {
      console.log(
        `[vision-snapshot][${requestId}] quota_exceeded duration=${
          Date.now() - start
        }ms`
      );

      return Response.json({
        risks: [],
        ai_used: false,
        reason: "quota_exceeded",
      });
    }

    console.error(
      `[vision-snapshot][${requestId}] error`,
      e
    );

    return Response.json(
      { error: "vision_snapshot_failed" },
      { status: 500 }
    );
  }
}

/* 🔒 SAFE JSON PARSE */
function safeJsonParse(text: string): any | null {
  try {
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return null;
    return JSON.parse(match[0]);
  } catch {
    return null;
  }
}
