// APP/app/api/admin/isg/analyze/annual-plan/route.ts
import { NextResponse } from "next/server";
import { supabaseServerClient } from "@/lib/supabase/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { seedExecutions } from "./_seedExecutions";
import { runOCR } from "@/lib/ocr/googleVision";


type ExtractedDoc = {
  name: string;
  type: string;
  kind: DocKind;
  text: string;
  ocrMeta?: {
    avgConfidence: number;
    lowConfidenceRatio: number;
    warnings: string[];
  };
};

export const runtime = "nodejs";

/* ================================================================== */
/* LOG HELPERS                                                         */
/* ================================================================== */
type LogLevel = "info" | "warn" | "error";
function baseLog(level: LogLevel, step: string, data?: any) {
  const ts = new Date().toISOString();
  const prefix = `[ANNUAL_PLAN][${ts}]`;
  if (data !== undefined) {
    // eslint-disable-next-line no-console
    console[level](`${prefix} ${step}`, data);
  } else {
    // eslint-disable-next-line no-console
    console[level](`${prefix} ${step}`);
  }
}
const log = (s: string, d?: any) => baseLog("info", s, d);
const warn = (s: string, d?: any) => baseLog("warn", s, d);
const errlog = (s: string, d?: any) => baseLog("error", s, d);


/* ================================================================== */
/* TYPES                                                               */
/* ================================================================== */
type PlanResult = {
  year: number;
  summary: {
    generalStatus: "Uygun" | "Kısmen Uygun" | "Uygun Değil" | string;
    riskLevel: "Düşük" | "Orta" | "Yüksek" | string;
    auditorOpinion: string;
    criticalFindings: string[];
    requiredActions: string[];
  };
  items: Array<{
    activity: string;
    period: string;
    months: string[];
    status: string;
    riskLevel: string;
    auditorNote: string;
  }>;
};

/* ================================================================== */
/* SAFE JSON PARSER                                                    */
/* ================================================================== */
function safeJsonParse(raw: string) {
  const preview = String(raw || "").slice(0, 1500);
  log("🧪 AI_RAW_OUTPUT (first 1500 chars)", preview);

  const cleaned = String(raw || "").replace(/```json|```/gi, "").trim();
  // ilk { ile son } arasını al
  const first = cleaned.indexOf("{");
  const last = cleaned.lastIndexOf("}");
  if (first === -1 || last === -1 || last <= first) {
    throw new Error("AI_JSON_BODY_NOT_FOUND");
  }

  const jsonBody = cleaned.slice(first, last + 1);
  try {
    return JSON.parse(jsonBody);
  } catch (e) {
    errlog("❌ AI_JSON_PARSE_ERROR", { message: (e as any)?.message });
    throw new Error("AI_JSON_PARSE_ERROR");
  }
}

function docKindToLabel(kind: DocKind) {
  switch (kind) {
    case "EGITIM_PLANI":
      return "İSG Yıllık Eğitim Planı";
    case "CALISMA_PLANI":
      return "İSG Yıllık Çalışma Planı";
    case "EK2":
      return "EK-2 Yıllık Değerlendirme Raporu";
    default:
      return undefined; // 👈 zorlamıyoruz
  }
}


/* ================================================================== */
/* NORMALIZER – UI güvenliği                                            */
/* ================================================================== */
function normalizePlan(parsed: any): PlanResult {
  const year =
    typeof parsed?.year === "number" && Number.isFinite(parsed.year)
      ? parsed.year
      : new Date().getFullYear();

  const summary = parsed?.summary || {};
  const items = Array.isArray(parsed?.items) ? parsed.items : [];

  const safeStr = (v: any) => (typeof v === "string" ? v : "");
  const safeArr = (v: any) =>
    Array.isArray(v) ? v.filter((x) => typeof x === "string" && x.trim()) : [];

  return {
    year,
    summary: {
      generalStatus: safeStr(summary.generalStatus).trim() || "Kısmen Uygun",
      riskLevel: safeStr(summary.riskLevel).trim() || "Orta",
      auditorOpinion: safeStr(summary.auditorOpinion),
      criticalFindings: safeArr(summary.criticalFindings),
      requiredActions: safeArr(summary.requiredActions),
    },
    items: items.map((i: any) => ({
      activity: safeStr(i?.activity),
      period: safeStr(i?.period).trim() || "Yıllık",
      months: safeArr(i?.months),
      status: safeStr(i?.status).trim() || "Planlı",
      riskLevel: safeStr(i?.riskLevel).trim() || "Orta",
      auditorNote: safeStr(i?.auditorNote),
    })),
  };
}

/* ================================================================== */
/* DOCUMENT CLASSIFIER (labeling)                                      */
/* ================================================================== */
type DocKind = "EGITIM_PLANI" | "CALISMA_PLANI" | "EK2" | "GENEL";

function classifyDocument(text: string): DocKind {
  const t = (text || "").toUpperCase();

  if (t.includes("YILLIK İSG EĞİTİM PLANI") || t.includes("YILLIK ISG EGITIM PLANI"))
    return "EGITIM_PLANI";

  if (t.includes("YILLIK ÇALIŞMA PLANI") || t.includes("YILLIK CALISMA PLANI"))
    return "CALISMA_PLANI";

  if (t.includes("EK-2") || t.includes("YILLIK DEĞERLENDİRME") || t.includes("YILLIK DEGERLENDIRME"))
    return "EK2";

  return "GENEL";
}

/* ================================================================== */
/* TEXT EXTRACTION (REAL OCR for images + CONFIDENCE)                 */
/* ================================================================== */
async function extractText(file: File): Promise<{
  name: string;
  type: string;
  kind: DocKind;
  text: string;
  ocrMeta?: {
    avgConfidence: number;
    lowConfidenceRatio: number;
    warnings: string[];
  };
}> {
  const meta = { name: file.name, type: file.type || "unknown", size: file.size };
  log("📄 EXTRACT_TEXT_START", meta);

  const buffer = Buffer.from(await file.arrayBuffer());

  /* ---------------- IMAGE → OCR ---------------- */
  if (file.type?.startsWith("image/")) {
    log("🔍 OCR_IMAGE_START", { name: file.name });

    const ocr = await runOCR(buffer);

    log("🔍 OCR_IMAGE_DONE", {
      name: file.name,
      chars: ocr.text.length,
      avgConfidence: Number(ocr.avgConfidence.toFixed(3)),
      lowConfidenceRatio: Number(ocr.lowConfidenceRatio.toFixed(3)),
      warnings: ocr.warnings,
    });

    const kind = classifyDocument(ocr.text);

    return {
      name: file.name,
      type: file.type,
      kind,
      text: ocr.text.trim(),
      ocrMeta: {
        avgConfidence: ocr.avgConfidence,
        lowConfidenceRatio: ocr.lowConfidenceRatio,
        warnings: ocr.warnings,
      },
    };
  }

  /* ---------------- TEXT FILES ---------------- */
  const isLikelyText =
    file.type?.startsWith("text/") ||
    /\.(txt|csv|md|json)$/i.test(file.name);

  if (isLikelyText) {
    const text = buffer.toString("utf-8");
    const kind = classifyDocument(text);

    log("📄 TEXT_FILE_DONE", {
      name: file.name,
      chars: text.length,
      kind,
    });

    return {
      name: file.name,
      type: file.type,
      kind,
      text,
    };
  }

  /* ---------------- OTHER BINARIES ---------------- */
  // PDF / DOCX / XLSX vb. için şimdilik bilinçli placeholder
  const placeholder =
    `[BINARY_DOSYA] ${file.name} (${file.type || "unknown"}) — ` +
    `Bu dosya türü için metin çıkarımı (PDF/DOCX/XLSX parser veya OCR) henüz etkin değil.`;

  const kind = classifyDocument(placeholder);

  log("📄 BINARY_PLACEHOLDER_DONE", {
    name: file.name,
    kind,
    chars: placeholder.length,
  });

  return {
    name: file.name,
    type: file.type,
    kind,
    text: placeholder,
  };
}

/* ================================================================== */
/* SIZE / TOKEN GUARDS                                                 */
/* ================================================================== */
function truncateByChars(input: string, maxChars: number) {
  if (input.length <= maxChars) return input;
  warn("⚠️ INPUT_TRUNCATED", { before: input.length, after: maxChars });
  return input.slice(0, maxChars);
}

/* ================================================================== */
/* GEMINI SETUP                                                        */
/* ================================================================== */
const apiKey = process.env.GOOGLE_API_KEY;
const modelName = process.env.GOOGLE_MODEL || "gemini-2.5-flash";


if (!apiKey) {
  warn("⚠️ GOOGLE_API_KEY_MISSING");
}

const genAI = new GoogleGenerativeAI(apiKey || "MISSING_KEY");
const models = {
  fast: genAI.getGenerativeModel({
    model: process.env.GOOGLE_MODEL || "gemini-2.5-flash",
  }),
  robust: genAI.getGenerativeModel({
    model: process.env.GOOGLE_MODEL_ROBUST || "gemini-1.5-pro-latest",
  }),
};

/* ================================================================== */
/* GEMINI CALL WITH BACKOFF (429)                                      */
/* ================================================================== */
function parseRetryDelaySeconds(e: any) {
  // Gemini errorDetails içinde retryDelay: "38s" gibi gelebiliyor.
  const details = e?.errorDetails;
  if (!Array.isArray(details)) return null;
  const retryInfo = details.find((x) => typeof x?.retryDelay === "string");
  if (!retryInfo?.retryDelay) return null;
  const s = String(retryInfo.retryDelay).replace("s", "");
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

async function runWithRetry(
  model: any,
  prompt: string,
  maxRetries: number
) {
  let attempt = 0;

  while (attempt <= maxRetries) {
    try {
      log("🤖 AI_CALL_ATTEMPT", { attempt });
      const res = await model.generateContent(prompt);
      log("🤖 AI_CALL_OK", { attempt });
      return res;
    } catch (e: any) {
      const status = e?.status ?? e?.response?.status;
      const msg = e?.message || "AI_CALL_FAILED";
      errlog("🤖 AI_CALL_ERROR", { attempt, status, msg });

      if (status === 429 && attempt < maxRetries) {
        const retryDelay =
          parseRetryDelaySeconds(e) ?? (20 + attempt * 10);

        warn("⏳ AI_RATE_LIMIT_BACKOFF", {
          retryDelaySec: retryDelay,
          nextAttempt: attempt + 1,
        });

        await new Promise((r) =>
          setTimeout(r, retryDelay * 1000)
        );
        attempt++;
        continue;
      }

      throw e;
    }
  }

  throw new Error("AI_CALL_RETRY_EXHAUSTED");
}


async function runAI(
  prompt: string,
  maxRetries: number
): Promise<{ response: any; modelUsed: "fast" | "robust" }> {
  log("🤖 AI_PIPELINE_START", {
    promptChars: prompt.length,
    strategy: "fast → robust",
  });

  /* ================= FAST MODEL ================= */
  try {
    log("🤖 AI_FAST_MODEL_START", { model: "gemini-2.5-flash" });
    const res = await runWithRetry(models.fast, prompt, maxRetries);
    log("🤖 AI_FAST_MODEL_OK");
    return { response: res, modelUsed: "fast" };
  } catch (e: any) {
    const status = e?.status ?? e?.response?.status;
    warn("⚠️ AI_FAST_MODEL_FAILED", {
      status,
      message: e?.message,
    });

    // Sadece servis / kota problemlerinde fallback
    if (![429, 503].includes(status)) {
      throw e;
    }
  }

  /* ================= ROBUST MODEL ================= */
  try {
    log("🤖 AI_ROBUST_MODEL_START", { model: "gemini-1.5-pro" });
    const res = await runWithRetry(models.robust, prompt, 1);
    log("🤖 AI_ROBUST_MODEL_OK");
    return { response: res, modelUsed: "robust" };
  } catch (e: any) {
    errlog("❌ AI_ROBUST_MODEL_FAILED", {
      status: e?.status,
      message: e?.message,
    });
    throw e;
  }
}

/* ================================================================== */
/* PROMPT BUILDER (REAL AUDITOR)                                       */
/* ================================================================== */
function buildPrompt(labeledText: string) {
  return `
ROLÜN:
Sen Çalışma ve Sosyal Güvenlik Bakanlığı denetimlerine giren,
en az 15 yıl saha deneyimi olan bir İŞ SAĞLIĞI VE GÜVENLİĞİ DENETÇİSİSİN.

AMAÇ:
Kullanıcı tarafından yüklenen İSG belgelerini inceleyerek,
gerçek bir resmi denetim öncesinde yapılacak
DENETİM HAZIRLIK ANALİZİNİ oluşturmak.

Bu analiz;
- Mevcut planların denetimde nasıl değerlendirileceğini,
- Nerelerde risk oluşabileceğini,
- Hangi noktaların düzeltilmesi gerektiğini
denetçi bakış açısıyla kullanıcıya rehberlik edecek şekilde hazırlanmalıdır.

────────────────────────
İNCELEME KAPSAMI
────────────────────────

ZORUNLU:
- İSG Yıllık Çalışma Planı
- İSG Yıllık Eğitim Planı

OPSİYONEL:
- EK-2 Yıllık Değerlendirme Raporu
(Eğer mevcutsa, sadece karşılaştırma ve bağlam amacıyla kullanılır.
EK-2 yoksa eksiklik olarak değerlendirilmez.)

────────────────────────
ÖNEMLİ BAĞLAM
────────────────────────

- Belgeler OCR yöntemiyle metne dönüştürülmüştür.
- Metinlerde eksiklik, okunamayan alanlar veya kopukluklar olabilir.
- OCR kaynaklı belirsizliklerde bunu açıkça belirt.
- Varsayım yapma, yalnızca metinde görülen bilgilere dayan.

────────────────────────
DENETİM YAKLAŞIMI (KESİN KURALLAR)
────────────────────────

1. TEKRAR YASAK:
- Aynı eksiklik birden fazla faaliyeti etkiliyorsa:
  → TEK KRİTİK BULGU olarak yaz
  → Faaliyet notlarında sadece referans ver

2. KRİTİK BULGU SAYILACAK DURUMLAR:
- Risk değerlendirmesi faaliyetinin ilgili yılın OCAK ayına açıkça bağlanmaması
- Çalışan İSG eğitimlerinin (Genel / Sağlık / Teknik) OCAK ayına açıkça bağlanmaması
- Eğitim sürelerinin işyeri risk sınıfı ile ilişkilendirilememesi

3. KRİTİK SAYILMAYACAK DURUMLAR:
(Bunlar için sadece denetçi notu yaz)
- Ay bilgisi olmayan ancak periyodu mevzuata uygun faaliyetler
- “Sürekli”, “Belirli periyot” ifadeleri
- Önceki yılda yapıldığı açıkça görülen ve süreklilik arz eden uygulamalar

4. VAR OLANI KORU:
- Bir faaliyet mevzuata uygun ve planlıysa:
  → BULGU ÜRETME
  → “Planlı ve mevzuata uygun” şeklinde not düş

5. AKSİYON SINIRI:
- requiredActions alanında:
  → En fazla 5 aksiyon üret
  → Aynı aksiyonu farklı cümlelerle tekrar etme
  → Aksiyonlar kullanıcının planı düzeltmesine yardımcı olacak kadar net olsun

────────────────────────
ÜSLUP VE TON
────────────────────────

- Resmi
- Sakin
- Rehberlik edici
- Suçlayıcı veya tehditkâr dil kullanma
- Denetçi gibi konuş, danışman gibi yönlendir

────────────────────────
ÇIKTI KURALLARI
────────────────────────

SADECE JSON ÜRET.
Başlık, markdown, açıklama veya ek metin YAZMA.

────────────────────────
JSON FORMAT
────────────────────────

{
  "year": 2026,
  "summary": {
    "generalStatus": "Uygun | Kısmen Uygun | Uygun Değil",
    "riskLevel": "Düşük | Orta | Yüksek",
    "auditorOpinion": "Tek paragraf, bütüncül denetçi değerlendirmesi",
    "criticalFindings": [
      "Tekrar etmeyen, gerçekten denetimde sorun yaratacak kritik bulgular"
    ],
    "requiredActions": [
      "Kritik bulgulara karşılık gelen, uygulanabilir düzeltme aksiyonları"
    ]
  },
  "items": [
    {
      "activity": "Faaliyet adı",
      "period": "Yıllık / Aylık / 2 Yıl vb.",
      "months": ["Ocak"] | [],
      "status": "Planlı | Belirsiz | Muaf",
      "riskLevel": "Düşük | Orta | Yüksek",
      "auditorNote": "Bu faaliyete özgü, kısa ve net denetçi yorumu"
    }
  ]
}

────────────────────────
İNCELEME METNİ (ETİKETLİ)
────────────────────────
${labeledText}
`.trim();
}


/* ================================================================== */
/* LABEL + MERGE                                                       */
/* ================================================================== */
function buildLabeledCorpus(docs: Array<{ name: string; kind: DocKind; text: string }>) {
  // Aynı tür birden fazla dosya varsa birlikte ver.
  const order: DocKind[] = ["EGITIM_PLANI", "CALISMA_PLANI", "EK2", "GENEL"];

  const grouped = new Map<DocKind, Array<{ name: string; text: string }>>();
  for (const d of docs) {
    if (!grouped.has(d.kind)) grouped.set(d.kind, []);
    grouped.get(d.kind)!.push({ name: d.name, text: d.text });
  }

  let out = "";
  for (const k of order) {
    const list = grouped.get(k);
    if (!list?.length) continue;

    out += `\n[${k}]\n`;
    for (const f of list) {
      out += `--- FILE: ${f.name} ---\n`;
      out += `${f.text}\n`;
      out += `--- END FILE ---\n`;
    }
  }

  return out.trim();
}

/* ================================================================== */
/* FALLBACK (AI unavailable)                                           */
/* - UI boş kalmasın; ayrıca kullanıcıya "OCR/PDF parse durumu"          */
/* ================================================================== */
function fallbackAnalysis(year: number, note?: string): PlanResult {
  return {
    year,
    summary: {
      generalStatus: "Kısmen Uygun",
      riskLevel: "Orta",
      auditorOpinion:
        (note ? `${note} ` : "") +
        "Analiz, kural bazlı denetçi kontrol listesine göre oluşturulmuştur. " +
        "Eğitim ve çalışma planlarında ay bazlı izlenebilirlik denetimde en sık sorgulanan alanlardandır.",
      criticalFindings: [
        "Risk değerlendirmesi ve/veya çalışan İSG eğitimlerinin Ocak ayına açık şekilde bağlandığı doğrulanamadı.",
        "Ay bilgisi içermeyen ifadeler (örn. “SÜREKLİ”, “GEREKTİĞİNDE”) denetimde açıklama gerektirir.",
      ],
      requiredActions: [
        "Risk değerlendirmesi ve çalışan İSG eğitimlerini Ocak ayına açık ve net şekilde bağlayın.",
        "“SÜREKLİ / GEREKTİĞİNDE” ifadelerini ay bazlı planlamaya çevirin (en az bir ana ay belirtin).",
        "Aylık izlenebilirlik için faaliyet–kanıt eşleştirmesi kurun (tutanak, katılım listesi, ölçüm raporu vb.).",
      ],
    },
    items: [],
  };
}



/* ================================================================== */
/* ROUTE                                                               */
/* ================================================================== */
export async function POST(req: Request) {
  const startedAt = Date.now();
  log("🚀 ANALYZE_START");

  const supabase = supabaseServerClient();

  /* ---------------- AUTH ---------------- */
  log("🔐 AUTH_CHECK_START");
  const { data: authData, error: authErr } = await supabase.auth.getUser();
  if (authErr) warn("🔐 AUTH_CHECK_ERROR", authErr);

  const user = authData?.user;
  if (!user) {
    warn("⛔ UNAUTHORIZED");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  log("👤 AUTH_OK", { userId: user.id });

  /* ---------------- ORG ---------------- */
  log("🏢 ORG_RESOLVE_START");
  const { data: profile, error: profErr } = await supabase
    .from("profiles")
    .select("organization_id")
    .eq("id", user.id)
    .single();

  if (profErr) {
    errlog("🏢 ORG_RESOLVE_DB_ERROR", profErr);
    return NextResponse.json({ error: "ORG_RESOLUTION_FAILED" }, { status: 500 });
  }

  const orgId = profile?.organization_id;
  if (!orgId) {
    warn("❌ ORG_NOT_FOUND_FOR_USER", { userId: user.id });
    return NextResponse.json({ error: "ORG_NOT_FOUND" }, { status: 400 });
  }
  log("🏢 ORG_OK", { orgId });

  /* ---------------- FILES ---------------- */
  log("📦 FILES_READ_START");
  const formData = await req.formData();
  const files = formData.getAll("files") as File[];

  if (!files?.length) {
    warn("📦 NO_FILES");
    return NextResponse.json({ error: "NO_FILES" }, { status: 400 });
  }

  log("📦 FILES_OK", {
    count: files.length,
    names: files.map((f) => f.name),
    types: files.map((f) => f.type),
    sizes: files.map((f) => f.size),
  });

 /* ---------------- EXTRACT TEXT (OCR) ---------------- */
log("🧾 TEXT_EXTRACT_START");

const extracted: ExtractedDoc[] = [];
for (const f of files) {
  try {
    const one = await extractText(f);
    extracted.push(one);
  } catch (e: any) {
    errlog("🧾 EXTRACT_ONE_FAILED", { name: f.name, message: e?.message });
    extracted.push({
      name: f.name,
      type: f.type || "unknown",
      kind: "GENEL",
      text: `[EXTRACT_ERROR] ${f.name} — Metin çıkarımı sırasında hata oluştu.`,
    });
  }
}

const totalChars = extracted.reduce(
  (a, b) => a + (b.text?.length || 0),
  0
);

log("🧾 TEXT_EXTRACT_DONE", {
  docs: extracted.map((d) => ({
    name: d.name,
    kind: d.kind,
    chars: d.text.length,
  })),
  totalChars,
});

/* ---------------- OCR CONFIDENCE (GLOBAL) ---------------- */
const ocrWarning = extracted.some(
  (d) =>
    d.ocrMeta &&
    (d.ocrMeta.avgConfidence < 0.6 ||
      d.ocrMeta.lowConfidenceRatio > 0.3)
);

/* ---------------- CONTENT GUARD ---------------- */
if (totalChars < 80) {
  warn("🧾 INSUFFICIENT_CONTENT", { totalChars });
  return NextResponse.json(
    { error: "INSUFFICIENT_CONTENT" },
    { status: 422 }
  );
}

/* ---------------- DOCUMENTS (OCR sonrası – yıl yok) ---------------- */
const documentsBase = extracted.map((d) => ({
  fileName: d.name,            // kullanıcı ne yüklediyse aynen
  kind: d.kind,                // yıl hesaplamak için saklanır
  docType: docKindToLabel(d.kind), // OCR’dan türetilen başlık (zorlamasız)
  ocrWarning:
    !!d.ocrMeta &&
    (d.ocrMeta.avgConfidence < 0.6 ||
     d.ocrMeta.lowConfidenceRatio > 0.3),
}));




  /* ---------------- LABEL + GUARD ---------------- */
  log("🏷️ LABEL_CORPUS_START");
  let labeledText = buildLabeledCorpus(extracted.map((d) => ({ name: d.name, kind: d.kind, text: d.text })));
  log("🏷️ LABEL_CORPUS_DONE", { labeledChars: labeledText.length });

  // Token / quota koruması
  labeledText = truncateByChars(labeledText, 18000);

  /* ---------------- PROMPT ---------------- */
  log("🧩 PROMPT_BUILD_START");
  const prompt = buildPrompt(labeledText);
  log("🧩 PROMPT_BUILD_DONE", { promptChars: prompt.length });

  /* ---------------- AI -> PARSE -> NORMALIZE ---------------- */
  let parsed: any;
  let aiUsed = false;
  let modelUsed: "fast" | "robust" | "fallback" = "fallback";

  try {
    if (!apiKey) {
      throw new Error("GOOGLE_API_KEY_MISSING");
    }

    log("🤖 AI_RUN_START");

    const aiResult = await runAI(prompt, 2);
    const raw = aiResult.response.response.text();

    modelUsed = aiResult.modelUsed;
    aiUsed = true;

    log("🤖 AI_MODEL_USED", { model: modelUsed });
    log("🤖 AI_RUN_DONE", { rawChars: raw?.length ?? 0 });

    parsed = safeJsonParse(raw);
    log("✅ AI_JSON_PARSED");
  } catch (e: any) {
    errlog("❌ AI_PIPELINE_FAILED_FALLBACK", {
      message: e?.message,
      status: e?.status,
    });

    const note =
      e?.status === 429 || e?.status === 503
        ? "AI servisinde anlık kota/yoğunluk oluştu."
        : "AI servisine erişimde hata oluştu.";

    parsed = fallbackAnalysis(new Date().getFullYear(), note);
  }



  const normalized = normalizePlan(parsed);
  log("🧹 NORMALIZE_DONE", {
    year: normalized.year,
    itemsCount: normalized.items.length,
    criticalFindingsCount: normalized.summary.criticalFindings.length,
    aiUsed,
  });

  /* ---------------- DOCUMENTS (final – yıl bağlandı) ---------------- */
    const documents = documentsBase.map((d) => ({
      fileName: d.fileName,
      docType: d.docType,
      year: d.kind === "EK2" ? normalized.year - 1 : normalized.year,
      ocrWarning: d.ocrWarning,
    }));


  /* ---------------- SAVE PLAN ---------------- */
  log("💾 PLAN_SAVE_CHECK_EXISTING_START");
  const { data: existing, error: existErr } = await supabase
    .from("annual_plan_results")
    .select("id")
    .eq("org_id", orgId)
    .eq("document_year", normalized.year)
    .maybeSingle();

  if (existErr) {
    errlog("💾 PLAN_SAVE_CHECK_EXISTING_DB_ERROR", existErr);
    return NextResponse.json({ error: "DB_ERROR" }, { status: 500 });
  }

  if (!existing) {
    log("💾 PLAN_SAVE_INSERT_START", { orgId, year: normalized.year, created_by: user.id });

    // annual_plan_results.created_by NOT NULL -> zorunlu
    const { data: inserted, error: insertErr } = await supabase
      .from("annual_plan_results")
      .insert({
        org_id: orgId,
        created_by: user.id,
        document_year: normalized.year,
        analysis_result: {
          ...normalized,
          summary: {
            ...normalized.summary,
            documents,
          },
        }
      })
      .select("id")
      .single();

    if (insertErr) {
      errlog("❌ PLAN_SAVE_FAILED", insertErr);
      return NextResponse.json({ error: "PLAN_SAVE_FAILED" }, { status: 500 });
    }

    log("💾 PLAN_SAVE_INSERT_DONE", { id: inserted?.id });

    log("🌱 SEED_EXECUTIONS_START");
    try {
      await seedExecutions({
        supabase,
        orgId,
        planYear: normalized.year,
        items: normalized.items,
      });
      log("🌱 SEED_EXECUTIONS_DONE");
    } catch (se: any) {
      errlog("⚠️ SEED_EXECUTIONS_FAILED", { message: se?.message });
      // plan kaydı var; UI yine de raporu gösterecek
    }
  } else {
    log("ℹ️ PLAN_ALREADY_EXISTS", { id: existing.id, year: normalized.year });
    // Not: İstersen burada "update" yapabiliriz (en güncel raporu saklamak için).
  }

  log("✅ ANALYZE_DONE", { ms: Date.now() - startedAt });

  return NextResponse.json({
    success: true,
    result: {
      ...normalized,
      summary: {
        ...normalized.summary,
        documents, // 👈 EKLENDİ
      },
      meta: {
        aiUsed,
        modelUsed,
        ocrWarning,
        analyzedAt: new Date().toISOString(),
      },
    },
  });
}
