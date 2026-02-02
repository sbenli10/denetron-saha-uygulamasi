//APP\app\api\ai\suggest-template\route.ts
import { NextResponse } from "next/server";
import { supabaseServiceRoleClient } from "@/lib/supabase/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);
const model = genAI.getGenerativeModel({ model: process.env.GOOGLE_MODEL || "gemini-2.0-pro" });

export async function POST(req: Request) {
  try {
    const { operator_id, org_id } = await req.json();

    if (!operator_id || !org_id) {
      return NextResponse.json({ error: "Missing operator_id or org_id" }, { status: 400 });
    }

    const supabase = supabaseServiceRoleClient();

    /** 1) Operatör geçmiş görevleri */
    const past = await supabase
      .from("assignments")
      .select("template_id, note, created_at")
      .eq("operator_id", operator_id)
      .order("created_at", { ascending: false });

    /** 2) Tüm aktif şablonlar */
    const templates = await supabase
      .from("templates")
      .select("id,name,description,tags")
      .eq("org_id", org_id)
      .eq("is_active", true);

    const aiInput = `
OPERATÖR BİLGİLERİ:
${JSON.stringify(past.data, null, 2)}

ŞABLON LİSTESİ:
${JSON.stringify(templates.data, null, 2)}

Görev:
- Operatörün geçmişine, şablon adlarına, açıklamalara, etiketlere, semantic similarity ve intent match'e göre EN UYGUN TEK ŞABLONU seç.
- Cevap JSON olarak dön:
{
  "template_id": "...",
  "confidence": 0-1 arasında bir sayı
}
`;

    const aiRes = await model.generateContent(aiInput);
    const text = aiRes.response.text();

    let json;
    try {
      json = JSON.parse(text);
    } catch {
      return NextResponse.json({ error: "AI JSON parse error", raw: text }, { status: 500 });
    }

    return NextResponse.json(json);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
