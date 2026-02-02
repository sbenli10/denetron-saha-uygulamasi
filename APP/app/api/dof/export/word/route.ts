//APP\app\api\dof\export\word\route.ts
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  Table,
  TableRow,
  TableCell,
  WidthType,
  ImageRun,
  Spacing,
} from "docx";
import { supabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

/* ================= HELPERS ================= */

const safe = (v: any) =>
  v === null || v === undefined || v === "" ? "—" : String(v);

const formatDate = (v: any) =>
  v ? new Date(v).toLocaleDateString("tr-TR") : "—";

async function fetchImage(url: string): Promise<Buffer> {
  const res = await fetch(url);
  return Buffer.from(await res.arrayBuffer());
}

/* ================= STYLES ================= */

const COLORS = {
  primary: "003366", // koyu mavi (kurumsal)
  secondary: "666666", // gri
  success: "2E7D32", // yeşil
  warning: "F9A825", // sarı
  danger: "C62828", // kırmızı
};

function confidenceBadge(confidence: number) {
  if (confidence >= 80) {
    return { text: "Yüksek Güven", color: COLORS.success };
  }
  if (confidence >= 50) {
    return { text: "Orta Güven", color: COLORS.warning };
  }
  return { text: "Düşük Güven – Manuel İnceleme Önerilir", color: COLORS.danger };
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
        area,
        equipment,
        risk_description,
        action_description,
        deadline,
        status,
        files:dof_item_files (
          file:files (
            url,
            type
          )
        ),
       ai:dof_item_ai_analysis (
          risk_level,
          findings,
          recommendation,
          confidence,
          iso_clauses
        )
      )
    `)
    .eq("id", dofId)
    .single();

  if (!dof) return new Response("DÖF bulunamadı", { status: 404 });

  /* ================= ISO CLAUSE COLLECT ================= */

const isoSet = new Set<string>();

for (const item of dof.dof_items) {
  const ai = Array.isArray(item.ai) ? item.ai[0] : item.ai;

  const aiAny = ai as any;

  if (aiAny?.iso_clauses) {
    isoSet.add(aiAny.iso_clauses);
  }

}


  /* ================= DOCUMENT ================= */

  const children: (Paragraph | Table)[] = [];

  /* ================= COVER TITLE ================= */

    children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 800, after: 600 },
      children: [
        new TextRun({
          text: "DÜZELTİCİ VE ÖNLEYİCİ FAALİYET RAPORU",
          bold: true,
          size: 40,
          color: COLORS.primary,
        }),
        new TextRun({
          text: "\n(DÖF)",
          size: 28,
          bold: true,
          color: COLORS.secondary,
        }),
      ],
    })
  );


  /* ================= REPORT INFO TABLE ================= */

  const reportInfoRows: [string, any][] = [
    ["Rapor No", dof.report_no],
    ["Rapor Tarihi", dof.report_date],
    ["Durum", dof.status === "open" ? "Açık" : "Kapalı"],
    ["Oluşturulma Tarihi", dof.created_at],
  ];

  const infoTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: reportInfoRows.map(([label, value]) => {
      return new TableRow({
        children: [
          new TableCell({
            width: { size: 35, type: WidthType.PERCENTAGE },
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: label,
                    bold: true,
                    color: COLORS.primary,
                  })
                ],
              }),
            ],
          }),
          new TableCell({
            width: { size: 65, type: WidthType.PERCENTAGE },
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text:
                      label.includes("Tarih")
                        ? formatDate(value)
                        : safe(value),
                  }),
                ],
              }),
            ],
          }),
        ],
      });
    }),
  });

  children.push(infoTable);

  children.push(new Paragraph({ spacing: { after: 400 } }));


  /* ================= ISO TABLE ================= */

  if (isoSet.size > 0) {
    children.push(
      new Paragraph({
        spacing: { before: 300, after: 200 },
        children: [
          new TextRun({
            text: "Uygulanan ISO Maddeleri",
            bold: true,
            size: 24,
            color: COLORS.primary,
          })
        ],
      })
    );

    children.push(
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: Array.from(isoSet).map(
          iso =>
            new TableRow({
              children: [
                new TableCell({
                  width: { size: 100, type: WidthType.PERCENTAGE },
                  children: [new Paragraph(iso)],
                }),
              ],
            })
        ),
      })
    );

    children.push(new Paragraph({}));
  }

    if (isoSet.size > 0) {
    const isoTable = new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          children: [
            new TableCell({
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: "Uygulanan ISO Maddeleri",
                      bold: true,
                      color: COLORS.primary,
                    }),
                  ],
                }),
              ],
            }),
          ],
        }),
        ...Array.from(isoSet).map(
          iso =>
            new TableRow({
              children: [
                new TableCell({
                  children: [
                    new Paragraph({
                      children: [
                        new TextRun({
                          text: iso,
                          color: COLORS.secondary,
                        }),
                      ],
                    }),
                  ],
                }),
              ],
            })
        ),
      ],
    });

    children.push(isoTable);
  } else {
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text:
              "Bu DÖF kapsamında otomatik ISO eşlemesi yapılamamıştır. " +
              "Manuel uzman değerlendirmesi gereklidir.",
            italics: true,
          }),
        ],
      })
    );
  }


  /* ================= ITEMS ================= */

  for (let i = 0; i < dof.dof_items.length; i++) {
    const item = dof.dof_items[i];
    const ai = Array.isArray(item.ai) ? item.ai[0] : item.ai;

    /* SECTION TITLE */
    children.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 400, after: 200 },
        children: [
          new TextRun({
            text: `${i + 1}. DÖF Maddesi`,
            bold: true,
            color: COLORS.primary,
          }),
        ],
      })
    );

    /* RISK */
    children.push(
      new Paragraph({
        spacing: { after: 200 },
        children: [
          new TextRun({ text: "Risk Tanımı:\n", bold: true }),
          new TextRun(safe(item.risk_description)),
        ],
      })
    );

    /* OPERATOR */
    children.push(
      new Paragraph({
        spacing: { after: 300 },
        children: [
          new TextRun({ text: "Operatör Açıklaması:\n", bold: true }),
          new TextRun(safe(item.action_description)),
        ],
      })
    );

    /* IMAGES */
    if (item.files?.length) {
      children.push(
        new Paragraph({
          spacing: { after: 200 },
          children: [new TextRun({ text: "Fotoğraflar:", bold: true })],
        })
      );

      for (const fw of item.files) {
        const list = Array.isArray(fw.file)
          ? fw.file
          : fw.file
          ? [fw.file]
          : [];

        for (const file of list) {
          if (!file?.url || file.type !== "photo") continue;

          const img = await fetchImage(file.url);

          children.push(
            new Paragraph({
              spacing: { after: 200 },
              children: [
                new ImageRun({
                  type: "jpg",
                  data: img,
                  transformation: {
                    width: 380,
                    height: 260,
                  },
                }),
              ],
            })
          );
        }
      }
    }

    /* ================= AI ================= */

    children.push(
      new Paragraph({
        spacing: { before: 300, after: 150 },
        children: [
          new TextRun({
            text: "Yapay Zekâ Destekli Risk Değerlendirmesi",
            bold: true,
            color: "003366", // kurumsal mavi
          }),
        ],
      })
    );

    if (!ai) {
      children.push(
        new Paragraph({
          spacing: { after: 300 },
          children: [
            new TextRun({
              text:
                "Bu madde için yapay zekâ analizi yapılmamıştır. " +
                "Uzman değerlendirmesi gereklidir.",
              italics: true,
            }),
          ],
        })
      );
    } else {
      const badge = confidenceBadge(ai.confidence);

      children.push(
        new Paragraph({
          spacing: { after: 300 },
          children: [
            new TextRun({
              text: `Risk Seviyesi: ${ai.risk_level}\n`,
              bold: true,
            }),
            new TextRun({
              text: `Bulgular: ${safe(ai.findings)}\n`,
            }),
            new TextRun({
              text: `Öneriler: ${safe(ai.recommendation)}\n\n`,
            }),
            new TextRun({
              text: `AI Güven Seviyesi: %${ai.confidence} (${badge.text})`,
              bold: true,
              color: badge.color,
            }),
          ],
        })
      );
    }

  }

  /* ================= SIGNATURES ================= */

  children.push(
    new Paragraph({
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 400, after: 200 },
      children: [new TextRun("İmzalar")],
    })
  );

  children.push(
    new Paragraph("Operatör / İşveren İmzası: ___________________________")
  );
  children.push(
    new Paragraph("Denetçi / İSG Uzmanı İmzası: _________________________")
  );

  /* ================= LEGAL FOOTNOTE ================= */

  children.push(
    new Paragraph({
      spacing: { before: 400 },
      children: [
        new TextRun({
          text:
            "HUKUKİ NOT: Bu raporda yer alan yapay zekâ destekli değerlendirmeler, " +
            "6331 sayılı İş Sağlığı ve Güvenliği Kanunu kapsamında nihai karar niteliği taşımaz. " +
            "Sorumluluk işverene aittir.",
          size: 16,
          italics: true,
        }),
      ],
    })
  );

  /* ================= DOC ================= */

  const doc = new Document({
    sections: [
      {
        children,
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `attachment; filename=DOF-${dof.report_no}.docx`,
    },
  });
}
