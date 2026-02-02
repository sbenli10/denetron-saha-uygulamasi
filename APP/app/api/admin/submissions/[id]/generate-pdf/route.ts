//APP\app\api\admin\submissions\[id]\generate-pdf\route.ts
import { NextResponse } from "next/server";
import PDFDocument from "pdfkit";
import path from "path";
import QRCode from "qrcode";
import { supabaseServiceRoleClient } from "@/lib/supabase/server";

/* -------------------------------------------------------------------------- */
/* CONFIG                                                                     */
/* -------------------------------------------------------------------------- */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PAGE_MARGIN = 50;
const HEADER_HEIGHT = 90;

const TABLE_WIDTH = 480;
const ROW_HEIGHT = 38;

const COL_QUESTION_X = PAGE_MARGIN + 10;
const COL_QUESTION_W = 270;

const COL_STATUS_X = PAGE_MARGIN + 290;
const COL_STATUS_W = 80;

const COL_RISK_X = PAGE_MARGIN + 380;
const COL_RISK_W = 80;

const FOOTER_HEIGHT = 30;

const FONTS = {
  regular: path.join(process.cwd(), "public/fonts/Inter_18pt-Regular.ttf"),
  bold: path.join(process.cwd(), "public/fonts/Inter_24pt-Bold.ttf"),
};

/* -------------------------------------------------------------------------- */
/* HELPERS                                                                    */
/* -------------------------------------------------------------------------- */
function formatAnswer(v: any) {
  if (v === true || v === "yes") return { status: "Uygun", risk: "Düşük", ok: true };
  if (v === false || v === "no") return { status: "Uygun Değil", risk: "Yüksek", ok: false };
  return { status: "Değerlendirilmedi", risk: "-", ok: false };
}

function ensureSpace(doc: PDFKit.PDFDocument, h: number) {
  if (doc.y + h > doc.page.height - PAGE_MARGIN - FOOTER_HEIGHT) {
    doc.addPage();
    doc.y = HEADER_HEIGHT + 30;
  }
}

function getTextHeight(
  doc: PDFKit.PDFDocument,
  text: string,
  width: number,
  fontSize = 10
) {
  return doc
    .font(FONTS.regular)
    .fontSize(fontSize)
    .heightOfString(text, { width });
}


/* -------------------------------------------------------------------------- */
/* DRAWERS                                                                    */
/* -------------------------------------------------------------------------- */

function normalizeMedia(item: any): string | null {
  if (!item) return null;
  if (typeof item === "string") return item;
  if (typeof item === "object") {
    if (typeof item.url === "string") return item.url;
    if (typeof item.path === "string") return item.path;
  }
  return null;
}

// function drawMediaLinks(
//   doc: PDFKit.PDFDocument,
//   media: unknown
// ) {
//   if (!Array.isArray(media) || media.length === 0) return;

//   console.log("📎 drawMediaLinks media:", media);

//   const urls = media
//     .map(normalizeMedia)
//     .filter((v): v is string => typeof v === "string");

//   if (urls.length === 0) {
//     console.log("⚠️ Media array var ama geçerli URL yok");
//     return;
//   }

//   ensureSpace(doc, 20 + urls.length * 16);

//   // Başlık
//   doc
//     .font(FONTS.bold)
//     .fontSize(10)
//     .fillColor("#0B2540")
//     .text("Medya:", COL_QUESTION_X, doc.y);

//   doc.y += 14;

//   urls.forEach((url, index) => {
//     const isVideo = /\.(mp4|webm)$/i.test(url);
//     const label = isVideo ? `🎥 Video ${index + 1}` : `🖼️ Fotoğraf ${index + 1}`;

//     const y = doc.y;

//     doc
//       .font(FONTS.regular)
//       .fontSize(9)
//       .fillColor("#1565C0")
//       .text(label, COL_QUESTION_X, y, {
//         link: url,
//         underline: true,
//         continued: false,
//       });

//     doc.y = y + 14;
//   });

//   doc.y += 6;
// }



function drawHeader(doc: PDFKit.PDFDocument, orgName: string, logo?: Buffer) {
  doc.rect(0, 0, doc.page.width, HEADER_HEIGHT).fill("#0B2540");

  doc.font(FONTS.bold).fontSize(16).fillColor("#fff")
    .text(orgName, PAGE_MARGIN, 32);

  doc.font(FONTS.regular).fontSize(10).fillColor("#D6DEE6")
    .text("ISO / İSG Denetim ve Uygunluk Raporu", PAGE_MARGIN, 55);

  if (logo) {
    doc.image(logo, doc.page.width - PAGE_MARGIN - 60, 22, { width: 55 });
  }

  doc.y = HEADER_HEIGHT + 30;
  doc.fillColor("#000");
}

function drawCategoryHeader(doc: PDFKit.PDFDocument, category: string) {
  ensureSpace(doc, 80);

  const y = doc.y;
  const title = category.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());

  doc.rect(PAGE_MARGIN, y, TABLE_WIDTH, 32).fill("#FFFFFF");

  doc.font(FONTS.bold).fontSize(13).fillColor("#0B2540")
    .text(title, PAGE_MARGIN + 6, y + 8, { width: TABLE_WIDTH });

  doc.moveTo(PAGE_MARGIN, y + 32)
    .lineTo(PAGE_MARGIN + TABLE_WIDTH, y + 32)
    .strokeColor("#B0BEC5")
    .stroke();

  doc.y = y + 40;
}

function drawTableHeader(doc: PDFKit.PDFDocument) {
  const y = doc.y;

  doc.rect(PAGE_MARGIN, y, TABLE_WIDTH, ROW_HEIGHT).fill("#E9EEF3");

  doc.font(FONTS.bold).fontSize(11).fillColor("#0B2540")
    .text("Soru", COL_QUESTION_X, y + 12, { width: COL_QUESTION_W });

  doc.text("Durum", COL_STATUS_X, y + 12, { width: COL_STATUS_W, align: "center" });
  doc.text("Risk", COL_RISK_X, y + 12, { width: COL_RISK_W, align: "center" });

  doc.moveTo(PAGE_MARGIN, y + ROW_HEIGHT)
    .lineTo(PAGE_MARGIN + TABLE_WIDTH, y + ROW_HEIGHT)
    .strokeColor("#C0C8D0")
    .stroke();

  doc.y += ROW_HEIGHT;
}

function drawCategorySummary(
  doc: PDFKit.PDFDocument,
  total: number,
  critical: number
) {
  ensureSpace(doc, 70);

  const y = doc.y;

  doc.rect(PAGE_MARGIN, y, TABLE_WIDTH, 50).fill("#F4F7FB");

  doc.font(FONTS.bold).fontSize(11).fillColor("#0B2540")
    .text("Kategori Özeti", PAGE_MARGIN + 10, y + 8);

  doc.font(FONTS.regular).fontSize(10).fillColor("#000")
    .text(`Toplam Madde: ${total}`, PAGE_MARGIN + 10, y + 26)
    .text(`Kritik Sayısı: ${critical}`, PAGE_MARGIN + 150, y + 26)
    .text(
      `Sonuç: ${critical === 0 ? "Uygun" : "İyileştirme Gerekli"}`,
      PAGE_MARGIN + 280,
      y + 26
    );

  doc.y = y + 70;
}

/* -------------------------------------------------------------------------- */
/* ROUTE                                                                      */
/* -------------------------------------------------------------------------- */
export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const db = supabaseServiceRoleClient();

  const { data: submission } = await db
    .from("v_assigned_tasks_detailed")
    .select("*")
    .eq("submission_id", params.id)
    .single();

  if (!submission) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { data: org } = await db
    .from("organizations")
    .select("name")
    .eq("id", submission.org_id)
    .single();

  const { data: settings } = await db
    .from("org_settings")
    .select("logo_url")
    .eq("org_id", submission.org_id)
    .maybeSingle();

  let logoBuffer: Buffer | undefined;
  if (settings?.logo_url) {
    const res = await fetch(settings.logo_url);
    if (res.ok) logoBuffer = Buffer.from(await res.arrayBuffer());
  }

  const doc = new PDFDocument({
    size: "A4",
    margin: PAGE_MARGIN,
    font: FONTS.regular,
    bufferPages: true,
  });

  const chunks: Uint8Array[] = [];
  doc.on("data", c => chunks.push(c));

  drawHeader(doc, org?.name ?? "Organizasyon", logoBuffer);

  doc.font(FONTS.bold).fontSize(20).text("Denetim Bulguları");
  doc.y += 15;

  const grouped: Record<string, any[]> = {};
  submission.answers.forEach((a: any) => {
    const key = a.questionId.split(".")[0];
    grouped[key] ??= [];
    grouped[key].push(a);
  });

  let kritikToplam = 0;

  for (const category of Object.keys(grouped)) {
  let kategoriKritik = 0;

  drawCategoryHeader(doc, category);
  drawTableHeader(doc);

  for (const a of grouped[category]) {
    const ans = formatAnswer(a.answer);

    if (!ans.ok) {
      kritikToplam++;
      kategoriKritik++;
    }

      // 🔴 SORU METNİ GERÇEK YÜKSEKLİĞİ
      const textHeight = getTextHeight(
        doc,
        a.questionText,
        COL_QUESTION_W,
        10
      );

      // 🔴 SATIR YÜKSEKLİĞİ DİNAMİK
      const rowHeight = Math.max(ROW_HEIGHT, textHeight + 20);

      ensureSpace(doc, rowHeight);

      const y = doc.y;

      // Satır arka planı
      doc
        .rect(PAGE_MARGIN, y, TABLE_WIDTH, rowHeight)
        .fill("#FFFFFF");

      // Alt ayırıcı çizgi
      doc
        .moveTo(PAGE_MARGIN, y + rowHeight)
        .lineTo(PAGE_MARGIN + TABLE_WIDTH, y + rowHeight)
        .strokeColor("#E0E0E0")
        .stroke();

      // Kritik şerit
      if (!ans.ok) {
        doc
          .rect(PAGE_MARGIN, y, 4, rowHeight)
          .fill("#C62828");
      }

      // ✅ SORU (ARTIK HER ZAMAN GÖRÜNÜR)
      doc
        .font(FONTS.regular)
        .fontSize(10)
        .fillColor("#000")
        .text(a.questionText, COL_QUESTION_X, y + 10, {
          width: COL_QUESTION_W,
        });

      // Durum
      doc
        .font(FONTS.bold)
        .fillColor(ans.ok ? "#1B5E20" : "#C62828")
        .text(ans.status, COL_STATUS_X, y + 10, {
          width: COL_STATUS_W,
          align: "center",
        });

      // Risk
      doc
        .fillColor(ans.ok ? "#2E7D32" : "#C62828")
        .text(ans.risk, COL_RISK_X, y + 10, {
          width: COL_RISK_W,
          align: "center",
        });

     
      doc.y = y + rowHeight;

      // if (Array.isArray(a.media) && a.media.length > 0) {
      //   drawMediaLinks(doc, a.media);
      // }
    }

    drawCategorySummary(
      doc,
      grouped[category].length,
      kategoriKritik
    );
  }


  /* ---------------- QR + GENEL ÖZET ---------------- */
  ensureSpace(doc, 220);

  const qrDataUrl = await QRCode.toDataURL(
    JSON.stringify({
      reportId: submission.id,
      organization: org?.name,
      createdAt: submission.completed_at,
    })
  );

  doc.font(FONTS.bold).fontSize(14).text("Genel Özet ve Rapor Doğrulama");
  doc.y += 10;

  doc.font(FONTS.regular).fontSize(11);
  doc.text(`Toplam Kontrol Maddesi : ${submission.answers.length}`);
  doc.text(`Toplam Kritik Uygunsuzluk : ${kritikToplam}`);
  doc.text(`Genel Durum : ${kritikToplam === 0 ? "UYGUN" : "İYİLEŞTİRME GEREKLİ"}`);

  doc.image(qrDataUrl, PAGE_MARGIN, doc.y + 10, { width: 100 });

  doc.end();

  /* ---------------- FOOTER ---------------- */
  const pageCount = doc.bufferedPageRange().count;

  for (let i = 0; i < pageCount; i++) {
    doc.switchToPage(i);

    const footerY = doc.page.height - PAGE_MARGIN + 5;

    doc.font(FONTS.regular).fontSize(9).fillColor("#777")
      .text(`Rapor No: ${submission.id}`, PAGE_MARGIN, footerY, { align: "left" })
      .text(`Sayfa ${i + 1} / ${pageCount}`, 0, footerY, { align: "center" })
      .text(
        new Date(submission.completed_at).toLocaleDateString("tr-TR"),
        doc.page.width - PAGE_MARGIN,
        footerY,
        { align: "right" }
      );
  }

  const buffer = await new Promise<Buffer>(resolve =>
    doc.on("end", () => resolve(Buffer.concat(chunks)))
  );

  return new Response(new Uint8Array(buffer), {
    headers: { "Content-Type": "application/pdf", "Content-Disposition": "inline" },
  });
}
