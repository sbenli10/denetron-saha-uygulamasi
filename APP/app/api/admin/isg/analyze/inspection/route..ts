//APP\app\api\admin\isg\analyze\inspection\route..ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { GoogleGenerativeAI } from "@google/generative-ai";

export const runtime = "nodejs";

/* ---------------------------------------
   SAFE JSON PARSER
--------------------------------------- */
function safeJson(raw: string) {
  try {
    return JSON.parse(raw.replace(/```json|```/g, "").trim());
  } catch {
    return { findings: [] };
  }
}

export async function POST(req: Request) {
  try {
    /* ---------------- AUTH ---------------- */
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          get(name) {
            return cookies().get(name)?.value;
          },
        },
      }
    );

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "UNAUTHORIZED" },
        { status: 401 }
      );
    }

    /* ---------------- ORG + PREMIUM ---------------- */
    const { data: org } = await supabase
      .from("organizations")
      .select("id, is_premium")
      .eq("id", user.user_metadata.organization_id)
      .single();

    if (!org?.is_premium) {
      return NextResponse.json(
        { error: "PREMIUM_REQUIRED" },
        { status: 403 }
      );
    }

    /* ---------------- FILE ---------------- */
    const form = await req.formData();
    const file = form.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "FILE_REQUIRED" },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    /* ---------------- GEMINI ---------------- */
    const genAI = new GoogleGenerativeAI(
      process.env.GOOGLE_API_KEY!
    );

    const model = genAI.getGenerativeModel({
      model: process.env.GOOGLE_MODEL || "gemini-2.5-flash",
    });

    const prompt = `
Bu belge bir İŞ SAĞLIĞI VE GÜVENLİĞİ (İSG) DENETİM TUTANAĞIDIR.

AMAÇ:
Denetim tespitlerini sade, net ve ayrı maddeler halinde ayırmak.

KURALLAR:
- Yorum yapma
- Tavsiye yazma
- DÖF oluşturma
- Metinde olmayan bilgi ekleme

SADECE JSON DÖNDÜR:

{
  "findings": [
    {
      "text": "",
      "priority": "Düşük | Orta | Yüksek",
      "deadline": null,
      "lawReference": null
    }
  ]
}
`;

    const result = await model.generateContent([
      {
        inlineData: {
          data: buffer.toString("base64"),
          mimeType: file.type,
        },
      },
      prompt,
    ]);

    const parsed = safeJson(result.response.text());

    return NextResponse.json({
      type: "inspection",
      findings: parsed.findings ?? [],
    });
  } catch (err) {
    console.error("INSPECTION ANALYZE ERROR:", err);
    return NextResponse.json(
      { error: "SERVER_ERROR" },
      { status: 500 }
    );
  }
}
