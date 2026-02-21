//APP\app\api\dof\manual\item-ai-analysis\route.ts
import { NextResponse } from "next/server";
import { supabaseServerClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  const supabase = supabaseServerClient();

  try {
    const { dof_item_id } = await req.json();

    if (!dof_item_id) {
      return NextResponse.json(
        { error: "dof_item_id zorunlu" },
        { status: 400 }
      );
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
    }

    /* ================= ITEM FETCH ================= */

    const { data: item, error } = await supabase
      .from("dof_items")
      .select(`
        id,
        area,
        severity,
        risk_description,
        long_description,
        dof_item_files (
          files ( url )
        )
      `)
      .eq("id", dof_item_id)
      .single();

    if (error || !item) {
      return NextResponse.json(
        { error: "Madde bulunamadı" },
        { status: 404 }
      );
    }

    /* ================= IMAGE PARTS ================= */

    const imageUrls =
      item.dof_item_files?.map((f: any) => f.files?.url).filter(Boolean) ?? [];

    const parts: any[] = [
      {
        text: `
Aşağıdaki DÖF maddesini ve fotoğrafları değerlendir.

İlgili Bölüm: ${item.area ?? "—"}
Önem Seviyesi: ${item.severity ?? "—"}

Risk Tanımı:
${item.risk_description}

Detaylı Açıklama:
${item.long_description ?? "—"}

Çıktı formatı:

Risk Seviyesi:
Tespit Edilen Bulgular:
Önerilen Düzeltici Faaliyet:
`
      }
    ];

    for (const url of imageUrls) {
      const res = await fetch(url);
      const buffer = Buffer.from(await res.arrayBuffer());
      parts.push({
        inlineData: {
          mimeType: "image/jpeg",
          data: buffer.toString("base64"),
        },
      });
    }

    /* ================= GEMINI CALL ================= */

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GOOGLE_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts }],
        }),
      }
    );

    const json = await res.json();

    const text =
      json?.candidates?.[0]?.content?.parts
        ?.map((p: any) => p.text ?? "")
        .join("") ?? "";

    if (!text) {
      return NextResponse.json(
        { error: "AI cevap üretmedi" },
        { status: 500 }
      );
    }

    /* ================= SAVE TO TABLE ================= */

    await supabase
      .from("dof_item_ai_analysis")
      .upsert({
        dof_item_id,
        findings: text,
        risk_level: item.severity ?? null,
        confidence: 85,
      });

    return NextResponse.json({ success: true, analysis: text });

  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Sunucu hatası" },
      { status: 500 }
    );
  }
}