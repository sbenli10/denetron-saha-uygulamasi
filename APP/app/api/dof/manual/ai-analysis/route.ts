// APP/app/api/dof/manual/ai-analysis/route.ts
import { NextResponse } from "next/server";
import crypto from "crypto";
import { supabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* ===================== Types ===================== */

type ItemFileRow = { file: { url: string } | null };

type DofItemRow = {
  area: string | null;
  severity: string | null;
  risk_description: string;
  action_description: string | null;
  long_description: string | null;
  files: ItemFileRow[] | null;
};

/* ===================== Config ===================== */

const MODEL_PRIMARY = process.env.GOOGLE_MODEL || "gemini-2.5-flash";
const MODEL_ROBUST = process.env.GOOGLE_MODEL_ROBUST || "gemini-1.5-pro-latest";
const API_KEY = process.env.GOOGLE_API_KEY || "";

const SA_B64 = process.env.GOOGLE_SERVICE_ACCOUNT_JSON_BASE64 || "";

const GENLANG_BASE = "https://generativelanguage.googleapis.com/v1beta";
const DEFAULT_TIMEOUT_MS = 25_000; // Gemini call timeout
const IMAGE_FETCH_TIMEOUT_MS = 8_000;
const MAX_IMAGES_TOTAL = 6; // total inline images to attach
const MAX_OUTPUT_TOKENS = 3800; // veya 4096

/* ===================== Helpers ===================== */

function jsonError(message: string, status = 500, extra?: any) {
  return NextResponse.json({ error: message, ...(extra ?? {}) }, { status });
}

function safeStr(x: any) {
  return typeof x === "string" ? x : x == null ? "" : String(x);
}

function buildPromptIntro(): string {
  return `
Sen, 6331 sayılı İş Sağlığı ve Güvenliği Kanunu ve ilgili yönetmelikler kapsamında çalışan, çok deneyimli bir İSG uzmanısın.

Aşağıda DÖF maddeleri ve sahadan çekilmiş fotoğraflar birlikte verilecektir.

Kurallar:
- Fotoğrafları ve metni birlikte değerlendir; varsayım üretme.
- Metin ile görsel çelişiyorsa, bunu tarafsız biçimde belirt ve fiili duruma göre raporla.
- Resmi/teknik bir dille, kısa ve net yaz.

ÇIKTI FORMATINA UY:

MADDE X
Mevcut Risk Durumu:
Olası Tehlikeler:
Planlanan Faaliyetin Değerlendirilmesi:
İlave Öneriler:

EN SON:
GENEL FAALİYET RAPORU DEĞERLENDİRMESİ
- Genel risk seviyesi
- DÖF faaliyetlerinin yeterliliği
- İzleme ve tekrar denetim gerekliliği
`.trim();
}

async function fetchWithTimeout(url: string, init: RequestInit, timeoutMs: number) {
  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...init, signal: ac.signal });
    return res;
  } finally {
    clearTimeout(t);
  }
}

async function imageUrlToInlinePart(url: string) {
  // InlineData: base64 image bytes
  const res = await fetchWithTimeout(url, { method: "GET" }, IMAGE_FETCH_TIMEOUT_MS);
  if (!res.ok) throw new Error(`image_fetch_failed:${res.status}`);

  const contentType = res.headers.get("content-type") || "image/jpeg";
  const buf = Buffer.from(await res.arrayBuffer());
  const b64 = buf.toString("base64");

  return {
    inlineData: {
      mimeType: contentType,
      data: b64,
    },
  };
}

/**
 * Service Account -> OAuth2 access token (Google APIs)
 * Scope: cloud-platform is enough for most; you can also add generativelanguage scope.
 */
async function getAccessTokenFromServiceAccount(reqId: string): Promise<string> {
  if (!SA_B64) throw new Error("missing_service_account_b64");

  const jsonStr = Buffer.from(SA_B64, "base64").toString("utf8");
  const sa = JSON.parse(jsonStr) as {
    client_email: string;
    private_key: string;
    token_uri?: string;
  };

  if (!sa?.client_email || !sa?.private_key) throw new Error("invalid_service_account_json");

  const tokenUri = sa.token_uri || "https://oauth2.googleapis.com/token";
  const now = Math.floor(Date.now() / 1000);
  const exp = now + 3600;

  // Minimal JWT (RS256) using Node crypto
  const header = { alg: "RS256", typ: "JWT" };
  const claimSet = {
    iss: sa.client_email,
    scope: "https://www.googleapis.com/auth/cloud-platform",
    aud: tokenUri,
    iat: now,
    exp,
  };

  const base64url = (obj: any) =>
    Buffer.from(JSON.stringify(obj))
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/g, "");

  const encHeader = base64url(header);
  const encClaims = base64url(claimSet);
  const unsigned = `${encHeader}.${encClaims}`;

  const sign = crypto.createSign("RSA-SHA256");
  sign.update(unsigned);
  sign.end();
  const signature = sign
    .sign(sa.private_key)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");

  const jwt = `${unsigned}.${signature}`;

  const body = new URLSearchParams({
    grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
    assertion: jwt,
  });

  const res = await fetchWithTimeout(
    tokenUri,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    },
    12_000
  );

  const json = await res.json().catch(() => null);

  if (!res.ok || !json?.access_token) {
    console.error("[AI_ANALYSIS] token_error", { reqId, status: res.status, json });
    throw new Error("service_account_token_failed");
  }

  return json.access_token as string;
}

function buildGeminiUrl(model: string, apiKey?: string) {
  const base = `${GENLANG_BASE}/models/${encodeURIComponent(model)}:generateContent`;
  return apiKey ? `${base}?key=${encodeURIComponent(apiKey)}` : base;
}

async function callGeminiGenerateContent(args: {
  reqId: string;
  model: string;
  parts: any[];
  apiKey?: string;
  accessToken?: string;
}) {
  const { reqId, model, parts, apiKey, accessToken } = args;

  const url = buildGeminiUrl(model, apiKey);
  const headers: Record<string, string> = { "Content-Type": "application/json" };

  if (accessToken) headers["Authorization"] = `Bearer ${accessToken}`;

  const res = await fetchWithTimeout(
    url,
    {
      method: "POST",
      headers,
      body: JSON.stringify({
        contents: [{ role: "user", parts }],
        generationConfig: {
          temperature: 0.25,
          maxOutputTokens: MAX_OUTPUT_TOKENS,
        },
      }),
    },
    DEFAULT_TIMEOUT_MS
  );

  const json = await res.json().catch(() => null);

  if (!res.ok) {
    console.error("[AI_ANALYSIS] gemini_http_error", {
      reqId,
      model,
      status: res.status,
      json,
      via: accessToken ? "service_account" : "api_key",
    });
    throw Object.assign(new Error("gemini_http_error"), { status: res.status, json });
  }

  const partsArr = json?.candidates?.[0]?.content?.parts ?? [];
  const text = partsArr
    .map((p: any) => (typeof p?.text === "string" ? p.text : ""))
    .join("")
    .trim();


  if (!text) {
  console.error("[AI_ANALYSIS] gemini_empty_text", { reqId, model, json });
  throw new Error("gemini_empty_text");
  }
  return text;

}

function pickImageUrls(items: DofItemRow[]): string[] {
  const urls: string[] = [];
  for (const it of items) {
    for (const f of it.files ?? []) {
      const u = f?.file?.url;
      if (u && typeof u === "string") urls.push(u);
    }
  }
  // unique + limit
  const uniq = Array.from(new Set(urls));
  return uniq.slice(0, MAX_IMAGES_TOTAL);
}

/* ===================== Route ===================== */

export async function POST(req: Request) {
  const reqId = crypto.randomUUID();
  console.log(`[AI_ANALYSIS][${reqId}] ===== REQUEST START =====`);

  try {
    const supabase = supabaseServerClient();
    const body = await req.json().catch(() => ({}));
    const dof_id = body?.dof_id as string | undefined;

    if (!dof_id) return jsonError("dof_id zorunludur", 400);

    // AUTH
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return jsonError("Yetkisiz", 401);

    // Fetch completed items
    const { data: items, error } = await supabase
      .from("dof_items")
      .select(
        `
        area,
        severity,
        risk_description,
        action_description,
        long_description,
        files:dof_item_files (
          file:files ( url )
        )
      `
      )
      .eq("dof_report_id", dof_id)
      .eq("status", "completed")
      .returns<DofItemRow[]>();

    if (error) {
      console.error(`[AI_ANALYSIS][${reqId}] db_error`, error);
      return jsonError("DÖF maddeleri alınamadı", 500);
    }

    if (!items || items.length === 0) {
      return jsonError("Analiz için tamamlanmış madde bulunamadı", 400);
    }

    // Build parts: prompt + items + a limited set of images
    const parts: any[] = [{ text: buildPromptIntro() }];
    
    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      parts.push({
        text: [
          `MADDE ${i + 1}`,
          `İlgili Bölüm: ${safeStr(it.area) || "—"}`,
          `Önem Seviyesi: ${safeStr(it.severity) || "—"}`,
          ``,
          `Risk Tanımı:`,
          safeStr(it.risk_description),
          ``,
          `Planlanan Faaliyet:`,
          safeStr(it.action_description) || "Belirtilmemiştir.",
          ``,
          `Detaylı Açıklama:`,
          safeStr(it.long_description) || "—",
        ].join("\n"),
      });
    }

    // Attach images (global cap)
    const imageUrls = pickImageUrls(items);
    if (imageUrls.length > 0) {
      parts.push({
        text: `\nAşağıdaki fotoğrafları da değerlendirmeye dahil et (toplam ${imageUrls.length} adet):\n`,
      });
    }

    for (const url of imageUrls) {
      try {
        parts.push(await imageUrlToInlinePart(url));
      } catch (e) {
        console.warn(`[AI_ANALYSIS][${reqId}] image_skip`, { url, err: String(e) });
        // skip bad/slow images, continue
      }
    }

    // ---- Try strategy:
    // 1) API key + primary model
    // 2) API key + robust model
    // 3) Service account + primary model
    // 4) Service account + robust model
    const attempts: Array<{
      label: string;
      model: string;
      via: "api_key" | "service_account";
    }> = [
      { label: "api_key_primary", model: MODEL_PRIMARY, via: "api_key" },
      { label: "api_key_robust", model: MODEL_ROBUST, via: "api_key" },
      { label: "sa_primary", model: MODEL_PRIMARY, via: "service_account" },
      { label: "sa_robust", model: MODEL_ROBUST, via: "service_account" },
    ];

    let analysisText: string | null = null;
    let lastErr: any = null;

    for (const a of attempts) {
      try {
        console.log(`[AI_ANALYSIS][${reqId}] attempt=${a.label} model=${a.model}`);
        if (a.via === "api_key") {
          if (!API_KEY) throw new Error("missing_google_api_key");
          analysisText = await callGeminiGenerateContent({
            reqId,
            model: a.model,
            parts,
            apiKey: API_KEY,
          });
        } else {
          const token = await getAccessTokenFromServiceAccount(reqId);
          analysisText = await callGeminiGenerateContent({
            reqId,
            model: a.model,
            parts,
            accessToken: token,
          });
        }
        break; // success
      } catch (e) {
        lastErr = e;
        // If it's a hard auth/permission error, still try the other auth method.
        console.warn(`[AI_ANALYSIS][${reqId}] attempt_failed`, {
          attempt: a.label,
          err: String(e),
        });
        continue;
      }
    }

    if (!analysisText) {
      console.error(`[AI_ANALYSIS][${reqId}] all_attempts_failed`, lastErr);
      return jsonError("AI analizi alınamadı (timeout/izin/bağlantı).", 500, {
        reqId,
      });
    }

    // Save into dof_reports.ai_report
    const { error: upErr } = await supabase
      .from("dof_reports")
      .update({ ai_report: analysisText })
      .eq("id", dof_id);

    if (upErr) {
      console.error(`[AI_ANALYSIS][${reqId}] save_error`, upErr);
      // still return the analysis
    }

    console.log(`[AI_ANALYSIS][${reqId}] SUCCESS`);
    return NextResponse.json({ success: true, analysis: analysisText, reqId });
  } catch (err) {
    console.error("[AI_ANALYSIS_ERROR]", err);
    return jsonError("Sunucu hatası", 500);
  }
}
