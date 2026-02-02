import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { getAdminContext } from "@/lib/admin/context";

export const runtime = "nodejs";

/* -----------------------------------------------------
   SAFE JSON EXTRACTOR (GEMINI FRIENDLY)
----------------------------------------------------- */
function safeExtractJson(raw: string): any {
  if (!raw) return {};

  let t = raw
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();

  const first = t.indexOf("{");
  const last = t.lastIndexOf("}");

  if (first === -1 || last === -1) return {};

  try {
    return JSON.parse(t.slice(first, last + 1));
  } catch {
    return {};
  }
}

/* -----------------------------------------------------
   PREMIUM OCR (GEMINI ONLY)
----------------------------------------------------- */
export async function POST(req: Request) {
  const { org } = await getAdminContext();

  if (!org?.is_premium) {
    return NextResponse.json(
      { success: false, error: "PREMIUM_REQUIRED" },
      { status: 403 }
    );
  }

  try {
    const form = await req.formData();
    const file = form.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { success: false, error: "FILE_REQUIRED" },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);
    const model = genAI.getGenerativeModel({
      model: process.env.GOOGLE_MODEL || "gemini-2.5-flash",
    });

    /* -----------------------------
       1️⃣ OCR RAW
    ----------------------------- */
    const ocrRes = await model.generateContent([
      {
        inlineData: {
          data: buffer.toString("base64"),
          mimeType: file.type,
        },
      },
      `
Belgedeki tabloyu ve metni OCR ile çıkar.
- Kod bloğu kullanma
- Sadece düz metin üret
      `,
    ]);

    const ocrRaw = ocrRes.response.text();

    /* -----------------------------
       2️⃣ OCR CLEAN + SECTION JSON
    ----------------------------- */
    const cleanRes = await model.generateContent(`
Aşağıdaki OCR metnini temizle ve şu formatta JSON üret.

FORMAT:
{
  "sections": [
    {
      "title": "Bölüm",
      "rows": ["Soru 1", "Soru 2"]
    }
  ]
}

KURALLAR:
- Mantıklı bölümlere ayır
- Gürültüyü temizle
- Kod bloğu YOK
- SADECE JSON

OCR:
${ocrRaw}
    `);

    const cleanJson = safeExtractJson(cleanRes.response.text());

    /* -----------------------------
       3️⃣ TEMPLATE BUILDER
    ----------------------------- */
    const templateRes = await model.generateContent(`
Aşağıdaki OCR JSON'dan form şablonu üret.

FORMAT:
{
  "name": "Form Başlığı",
  "fields": [
    {
      "type": "boolean|text|number|textarea",
      "key": "otomatik_key",
      "label": "Soru",
      "critical": true|false
    }
  ]
}

KURALLAR:
- Evet/Hayır soruları → boolean
- Uzun açıklamalar → textarea
- SADECE JSON
- Kod bloğu YOK

OCR JSON:
${JSON.stringify(cleanJson)}
    `);

    const template = safeExtractJson(templateRes.response.text());

    return NextResponse.json({
      success: true,
      ocr_raw: ocrRaw,
      ocr_clean: cleanJson,
      template,
    });

  } catch (err: any) {
    console.error("GEMINI OCR ERROR:", err);
    return NextResponse.json(
      { success: false, error: "AI_PROCESS_FAILED" },
      { status: 500 }
    );
  }
}
