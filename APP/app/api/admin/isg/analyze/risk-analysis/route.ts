// APP/app/api/admin/isg/analyze/risk-analysis/route.ts
import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { getAdminContext } from "@/lib/admin/context";
import { GoogleGenerativeAI } from "@google/generative-ai";
import * as XLSX from "xlsx";

export const runtime = "nodejs";

/* ======================================================
   CONFIG
====================================================== */

const MAX_FILE_SIZE_MB = 12;
const REQUEST_TIMEOUT_MS = 18_000;

// Excel preview limits (AI prompt şişmesin)
const PREVIEW_MAX_SHEETS = 8;
const PREVIEW_MAX_ROWS = 40;
const PREVIEW_MAX_COLS = 14;

// Header/primary preview (LLM için)
const PRIMARY_PREVIEW_ROWS = 16; // header + 15
const PRIMARY_SCAN_ROWS_FOR_HEADER = 30;

// Sheet scoring için sample (heap’i şişirmesin)
const SHEET_SCORE_SAMPLE_ROWS = 60;
const SHEET_SCORE_SAMPLE_COLS = 30;

// LLM prompt max (çok büyümesin)
const PROMPT_MAX_CHARS = 24_000;

// Logging level (prod’da TRACE kapatmak için)
type LogLevel = "TRACE" | "DEBUG" | "INFO" | "WARN" | "ERROR";
const LOG_LEVEL: LogLevel = (process.env.LOG_LEVEL as LogLevel) || "TRACE";

const LOG_ORDER: Record<LogLevel, number> = {
  TRACE: 10,
  DEBUG: 20,
  INFO: 30,
  WARN: 40,
  ERROR: 50,
};

function log(level: LogLevel, requestId: string, step: string, data?: any) {
  if ((LOG_ORDER[level] ?? 999) < (LOG_ORDER[LOG_LEVEL] ?? 10)) return;

  // data undefined ise spread’de sorun yok ama null/primitive gelmesin
  const payload =
    data && typeof data === "object" ? data : data != null ? { data } : undefined;

  console.log(
    JSON.stringify({
      level,
      requestId,
      step,
      ...(payload || {}),
      ts: new Date().toISOString(),
    })
  );
}

/* ======================================================
   SIMPLE MEMORY RATE LIMIT (IP BASED)
   (Prod için Redis önerilir ama şimdilik güvenli)
====================================================== */

const ipMap = new Map<string, { count: number; ts: number }>();
const RATE_LIMIT = 25; // 25 req / 10 dk
const WINDOW_MS = 10 * 60 * 1000;

function checkRateLimit(ip: string) {
  const now = Date.now();
  const r = ipMap.get(ip);

  if (!r) {
    ipMap.set(ip, { count: 1, ts: now });
    return true;
  }
  if (now - r.ts > WINDOW_MS) {
    ipMap.set(ip, { count: 1, ts: now });
    return true;
  }
  if (r.count >= RATE_LIMIT) return false;
  r.count++;
  return true;
}

/* ======================================================
   FINE-KINNEY (DETERMINISTIC)
====================================================== */

function toNum(v: any): number | null {
  const s = String(v ?? "").replace(",", ".").trim();
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

function fkScore(p: number | null, e: number | null, s: number | null) {
  if (p == null || e == null || s == null) return null;
  const score = p * e * s;
  return Number.isFinite(score) ? score : null;
}

function fkLevel(score: number | null) {
  if (score == null) return "Belirsiz" as const;
  if (score <= 20) return "Kabul edilebilir" as const;
  if (score <= 70) return "Dikkate değer" as const;
  if (score <= 200) return "Önemli" as const;
  if (score <= 400) return "Yüksek" as const;
  return "Çok yüksek" as const;
}

function levelOrder(level: string) {
  const map: Record<string, number> = {
    "Çok yüksek": 5,
    "Yüksek": 4,
    "Önemli": 3,
    "Dikkate değer": 2,
    "Kabul edilebilir": 1,
    "Belirsiz": 0,
  };
  return map[level] ?? 0;
}

/* ======================================================
   UTILS
====================================================== */

function mkReqId() {
  return `isg_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function errorResponse(code: string, message: string, status: number, meta?: any) {
  return NextResponse.json({ success: false, error: { code, message }, meta }, { status });
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error("TIMEOUT")), ms)),
  ]);
}

function extractJsonObject(raw: string): any | null {
  // 1) fenced code temizle
  const cleaned = String(raw ?? "").replace(/```json|```/g, "").trim();
  // 2) direkt parse dene
  try {
    return JSON.parse(cleaned);
  } catch {
    // 3) ilk { ... } bloğunu yakala
    const firstBrace = cleaned.indexOf("{");
    const lastBrace = cleaned.lastIndexOf("}");
    if (firstBrace >= 0 && lastBrace > firstBrace) {
      const sliced = cleaned.slice(firstBrace, lastBrace + 1);
      try {
        return JSON.parse(sliced);
      } catch {
        return null;
      }
    }
    return null;
  }
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function clampString(s: string, maxChars: number) {
  if (!s) return s;
  return s.length > maxChars ? s.slice(0, maxChars) : s;
}

/* ======================================================
   EXCEL PARSE + TABLE DETECTION
====================================================== */

const KEYWORDS = [
  // TR
  "tehlike",
  "risk",
  "aktivite",
  "faaliyet",
  "iş adımı",
  "proses",
  "alan",
  "bölüm",
  "olasılık",
  "frekans",
  "maruziyet",
  "şiddet",
  "skor",
  "puan",
  "değer",
  "seviye",
  "mevcut önlem",
  "önlem",
  "kontrol",
  "sorumlu",
  "termin",
  "tarih",
  // EN
  "hazard",
  "activity",
  "probability",
  "frequency",
  "exposure",
  "severity",
  "score",
  "risk level",
  "control",
  "owner",
  "deadline",
];

function norm(s: any) {
  return String(s ?? "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * 2D array (sheet rows) içinde "header" olma ihtimali yüksek satırı bulur.
 */
function detectHeaderRow(rows: any[][], scan = 20) {
  let best = { idx: 0, score: 0 };
  const limit = Math.min(rows.length, scan);

  for (let i = 0; i < limit; i++) {
    const row = rows[i] || [];
    const rowText = row.map(norm).join(" | ");
    let score = 0;

    for (const kw of KEYWORDS) {
      if (rowText.includes(kw)) score++;
    }

    const nonEmpty = row.filter((c) => String(c ?? "").trim().length > 0).length;
    if (nonEmpty < 3) score -= 2;

    if (score > best.score) best = { idx: i, score };
  }

  return best.score >= 2 ? best.idx : 0;
}

function sheetTo2D(wb: XLSX.WorkBook, sheetName: string) {
  const ws = wb.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(ws, {
    header: 1,
    raw: false,
    defval: "",
  }) as any[][];
  return rows;
}

function sheetTo2DSampled(wb: XLSX.WorkBook, sheetName: string, maxRows: number, maxCols: number) {
  const ws = wb.Sheets[sheetName];
  const sampled = XLSX.utils.sheet_to_json(ws, {
    header: 1,
    raw: false,
    defval: "",
    range: {
      s: { r: 0, c: 0 },
      e: { r: Math.max(0, maxRows - 1), c: Math.max(0, maxCols - 1) },
    } as any,
  }) as any[][];
  return sampled;
}

function scoreSheetAsRiskTable(sampledRows: any[][]) {
  const headerIdx = detectHeaderRow(sampledRows, Math.min(PRIMARY_SCAN_ROWS_FOR_HEADER, sampledRows.length));
  const header = (sampledRows[headerIdx] || []).map(norm);

  const hasHazard = header.some((h) => h.includes("tehlike") || h.includes("hazard"));
  const hasRisk = header.some((h) => h.includes("risk"));
  const hasP = header.some((h) => h.includes("olasılık") || h.includes("probability") || h.includes("(o)"));
  const hasE = header.some(
    (h) =>
      h.includes("maruziyet") ||
      h.includes("exposure") ||
      h.includes("frekans") ||
      h.includes("frequency") ||
      h.includes("(f)")
  );
  const hasS = header.some((h) => h.includes("şiddet") || h.includes("severity") || h.includes("(ş)") || h.includes("(s)"));
  const hasScore = header.some(
    (h) =>
      h.includes("skor") ||
      h.includes("puan") ||
      h.includes("score") ||
      (h.includes("risk") && h.includes("değer")) ||
      h.includes("(r)")
  );

  let score = 0;
  if (hasHazard) score += 3;
  if (hasRisk) score += 2;
  if (hasP) score += 2;
  if (hasE) score += 2;
  if (hasS) score += 2;
  if (hasScore) score += 3;

  if (sampledRows.length >= 15) score += 1;
  if (sampledRows.length >= 40) score += 1;

  return { score, headerIdx };
}

function pickPrimarySheetName(wb: XLSX.WorkBook) {
  const sheetNames = wb.SheetNames.slice(0, PREVIEW_MAX_SHEETS);

  const candidates = sheetNames.map((name) => {
    const sampled = sheetTo2DSampled(wb, name, SHEET_SCORE_SAMPLE_ROWS, SHEET_SCORE_SAMPLE_COLS);
    const scored = scoreSheetAsRiskTable(sampled);
    return { name, score: scored.score, headerIdx: scored.headerIdx };
  });

  candidates.sort((a, b) => b.score - a.score);
  const primary = candidates[0];

  return {
    primarySheetName: primary?.name ?? "Belirsiz",
    candidates,
  };
}

/* ======================================================
   PRIMARY PREVIEW (compact TSV)
====================================================== */

function buildPrimaryCompactPreview(primaryRows: any[][]) {
  const headerIdx = detectHeaderRow(primaryRows, PRIMARY_SCAN_ROWS_FOR_HEADER);
  const slice = primaryRows
    .slice(headerIdx, headerIdx + PRIMARY_PREVIEW_ROWS)
    .map((r) => r.slice(0, PREVIEW_MAX_COLS).map((x) => String(x ?? "").trim()).join("\t"))
    .join("\n");

  return { headerIdx, tsv: slice };
}

/* ======================================================
   COLUMN MAPPING + ROW NORMALIZATION
====================================================== */

function findColIndex(headers: string[], includesAny: string[]) {
  const h = headers.map(norm);
  for (let i = 0; i < h.length; i++) {
    const cell = h[i];
    if (!cell) continue;
    if (includesAny.some((kw) => cell.includes(norm(kw)))) return i;
  }
  return -1;
}

function findColIndexRegex(headers: string[], patterns: RegExp[]) {
  const h = headers.map((x) => norm(x));
  for (let i = 0; i < h.length; i++) {
    const cell = h[i];
    if (!cell) continue;
    if (patterns.some((re) => re.test(cell))) return i;
  }
  return -1;
}

function normalizeHeaders(row: any[]) {
  return (row || []).map((c) => String(c ?? "").replace(/\s+/g, " ").trim());
}

function getCell(row: any[], idx: number) {
  if (idx < 0) return "";
  return String(row?.[idx] ?? "").trim();
}

function analyzePrimaryRiskTable(rows: any[][]) {
  const headerIdx = detectHeaderRow(rows, PRIMARY_SCAN_ROWS_FOR_HEADER);
  const headers = normalizeHeaders(rows[headerIdx] || []);

  // TR/EN + bu dosya için O/F/Ş/R destekli
  const colHazard = findColIndex(headers, ["tehlike", "hazard"]);
  const colAct = findColIndex(headers, [
    "aktivite",
    "faaliyet",
    "iş adımı",
    "proses",
    "alan",
    "bölüm",
    "activity",
    "area",
  ]);

  const colObs = findColIndex(headers, ["açıklama", "gözlem", "durum", "risk", "observation", "description"]);

  // Olasılık: "Olasılık(O)" gibi
  const colP =
    findColIndex(headers, ["olasılık", "probability"]) >= 0
      ? findColIndex(headers, ["olasılık", "probability"])
      : findColIndexRegex(headers, [/\(o\)\b/, /\bolasilik\b/]);

  // Maruziyet / Frekans: bu şablonda Frekans(F)
  const colE =
    findColIndex(headers, ["maruziyet", "exposure", "frekans", "frequency"]) >= 0
      ? findColIndex(headers, ["maruziyet", "exposure", "frekans", "frequency"])
      : findColIndexRegex(headers, [/\(f\)\b/, /\bfrekans\b/, /\bexposure\b/]);

  // Şiddet: "Şiddet(Ş)" veya "Severity"
  const colS =
    findColIndex(headers, ["şiddet", "severity"]) >= 0
      ? findColIndex(headers, ["şiddet", "severity"])
      : findColIndexRegex(headers, [/\(ş\)\b/, /\(s\)\b/, /\bsiddet\b/, /\bseverity\b/]);

  // Risk değeri / skor: "Risk Değeri ( R)" vb.
  const colScore =
    findColIndex(headers, ["skor", "puan", "score", "risk değeri", "risk degeri", "değer", "deger"]) >= 0
      ? findColIndex(headers, ["skor", "puan", "score", "risk değeri", "risk degeri", "değer", "deger"])
      : findColIndexRegex(headers, [/\(r\)\b/, /\brisk\b.*\bde(ğ|g)er\b/]);

  const colLevel = findColIndex(headers, ["seviye", "risk level", "risk seviyesi"]);
  const colExisting = findColIndex(headers, ["mevcut önlem", "önlem", "kontrol", "existing", "control"]);
  const colRec = findColIndex(headers, ["öneri", "aksiyon", "recommended", "action"]);
  const colOwner = findColIndex(headers, ["sorumlu", "owner"]);
  const colDeadline = findColIndex(headers, ["termin", "tarih", "deadline", "date"]);

  const dataRows = rows.slice(headerIdx + 1);

  const items: any[] = [];
  let scoredCount = 0;
  let maxScore: number | null = null;

  for (let i = 0; i < dataRows.length; i++) {
    const r = dataRows[i];

    const nonEmpty = (r || []).filter((c) => String(c ?? "").trim().length > 0).length;
    if (nonEmpty === 0) continue;

    const hazard = getCell(r, colHazard) || getCell(r, colObs) || "Belirsiz";
    const activityOrArea = getCell(r, colAct) || null;

    const p = toNum(getCell(r, colP));
    const e = toNum(getCell(r, colE));
    const s = toNum(getCell(r, colS));

    const scoreCell = toNum(getCell(r, colScore));
    const computed = fkScore(p, e, s);

    // skor: varsa scoreCell, yoksa computed
    const riskScore = scoreCell ?? computed ?? null;
    if (riskScore != null) scoredCount++;

    const riskLevel = (getCell(r, colLevel) || fkLevel(riskScore)) as any;

    if (riskScore != null) {
      if (maxScore == null || riskScore > maxScore) maxScore = riskScore;
    }

    items.push({
      rowIndex: headerIdx + 1 + i + 1, // excel satır hissi
      hazard,
      activityOrArea,
      observation: getCell(r, colObs) || null,
      existingControls: getCell(r, colExisting) || null,
      recommendedActionsText: getCell(r, colRec) || null,
      owner: getCell(r, colOwner) || null,
      deadline: getCell(r, colDeadline) || null,
      probability: p,
      exposure: e,
      severity: s,
      riskScore,
      riskLevel,
      _levelOrder: levelOrder(riskLevel),
    });
  }

  const dist: Record<string, number> = {
    "Kabul edilebilir": 0,
    "Dikkate değer": 0,
    "Önemli": 0,
    "Yüksek": 0,
    "Çok yüksek": 0,
    "Belirsiz": 0,
  };

  for (const it of items) dist[it.riskLevel] = (dist[it.riskLevel] ?? 0) + 1;

  const sorted = [...items].sort((a, b) => {
    const as = a.riskScore ?? -1;
    const bs = b.riskScore ?? -1;
    if (as !== bs) return bs - as;
    return b._levelOrder - a._levelOrder;
  });

  const top = sorted.slice(0, 8).map((it, idx) => ({
    rank: idx + 1,
    rowIndex: it.rowIndex,
    hazard: it.hazard,
    activityOrArea: it.activityOrArea,
    riskScore: it.riskScore,
    riskLevel: it.riskLevel,
    observation: it.observation,
    existingControls: it.existingControls,
    recommendedActionsText: it.recommendedActionsText,
    owner: it.owner,
    deadline: it.deadline,
    probability: it.probability,
    exposure: it.exposure,
    severity: it.severity,
  }));

  const methodology = colP >= 0 && colE >= 0 && colS >= 0 ? "Fine-Kinney" : "Belirsiz";

  return {
    headerIdx,
    headers,
    detectedColumns: {
      hazard: colHazard >= 0 ? headers[colHazard] : "Belirsiz",
      activityOrArea: colAct >= 0 ? headers[colAct] : "Belirsiz",
      observation: colObs >= 0 ? headers[colObs] : "Belirsiz",
      probability: colP >= 0 ? headers[colP] : "Belirsiz",
      exposure: colE >= 0 ? headers[colE] : "Belirsiz",
      severity: colS >= 0 ? headers[colS] : "Belirsiz",
      riskScore: colScore >= 0 ? headers[colScore] : "Belirsiz",
      riskLevel: colLevel >= 0 ? headers[colLevel] : "Belirsiz",
      existingControls: colExisting >= 0 ? headers[colExisting] : "Belirsiz",
      recommendedActions: colRec >= 0 ? headers[colRec] : "Belirsiz",
      owner: colOwner >= 0 ? headers[colOwner] : "Belirsiz",
      deadline: colDeadline >= 0 ? headers[colDeadline] : "Belirsiz",
    },
    methodology,
    scoreFieldDetected: colScore >= 0 || (colP >= 0 && colE >= 0 && colS >= 0),
    rowsEstimated: items.length,
    scoredRowsEstimated: scoredCount,
    highestRiskScore: maxScore,
    highestRiskLevel: fkLevel(maxScore),
    distribution: {
      "Kabul edilebilir": dist["Kabul edilebilir"] ?? 0,
      "Dikkate değer": dist["Dikkate değer"] ?? 0,
      "Önemli": dist["Önemli"] ?? 0,
      "Yüksek": dist["Yüksek"] ?? 0,
      "Çok yüksek": dist["Çok yüksek"] ?? 0,
    },
    topRisks: top,
  };
}

/* ======================================================
   PROMPT (TOKEN-OPTIMIZED, HYBRID)
====================================================== */

function buildRiskAnalysisHybridPrompt(params: {
  fileName: string;
  primarySheetName: string;
  deterministic: ReturnType<typeof analyzePrimaryRiskTable>;
  headerTsv?: string;
}) {
  const { fileName, primarySheetName, deterministic, headerTsv } = params;

  const top = deterministic.topRisks.map((r) => ({
    rank: r.rank,
    rowIndex: r.rowIndex,
    hazard: r.hazard,
    activityOrArea: r.activityOrArea,
    riskScore: r.riskScore,
    riskLevel: r.riskLevel,
    existingControls: r.existingControls,
    observation: r.observation,
  }));

const prompt = `
SADECE GEÇERLİ JSON ÜRET.
Markdown kullanma.
Açıklama yazma.
Kod bloğu işareti kullanma.
Backtick kullanma.
Yorum satırı yazma.
JSON dışında hiçbir karakter üretme.
Yanıt { ile başlamalı ve } ile bitmelidir.
Tek ve tam bir JSON nesnesi üret.

GİRDİ VERİLERİ:

dosyaAdi: ${fileName}
birincilSayfaAdi: ${primarySheetName}

HEADER_PREVIEW_TSV:
${headerTsv || "Yok"}

DETERMINISTIK_OZET:
metodoloji: ${deterministic.methodology}
satirSayisiTahmini: ${deterministic.rowsEstimated}
skorlananSatirSayisi: ${deterministic.scoredRowsEstimated}
enYuksekRiskSkoru: ${deterministic.highestRiskScore}
enYuksekRiskSeviyesi: ${deterministic.highestRiskLevel}
dagilim: ${JSON.stringify(deterministic.distribution)}

EN_YUKSEK_RISKLER:
${JSON.stringify(top)}

CiktiSemasi:

{
  "documentType": "risk_analysis",
  "isRiskAnalysisDocument": true,
  "confidence": number,
  "executiveSummary": string,
  "stats": {
    "rowsEstimated": number | null,
    "scoredRowsEstimated": number | null,
    "highestRiskScore": number | null,
    "highestRiskLevel": string,
    "distribution": object
  },
  "topRisks": array,
  "complianceGaps": array,
  "managementActionPlan": array
}

KURALLAR:

- confidence değeri 0.6 ile 0.9 arasında olmalıdır.
- topRisks dizisinin sırası EN_YUKSEK_RISKLER girdisi ile aynı olmalıdır.
- Veri dışı varsayım yapma.
- Uydurma mevzuat maddesi yazma.
- Emin olmadığın alanlara null yaz.
- JSON eksik veya yarım bırakılmamalıdır.
- Şema dışı alan ekleme.
- Çıktı tamamen geçerli JSON olmalıdır.

Rol:
A sınıfı İş Güvenliği Uzmanı ve ISO 45001:2018 baş denetçisi gibi değerlendirme yap.
`.trim();

return clampString(prompt, PROMPT_MAX_CHARS);

}


/* ======================================================
   GEMINI CALL (retry/backoff)
====================================================== */

async function callGeminiJSON(prompt: string) {
  if (!process.env.GOOGLE_API_KEY) {
    throw { type: "CONFIG", message: "GOOGLE_API_KEY missing" };
  }

  const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

  const model = genAI.getGenerativeModel({
    model: process.env.GOOGLE_MODEL || "gemini-2.5-flash",
    generationConfig: {
      temperature: 0,
      maxOutputTokens: 1800,
      responseMimeType: "application/json",
    },
  });

  const maxRetries = 3;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await model.generateContent(prompt);
      const text = result.response.text();

      const parsed = extractJsonObject(text);
      if (parsed) return text;

      // JSON parse edilemezse düzeltme promptu
      const repairPrompt = `
Return ONLY valid JSON.
Fix the following content into valid JSON.
Do not add explanations.

CONTENT:
${text}
`;

      const repair = await model.generateContent(repairPrompt);
      const repairedText = repair.response.text();
      const repairedParsed = extractJsonObject(repairedText);

      if (repairedParsed) return repairedText;

      if (attempt === maxRetries) {
        throw { type: "INVALID_JSON", message: "AI returned invalid JSON" };
      }

    } catch (err: any) {
      if (err?.status === 429) {
        await sleep(attempt * 1500);
        continue;
      }
      throw err;
    }
  }

  throw { type: "AI_ERROR", message: "Gemini failed after retries" };
}

/* ======================================================
   POST HANDLER
====================================================== */

export async function POST(req: Request) {
  const requestId = mkReqId();
  const start = Date.now();

  log("INFO", requestId, "REQUEST_START", { url: req.url, method: "POST" });

  try {
    /* ---------------- IP RATE LIMIT ---------------- */
    log("TRACE", requestId, "RATE_LIMIT_CHECK_START");

    const h = headers();
    const ip = h.get("x-forwarded-for") || h.get("x-real-ip") || "unknown";

    log("DEBUG", requestId, "IP_DETECTED", { ip });

    if (!checkRateLimit(ip)) {
      log("WARN", requestId, "RATE_LIMIT_BLOCKED", { ip });

      return errorResponse(
        "RATE_LIMIT",
        "Çok fazla istek gönderildi. Lütfen daha sonra tekrar deneyin.",
        429,
        { requestId }
      );
    }

    log("TRACE", requestId, "RATE_LIMIT_PASS");

    /* ---------------- PREMIUM CHECK ---------------- */
    log("TRACE", requestId, "PREMIUM_CHECK_START");

    const { org } = await getAdminContext();

    if (!org?.is_premium) {
      log("WARN", requestId, "PREMIUM_DENIED", { orgId: org?.id ?? null });

      return errorResponse(
        "PREMIUM_REQUIRED",
        "Bu özellik premium üyelik gerektirir.",
        403,
        { requestId }
      );
    }

    log("TRACE", requestId, "PREMIUM_PASS", { orgId: org.id });

    /* ---------------- FORM DATA ---------------- */
    log("TRACE", requestId, "FORMDATA_PARSE_START");

    const form = await req.formData();
    const file = form.get("file") as File | null;

    if (!file) {
      log("WARN", requestId, "NO_FILE_PROVIDED");

      return errorResponse("NO_FILE", "Lütfen bir Excel dosyası yükleyin.", 400, {
        requestId,
      });
    }

    log("INFO", requestId, "FILE_RECEIVED", {
      name: file.name,
      sizeKB: Math.round(file.size / 1024),
    });

    const lower = file.name.toLowerCase();

    if (!lower.endsWith(".xls") && !lower.endsWith(".xlsx")) {
      log("WARN", requestId, "INVALID_FILE_TYPE", { name: file.name });

      return errorResponse(
        "INVALID_FILE_TYPE",
        "Sadece Excel (.xls, .xlsx) dosyaları desteklenir.",
        400,
        { requestId }
      );
    }

    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      log("WARN", requestId, "FILE_TOO_LARGE", {
        sizeMB: (file.size / 1024 / 1024).toFixed(2),
      });

      return errorResponse(
        "FILE_TOO_LARGE",
        `Dosya boyutu çok büyük. En fazla ${MAX_FILE_SIZE_MB}MB yükleyebilirsiniz.`,
        400,
        { requestId }
      );
    }

    /* ---------------- EXCEL READ ---------------- */
    log("TRACE", requestId, "EXCEL_READ_START");

    const buffer = Buffer.from(await file.arrayBuffer());

    let wb: XLSX.WorkBook;

    try {
      wb = XLSX.read(buffer, { type: "buffer" });

      log("INFO", requestId, "EXCEL_READ_SUCCESS", {
        sheetCount: wb.SheetNames.length,
      });
    } catch (err) {
      log("ERROR", requestId, "EXCEL_READ_FAILED", {
        error: err instanceof Error ? err.message : err,
      });

      return errorResponse(
        "EXCEL_PARSE_FAILED",
        "Excel dosyası okunamadı. Dosya bozuk veya şifreli olabilir.",
        422,
        { requestId }
      );
    }

    if (!wb.SheetNames?.length) {
      log("WARN", requestId, "EMPTY_EXCEL");

      return errorResponse(
        "EMPTY_EXCEL",
        "Excel dosyasında okunabilir bir sayfa bulunamadı.",
        422,
        { requestId }
      );
    }

    /* ---------------- SHEET DETECTION ---------------- */
    log("TRACE", requestId, "SHEET_DETECTION_START");

    const pick = pickPrimarySheetName(wb);

    log("DEBUG", requestId, "SHEET_CANDIDATES_SCORED", {
      candidates: pick.candidates,
    });

    const primarySheetName = pick.primarySheetName;

    log("INFO", requestId, "PRIMARY_SHEET_SELECTED", { primarySheetName });

    if (primarySheetName === "Belirsiz") {
      log("WARN", requestId, "PRIMARY_SHEET_UNCERTAIN");
    }

    /* ---------------- PRIMARY SHEET READ ---------------- */
    log("TRACE", requestId, "PRIMARY_SHEET_READ_START");

    const primaryRows = sheetTo2D(wb, primarySheetName);

    log("TRACE", requestId, "PRIMARY_ROWS_EXTRACTED", {
      rowCount: primaryRows.length,
    });

    /* ---------------- PRIMARY PREVIEW ---------------- */
    log("TRACE", requestId, "PRIMARY_PREVIEW_BUILD_START");

    const compact = buildPrimaryCompactPreview(primaryRows);

    log("DEBUG", requestId, "PRIMARY_PREVIEW_BUILT", {
      headerIdx: compact.headerIdx,
      previewChars: compact.tsv.length,
    });

    /* ---------------- DETERMINISTIC ANALYSIS ---------------- */
    log("TRACE", requestId, "DETERMINISTIC_ANALYSIS_START");

    const deterministic = analyzePrimaryRiskTable(primaryRows);

    log("INFO", requestId, "DETERMINISTIC_ANALYSIS_DONE", {
      methodology: deterministic?.methodology,
      rowsEstimated: deterministic?.rowsEstimated,
      scoredRowsEstimated: deterministic?.scoredRowsEstimated,
      highestRiskScore: deterministic?.highestRiskScore,
      highestRiskLevel: deterministic?.highestRiskLevel,
      detectedColumns: deterministic?.detectedColumns,
    });

    /* ---------------- WARNINGS INIT ---------------- */
    const warnings: string[] = [];

    if (!deterministic?.rowsEstimated) {
      warnings.push("Dosyada okunabilir risk satırı tespit edilemedi; sonuçlar sınırlı olabilir.");
      log("WARN", requestId, "NO_RISK_ROWS_DETECTED");
    }

    if (!deterministic?.scoreFieldDetected) {
      warnings.push("Risk skor alanı tespit edilemedi; Fine-Kinney skorları hesaplanamamış olabilir.");
      log("WARN", requestId, "SCORE_FIELD_NOT_DETECTED", {
        detectedColumns: deterministic?.detectedColumns,
      });
    }

    /* ---------------- PROMPT BUILD ---------------- */
    log("TRACE", requestId, "PROMPT_BUILD_START");

    const prompt = buildRiskAnalysisHybridPrompt({
      fileName: file.name,
      primarySheetName,
      deterministic,
      headerTsv: compact.tsv,
    });

    log("DEBUG", requestId, "PROMPT_BUILT", {
      promptChars: prompt.length,
      topRiskCount: deterministic?.topRisks?.length,
    });

    /* ---------------- GEMINI CALL ---------------- */
    log("INFO", requestId, "AI_CALL_START", {
      model: process.env.GOOGLE_MODEL || "gemini-2.5-flash",
    });

    let aiText = "";

    try {
      aiText = await withTimeout(callGeminiJSON(prompt), REQUEST_TIMEOUT_MS);

      log("INFO", requestId, "AI_CALL_SUCCESS", {
        responseLength: aiText?.length ?? 0,
      });

      // Debug amaçlı kısa snippet (tam loglamak istersen kaldır clamp’i)
      log("DEBUG", requestId, "AI_RESPONSE_SNIPPET", {
        snippet: clampString(String(aiText ?? ""), 400),
      });
    } catch (err: any) {
      if (err?.type === "QUOTA") {
        log("WARN", requestId, "AI_QUOTA_EXCEEDED");

        return errorResponse("AI_QUOTA_EXCEEDED", "Yapay zekâ kullanım limiti doldu.", 429, {
          requestId,
        });
      }

      if (err?.message === "TIMEOUT") {
        log("WARN", requestId, "AI_TIMEOUT");

        return errorResponse("AI_TIMEOUT", "Analiz süresi aşıldı. Daha küçük dosya ile tekrar deneyin.", 504, {
          requestId,
        });
      }

      log("ERROR", requestId, "AI_FAILED", {
        errorType: err?.type ?? null,
        error: err?.message ?? err,
      });

      return errorResponse("AI_FAILED", "Risk analizi incelenirken bir hata oluştu.", 500, {
        requestId,
      });
    }

    /* ---------------- SAFE JSON PARSE ---------------- */
    log("TRACE", requestId, "AI_JSON_PARSE_START");

    const parsed = extractJsonObject(aiText);

    if (!parsed) {
      warnings.push("AI çıktısı JSON formatında okunamadı. Deterministic analiz gösterilecek.");
      log("WARN", requestId, "AI_JSON_PARSE_FAILED", {
        rawLength: aiText?.length ?? 0,
      });
    } else {
      log("DEBUG", requestId, "AI_JSON_PARSE_SUCCESS");
    }

    /* ---------------- PERFORMANCE ---------------- */
    const duration = Date.now() - start;
    const mem = process.memoryUsage();

    log("DEBUG", requestId, "PERFORMANCE_STATS", {
      durationMs: duration,
      rssMB: Math.round(mem.rss / 1024 / 1024),
      heapTotalMB: Math.round(mem.heapTotal / 1024 / 1024),
      heapUsedMB: Math.round(mem.heapUsed / 1024 / 1024),
      externalMB: Math.round((mem.external ?? 0) / 1024 / 1024),
    });

    log("INFO", requestId, "REQUEST_SUCCESS", {
      durationMs: duration,
      warningsCount: warnings.length,
    });

    /* ---------------- FINAL RESPONSE ---------------- */
    return NextResponse.json({
      success: true,
      type: "risk-analysis",
      fileName: file.name,
      primarySheetName,

      analysis: parsed || null,
      aiRaw: parsed ? undefined : aiText,

      deterministic: deterministic || null,

      warnings,

      meta: {
        requestId,
        durationMs: duration,
        sheetCount: wb.SheetNames.length,
        modelName: process.env.GOOGLE_MODEL || "gemini-2.5-flash",
        hybridMode: true,
      },
    });
  } catch (err) {
    log("ERROR", requestId, "UNEXPECTED_SERVER_ERROR", {
      error: err instanceof Error ? err.message : err,
    });

    return errorResponse("SERVER_ERROR", "Beklenmeyen bir sunucu hatası oluştu.", 500, {
      requestId,
    });
  }
}
