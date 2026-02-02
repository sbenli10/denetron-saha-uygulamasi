// APP/app/api/ai/vision-live/route.ts
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);

export async function POST(req: Request) {
  const requestId = crypto.randomUUID();
  const startedAt = Date.now();

  console.log(`[vision-live][${requestId}] request_started`);

  try {
    const body = await req.json();
    const imageBase64: string | undefined = body?.imageBase64;

    if (!imageBase64) {
      return Response.json(
        { error: "imageBase64_required" },
        { status: 400 }
      );
    }

    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
    });

    const prompt = `
Sen bir İş Sağlığı ve Güvenliği (İSG) uzmanısın.

Bu, canlı sahadan alınmış tek bir görüntüdür.
Çıktı sadece farkındalık amaçlıdır.

KURALLAR:
- Yalnızca fotoğrafta AÇIKÇA görülen durumları değerlendir
- Varsayım yapma
- Kesin hüküm verme
- "olabilir", "risk oluşturabilir" gibi ifadeler kullan

FORMAT (SADECE JSON):
{
  "risks": [
    {
      "label": "kısa risk adı",
      "severity": "low | medium | high",
      "confidence": 0.0,
      "why_risk": "neden risk oluşturur",
      "what_to_do": "nasıl önlem alınabilir",
      "if_ignored": "önlem alınmazsa ne olabilir"
    }
  ]
}
`.trim();

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

    const risks = Array.isArray(parsed?.risks) ? parsed.risks : [];

    console.log(
      `[vision-live][${requestId}] success risks_count=${risks.length} duration=${Date.now() - startedAt}ms`
    );

    return Response.json({
      requestId,
      offline: false,
      risks,
    });

  } catch (e: any) {
      const msg = String(e?.message || "");
      const duration = Date.now() - startedAt;

      if (msg.includes("429")) {
        console.warn(
          `[vision-live][${requestId}] quota_exceeded duration=${duration}ms`
        );

        return Response.json(
          {
            requestId,
            offline: true,
            reason: "quota_exceeded",
            risks: [],
          },
          { status: 200 } // ❗ UI bozulmasın
        );
      }

      console.error(
        `[vision-live][${requestId}] error duration=${duration}ms`,
        e
      );

      return Response.json(
        { requestId, error: "vision_failed" },
        { status: 500 }
      );
    }

}

function safeJsonParse(text: string): any | null {
  try {
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return null;
    return JSON.parse(match[0]);
  } catch {
    return null;
  }
}
