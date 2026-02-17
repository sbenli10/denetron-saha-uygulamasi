// APP/app/api/admin/isg/analyze/photo/route.ts

import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { getAdminContext } from "@/lib/admin/context";
import { GoogleGenerativeAI } from "@google/generative-ai";
import vision from "@google-cloud/vision";

export const runtime = "nodejs";

/* ======================================================
   CONFIG
====================================================== */

const MAX_FILE_SIZE_MB = 5;
const MAX_FILES = 5;
const REQUEST_TIMEOUT_MS = 60_000;

/* ======================================================
   SIMPLE MEMORY RATE LIMIT (IP BASED)
====================================================== */

const ipMap = new Map<string, { count: number; ts: number }>();
const RATE_LIMIT = 20; // 20 request / 10 dk
const WINDOW_MS = 10 * 60 * 1000;

function checkRateLimit(ip: string) {
  const now = Date.now();
  const record = ipMap.get(ip);

  if (!record) {
    ipMap.set(ip, { count: 1, ts: now });
    return true;
  }

  if (now - record.ts > WINDOW_MS) {
    ipMap.set(ip, { count: 1, ts: now });
    return true;
  }

  if (record.count >= RATE_LIMIT) return false;

  record.count++;
  return true;
}

/* ======================================================
   UTILS
====================================================== */

function mkReqId() {
  return `isg_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function errorResponse(
  code: string,
  message: string,
  status: number,
  meta?: any
) {
  return NextResponse.json(
    {
      success: false,
      error: { code, message },
      meta,
    },
    { status }
  );
}

function safeJson(raw: string) {
  try {
    const clean = raw.replace(/```json|```/g, "").trim();
    return JSON.parse(clean);
  } catch {
    return null;
  }
}

/* ======================================================
   GOOGLE VISION
====================================================== */

function createVisionClient() {
  if (!process.env.GOOGLE_SERVICE_ACCOUNT_JSON_BASE64) return null;

  try {
    const credentials = JSON.parse(
      process.env.GOOGLE_SERVICE_ACCOUNT_JSON_BASE64
    );
    return new vision.ImageAnnotatorClient({ credentials });
  } catch {
    return null;
  }
}

const ocrClient = createVisionClient();

async function runOCR(buffer: Buffer) {
  if (!ocrClient) return { text: "", warning: "OCR_CONFIG_YOK" };

  try {
    const [res] = await ocrClient.textDetection(buffer);
    return { text: res.fullTextAnnotation?.text ?? "", warning: null };
  } catch {
    return { text: "", warning: "OCR_CALISAMADI" };
  }
}

/* ======================================================
   AI SERVİS KATMANI
====================================================== */

async function callGemini(buffer: Buffer, mimeType: string, prompt: string) {
  if (!process.env.GOOGLE_API_KEY) {
    throw { type: "CONFIG", message: "GOOGLE_API_KEY eksik" };
  }

  const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
  const model = genAI.getGenerativeModel({
    model: process.env.GOOGLE_MODEL || "gemini-1.5-flash",
  });

  try {
    const result = await model.generateContent([
      {
        inlineData: {
          data: buffer.toString("base64"),
          mimeType,
        },
      },
      prompt,
    ]);

    return result.response.text();
  } catch (err: any) {
    if (err?.status === 429) {
      throw { type: "QUOTA", message: "Gemini quota doldu" };
    }

    throw { type: "AI_ERROR", message: "Gemini hata verdi" };
  }
}

/* ======================================================
   TIMEOUT WRAPPER
====================================================== */

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error("TIMEOUT")), ms)
    ),
  ]);
}

/* ======================================================
   POST HANDLER
====================================================== */

export async function POST(req: Request) {
  const requestId = mkReqId();
  const start = Date.now();

  try {
    /* ---------------- IP RATE LIMIT ---------------- */

    const ip =
      headers().get("x-forwarded-for") ||
      headers().get("x-real-ip") ||
      "unknown";

    if (!checkRateLimit(ip)) {
      return errorResponse(
        "RATE_LIMIT",
        "Çok fazla istek gönderildi. Lütfen daha sonra tekrar deneyin.",
        429,
        { requestId }
      );
    }

    /* ---------------- ADMIN CHECK ---------------- */

    const { org } = await getAdminContext();

    if (!org?.is_premium) {
      return errorResponse(
        "PREMIUM_REQUIRED",
        "Bu özellik premium üyelik gerektirir.",
        403,
        { requestId }
      );
    }

    /* ---------------- FORM ---------------- */

    const form = await req.formData();
    const files = form.getAll("files") as File[];

    if (!files.length) {
      return errorResponse(
        "NO_FILE",
        "En az bir fotoğraf yüklenmelidir.",
        400,
        { requestId }
      );
    }

    if (files.length > MAX_FILES) {
      return errorResponse(
        "TOO_MANY_FILES",
        `En fazla ${MAX_FILES} fotoğraf yükleyebilirsiniz.`,
        400,
        { requestId }
      );
    }

    const results = [];
    const warnings: string[] = [];

    /* ---------------- FILE LOOP ---------------- */

    for (const file of files) {
      if (!file.type.startsWith("image/")) {
        warnings.push(`${file.name} fotoğraf değil.`);
        continue;
      }

      if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
        warnings.push(`${file.name} boyutu çok büyük.`);
        continue;
      }

      const buffer = Buffer.from(await file.arrayBuffer());

      /* OCR */
      const { text: ocrText, warning: ocrWarn } = await runOCR(buffer);
     if (ocrWarn)
      warnings.push(
        `${file.name}: Görselde analiz edilebilir bir yazı bulunamadı. Değerlendirme görsel içerik üzerinden yapılmıştır.`
      );

      const prompt = `
      ROL:
      Sen A Sınıfı İş Güvenliği Uzmanı + Kıdemli Denetçi + Risk Analiz Danışmanısın.
      ISO 45001:2018, 6331 Sayılı İş Sağlığı ve Güvenliği Kanunu ve ilgili tüm yönetmeliklere hakimsin.

      Davranış Modelin 3 Katmanlıdır:

      1) AGRESİF SAHA ANALİZİ
      - Çalışan görünmese bile risk üret.
      - Elektrik, açık metal, kazı, mekanik ekipman, toprak, yükseklik varsa otomatik risk değerlendir.
      - "Belirsiz" durumlarda ihtiyatlı yaklaşım uygula.
      - Potansiyel riskleri yazmaktan kaçınma.

      2) KURUMSAL DENETİM DİLİ
      - Teknik ve resmi ifade kullan.
      - Gözlemsel, ölçülebilir ve mevzuat referanslı yaz.
      - Varsayım yapma, ancak gözlemlenen unsurları teknik olarak yorumla.

      3) YÖNETSEL AKSİYON ZORLAMA
      - Kullanıcıyı açıkça bilgilendir.
      - Gerekirse “Acil müdahale gerektirir” ifadesi kullan.
      - Riskleri öncelik sırasına göre yaz.
      - Net uygulanabilir aksiyon üret.

      ========================================
      İSG DEĞERLENDİRME KRİTERİ
      ========================================

      Aşağıdakilerden biri varsa İSG kapsamında değerlendir:

      - Elektrik ekipmanı, açık kablo, pano
      - Şantiye zemini, kazı, beton, toprak
      - Endüstriyel ekipman
      - Mekanik sistem
      - Açık metal yapı
      - Yükseklik farkı
      - Korumasız tehlikeli alan

      Çalışan görünmesi zorunlu değildir.

      Sadece ev içi veya tamamen günlük yaşam ortamıysa isgRelevant:false üret.

      ========================================
      RİSK ANALİZ METODOLOJİSİ
      ========================================

      ISO 45001 + Fine–Kinney

      Risk Skoru = P x E x S
      riskScore NUMBER olmalı.
      priorityOrder 1 en yüksek risk olacak şekilde sırala.

      Risk Seviyesi:
      0-20      = Kabul edilebilir
      21-70     = Dikkate değer
      71-200    = Önemli
      201-400   = Yüksek
      400+      = Çok yüksek

      ========================================
      ÇIKTI FORMATIN (SADECE JSON)
      ========================================

      EĞER İSG DIŞI:

      {
        "isgRelevant": false,
        "sceneDescription": "Teknik ve tarafsız açıklama",
        "reason": "İSG kapsamına girmiyor"
      }

      EĞER İSG KAPSAMINDA:

      {
        "isgRelevant": true,
        "methodology": "ISO 45001 + Fine-Kinney",
        "generalEvaluation": "Kurumsal dilde genel saha değerlendirmesi. Kritik riskler açıkça belirtilmeli. Gerekirse 'Acil müdahale gerektirir' ifadesi kullanılmalı.",
        "assessmentItems": [
          {
            "hazard": "Net ve teknik tehlike tanımı",
            "observation": "Fotoğrafta gözlemlenen kanıt",
            "probability": 6,
            "exposure": 3,
            "severity": 15,
            "riskScore": 270,
            "riskLevel": "Yüksek",
            "priorityOrder": 1,
            "recommendedControls": {
              "elimination": "Ortadan kaldırma önerisi veya null",
              "substitution": "İkame önerisi veya null",
              "engineeringControls": "Mühendislik kontrolü",
              "administrativeControls": "İdari önlem",
              "ppe": "KKD önerisi"
            },
            "complianceStatus": "Uygun değil",
            "legalReference": {
              "primaryLaw": "6331 sayılı İş Sağlığı ve Güvenliği Kanunu",
              "regulation": "İlgili yönetmelik adı veya null",
              "isoClause": "ISO 45001 madde numarası veya null"
            }
          }
        ],
        "riskRankingSummary": "Riskler en yüksekten düşüğe sıralanmıştır."
      }

      ========================================
      OCR METNİ
      ========================================

      ${ocrText || "OCR ile okunabilir metin tespit edilmedi"}

      Kurallar:
      - Varsayım yapma.
      - Görünmeyen unsuru yazma.
      - Elektrik varsa risk üretmek zorundasın.
      - Açık yapı varsa risk üretmek zorundasın.
      - JSON dışında hiçbir çıktı üretme.
      - Markdown kullanma.
      `;


      let aiText: string;

      try {
        aiText = await withTimeout(
          callGemini(buffer, file.type, prompt),
          REQUEST_TIMEOUT_MS
        );
      } catch (err: any) {
        if (err?.type === "QUOTA") {
          return errorResponse(
            "AI_QUOTA_EXCEEDED",
            "Yapay zeka günlük kullanım limiti doldu. Lütfen daha sonra tekrar deneyin.",
            429,
            { requestId }
          );
        }

        if (err?.message === "TIMEOUT") {
          return errorResponse(
            "AI_TIMEOUT",
            "Yapay zeka yanıt vermedi. Lütfen tekrar deneyin.",
            504,
            { requestId }
          );
        }

        return errorResponse(
          "AI_FAILED",
          "Yapay zeka analiz sırasında hata verdi.",
          500,
          { requestId }
        );
      }

      const parsed = safeJson(aiText);

      if (!parsed) {
        warnings.push(`${file.name} AI çıktısı JSON formatında değil.`);
      }

      results.push({
        fileName: file.name,
        ok: true,
        analysis: parsed,
        warnings: [],
      });
    }

    if (!results.length) {
      return errorResponse(
        "NO_ANALYZABLE_IMAGE",
        "Analiz edilebilir fotoğraf bulunamadı.",
        400,
        { requestId }
      );
    }

   return NextResponse.json({
      type: "photo",   // 🔥 EKLE
      success: true,
      results,
      warnings,
      meta: {
        requestId,
        durationMs: Date.now() - start,
      },
    });

  } catch (err) {
    console.error("UNEXPECTED_ERROR", err);

    return errorResponse(
      "SERVER_ERROR",
      "Beklenmeyen bir sunucu hatası oluştu.",
      500
    );
  }
}
