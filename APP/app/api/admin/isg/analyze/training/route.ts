// APP/app/api/admin/isg/analyze/training/route.ts
import { NextResponse } from "next/server";
import { getAdminContext } from "@/lib/admin/context";
import { GoogleGenerativeAI } from "@google/generative-ai";
import * as XLSX from "xlsx";

export const runtime = "nodejs";

/* ================= TYPES ================= */

type RiskLevel = "Düşük" | "Orta" | "Yüksek";
type OverallStatus = "Uygun" | "Kısmen Uygun" | "Uygun Değil";
type ParticipantStatus = "Geçerli" | "Süresi Yaklaşıyor" | "Süresi Dolmuş" | "Belirsiz";

type TrainingResponse = {
  summary: {
    overallStatus: OverallStatus;
    riskLevel: RiskLevel;
    note: string;
  };
  participants: Array<{
    name: string;
    status: ParticipantStatus;
    evidence?: string | null; // OCR/Belge satırı vb. kısa kanıt
  }>;
  missingTrainings: Array<{
    training: string;
    reason: "Süresi dolmuş" | "Eksik" | "Planlanmamış" | "Belirsiz";
    riskLevel: Exclude<RiskLevel, "Düşük">; // Orta | Yüksek
    relatedPeople?: string[]; // opsiyonel
  }>;
  suggestedPlan: Array<{
    training: string;
    targetGroup: string;
    duration: string; // ör: "8 saat"
    period: string; // ör: "Yıllık" | "2 yıl"
    suggestedMonth: string; // ör: "Ocak"
    note: string;
  }>;
  documents?: Array<{
    fileName: string;
    mimeType: string;
    used: boolean;
    note?: string | null;
  }>;
  warnings?: string[];
  requestId?: string;
};


  function parseExcelToText(buffer: Buffer): string {
    const workbook = XLSX.read(buffer, { type: "buffer" });

    let output = "";

    for (const sheetName of workbook.SheetNames) {
      const sheet = workbook.Sheets[sheetName];

      const rows = XLSX.utils.sheet_to_json<
        (string | number | boolean | null)[]
      >(sheet, { header: 1 });

      output += `\n[SHEET: ${sheetName}]\n`;

      for (const row of rows) {
        if (!Array.isArray(row)) continue;

        const line = row
          .map((cell: string | number | boolean | null) =>
            cell === null || cell === undefined
              ? ""
              : String(cell).trim()
          )
          .filter((v: string) => v.length > 0)
          .join(" | ");

        if (line) {
          output += line + "\n";
        }
      }
    }

    return output;
  }

/* ================= HELPERS ================= */

function makeRequestId() {
  return `tr_${Date.now()}_${Math.random().toString(16).slice(2, 10)}`;
}

function nowMs() {
  return Date.now();
}

function safeJsonParse<T>(raw: string): T | null {
  try {
    if (!raw) return null;

    // 1. Adım: Markdown bloklarını temizle ve gereksiz boşlukları at
    let clean = raw.replace(/```json|```/g, "").trim();

    // 2. Adım: Eğer AI JSON'dan önce veya sonra metin yazdıysa, sadece { ... } veya [ ... ] arasını al
    const startBrace = clean.indexOf('{');
    const startBracket = clean.indexOf('[');
    let firstTokenIdx = -1;

    if (startBrace !== -1 && (startBracket === -1 || startBrace < startBracket)) {
      firstTokenIdx = startBrace;
    } else {
      firstTokenIdx = startBracket;
    }

    if (firstTokenIdx !== -1) {
      const lastBrace = clean.lastIndexOf('}');
      const lastBracket = clean.lastIndexOf(']');
      const lastTokenIdx = Math.max(lastBrace, lastBracket);
      
      if (lastTokenIdx !== -1) {
        clean = clean.slice(firstTokenIdx, lastTokenIdx + 1);
      }
    }

    // 3. Adım: JSON içindeki görünmez kontrol karakterlerini ve hatalı satır sonlarını temizle
    // (Bazen Excel verisinden gelen karakterler JSON'u bozabilir)
    clean = clean.replace(/[\u0000-\u001F\u007F-\u009F]/g, "");

    return JSON.parse(clean) as T;
  } catch (error) {
    // Geliştirme aşamasında hatayı görmek için log ekliyoruz
    console.error("Critical JSON Parse Error:", {
      error: error instanceof Error ? error.message : String(error),
      rawSnippet: raw.slice(0, 100) + "..." // Sadece başını logla ki ekran dolmasın
    });
    return null;
  }
}

function clip(s: string, n = 800) {
  const str = String(s ?? "");
  return str.length > n ? `${str.slice(0, n)}…` : str;
}

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function isSupportedMime(mime: string) {
  return (
    mime.startsWith("image/") ||
    mime === "application/pdf" ||
    mime === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
    mime === "application/vnd.ms-excel"
  );
}


/* ================= ROUTE ================= */

export async function POST(req: Request) {
  const requestId = makeRequestId();
  const t0 = nowMs();

  console.log(`[ISG_TRAINING][${requestId}] ▶️ POST start`);
  console.log(`[ISG_TRAINING][${requestId}] runtime=${runtime}`);

  try {
    /* ===== 1) AUTH / ORG ===== */
    const tAuth = nowMs();
    console.log(`[ISG_TRAINING][${requestId}] 1) getAdminContext() starting`);
    const { org } = await getAdminContext();
    console.log(
      `[ISG_TRAINING][${requestId}] 1) getAdminContext() done in ${nowMs() - tAuth}ms`,
      { orgId: org?.id ?? null, isPremium: !!org?.is_premium }
    );

    if (!org?.is_premium) {
      console.warn(`[ISG_TRAINING][${requestId}] ❌ PREMIUM_REQUIRED`);
      return NextResponse.json(
        { error: "PREMIUM_REQUIRED", requestId },
        { status: 403 }
      );
    }

    /* ===== 2) READ FORM ===== */
    const tForm = nowMs();
    console.log(`[ISG_TRAINING][${requestId}] 2) req.formData() starting`);
    const form = await req.formData();
    console.log(
      `[ISG_TRAINING][${requestId}] 2) req.formData() done in ${nowMs() - tForm}ms`
    );

    /* ===== 3) GET FILES ===== */
    const tFiles = nowMs();
    console.log(`[ISG_TRAINING][${requestId}] 3) form.getAll("files") starting`);
    const files = form.getAll("files") as File[];
    console.log(
      `[ISG_TRAINING][${requestId}] 3) files received in ${nowMs() - tFiles}ms`,
      {
        count: files.length,
        names: files.map((f) => f?.name),
        types: files.map((f) => f?.type),
        sizes: files.map((f) => f?.size),
      }
    );

    if (!files?.length) {
      console.warn(`[ISG_TRAINING][${requestId}] ❌ FILES_REQUIRED`);
      return NextResponse.json(
        { error: "FILES_REQUIRED", message: "En az 1 dosya yüklemelisiniz.", requestId },
        { status: 400 }
      );
    }

    // Guardrails (kullanıcı deneyimi)
    const MAX_FILES = 6;
    const MAX_FILE_MB = 12;
    const MAX_TOTAL_MB = 30;

    if (files.length > MAX_FILES) {
      console.warn(`[ISG_TRAINING][${requestId}] ❌ TOO_MANY_FILES`, {
        max: MAX_FILES,
        got: files.length,
      });
      return NextResponse.json(
        {
          error: "TOO_MANY_FILES",
          message: `En fazla ${MAX_FILES} dosya yükleyebilirsiniz.`,
          requestId,
        },
        { status: 400 }
      );
    }

    const totalBytes = files.reduce((a, f) => a + (f?.size ?? 0), 0);
    const totalMb = totalBytes / 1024 / 1024;

    if (totalMb > MAX_TOTAL_MB) {
      console.warn(`[ISG_TRAINING][${requestId}] ❌ TOTAL_TOO_LARGE`, {
        totalMb: Number(totalMb.toFixed(2)),
        maxTotalMb: MAX_TOTAL_MB,
      });
      return NextResponse.json(
        {
          error: "TOTAL_TOO_LARGE",
          message: `Toplam dosya boyutu ${MAX_TOTAL_MB} MB’ı aşamaz.`,
          requestId,
        },
        { status: 400 }
      );
    }

    const warnings: string[] = [];
    const docsMeta: TrainingResponse["documents"] = [];

    /* ===== 4) READ BUFFERS & BUILD PARTS ===== */
    console.log(`[ISG_TRAINING][${requestId}] 4) buffers+parts building starting`);
    const tParts = nowMs();

    const parts: any[] = [];
    let usedCount = 0;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      const tag = `[ISG_TRAINING][${requestId}][file#${i + 1}/${files.length}][${file?.name}]`;

      if (!file) {
        warnings.push(`Dosya okunamadı (null/undefined).`);
        console.warn(`${tag} ⚠️ file missing`);
        continue;
      }

      const sizeMb = file.size / 1024 / 1024;

      console.log(`${tag} 📄 meta`, { type: file.type, sizeMb: Number(sizeMb.toFixed(2)) });

      if (!isSupportedMime(file.type)) {
        warnings.push(`${file.name} analiz edilmedi (sadece PDF veya fotoğraf desteklenir).`);
        docsMeta?.push({
          fileName: file.name,
          mimeType: file.type || "unknown",
          used: false,
          note: "Desteklenmeyen dosya türü",
        });
        console.warn(`${tag} ⚠️ unsupported mime`);
        continue;
      }

      if (sizeMb > MAX_FILE_MB) {
        warnings.push(`${file.name} analiz edilmedi (dosya ${MAX_FILE_MB} MB sınırını aşıyor).`);
        docsMeta?.push({
          fileName: file.name,
          mimeType: file.type,
          used: false,
          note: `Dosya boyutu ${MAX_FILE_MB} MB sınırını aşıyor`,
        });
        console.warn(`${tag} ⚠️ file too large`);
        continue;
      }

      console.log(`${tag} 4.1) arrayBuffer -> Buffer starting`);
      const tBuf = nowMs();
      const buffer = Buffer.from(await file.arrayBuffer());
      console.log(`${tag} 4.1) buffer ready in ${nowMs() - tBuf}ms`, { bytes: buffer.length });

      const isExcel =
        file.type === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
        file.type === "application/vnd.ms-excel";

      if (isExcel && buffer.length > 3 * 1024 * 1024) {
        warnings.push(`${file.name} çok büyük olduğu için analiz edilmedi.`);
        continue;
      }


      if (isExcel) {
        const excelText = parseExcelToText(buffer);

        if (!excelText.trim()) {
          warnings.push(`${file.name} okunamadı (Excel içeriği boş).`);
          docsMeta?.push({
            fileName: file.name,
            mimeType: file.type,
            used: false,
            note: "Excel içeriği okunamadı",
          });
          continue;
        }

        parts.push(
          `\n\n[EXCEL_DOC_${i + 1}] fileName="${file.name}"\n${excelText}\n`
        );

        docsMeta?.push({
          fileName: file.name,
          mimeType: file.type,
          used: true,
          note: "Excel metin olarak analiz edildi",
        });

        usedCount++;
        continue;
      }

        // 🔴 PDF / GÖRSEL / WORD → Vision / Document
        parts.push({
          inlineData: {
            data: buffer.toString("base64"),
            mimeType: file.type,
          },
        });


      // Dosya etiket metni: modelin çoklu belgeyi ayırt etmesi için
      parts.push(
        `\n\n[DOC_${i + 1}] fileName="${file.name}" mimeType="${file.type}"\n`
      );

      docsMeta?.push({ fileName: file.name, mimeType: file.type, used: true, note: null });
      usedCount++;
    }

    console.log(
      `[ISG_TRAINING][${requestId}] 4) parts ready in ${nowMs() - tParts}ms`,
      { usedCount, warningsCount: warnings.length }
    );

    if (!usedCount) {
      console.warn(`[ISG_TRAINING][${requestId}] ❌ NO_SUPPORTED_FILES`);
      return NextResponse.json(
        {
          error: "NO_SUPPORTED_FILES",
          message: "Analiz edilebilir dosya bulunamadı. Lütfen PDF veya fotoğraf yükleyin.",
          warnings,
          requestId,
        },
        { status: 400 }
      );
    }

    /* ===== 5) GEMINI INIT ===== */
    const tAIInit = nowMs();
    console.log(`[ISG_TRAINING][${requestId}] 5) Gemini init starting`);

    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      console.error(`[ISG_TRAINING][${requestId}] ❌ GOOGLE_API_KEY missing`);
      return NextResponse.json(
        { error: "SERVER_MISCONFIG", message: "Sunucu ayarı eksik (API key).", requestId },
        { status: 500 }
      );
    }

    const modelName = process.env.GOOGLE_MODEL || "gemini-2.5-flash";
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: modelName });

    console.log(
      `[ISG_TRAINING][${requestId}] 5) Gemini init done in ${nowMs() - tAIInit}ms`,
      { modelName, hasApiKey: true }
    );

/* ===== 7) ÇOKLU BELGE DESTEKLİ PROFESYONEL İSG DENETÇİSİ PROMPT ===== */
const prompt = `
ROL:
Sen, T.C. Çalışanların İş Sağlığı ve Güvenliği Eğitimlerinin Usul ve Esasları Hakkında Yönetmelik konusunda uzman, kıdemli bir İSG BAŞ DENETÇİSİSİN.

AMACIN:
Yüklenen farklı formattaki belgeleri (Excel planlar, PDF sertifikalar, fotoğraf formatındaki katılım listeleri vb.) bir bütün olarak analiz etmek ve işletmenin "Yasal Eğitim Uyumluluk Raporu"nu oluşturmaktır.

ÇOKLU BELGE ANALİZ MANTIĞI:
- ÇAPRAZ KONTROL: Eğer bir belge "Plan" (Excel/PDF) ve diğeri "Kanıt/Sertifika" (Görsel/PDF) ise, bu ikisini eşleştir. Planlanan bir eğitimin kanıtı varsa statüsünü "Geçerli" yap.
- VERİ ÖNCELİĞİ: Islak imzalı katılım listeleri veya resmi sertifikalar (Görsel/PDF), Excel'deki beyanlardan daha yüksek kanıt değerine sahiptir.
- TUTARSIZLIK TESPİTİ: Planda görünen ancak kanıtı (sertifikası/listesi) bulunmayan eğitimleri "Planlanmış Ancak Kanıt Eksik" veya "Süresi Dolmuş" olarak işaretle.

ZORUNLU ANALİZ KURALLARI (summary.note İÇİN):
- Eğer bir eğitim takvimi (aylar) boşsa veya planlanan eğitimlerin yasal kanıtı (katılım listesi vb.) yüklenmemişse, "summary.note" alanını şu 3 aşamalı yapı ile doldur:
  1. TESPİT: Belgeler arasındaki ilişkiyi açıkla (Örn: "Yıllık plan sunulmuş ancak 29 zorunlu eğitim başlığı için kanıtlayıcı belge/katılım listesi bulunamamıştır.")
  2. YASAL RİSK: "6331 Sayılı Kanun uyarınca, takvimlendirilmemiş veya kanıtlanamayan eğitimler denetimlerde 'Geçersiz' sayılır. Bu durum, olası bir iş kazasında işverenin 'Eğitim Yükümlülüğünü Yerine Getirmediği' gerekçesiyle tam kusurlu sayılmasına ve ağır idari para cezalarına yol açabilir."
  3. ÇÖZÜM: "Denetron, yasal riskinizi bertaraf etmek için eksik olan tüm başlıkları kapsayan profesyonel bir takvim önerisi oluşturmuştur. Bu planın onaylanarak sistem üzerinden takibinin yapılması hayati önemdedir."
- DİL: Ciddi, otoriter, kurumsal ve ikna edici bir denetçi dili kullan.

DEĞERLENDİRME PRENSİPLERİ:
- Tehlike Sınıfı Periyotları: Çok Tehlikeli (1 yıl), Tehlikeli (2 yıl), Az Tehlikeli (3 yıl). Belgede tehlike sınıfı yoksa "Az Tehlikeli" varsay ama notta belirt.
- Süre Kontrolü: İSG eğitimlerinin yönetmelikteki minimum saatlerine (8, 12, 16 saat) uygunluğunu denetle.

JSON FORMAT KURALLARI (Sadece JSON üret):
{
  "summary": {
    "overallStatus": "string",
    "riskLevel": "string",
    "note": "string (TALİMATLARDAKİ YASAL VURGULU VE DETAYLI DENETÇİ NOTU BURAYA GELECEK)"
  },
  "participants": [
    {
      "name": "string",
      "status": "string",
      "evidence": "string"
    }
  ],
  "missingTrainings": [
    {
      "training": "string",
      "reason": "string",
      "riskLevel": "string",
      "relatedPeople": []
    }
  ],
  "suggestedPlan": [
    {
      "training": "string",
      "targetGroup": "string",
      "duration": "string",
      "period": "string",
      "suggestedMonth": "string",
      "note": "string"
    }
  ]
}
`.trim();


    console.log(`[ISG_TRAINING][${requestId}] 6) prompt ready`, {
      promptChars: prompt.length,
    });

    /* ===== 7) GEMINI CALL (WITH RETRY) ===== */
    console.log(`[ISG_TRAINING][${requestId}] 7) Gemini generateContent starting`);
    const tGen = nowMs();

    const MAX_RETRIES = 2; // 0,1,2 => toplam 3 deneme
    let lastErr: any = null;
    let rawText = "";

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        console.log(`[ISG_TRAINING][${requestId}] 7) AI_CALL_ATTEMPT`, { attempt });

        const aiRes = await model.generateContent([...parts, prompt]);
        rawText = aiRes.response.text();

        console.log(`[ISG_TRAINING][${requestId}] 7) AI_CALL_OK`, {
          attempt,
          rawChars: rawText.length,
          rawSample: clip(rawText, 500),
        });
        lastErr = null;
        break;
      } catch (e: any) {
        lastErr = e;
        const status = e?.status ?? e?.response?.status ?? null;
        const msg = e?.message ?? String(e);

        console.error(`[ISG_TRAINING][${requestId}] ❌ AI_CALL_FAIL`, {
          attempt,
          status,
          message: msg,
        });

        // Model overloaded / transient => retry
        const isRetryable = status === 429 || status === 503 || /overloaded/i.test(msg);
        if (attempt < MAX_RETRIES && isRetryable) {
          const backoff = 600 * (attempt + 1);
          console.log(`[ISG_TRAINING][${requestId}] 7) retrying after ${backoff}ms`);
          await delay(backoff);
          continue;
        }
        break;
      }
    }

    console.log(`[ISG_TRAINING][${requestId}] 7) Gemini done in ${nowMs() - tGen}ms`);

    if (lastErr) {
      return NextResponse.json(
        {
          error: "AI_UNAVAILABLE",
          message:
            "Analiz servisi şu anda yoğun veya geçici olarak erişilemiyor. Lütfen tekrar deneyin.",
          warnings,
          requestId,
        },
        { status: 503 }
      );
    }

    /* ===== 8) PARSE JSON ===== */
    console.log(`[ISG_TRAINING][${requestId}] 8) parsing AI JSON`);
    const parsed = safeJsonParse<TrainingResponse>(rawText);

    if (!parsed) {
      console.error(`[ISG_TRAINING][${requestId}] ❌ AI_JSON_PARSE_FAIL`, {
        rawSample: clip(rawText, 1200),
      });

      return NextResponse.json(
        {
          error: "AI_JSON_PARSE_FAIL",
          message:
            "Analiz çıktısı okunamadı (JSON formatı bozuk). Lütfen aynı belgeyle tekrar deneyin.",
          debug: { rawSample: clip(rawText, 800) },
          warnings,
          requestId,
        },
        { status: 502 }
      );
    }

    console.log(`[ISG_TRAINING][${requestId}] ✅ AI_JSON_PARSED`, {
      participants: parsed.participants?.length ?? 0,
      missingTrainings: parsed.missingTrainings?.length ?? 0,
      suggestedPlan: parsed.suggestedPlan?.length ?? 0,
    });

    /* ===== 9) NORMALIZE / ATTACH META ===== */
    const normalized: TrainingResponse = {
      summary: {
        // AI'dan gelen veriyi öncelikli yap, yoksa fallback değerlerini kullan
        overallStatus: parsed.summary?.overallStatus || "Kısmen Uygun",
        riskLevel: parsed.summary?.riskLevel || "Orta",
        // Profesyonel notu ezen kısmı sildik, AI notu artık doğrudan ekrana gelecek
        note: parsed.summary?.note || "Analiz tamamlandı, değerlendirme notu hazırlanırken bir hata oluştu.",
      },
      participants: Array.isArray(parsed.participants) ? parsed.participants : [],
      missingTrainings: Array.isArray(parsed.missingTrainings) ? parsed.missingTrainings : [],
      suggestedPlan: Array.isArray(parsed.suggestedPlan) ? parsed.suggestedPlan : [],
      documents: docsMeta,
      warnings,
      requestId,
    };

    console.log(`[ISG_TRAINING][${requestId}] ✅ success`, {
      totalMs: nowMs() - t0,
      docsUsed: usedCount,
      warningsCount: warnings.length,
    });

    return NextResponse.json(normalized);
  } catch (err: any) {
    console.error(`[ISG_TRAINING][${requestId}] 🔥 UNHANDLED_ERROR`, {
      message: err?.message ?? String(err),
      stack: err?.stack ? clip(err.stack, 1200) : null,
    });

    return NextResponse.json(
      {
        error: "INTERNAL_ERROR",
        message: "Beklenmeyen bir hata oluştu. Lütfen tekrar deneyin.",
        requestId,
      },
      { status: 500 }
    );
  }
}
