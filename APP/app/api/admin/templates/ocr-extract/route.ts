//APP\app\api\admin\templates\ocr-extract\route.ts
import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { getAdminContext } from "@/lib/admin/context";

export const runtime = "nodejs";

/* -----------------------------------------------------
   SAFE JSON EXTRACTOR (GEMINI FRIENDLY) + LOGS
----------------------------------------------------- */
function safeExtractJson(raw: string, stepLabel = "safeExtractJson"): any {
  if (!raw) {
    console.log(`[${stepLabel}] raw empty -> {}`);
    return {};
  }

  let t = raw
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();

  const first = t.indexOf("{");
  const last = t.lastIndexOf("}");

  console.log(
    `[${stepLabel}] rawLen=${raw.length} cleanedLen=${t.length} first={@${first}} last}=@${last}`
  );

  if (first === -1 || last === -1) {
    console.log(`[${stepLabel}] braces not found -> {}`);
    return {};
  }

  const slice = t.slice(first, last + 1);

  try {
    const parsed = JSON.parse(slice);
    const keys = parsed && typeof parsed === "object" ? Object.keys(parsed) : [];
    console.log(`[${stepLabel}] JSON.parse OK keys=${keys.join(",") || "(none)"}`);
    return parsed;
  } catch (e: any) {
    console.log(
      `[${stepLabel}] JSON.parse FAIL err=${e?.message || e} slicePreview=${slice.slice(
        0,
        300
      )}`
    );
    return {};
  }
}

/* -----------------------------------------------------
   HELPERS: TIMING + SAFE PREVIEW LOGGING
----------------------------------------------------- */
function msSince(start: bigint) {
  return Number(process.hrtime.bigint() - start) / 1e6;
}

function preview(text: string, n = 500) {
  if (!text) return "";
  return text.length <= n ? text : text.slice(0, n) + "…";
}

/* -----------------------------------------------------
   PREMIUM OCR (GEMINI ONLY) + FULL STEP LOGS
----------------------------------------------------- */
export async function POST(req: Request) {
  const reqStart = process.hrtime.bigint();
  console.log(`[OCR] POST start at=${new Date().toISOString()}`);

  // 0) Admin context
  console.log("[OCR] step0: getAdminContext()");
  const ctxStart = process.hrtime.bigint();
  const { org } = await getAdminContext();
  console.log(
    `[OCR] step0 done in=${msSince(ctxStart).toFixed(
      1
    )}ms orgId=${org?.id || "(none)"} is_premium=${org?.is_premium ?? "(unknown)"}`
  );

  // Premium gate
  if (!org?.is_premium) {
    console.log("[OCR] premium required -> 403");
    return NextResponse.json(
      { success: false, error: "PREMIUM_REQUIRED" },
      { status: 403 }
    );
  }

  try {
    // 1) Read form data
    console.log("[OCR] step1: req.formData()");
    const fdStart = process.hrtime.bigint();
    const form = await req.formData();
    console.log(`[OCR] step1 done in=${msSince(fdStart).toFixed(1)}ms`);

    const file = form.get("file") as File | null;

    // Validate file
    console.log(
      `[OCR] step1.1: file present=${!!file} type=${(file as any)?.type || "(n/a)"} name=${(file as any)?.name || "(n/a)"} size=${(file as any)?.size || "(n/a)"}`
    );

    if (!file) {
      console.log("[OCR] FILE_REQUIRED -> 400");
      return NextResponse.json(
        { success: false, error: "FILE_REQUIRED" },
        { status: 400 }
      );
    }

    // 2) Bufferize file
    console.log("[OCR] step2: buffer = Buffer.from(await file.arrayBuffer())");
    const bufStart = process.hrtime.bigint();
    const arrayBuf = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuf);
    console.log(
      `[OCR] step2 done in=${msSince(bufStart).toFixed(
        1
      )}ms bytes=${buffer.length}`
    );

    // base64 (log size only)
    const b64 = buffer.toString("base64");
    console.log(
      `[OCR] step2.1: base64Len=${b64.length} approxInflation=${(
        (b64.length / buffer.length) *
        100
      ).toFixed(1)}%`
    );

    // 3) Init Gemini model
    const modelName = process.env.GOOGLE_MODEL || "gemini-2.5-flash";
    const hasKey = !!process.env.GOOGLE_API_KEY;

    console.log(
      `[OCR] step3: init Gemini hasKey=${hasKey} model=${modelName}`
    );

    const aiStart = process.hrtime.bigint();
    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);
    const model = genAI.getGenerativeModel({ model: modelName });
    console.log(`[OCR] step3 done in=${msSince(aiStart).toFixed(1)}ms`);

    /* -----------------------------
       1️⃣ OCR RAW
    ----------------------------- */
    console.log("[OCR] step4: generateContent OCR RAW start");
    const ocrStart = process.hrtime.bigint();

    const ocrRes = await model.generateContent([
      {
        inlineData: {
          data: b64,
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
    console.log(
      `[OCR] step4 done in=${msSince(ocrStart).toFixed(
        1
      )}ms ocrRawLen=${ocrRaw.length} ocrRawPreview=${JSON.stringify(preview(ocrRaw, 500))}`
    );

    /* -----------------------------
       2️⃣ OCR CLEAN + SECTION JSON
    ----------------------------- */
    console.log("[OCR] step5: generateContent OCR CLEAN JSON start");
    const cleanStart = process.hrtime.bigint();

    const cleanPrompt = `
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
    `;

    console.log(
      `[OCR] step5 promptLen=${cleanPrompt.length} (includes OCR)`
    );

    const cleanRes = await model.generateContent(cleanPrompt);
    const cleanText = cleanRes.response.text();

    console.log(
      `[OCR] step5 done in=${msSince(cleanStart).toFixed(
        1
      )}ms cleanTextLen=${cleanText.length} cleanTextPreview=${JSON.stringify(preview(cleanText, 500))}`
    );

    console.log("[OCR] step5.1: safeExtractJson(cleanText)");
    const cleanJson = safeExtractJson(cleanText, "cleanJson");

    const sectionsCount = Array.isArray(cleanJson?.sections)
      ? cleanJson.sections.length
      : 0;

    console.log(
      `[OCR] step5.1 parsed sectionsCount=${sectionsCount}`
    );

    /* -----------------------------
       3️⃣ TEMPLATE BUILDER
    ----------------------------- */
    console.log("[OCR] step6: generateContent TEMPLATE JSON start");
    const tplStart = process.hrtime.bigint();

    const cleanJsonString = JSON.stringify(cleanJson);
    console.log(
      `[OCR] step6 input cleanJsonStringLen=${cleanJsonString.length}`
    );

    const templatePrompt = `
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
${cleanJsonString}
    `;

    console.log(
      `[OCR] step6 promptLen=${templatePrompt.length}`
    );

    const templateRes = await model.generateContent(templatePrompt);
    const templateText = templateRes.response.text();

    console.log(
      `[OCR] step6 done in=${msSince(tplStart).toFixed(
        1
      )}ms templateTextLen=${templateText.length} templateTextPreview=${JSON.stringify(preview(templateText, 500))}`
    );

    console.log("[OCR] step6.1: safeExtractJson(templateText)");
    const template = safeExtractJson(templateText, "templateJson");

    const fieldsCount = Array.isArray(template?.fields)
      ? template.fields.length
      : 0;

    console.log(
      `[OCR] step6.1 parsed templateName=${template?.name || "(none)"} fieldsCount=${fieldsCount}`
    );

    // 7) Response
    console.log(
      `[OCR] success totalMs=${msSince(reqStart).toFixed(1)}ms`
    );

    return NextResponse.json({
      success: true,
      ocr_raw: ocrRaw,
      ocr_clean: cleanJson,
      template,
    });
  } catch (err: any) {
    console.error("[OCR] GEMINI OCR ERROR:", {
      message: err?.message,
      name: err?.name,
      stack: err?.stack,
    });

    console.log(
      `[OCR] fail totalMs=${msSince(reqStart).toFixed(1)}ms`
    );

    return NextResponse.json(
      { success: false, error: "AI_PROCESS_FAILED" },
      { status: 500 }
    );
  }
}
