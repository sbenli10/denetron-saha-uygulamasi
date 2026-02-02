import PDFDocument from "pdfkit";
import path from "path";
import QRCode from "qrcode";
import { supabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* ================= CONFIG ================= */

const MARGIN = 50;
const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;
const BODY_TEXT = {
  width: CONTENT_WIDTH - 20, // biraz genişlettik → satır kırılması azalır
  indent: 10,                // 12 → 10 (fazla girinti profesyonel durmuyor)
  lineGap: 4,                // 5 → 4 (okunabilir ama sıkı)
  paragraphGap: 6,           // 8 → 6 (blok hissi korunur, boşluk şişmez)
};

const TITLE_TEXT = {
  width: CONTENT_WIDTH,
  lineGap: 3,                // 4 → 3 (başlıklar daha kompakt)
};


const SECTION_GAP = 14;
const SUBSECTION_GAP = 8;
const BLOCK_GAP = 6;

const HEADER_STYLE = {
  width: CONTENT_WIDTH,
};

const TEXT_STYLE = {
  width: CONTENT_WIDTH,
  lineGap: 4,
  paragraphGap: 6,
};

/* ================= HELPERS ================= */

  const safe = (v: any) =>
    v === null || v === undefined || v === "" ? "—" : String(v);

  const formatDate = (v: any) =>
    v ? new Date(v).toLocaleDateString("tr-TR") : "—";

  function ensureSpace(
    doc: InstanceType<typeof PDFDocument>,
    neededHeight: number
  ) {
    const remaining =
      PAGE_HEIGHT - doc.y - MARGIN;

    if (remaining < neededHeight) {
      doc.addPage();
    }
  }



/* ================= ROUTE ================= */

export async function GET(req: Request) {
  const supabase = supabaseServerClient();
  const { searchParams } = new URL(req.url);
  const dofId = searchParams.get("id");

  if (!dofId) return new Response("id zorunlu", { status: 400 });

  /* ================= DATA ================= */

  const { data: dof } = await supabase
    .from("dof_reports")
    .select(`
      id,
      submission_id,
      report_no,
      report_date,
      status,
      created_at,
      dof_items (
        id,
        risk_description,
        action_description,
        ai_analysis:dof_item_ai_analysis (
          risk_level,
          findings,
          recommendation,
          confidence
        )
      )
    `)
    .eq("id", dofId)
    .single();

  if (!dof) return new Response("DÖF bulunamadı", { status: 404 });

  const { data: signatures } = await supabase
    .from("files")
    .select("url, metadata")
    .eq("submission_id", dof.submission_id)
    .eq("type", "signature");

    

  /* ================= PDF SETUP ================= */

  const fontRegular = path.join(
    process.cwd(),
    "public/fonts/Inter_18pt-Regular.ttf"
  );
  const fontBold = path.join(
    process.cwd(),
    "public/fonts/Inter_24pt-Bold.ttf"
  );

  const doc = new PDFDocument({
    size: "A4",
    margin: MARGIN,
    font: fontRegular,
    bufferPages: true,
  });

  const chunks: Buffer[] = [];
  doc.on("data", c => chunks.push(c));

  /* ======================================================
     ================ 1️⃣ COVER PAGE ======================
     ====================================================== */

  doc.rect(0, 0, PAGE_WIDTH, PAGE_HEIGHT).fill("#0B2540");

  doc
    .font(fontBold)
    .fontSize(26)
    .fillColor("#FFFFFF")
    .text(
      "DÜZELTİCİ VE ÖNLEYİCİ\nFAALİYET RAPORU",
      MARGIN,
      180,
      { width: CONTENT_WIDTH, align: "center" }
    );

  doc
    .fontSize(14)
    .fillColor("#D6E4F0")
    .text("(DÖF)", { align: "center" });

  doc.moveDown(3);

  doc
    .font(fontRegular)
    .fontSize(12)
    .fillColor("#FFFFFF")
    .text(`Rapor No: ${safe(dof.report_no)}`, { align: "center" });

  doc.text(`Rapor Tarihi: ${formatDate(dof.report_date)}`, {
    align: "center",
  });

  doc.text(
    `Durum: ${dof.status === "open" ? "Açık" : "Kapalı"}`,
    { align: "center" }
  );

  const qr = await QRCode.toBuffer(
    `https://app.denetron.com/verify/dof/${dofId}`
  );

  doc.image(qr, PAGE_WIDTH / 2 - 40, 420, { width: 80 });

  doc
    .fontSize(9)
    .fillColor("#D6E4F0")
    .text(
      "QR kod ile belgenin doğruluğu doğrulanabilir.",
      MARGIN,
      510,
      { width: CONTENT_WIDTH, align: "center" }
    );

  doc
    .fontSize(8)
    .fillColor("#B0C4D8")
    .text(
      "Bu belge Denetron dijital denetim platformu tarafından üretilmiştir.",
      MARGIN,
      PAGE_HEIGHT - 70,
      { width: CONTENT_WIDTH, align: "center" }
    );

  doc.addPage();
  doc.fillColor("#000");

  /* ======================================================
     ================ 2️⃣ RAPOR ÖZETİ =====================
     ====================================================== */

  doc.font(fontBold).fontSize(16).text("Rapor Özeti");
  doc.moveDown(1);

  doc
    .rect(MARGIN, doc.y, CONTENT_WIDTH, 90)
    .stroke("#E0E0E0");

  const y = doc.y + 12;
  doc.font(fontRegular).fontSize(11);

  doc.text("Rapor No", MARGIN + 12, y);
  doc.text(safe(dof.report_no), MARGIN + 180, y);

  doc.text("Durum", MARGIN + 12, y + 24);
  doc.text(dof.status === "open" ? "Açık" : "Kapalı", MARGIN + 180, y + 24);

  doc.text("Oluşturulma Tarihi", MARGIN + 12, y + 48);
  doc.text(formatDate(dof.created_at), MARGIN + 180, y + 48);

  doc.moveDown(6);

/* ======================================================
   ================ 3️⃣ DÖF MADDELERİ ===================
   ====================================================== */

doc
  .font(fontBold)
  .fontSize(16)
  .text("DÖF MADDELERİ VE DENETİM ANALİZİ", MARGIN, doc.y, HEADER_STYLE);

doc.moveDown(1.2);

for (let i = 0; i < dof.dof_items.length; i++) {
  const item = dof.dof_items[i];
  const ai = Array.isArray(item.ai_analysis)
    ? item.ai_analysis[0]
    : item.ai_analysis;

  // Her madde öncesi güvenli alan
  ensureSpace(doc, 260);

  /* ================= MADDE KART ÇERÇEVESİ ================= */

  const startY = doc.y;

  doc
    .rect(MARGIN, startY, CONTENT_WIDTH, 1)
    .fill("#0B2540");

  doc.moveDown(0.8);

  /* ================= MADDE BAŞLIĞI ================= */

  doc
    .font(fontBold)
    .fontSize(13)
    .fillColor("#0B2540")
    .text(
      `${i + 1}. DÖF Maddesi`,
      MARGIN,
      doc.y,
      HEADER_STYLE
    )
    .fillColor("#000");

  doc.moveDown(SUBSECTION_GAP / 10);

  /* ================= RİSK TANIMI ================= */

  doc
    .font(fontBold)
    .fontSize(11)
    .text("1. Risk Tanımı", MARGIN, doc.y, HEADER_STYLE);

  doc.moveDown(0.3);

  doc
    .font(fontRegular)
    .fontSize(10)
    .text(
      safe(item.risk_description),
      MARGIN,
      doc.y,
      TEXT_STYLE
    );

  doc.moveDown(BLOCK_GAP / 10);

  /* ================= PLANLANAN FAALİYET ================= */

  doc
    .font(fontBold)
    .fontSize(11)
    .text("2. Planlanan Düzeltici / Önleyici Faaliyet", MARGIN, doc.y, HEADER_STYLE);

  doc.moveDown(0.3);

  doc
    .font(fontRegular)
    .fontSize(10)
    .text(
      safe(item.action_description),
      MARGIN,
      doc.y,
      TEXT_STYLE
    );

  doc.moveDown(BLOCK_GAP / 10);

  /* ================= YAPAY ZEKÂ ANALİZİ ================= */

  ensureSpace(doc, 140);

  doc
    .font(fontBold)
    .fontSize(11)
    .text("3. Yapay Zekâ Destekli Denetim Analizi", MARGIN, doc.y, HEADER_STYLE);

  doc.moveDown(0.4);

  if (!ai) {
    doc
      .font(fontRegular)
      .fontSize(10)
      .fillColor("#B00020")
      .text(
        "Bu DÖF maddesi için yapay zekâ destekli analiz gerçekleştirilmemiştir. Nihai değerlendirme denetçi sorumluluğundadır.",
        MARGIN,
        doc.y,
        TEXT_STYLE
      )
      .fillColor("#000");
  } else {
    doc
      .font(fontRegular)
      .fontSize(10)
      .text(
        `Risk Seviyesi: ${safe(ai.risk_level)}\nGüven Oranı: %${safe(ai.confidence)}`,
        MARGIN,
        doc.y,
        TEXT_STYLE
      );

    doc.moveDown(0.4);

    doc
      .font(fontBold)
      .fontSize(10)
      .text("3.1 Bulgular", MARGIN, doc.y, HEADER_STYLE);

    doc.moveDown(0.2);

    doc
      .font(fontRegular)
      .fontSize(10)
      .text(
        safe(ai.findings),
        MARGIN,
        doc.y,
        TEXT_STYLE
      );

    doc.moveDown(0.4);

    doc
      .font(fontBold)
      .fontSize(10)
      .text("3.2 Önerilen Aksiyonlar", MARGIN, doc.y, HEADER_STYLE);

    doc.moveDown(0.2);

    doc
      .font(fontRegular)
      .fontSize(10)
      .text(
        safe(ai.recommendation),
        MARGIN,
        doc.y,
        TEXT_STYLE
      );
  }

  doc.moveDown(SECTION_GAP / 10);
}




  /* ======================================================
     ================ 4️⃣ İMZALAR =========================
     ====================================================== */

  doc.addPage();
  doc.font(fontBold).fontSize(16).text("Onay ve İmzalar");
  doc.moveDown(2);

  const operator = signatures?.find(s => s.metadata?.role === "operator");
  const auditor = signatures?.find(s => s.metadata?.role === "auditor");

  const drawSignature = async (
    title: string,
    sig: any,
    x: number,
    y: number
  ) => {
    doc.rect(x, y, 220, 90).stroke("#CCCCCC");
    doc.font(fontBold).fontSize(9).text(title, x + 8, y + 6);

    if (sig) {
      const res = await fetch(sig.url);
      const buf = Buffer.from(await res.arrayBuffer());
      doc.image(buf, x + 30, y + 24, { width: 120 });
      doc.font(fontRegular).fontSize(8).text(
        `İmza Tarihi: ${formatDate(sig.metadata?.signed_at)}`,
        x + 8,
        y + 72
      );
    }
  };

  const sigY = doc.y;
  await drawSignature("Operatör / İşveren", operator, MARGIN, sigY);
  await drawSignature("Denetçi / İSG Uzmanı", auditor, MARGIN + 260, sigY);

  doc.moveDown(6);

  doc
    .fontSize(8)
    .fillColor("#444")
    .text(
      "HUKUKİ NOT:\nBu raporda yer alan yapay zekâ destekli değerlendirmeler, nihai karar niteliği taşımaz.",
      { align: "justify" }
    )
    .fillColor("#000");

  /* ================= FINISH ================= */

  doc.end();

  const buffer = await new Promise<Buffer>((resolve, reject) => {
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
  });

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename=DOF-${dof.report_no}.pdf`,
      "Cache-Control": "no-store",
    },
  });
}
