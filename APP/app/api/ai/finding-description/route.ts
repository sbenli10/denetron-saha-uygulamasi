import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);

export async function POST(req: Request) {
  console.log("🧠 AI /finding-description HIT");

  try {
    const { text, images } = await req.json();

    console.log("📥 Request:", {
      hasText: typeof text === "string",
      imagesCount: Array.isArray(images) ? images.length : 0,
    });

    if (!text || typeof text !== "string") {
      return Response.json(
        { error: "text alanı zorunludur" },
        { status: 400 }
      );
    }

    const model = genAI.getGenerativeModel({
      model: process.env.GOOGLE_MODEL || "gemini-2.5-flash",
    });

    /* ================= PROMPT ================= */

    const prompt = `
Sen bir saha oparatörsün ve şuan ki sorunla ilgili bir açıklama yazman gerekiyor.

KURALLAR:
- Fotoğrafları incelemeden yazma
- İlk cümle fotoğrafta açıkça görülen durumu tarif etsin
- Varsayım yapma
- Fotoğrafta açıkça görülmeyeni YAZMA
- Metin ile fotoğraf çelişirse FOTOĞRAF ESAS
- Tek paragraf
- 70–90 kelime
Operatör notu:
"${text}"
    `.trim();

    const parts: any[] = [{ text: prompt }];

    /* ================= IMAGE PARTS ================= */

    if (Array.isArray(images)) {
      for (const img of images) {
        if (!img?.data || !img?.type) continue;

        parts.push({
          inlineData: {
            data: img.data,       // 🔥 BASE64
            mimeType: img.type,   // 🔥 image/jpeg
          },
        });
      }
    }

    console.log("📦 Parts sent:", {
      count: parts.length,
      hasImage: parts.length > 1,
    });

    /* ================= MODEL CALL ================= */

    const result = await model.generateContent({
      contents: [{ role: "user", parts }],
    });

    let output = result.response.text().trim();

    console.log("🧾 AI output length:", output.length);

    if (output.length > 700) {
      output = output.slice(0, 700);
    }

    return Response.json({ text: output });
  } catch (err) {
    console.error("❌ AI error:", err);
    return Response.json(
      { error: "AI açıklama oluşturulamadı" },
      { status: 500 }
    );
  }
}
