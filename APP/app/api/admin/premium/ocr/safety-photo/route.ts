import { NextResponse } from "next/server";
import { getAdminContext } from "@/lib/admin/context";
import { GoogleGenerativeAI } from "@google/generative-ai";

export const runtime = "nodejs";

/* ---------------- JSON SAFE PARSER ---------------- */
function safeJson(raw: string) {
  try {
    const clean = raw
      .replace(/```json/gi, "")
      .replace(/```/g, "")
      .trim();

    const first = clean.indexOf("{");
    const last = clean.lastIndexOf("}");

    if (first === -1 || last === -1) return {};

    return JSON.parse(clean.substring(first, last + 1));
  } catch {
    return {};
  }
}

/* ---------------- ENDPOINT ---------------- */
export async function POST(req: Request) {
  const { org } = await getAdminContext();

  if (!org?.is_premium) {
    return NextResponse.json(
      { success: false, error: "PREMIUM_REQUIRED" },
      { status: 403 }
    );
  }

  const form = await req.formData();
  const file = form.get("file") as File;

  if (!file || !file.type.startsWith("image/")) {
    return NextResponse.json(
      { success: false, error: "IMAGE_REQUIRED" },
      { status: 400 }
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);
  const model = genAI.getGenerativeModel({
    model: process.env.GOOGLE_MODEL || "gemini-2.5-flash",
  });

  /* ---------------- GEMINI PROMPT ---------------- */
  const prompt = `
Bu bir iş sağlığı ve güvenliği (İSG) saha fotoğrafıdır.

Fotoğrafa bak ve varsa UYGUNSUZLUKLARI tespit et.
Her uygunsuzluğu bir DÖF MADDESİ olarak üret.

JSON FORMAT (SADECE BU FORMAT):

{
  "dofItems": [
    {
      "title": "Uygunsuzluk başlığı",
      "risk": {
        "level": "Düşük | Orta | Yüksek",
        "description": "Bu uygunsuzluğun oluşturduğu risk"
      },
      "action": {
        "type": "Düzeltici | Önleyici",
        "description": "Yapılması gereken faaliyet"
      },
      "evidence": {
        "expected": "Faaliyetin kapatılması için beklenen kanıt"
      },
      "law": "6331 sayılı Kanun veya ilgili yönetmelik"
    }
  ]
}

KURALLAR:
- İnsan hayatı riski varsa risk seviyesi Yüksek
- KKD eksikliği → Düzeltici faaliyet
- Makine koruyucu eksikliği → Düzeltici faaliyet
- Aynı fotoğrafta birden fazla uygunsuzluk olabilir
- Tahmin et ama uydurma yapma
- Kod bloğu, açıklama, metin YAZMA
- Sadece JSON üret
`;

  const result = await model.generateContent([
    {
      inlineData: {
        data: buffer.toString("base64"),
        mimeType: file.type,
      },
    },
    prompt,
  ]);

  const text = result.response.text();
  const parsed = safeJson(text);

  return NextResponse.json({
    success: true,
    documentType: "safety_photo",
    dofItems: Array.isArray(parsed.dofItems) ? parsed.dofItems : [],
  });
}
