// APP/app/api/admin/isg/analyze/risk-analysis/route.ts
import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { getAdminContext } from "@/lib/admin/context";
import { GoogleGenerativeAI,HarmCategory,HarmBlockThreshold} from "@google/generative-ai";
import * as XLSX from "xlsx";
export const runtime = "nodejs";

/* ======================================================
   CONFIG
====================================================== */

const MAX_FILE_SIZE_MB = 12;
const REQUEST_TIMEOUT_MS = 45_000;


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

function findColIndex(headers: string[], keywords: string[]) {
  let bestIdx = -1;
  let highestScore = 0;

  const normalizedHeaders = headers.map(h => norm(h));
  const normalizedKeywords = keywords.map(k => norm(k));

  // "Tarih" veya "No" gibi kelimeleri içeren sütunların tehlike/faaliyet sanılmasını engellemek için ceza puanı
  const penaltyWords = ["tarih", "date", "no", "sicil", "index", "id", "sıra"];

  for (let i = 0; i < normalizedHeaders.length; i++) {
    const cell = normalizedHeaders[i];
    if (!cell) continue;

    let currentScore = 0;

    for (const kw of normalizedKeywords) {
      if (cell === kw) currentScore += 100; // Tam eşleşme
      else if (cell.includes(kw)) currentScore += kw.length * 5;
    }

    // Ceza puanı: Eğer sütun başlığında "tarih" geçiyorsa ama biz tehlike arıyorsak puanı kır
    if (penaltyWords.some(pw => cell.includes(pw)) && !keywords.some(kw => kw.includes("tarih"))) {
      currentScore -= 80;
    }

    if (currentScore > highestScore) {
      highestScore = currentScore;
      bestIdx = i;
    }
  }
  return highestScore > 5 ? bestIdx : -1;
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

  // --- 1. AGRESİF SÜTUN TESPİTİ ---

  // Tehlike Tanımı: En geniş anahtar kelime listesi
  let colHazard = findColIndex(headers, ["tehlike", "hazard", "tehlikeler", "risk tanımı", "unsur", "olay", "riskler"]);
  
  // Faaliyet: Süreç veya Alan
  const colAct = findColIndex(headers, ["faaliyet", "aktivite", "proses", "iş adımı", "alan", "bölüm", "birim", "activity"]);

  // Gözlem / Durum
  const colObs = findColIndex(headers, ["açıklama", "gözlem", "mevcut durum", "risk", "observation", "description"]);

  // Risk Skoru (R): Tehlikeyle karışmaması için korumalı
  let colScore = findColIndex(headers, ["risk değeri", "risk degeri", "toplam puan", "skor", "score", "risk puanı"]);
  if (colScore < 0) colScore = findColIndexRegex(headers, [/\(r\)/i, /\brisk\b.*\bde(ğ|g)er/i, /^r$/i]);

  // --- 2. BULAMAMA LÜKSÜNÜ ORTADAN KALDIRAN FALLBACK MANTIĞI ---

  // Eğer Tehlike sütunu bulunamadıysa veya Skor sütunuyla çakıştıysa:
  // İSG Excel'lerinde 2. veya 3. sütun %99 ihtimalle tehlikedir.
  if (colHazard === -1 || colHazard === colScore) {
    if (colAct !== 2 && colScore !== 2) colHazard = 2; // C Sütunu denemesi
    else if (colAct !== 1 && colScore !== 1) colHazard = 1; // B Sütunu denemesi
    else colHazard = colObs !== -1 ? colObs : 2;
  }

  const dataRows = rows.slice(headerIdx + 1);
  const items: any[] = [];
  let scoredCount = 0;
  let maxScore: number | null = null;

  for (let i = 0; i < dataRows.length; i++) {
    const r = dataRows[i];

    // Satır doluluk kontrolü (en azından bir şeyler yazmalı)
    const nonEmptyCells = (r || []).filter((c) => String(c ?? "").trim().length > 0);
    if (nonEmptyCells.length < 2) continue; 

    // --- 3. TEHLİKE YAKALAMA (HİBRİT YÖNTEM) ---
    let hazard = getCell(r, colHazard);
    const activity = getCell(r, colAct);
    const observation = getCell(r, colObs);

    // EĞER HÜCRE BOŞSA VEYA SADECE SAYI İÇERİYORSA (Yanlış sütunsa):
    // Yan hücrelere bak (Merged cell veya kayma durumu)
    if (!hazard || hazard.length < 3 || !isNaN(Number(hazard))) {
       const candidates = [
         getCell(r, colHazard + 1), 
         getCell(r, colHazard - 1),
         observation,
         activity
       ];
       // En uzun ve sayı olmayan metni seç
       hazard = candidates.find(c => c && c.length > 3 && isNaN(Number(c))) || hazard;
    }

    // HALA BOŞSA: "Tanımlanmamış" yerine en azından Faaliyet + Gözlem birleştir
    if (!hazard || hazard.length < 2) {
      if (activity || observation) {
        hazard = `${activity} - ${observation}`.replace(/(null|undefined| - $|^ - )/g, "").trim();
      }
    }

    // SON ÇARE: Satırdaki en uzun metni bul (Bulamama lüksü yok!)
    if (!hazard || hazard.length < 2) {
      const longestCell = [...r].sort((a, b) => String(b).length - String(a).length)[0];
      hazard = String(longestCell || "Bilinmeyen Tehlike");
    }

    // Skorları Çek
    const scoreCell = toNum(getCell(r, colScore));
    const riskScore = scoreCell !== null ? scoreCell : null;
    
    if (riskScore !== null) {
      scoredCount++;
      if (maxScore === null || riskScore > maxScore) maxScore = riskScore;
    }

    const riskLevel = fkLevel(riskScore);

    items.push({
      rowIndex: headerIdx + i + 2, 
      hazard: hazard.substring(0, 200), // Çok uzun metinleri kırp
      activityOrArea: activity || "Genel",
      observation: observation || null,
      riskScore,
      riskLevel,
      _levelOrder: levelOrder(riskLevel),
      // Diğer alanları getCell ile çekmeye devam edebilirsin...
    });
  }

  // Özetleme kısmı (Senin mevcut mantığınla aynı kalabilir)
  const dist: Record<string, number> = {
    "Kabul edilebilir": 0, "Dikkate değer": 0, "Önemli": 0, "Yüksek": 0, "Çok yüksek": 0, "Belirsiz": 0,
  };
  items.forEach(it => { dist[it.riskLevel]++ });

  const sorted = [...items].sort((a, b) => (b.riskScore ?? -1) - (a.riskScore ?? -1));
  const top = sorted.slice(0, 10).map((it, idx) => ({ rank: idx + 1, ...it }));

  return {
    headerIdx,
    headers,
    detectedColumns: {
      hazard: headers[colHazard] || "Tespit Edilen Sütun",
      activityOrArea: headers[colAct] || "Genel",
      riskScore: headers[colScore] || "Skor",
    },
    methodology: scoredCount > 0 ? "Fine-Kinney / Matris" : "Nitel Gözlem",
    scoreFieldDetected: scoredCount > 0, 
    rowsEstimated: items.length,
    scoredRowsEstimated: scoredCount,
    highestRiskScore: maxScore,
    highestRiskLevel: fkLevel(maxScore),
    distribution: dist,
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
    hazard: r.hazard,
    activityOrArea: r.activityOrArea,
    riskScore: r.riskScore,
    riskLevel: r.riskLevel,
    existingControls: r.existingControls,
    observation: r.observation
  }));

// route.ts içinde buildRiskAnalysisHybridPrompt fonksiyonunu bu kısımla değiştir
  const prompt = `
SADECE GEÇERLİ JSON ÜRET. Markdown kullanma. Açıklama yazma.
Yanıt { ile başlamalı ve } ile bitmelidir.

GİRDİ:
Dosya: ${fileName}
Sayfa: ${primarySheetName}

DETERMINISTIK_VERI:
Metodoloji: ${deterministic.methodology}
ToplamRisk: ${deterministic.rowsEstimated}
SkorluRisk: ${deterministic.scoredRowsEstimated}
EnYuksekSkor: ${deterministic.highestRiskScore}
EnYuksekSeviye: ${deterministic.highestRiskLevel}
Dagilim: ${JSON.stringify(deterministic.distribution)}

TopRiskler:
${JSON.stringify(top)}

ÇIKTI ŞEMASI (KESİN UY):
{
  "documentType": "risk_analysis",
  "confidence": number,
  "documentSummary": "string",
  "stats": {
    "rowsEstimated": number,
    "scoredRowsEstimated": number,
    "highestRiskScore": number,
    "highestRiskLevel": "string",
    "distribution": object
  },
  "topRisks": [
    {
      "rank": number,
      "hazard": "string",
      "riskLevel": "string",
      "riskScore": number,
      "observation": "string",
      "recommendedActions": ["string"],
      "legalReference": { "primaryLaw": "6331", "regulation": "string", "isoClause": "string" }
    }
  ],
  "complianceGaps": [
    { "gap": "string", "impact": "Yüksek | Orta" }
  ],
  "managementActionPlan": [
    {
      "action": "string",
      "priority": "Yüksek | Orta",
      "ownerRole": "Yönetim | İSG Kurulu",
      "deadline": "string"
    }
  ]
}

ZORUNLU KURALLAR:
- "stats" alanını DETERMINISTIK_VERI'deki sayılarla doldur.
- "managementActionPlan" KESİNLİKLE boş kalmamalı, en az 3 madde üret.
- "documentSummary" en az 4 cümle olmalı.
- Tüm yanıtlar Türkçe olmalı.
`.trim();

  return clampString(prompt, PROMPT_MAX_CHARS);
}

function buildDeterministicExecutiveSummary(d: ReturnType<typeof analyzePrimaryRiskTable>) {
  if (!d || !d.rowsEstimated) {
    return "Risk analizi tablosunda yeterli veri tespit edilememiştir.";
  }

  const total = d.rowsEstimated;
  const highest = d.highestRiskScore ?? "Belirsiz";
  const highestLevel = d.highestRiskLevel ?? "Belirsiz";

  const dist = d.distribution;
  const highCount = (dist["Yüksek"] ?? 0) + (dist["Çok yüksek"] ?? 0);

  let dominant = Object.entries(dist)
    .sort((a, b) => b[1] - a[1])[0]?.[0];

  return `
Risk analizinde yaklaşık ${total} risk kalemi değerlendirilmiştir.
En yüksek risk skoru ${highest} olup bu seviye "${highestLevel}" kategorisindedir.
Toplam ${highCount} adet yüksek veya çok yüksek risk tespit edilmiştir.
Risklerin büyük kısmı "${dominant}" seviyesinde yoğunlaşmaktadır.
Mevcut aksiyon planının etkinliği ayrıca değerlendirilmelidir.
`.trim();
}
/* ======================================================
   GEMINI CALL (retry/backoff)
====================================================== */

async function callGeminiJSON(prompt: string): Promise<string | null> {
  if (!process.env.GOOGLE_API_KEY) {
    throw { type: "CONFIG", message: "GOOGLE_API_KEY missing" };
  }

  const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
  
  /**
   * NOT: Loglarında gemini-2.5-flash alias olarak çalışsa da MAX_TOKENS hatası verdi.
   * 1.5-flash hem daha geniş bir bağlam penceresine sahiptir hem de kota konusunda daha esnektir.
   */
  const modelName = process.env.GOOGLE_MODEL || "gemini-2.5-flash";

  const model = genAI.getGenerativeModel({
    model: modelName,
    generationConfig: {
      temperature: 0.1, // JSON kararlılığı için düşük sıcaklık
      maxOutputTokens: 8000, // Yanıtın yarıda kesilmesini (MAX_TOKENS) önlemek için yüksek limit
      topP: 0.95,
    },
    safetySettings: [
      { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
      { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
      { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
      { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
    ],
  });

  // Ücretsiz tier kullanıyorsan maxRetries'ı 1 veya 2 tutmak kota (429) sağlığı için kritiktir.
  const maxRetries = 2;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`--- AI İstek Başlatıldı (Deneme: ${attempt}, Model: ${modelName}) ---`);
      
      const result = await model.generateContent(prompt);
      const response = await result.response;
      
      const candidate = response.candidates?.[0];
      const finishReason = candidate?.finishReason;
      const text = response.text();

      console.log(`AI Yanıt Durumu: ${finishReason}`);
      console.log(`AI Yanıt Uzunluğu: ${text?.length || 0} karakter`);

      if (!text || text.length === 0) {
        console.error("!!! HATA: AI boş içerik döndü. Sebep:", finishReason);
        if (finishReason === "SAFETY") {
          console.error("İçerik filtreye takıldı. İSG terimleri (ölüm, kaza) engellenmiş olabilir.");
        }
        continue;
      }

      // JSON Ayıklama
      const parsed = extractJsonObject(text);
      if (parsed) {
        console.log("✅ JSON başarıyla doğrulandı.");
        return text;
      }

      /**
       * KOTA YÖNETİMİ: 
       * Eğer parse başarısızsa ve ücretsiz tier'daysan, tekrar denemek yerine 
       * mevcudu düzeltmeye çalışmak yerine deterministik veriye güvenmek daha sağlıklıdır.
       * Ama yine de 1 kez 'repair' deniyoruz.
       */
      if (attempt < maxRetries) {
        console.warn("⚠️ JSON parse hatası. Bir sonraki denemede daha katı format istenecek.");
        // Prompt'u biraz daha basitleştirip tekrar dene (opsiyonel)
        await sleep(30000); 
      }

    } catch (err: any) {
      console.error(`❌ GEMINI HATASI (Deneme ${attempt}):`, err.message);
      
      // Model Bulunamadı Hatası (404)
      if (err.message?.includes("not found") || err.message?.includes("404")) {
        throw { 
          type: "MODEL_NOT_FOUND", 
          message: `Model (${modelName}) bulunamadı. Lütfen .env dosyasını gemini-1.5-flash olarak güncelleyin.` 
        };
      }

      // Kota Hatası (429) - Ücretsiz tier sınırı
      if (err?.status === 429 || err.message?.includes("429")) {
        console.warn("🚦 Kota doldu. 35 saniye bekleniyor...");
        await sleep(35000); // 429 hatasında Google genelde 20sn beklemeni ister
        continue;
      }
      
      if (attempt === maxRetries) throw err;
    }
  }

  return null;
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

    let aiText: string | null = null;

    try {
      aiText = await withTimeout(callGeminiJSON(prompt), REQUEST_TIMEOUT_MS);

      if (!aiText) {
        warnings.push("Yapay zekâ geçerli bir çıktı üretemedi. Temel analiz gösteriliyor.");
      }


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
        warnings.push("Yapay zekâ analiz süresi aşıldı. Temel risk analizi gösteriliyor.");

        return NextResponse.json({
          success: true,
          type: "risk-analysis",
          fileName: file.name,
          primarySheetName,
          analysis: null,
          deterministic,
          warnings,
          meta: {
            aiTimeout: true,
            requestId,
          },
        });
      }


      log("ERROR", requestId, "AI_FAILED", {
        errorType: err?.type ?? null,
        error: err?.message ?? err,
      });

      warnings.push("Yapay zekâ yorumu üretilemedi. Temel analiz gösteriliyor.");

      return NextResponse.json({
        success: true,
        type: "risk-analysis",
        fileName: file.name,
        primarySheetName,
        analysis: null,
        deterministic,
        warnings,
        meta: {
          requestId,
          aiFailed: true,
        },
      });

    }

    /* ---------------- SAFE JSON PARSE ---------------- */
    log("TRACE", requestId, "AI_JSON_PARSE_START");

    const parsed = aiText ? extractJsonObject(aiText) : null;


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

    function validateAIOutput(parsed: any, deterministic: any) {
  if (!parsed) return false;

  if (!parsed.documentSummary || parsed.documentSummary.length < 120)
    return false;

  if (!Array.isArray(parsed.topRisks)) return false;

  if (parsed.topRisks.length !== deterministic.topRisks.length)
    return false;

  if (!parsed.stats?.highestRiskScore)
    return false;

  return true;
}

    /* ---------------- FINAL RESPONSE ---------------- */

  const aiValid = validateAIOutput(parsed, deterministic);

      // route.ts - POST fonksiyonunun sonuna doğru

    const fallbackSummary = buildDeterministicExecutiveSummary(deterministic);

    // AI geçerli değilse bile stats nesnesini mutlaka oluştur
    const finalAnalysis = aiValid
      ? parsed
      : {
          documentType: "risk_analysis",
          confidence: 0.65,
          documentSummary: fallbackSummary,
          // Frontend stats.rowsEstimated bekliyor
          stats: {
            rowsEstimated: deterministic.rowsEstimated,
            scoredRowsEstimated: deterministic.scoredRowsEstimated,
            highestRiskScore: deterministic.highestRiskScore,
            highestRiskLevel: deterministic.highestRiskLevel,
            distribution: deterministic.distribution,
          },
          topRisks: deterministic.topRisks,
          complianceGaps: [],
          managementActionPlan: [],
        };

    // ÖNEMLİ: Eğer AI başarılıysa (aiValid ise), 
    // AI bazen 'stats' objesini üretmeyi unutabilir. 
    // Bu yüzden manuel olarak ekleyelim:
    if (aiValid && !parsed.stats) {
      parsed.stats = {
        rowsEstimated: deterministic.rowsEstimated,
        scoredRowsEstimated: deterministic.scoredRowsEstimated,
        highestRiskScore: deterministic.highestRiskScore,
        highestRiskLevel: deterministic.highestRiskLevel,
        distribution: deterministic.distribution,
      };
    }
    return NextResponse.json({
      success: true,
      type: "risk-analysis",
      fileName: file.name,
      primarySheetName,

      analysis: finalAnalysis,

      // AI eksikse deterministic kesin dolu
      deterministic: deterministic || null,

      warnings,

      meta: {
      requestId,
      durationMs: duration,
      sheetCount: wb.SheetNames.length,
      modelName: process.env.GOOGLE_MODEL || "gemini-2.5-flash",
      hybridMode: true,
      aiUsed: aiValid,
    }
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
