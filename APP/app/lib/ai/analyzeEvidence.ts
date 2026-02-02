// APP/app/lib/ai/analyzeEvidence.ts
import { openai } from "@/lib/ai/openai";
import { getAiProvider } from "./provider";

/* ================= PROMPT BUILDER ================= */

export function buildEvidencePrompt(question: string): string {
  return `
Sen kıdemli bir İŞ SAĞLIĞI VE GÜVENLİĞİ denetçisisin.

⚠️ Kurallar:
- Sadece görsel kanıtlara dayan.
- Görselde net olmayan hiçbir kusuru varsayma.
- Görseller soruyla alakasızsa bunu AÇIKÇA belirt.
- Emin değilsen risk seviyesini "Manual Review" yap.
- Cevapların TAMAMEN TÜRKÇE olacak.

SADECE JSON DÖNDÜR. Markdown kullanma.

JSON formatı:
{
  "risk_level": "Low | Medium | High | Critical | Manual Review",
  "observed_risks": ["gözlemlenen riskler"],
  "potential_future_risks": ["ileride oluşabilecek riskler"],
  "suggested_actions": ["önerilen düzeltici faaliyetler"],
  "confidence": 0-1
}

Denetim sorusu:
"${question}"
`;
}

/* ================= TYPES ================= */

export type GeminiImageInput = {
  inlineData: {
    mimeType: string;
    data: string;
  };
};


/* ================= ANALYSIS ================= */

export async function analyzeEvidence({
  prompt,
  imageInputs,
}: {
  prompt: string;
  imageInputs: GeminiImageInput[];
}): Promise<string> {
  const provider = getAiProvider();

  /* =====================================================
     OPENAI (GPT-4 Vision / GPT-4.1 / GPT-4o)
     ===================================================== */
  if (provider === "openai") {
    const model = process.env.OPENAI_MODEL;
    if (!model) {
      throw new Error("OPENAI_MODEL tanımlı değil");
    }

    const content: any[] = [
      { type: "text", text: prompt },
      ...imageInputs.map(img => ({
        type: "image_url",
        image_url: {
          url: `data:${img.inlineData.mimeType};base64,${img.inlineData.data}`,
        },
      })),
    ];

    const res = await openai.chat.completions.create({
      model,
      temperature: 0.2,
      messages: [
        {
          role: "user",
          content,
        },
      ],
    });

    return res.choices?.[0]?.message?.content ?? "";
  }

  /* =====================================================
     GOOGLE GEMINI (Vision)
     ===================================================== */
  const googleModel = process.env.GOOGLE_MODEL;
  const googleKey = process.env.GOOGLE_API_KEY;

  if (!googleModel || !googleKey) {
    throw new Error("GOOGLE_MODEL veya GOOGLE_API_KEY tanımlı değil");
  }

  const endpoint = `https://generativelanguage.googleapis.com/v1/models/${googleModel}:generateContent?key=${googleKey}`;

  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            { text: prompt },
            ...imageInputs, // 🔥 mimeType + data içeriyor
          ],
        },
      ],
    }),
  });

  const json = await res.json();

  console.log(
    "🧠 [GEMINI RAW RESPONSE]",
    JSON.stringify(json, null, 2)
  );

  const text =
    json?.candidates?.[0]?.content?.parts
      ?.map((p: any) => p.text)
      ?.join("\n") ?? "";

  return text;
}
