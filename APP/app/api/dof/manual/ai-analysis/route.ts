//APP\app\api\dof\manual\ai-analysis\route.ts
import { NextResponse } from "next/server";
import { supabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";


type ItemFile = {
  file: {
    url: string;
  } | null;
};

type DofItem = {
  area: string | null;
  severity: string | null;
  risk_description: string;
  action_description: string | null;
  long_description: string | null;
  files: ItemFile[];
};

/* ================= HELPERS ================= */

async function imageUrlToInlinePart(url: string) {
  const res = await fetch(url);
  const buffer = Buffer.from(await res.arrayBuffer());

  return {
    inlineData: {
      mimeType: res.headers.get("content-type") || "image/jpeg",
      data: buffer.toString("base64"),
    },
  };
}

function buildIntroPrompt(): string {
  return `
Sen, 6331 sayılı İş Sağlığı ve Güvenliği Kanunu, ilgili yönetmelikler
(Risk Değerlendirmesi Yönetmeliği, Sağlık ve Güvenlik İşaretleri Yönetmeliği,
Çalışanların Eğitimi Yönetmeliği vb.) kapsamında çalışan,
çok deneyimli ve yetkili bir İş Sağlığı ve Güvenliği (İSG) uzmanısın.

Aşağıda;
- Sahadan çekilmiş GERÇEK fotoğraflar
- Kullanıcı tarafından girilmiş Düzeltici ve Önleyici Faaliyet (DÖF) maddeleri
birlikte sunulmaktadır.

GÖREV VE YETKİ KAPSAMIN:
- Fotoğrafları, sahadaki fiili durumu yansıtacak şekilde dikkatlice incele
- Metinsel risk tanımları ile fotoğrafları birlikte değerlendir
- Analizini; fotoğraflarda GÖRÜLEN gerçek tehlike ve risklere dayandır
- Tahmin, varsayım veya senaryo üretme
- Mevzuata aykırılık, eksiklik veya uygunsuzlukları açık ve nesnel şekilde belirt
- Denetime sunulabilecek, resmi ve teknik bir dil kullan
- Kullanıcı adına karar verme, yalnızca değerlendirme ve öneri sun

ÖNEMLİ TALİMAT:
- Eğer fotoğraflarda görülen riskler ile kullanıcı tarafından yazılan risk tanımı
  birbiriyle UYUŞMUYORSA:
  - Bu durumu açıkça ve tarafsız şekilde belirt
  - Analizi fotoğraflardaki fiili duruma göre yap
  - Metin–görsel uyumsuzluğunu raporda özellikle vurgula
  - Suçlayıcı, itham edici veya yargılayıcı dil kullanma

ANALİZDE DİKKATE ALINACAK ESASLAR:
- Tehlikenin kaynağı
- Olası maruziyetler
- Çalışanlar üzerindeki muhtemel etkiler
- Mevcut kontrol tedbirlerinin yeterliliği
- İlave alınması gereken önlemler
- Önlemlerin mevzuata uygunluğu
- Analiz Sonucu Çok uzun olmasın

ÇIKTI FORMATINA MUTLAKA UY:

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
`;
}

/* ================= ROUTE ================= */

export async function POST(req: Request) {
  console.log("[AI_ANALYSIS] ===== REQUEST START =====");

  try {
    const supabase = supabaseServerClient();
    const { dof_id } = await req.json();

    if (!dof_id) {
      return NextResponse.json({ error: "dof_id zorunludur" }, { status: 400 });
    }

    /* ===== AUTH ===== */
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
    }

    /* ===== FETCH COMPLETED ITEMS ===== */
    const { data: items, error } = await supabase
    .from("dof_items")
    .select(`
      area,
      severity,
      risk_description,
      action_description,
      long_description,
      files:dof_item_files (
        file:files ( url )
      )
    `)
    .eq("dof_report_id", dof_id)
    .eq("status", "completed")
    .returns<DofItem[]>();

    if (error || !items || items.length === 0) {
      return NextResponse.json(
        { error: "Analiz için tamamlanmış madde bulunamadı" },
        { status: 400 }
      );
    }

    /* ===== BUILD CONTENT ===== */
    const parts: any[] = [
      { text: buildIntroPrompt() },
    ];

    for (let i = 0; i < items.length; i++) {
      const item = items[i];

      parts.push({
        text: `
        MADDE ${i + 1}
        İlgili Bölüm: ${item.area}
        Önem Seviyesi: ${item.severity}

        Risk Tanımı:
        ${item.risk_description}

        Planlanan Faaliyet:
        ${item.action_description ?? "Belirtilmemiştir."}

        Detaylı Açıklama:
        ${item.long_description ?? "—"}
        `,
      });

      for (const f of item.files ?? []) {
        if (f.file?.url) {
          parts.push(await imageUrlToInlinePart(f.file.url));
        }
      }
    }

    /* ===== GEMINI VISION CALL ===== */
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${process.env.GOOGLE_MODEL}:generateContent?key=${process.env.GOOGLE_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts }],
          generationConfig: {
            temperature: 0.25,
            maxOutputTokens: 4096,
          },
        }),
      }
    );

    const json = await res.json();
    const analysis =
      json?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!analysis) {
      return NextResponse.json({ error: "AI yanıtı alınamadı" }, { status: 500 });
    }

    /* ===== SAVE REPORT ===== */
    await supabase
      .from("dof_reports")
      .update({ ai_report: analysis })
      .eq("id", dof_id);

    console.log("[AI_ANALYSIS] SUCCESS");

    return NextResponse.json({ success: true, analysis });

  } catch (err) {
    console.error("[AI_ANALYSIS_ERROR]", err);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
