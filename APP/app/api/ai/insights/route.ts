import OpenAI from "openai";
import { NextResponse } from "next/server";
import { supabaseServerClient } from "@/app/lib/supabase/server";

export async function POST(req: Request) {
  const { org_id } = await req.json();
  const supabase = await supabaseServerClient();

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  // Örnek veri çekimi
  const recent = await supabase
    .from("submissions")
    .select("content")
    .eq("org_id", org_id)
    .limit(20);

  const prompt = `
Sen Denetron için çalışan gelişmiş bir AI analiz uzmanısın.
Son gönderimler:
${recent.data?.map(d => "- " + d.content).join("\n")}

Bu organizasyon için:
- operasyonel risk analizi
- trend tahmini
- süreç optimizasyonu
- kalite önerileri

hazırla.
`;

  const result = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [{ role: "user", content: prompt }],
  });

  return NextResponse.json({ insights: result.choices[0].message.content });
}
