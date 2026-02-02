// APP/app/api/admin/isg/analyze/photo/route.ts
import { NextResponse } from "next/server";
import { getAdminContext } from "@/lib/admin/context";
import { GoogleGenerativeAI } from "@google/generative-ai";
import vision from "@google-cloud/vision";

export const runtime = "nodejs";

const ocrClient = new vision.ImageAnnotatorClient();

/** Basit request id (log korelasyonu için) */
function mkReqId() {
  return `isg_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function safeJson(raw: string, logPrefix: string) {
  try {
    const clean = raw.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(clean);
    console.log(`${logPrefix} ✅ safeJson: parsed ok`);
    return parsed;
  } catch (err) {
    console.warn(`${logPrefix} ⚠️ safeJson: parse failed`, err);
    return {};
  }
}

async function runOCR(buffer: Buffer, logPrefix: string): Promise<string> {
  const started = Date.now();
  console.log(
    `${logPrefix} 🔎 OCR: starting textDetection (buffer=${buffer.length} bytes)`
  );

  const [res] = await ocrClient.textDetection(buffer);

  const text = res.fullTextAnnotation?.text ?? "";
  console.log(
    `${logPrefix} 🔎 OCR: done in ${Date.now() - started}ms (chars=${text.length})`
  );

  return text;
}

export async function POST(req: Request) {
  const reqId = mkReqId();
  const logPrefix = `[ISG_ANALYZE_PHOTO][${reqId}]`;

  const t0 = Date.now();
  console.log(`${logPrefix} ▶️ POST start`);
  console.log(`${logPrefix} runtime=nodejs`);

  // 1) Admin context / Premium kontrolü
  console.log(`${logPrefix} 1) getAdminContext() starting`);
  const ctxStarted = Date.now();
  const { org } = await getAdminContext();
  console.log(
    `${logPrefix} 1) getAdminContext() done in ${Date.now() - ctxStarted}ms`,
    { orgId: org?.id, isPremium: org?.is_premium }
  );

  if (!org?.is_premium) {
    console.warn(`${logPrefix} ⛔ PREMIUM_REQUIRED`);
    return NextResponse.json({ error: "PREMIUM_REQUIRED" }, { status: 403 });
  }

  // 2) FormData al
  console.log(`${logPrefix} 2) req.formData() starting`);
  const fdStarted = Date.now();
  const form = await req.formData();
  console.log(`${logPrefix} 2) req.formData() done in ${Date.now() - fdStarted}ms`);

  // 3) Dosyaları çek
  console.log(`${logPrefix} 3) form.getAll("files") starting`);
  const files = form.getAll("files") as File[];
  console.log(`${logPrefix} 3) files received: count=${files.length}`);

  if (!files.length) {
    console.warn(`${logPrefix} ⛔ EN_AZ_BIR_FOTOGRAF_YUKLENMELI`);
    return NextResponse.json(
      { error: "EN_AZ_BIR_FOTOGRAF_YUKLENMELI" },
      { status: 400 }
    );
  }

  // 4) Gemini client hazırla
  console.log(`${logPrefix} 4) Gemini init starting`);
  const gemStarted = Date.now();
  const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);
  const modelName = process.env.GOOGLE_MODEL || "gemini-2.5-flash";
  const model = genAI.getGenerativeModel({ model: modelName });
  console.log(`${logPrefix} 4) Gemini init done in ${Date.now() - gemStarted}ms`, {
    modelName,
    hasApiKey: Boolean(process.env.GOOGLE_API_KEY),
  });

  const results: any[] = [];
  const warnings: string[] = [];

  // 5) Dosyaları sırayla işle
  console.log(`${logPrefix} 5) processing files...`);

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const filePrefix = `${logPrefix}[file#${i + 1}/${files.length}][${file.name}]`;

    console.log(
      `${filePrefix} 📄 file meta`,
      { type: file.type, size: file.size }
    );

    // 5.1) Tip kontrol
    if (!file.type.startsWith("image/")) {
      const msg = `${file.name} analiz edilmedi (fotoğraf değil)`;
      warnings.push(msg);
      console.warn(`${filePrefix} ⚠️ ${msg}`);
      continue;
    }

    // 5.2) Buffer’a çevir
    console.log(`${filePrefix} 5.2) arrayBuffer -> Buffer starting`);
    const bufStarted = Date.now();
    const buffer = Buffer.from(await file.arrayBuffer());
    console.log(
      `${filePrefix} 5.2) buffer ready in ${Date.now() - bufStarted}ms (bytes=${buffer.length})`
    );

    // 5.3) OCR
    let ocrText = "";
    try {
      console.log(`${filePrefix} 5.3) OCR starting`);
      ocrText = await runOCR(buffer, filePrefix);
      console.log(`${filePrefix} 5.3) OCR text sample`, {
        sample: ocrText.slice(0, 160),
        chars: ocrText.length,
      });
    } catch (err) {
      const msg = `${file.name} OCR hatası (devam ediliyor)`;
      warnings.push(msg);
      console.error(`${filePrefix} ❌ OCR failed`, err);
      // OCR başarısız olsa da görsel analizi devam ettirebilirsin:
      ocrText = "";
    }

    // 5.4) Prompt hazırla
    console.log(`${filePrefix} 5.4) prompt building`);
    const prompt = `
Bu görsel bir İŞ SAĞLIĞI VE GÜVENLİĞİ (İSG) SAHA FOTOĞRAFIDIR.

AŞAĞIDA:
1) Fotoğrafa ait OCR ile çıkarılmış METİN
2) Fotoğrafın kendisi

AMAÇ:
Yalnızca FOTOĞRAFTA GÖRÜLEBİLEN ve OCR METNİYLE DESTEKLENEBİLEN unsurlara dayanarak,
İSG uzmanına yardımcı olacak BİR ÖN SAHA RİSK DEĞERLENDİRMESİ yapmak.

KURALLAR:
- Varsayım yapma
- Görünmeyen risk uydurma
- Yaptırım veya zorunlu aksiyon tanımlama
- Kesin hüküm verme

OCR METNİ:
"""
${ocrText || "OCR ile okunabilir metin tespit edilemedi"}
"""

ÇIKTI (SADECE JSON):

{
  "assessmentItems": [
    {
      "title": "Kısa tespit başlığı",
      "riskLevel": "Düşük | Orta | Yüksek",
      "riskDescription": "Fotoğrafta ve/veya OCR metninde GÖRÜLEN duruma dayalı açıklama",
      "suggestedAction": "Bağlayıcı olmayan önleyici öneri",
      "law": "İlgili olabilecek mevzuat (emin değilse null)"
    }
  ]
}
`;

    console.log(`${filePrefix} 5.4) prompt length`, { chars: prompt.length });

    // 5.5) Gemini çağrısı
    console.log(`${filePrefix} 5.5) Gemini generateContent starting`);
    const aiStarted = Date.now();

    let aiText = "";
    try {
      const aiResult = await model.generateContent([
        {
          inlineData: {
            data: buffer.toString("base64"),
            mimeType: file.type,
          },
        },
        prompt,
      ]);

      aiText = aiResult.response.text();
      console.log(
        `${filePrefix} 5.5) Gemini done in ${Date.now() - aiStarted}ms`,
        { responseChars: aiText.length, responseSample: aiText.slice(0, 200) }
      );
    } catch (err) {
      const msg = `${file.name} AI analizi başarısız (devam ediliyor)`;
      warnings.push(msg);
      console.error(`${filePrefix} ❌ Gemini failed`, err);
      continue;
    }

    // 5.6) JSON parse
    console.log(`${filePrefix} 5.6) parsing AI JSON`);
    const parsed = safeJson(aiText, filePrefix);

    const assessmentItems = Array.isArray(parsed.assessmentItems)
      ? parsed.assessmentItems
      : [];

    console.log(`${filePrefix} 5.6) assessmentItems count=${assessmentItems.length}`);

    // 5.7) Sonucu ekle
    results.push({
      fileName: file.name,
      ocrText,
      assessmentItems,
    });

    console.log(`${filePrefix} ✅ file processing completed`);
  }

  // 6) Hiç foto analiz edilmediyse
  if (!results.length) {
    console.warn(`${logPrefix} ⛔ FOTOGRAF_YOK (no analyzable images)`, { warnings });
    return NextResponse.json(
      {
        error: "FOTOGRAF_YOK",
        message: "Yüklenen dosyalar arasında analiz edilebilir fotoğraf bulunamadı.",
        warnings,
      },
      { status: 400 }
    );
  }

  // 7) Başarılı response
  console.log(`${logPrefix} ✅ success`, {
    resultsCount: results.length,
    warningsCount: warnings.length,
    totalMs: Date.now() - t0,
  });

  return NextResponse.json({
    type: "photo",
    results,
    warnings,
    meta: {
      requestId: reqId,
      resultsCount: results.length,
      warningsCount: warnings.length,
      totalMs: Date.now() - t0,
      modelName,
    },
  });
}
