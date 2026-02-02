// APP/app/api/dof/ai-evidence-analysis/route.ts
import { NextResponse } from "next/server";
import { supabaseServerClient } from "@/lib/supabase/server";
import {
  analyzeEvidence,
  buildEvidencePrompt,
  GeminiImageInput,
} from "@/lib/ai/analyzeEvidence";
import { mapIsoClause } from "@/lib/dof/isoMapping";

/* ================= CONFIG ================= */
const GEMINI_IMAGE_LIMIT = 5;
const MANUAL_REVIEW_THRESHOLD = 40;

/* ================= TYPES ================= */
type AiRawResult = {
  risk_level: "Low" | "Medium" | "High" | "Critical" | "Manual Review";
  observed_risks: string[];
  suggested_actions: string[];
  confidence: number; // 0–1
};

type FileRow = {
  url: string;
  type: "photo" | "video";
};

/* ================= HELPERS ================= */
function safeJsonParse<T>(raw: string): T | null {
  try {
    const cleaned = raw.replace(/```json|```/g, "").trim();
    return JSON.parse(cleaned);
  } catch {
    return null;
  }
}

function detectMimeType(url: string): string {
  if (url.endsWith(".png")) return "image/png";
  if (url.endsWith(".webp")) return "image/webp";
  return "image/jpeg";
}

async function imageUrlToBase64(url: string): Promise<string> {
  const res = await fetch(url);
  const buf = await res.arrayBuffer();
  return Buffer.from(buf).toString("base64");
}

/* ================= ROUTE ================= */
export async function POST(req: Request) {
  const supabase = supabaseServerClient();
  const { dof_item_id } = await req.json();

  if (!dof_item_id) {
    return NextResponse.json(
      { error: "dof_item_id zorunlu" },
      { status: 400 }
    );
  }

  /* ---------- DOF ITEM ---------- */
  const { data: item, error: itemErr } = await supabase
    .from("dof_items")
    .select("id, risk_description")
    .eq("id", dof_item_id)
    .single();

  if (itemErr || !item) {
    return NextResponse.json(
      { error: "DÖF maddesi bulunamadı" },
      { status: 404 }
    );
  }

  /* ---------- FILES ---------- */
  const { data: files } = await supabase
    .from("dof_item_files")
    .select("file:files(url, type)")
    .eq("dof_item_id", dof_item_id);

  const imageInputs: GeminiImageInput[] = [];
  let hasVideo = false;

  for (const row of files ?? []) {
    const file = (row as any).file as FileRow;
    if (!file?.url) continue;

    if (
      file.type === "photo" &&
      imageInputs.length < GEMINI_IMAGE_LIMIT
    ) {
      imageInputs.push({
        inlineData: {
          mimeType: detectMimeType(file.url),
          data: await imageUrlToBase64(file.url),
        },
      });
    }

    if (file.type === "video") {
      hasVideo = true;
    }
  }

  /* ---------- PROMPT ---------- */
  let prompt = buildEvidencePrompt(item.risk_description);

  if (hasVideo) {
    prompt += `
NOT: Video dosyaları analiz edilmemektedir.
Yalnızca fotoğraflara dayan.
Yetersizse "Manual Review" belirt.
`;
  }

  /* ---------- AI ---------- */
  let raw = "";
  try {
    raw = await analyzeEvidence({ prompt, imageInputs });
  } catch {
    raw = "";
  }

  const parsed = safeJsonParse<AiRawResult>(raw);

  /* ---------- FALLBACK (AI FAIL) ---------- */
  if (!parsed) {
    const iso = mapIsoClause({
      riskText: item.risk_description,
      severity: "manual review",
    });

    await supabase.from("dof_item_ai_analysis").upsert(
      {
        dof_item_id,
        risk_level: "Manual Review",
        findings: "Yapay zekâ güvenilir sonuç üretemedi.",
        recommendation: "Uzman denetçi incelemesi zorunludur.",
        confidence: 0,
        iso_clauses: iso ? [iso] : [],
      },
      { onConflict: "dof_item_id" }
    );

    return NextResponse.json({ success: true, manual: true });
  }

  /* ---------- CONFIDENCE ---------- */
  const confidencePercent = Math.round(parsed.confidence * 100);
  const isManual = confidencePercent < MANUAL_REVIEW_THRESHOLD;
  const finalRisk = isManual ? "Manual Review" : parsed.risk_level;

  /* ---------- ISO ---------- */
  const iso = mapIsoClause({
    riskText: item.risk_description,
    severity: finalRisk.toLowerCase(),
  });

  /* ---------- SAVE ---------- */
  await supabase.from("dof_item_ai_analysis").upsert(
    {
      dof_item_id,
      risk_level: finalRisk,
      findings: parsed.observed_risks.join("\n"),
      recommendation: parsed.suggested_actions.join("\n"),
      confidence: confidencePercent,
      iso_clauses: iso ? [iso] : [],
    },
    { onConflict: "dof_item_id" }
  );

  return NextResponse.json({ success: true });
}
