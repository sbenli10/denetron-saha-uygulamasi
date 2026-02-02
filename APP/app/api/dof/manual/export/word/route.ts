//APP\app\api\dof\manual\export\word\route.ts
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  ImageRun,
} from "docx";
import { NextResponse } from "next/server";
import { supabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
type DofItemFile = {
  file: {
    url: string;
  } | null;
};

type DofItem = {
  area: string | null;
  deadline: string | null;
  severity: string | null;
  risk_description: string;
  action_description: string | null;
  long_description: string | null;
  files: DofItemFile[];
};

const headerColumns: [string, number][] = [
  ["AÇIKLAMA", 40],
  ["RESİMLER", 25],
  ["ÖNEM", 10],
  ["TERMİN", 10],
  ["BÖLÜM", 15],
];

/* ===== WORD LAYOUT CONSTANTS (MOBILE SAFE) ===== */
const PAGE_WIDTH_DXA = 9000;

const COL_WIDTHS = {
  description: 3600,
  images: 2200,
  severity: 800,
  deadline: 800,
  area: 1600,
};



/* ================= HELPERS ================= */

const safe = (v: unknown): string =>
  v === null || v === undefined || v === "" ? "—" : String(v);

async function fetchImage(url: string): Promise<Buffer | null> {
  try {
    console.log("📥 [WORD_EXPORT] FETCH IMAGE:", url);

    const res = await fetch(url);
    console.log("📡 [WORD_EXPORT] STATUS:", res.status);
    console.log("📦 [WORD_EXPORT] CONTENT-TYPE:", res.headers.get("content-type"));
    console.log("📦 [WORD_EXPORT] CONTENT-LENGTH:", res.headers.get("content-length"));

    if (!res.ok) {
      console.error("❌ [WORD_EXPORT] FETCH FAILED");
      return null;
    }

    const buffer = Buffer.from(await res.arrayBuffer());
    console.log("✅ [WORD_EXPORT] BUFFER SIZE:", buffer.length);

    return buffer;
  } catch (err) {
    console.error("🔥 [WORD_EXPORT] FETCH ERROR", err);
    return null;
  }
}


/* ================= ROUTE ================= */

export async function GET(req: Request) {
  const supabase = supabaseServerClient();
  const { searchParams } = new URL(req.url);
  const dofId = searchParams.get("dof_id");

  if (!dofId) {
    return NextResponse.json({ error: "dof_id zorunludur" }, { status: 400 });
  }

  /* ===== AUTH ===== */
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  }

  /* ===== ORGANIZATION ===== */
  const { data: orgMember } = await supabase
    .from("org_members")
    .select("org_id")
    .eq("user_id", user.id)
    .is("deleted_at", null)
    .single();

  const { data: organization } = await supabase
    .from("organizations")
    .select("name")
    .eq("id", orgMember?.org_id)
    .single();

  const { data: dof } = await supabase
    .from("dof_reports")
    .select(`
      report_no,
      report_date,
      konu,
      sayi,
      isg_uzmani,
      bildirim_sekli,
      analysis,
      items:dof_items (
        area,
        deadline,
        severity,
        risk_description,
        action_description,
        long_description,
        files:dof_item_files (
          file:files ( url )
        )
      )
    `)

    .eq("id", dofId)
    .single<{
      report_no: string;
      report_date: string;
      konu: string;
      sayi: string;
      isg_uzmani: string;
      bildirim_sekli: string;
      analysis: string | null;
      items: DofItem[];
    }>();


    console.log("[WORD_EXPORT] RAW DOF DATA");
    console.dir(dof, { depth: 10 });


  if (!dof) {
    return NextResponse.json({ error: "DÖF bulunamadı" }, { status: 404 });
  }
//* ================= DOCUMENT ================= */

const PAGE_WIDTH_DXA = 9000;

const COL_WIDTHS = {
  description: 3600,
  images: 2200,
  severity: 800,
  deadline: 800,
  area: 1600,
};

const children: (Paragraph | Table)[] = [];

/* ===== TITLE ===== */
children.push(
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 300 },
    children: [
      new TextRun({
        text: "DÜZELTİCİ VE ÖNLEYİCİ\nFAALİYET FORMU",
        bold: true,
        size: 28,
      }),
    ],
  })
);

/* ===== HEADER INFO TABLE ===== */
children.push(
  new Table({
    width: { size: PAGE_WIDTH_DXA, type: WidthType.DXA },
    layout: "fixed",
    rows: [
      ["Firma Adı", organization?.name],
      ["Konu", dof.konu],
      ["Rapor No", dof.sayi],
      ["Tarih", safe(dof.report_date)],
      ["İSG Uzmanı", dof.isg_uzmani],
      ["Bildirim Şekli", dof.bildirim_sekli],
    ].map(([label, value]) =>
      new TableRow({
        children: [
          new TableCell({
            width: { size: 2700, type: WidthType.DXA },
            shading: { fill: "F2F2F2" },
            children: [
              new Paragraph({
                children: [new TextRun({ text: label, bold: true })],
              }),
            ],
          }),
          new TableCell({
            width: { size: 6300, type: WidthType.DXA },
            children: [new Paragraph(safe(value))],
          }),
        ],
      })
    ),
  })
);

let index = 1;

/* ================= ITEMS ================= */
for (const item of dof.items ?? []) {
  /* ===== ITEM TITLE ===== */
  children.push(
    new Paragraph({
      spacing: { before: 400, after: 200 },
      children: [
        new TextRun({
          text: `MADDE ${index} – UYGUNSUZLUK / RİSK`,
          bold: true,
          size: 22,
        }),
      ],
    })
  );

  /* ===== DESCRIPTION CELL ===== */
  const descriptionCell: Paragraph[] = [
    new Paragraph({
      children: [
        new TextRun({ text: "Risk Tanımı:\n", bold: true }),
        new TextRun(safe(item.risk_description)),
      ],
    }),
  ];

  // if (item.action_description) {
  //   descriptionCell.push(
  //     new Paragraph({
  //       spacing: { before: 150 },
  //       children: [
  //         new TextRun({ text: "Planlanan Faaliyet:\n", bold: true }),
  //         new TextRun(safe(item.action_description)),
  //       ],
  //     })
  //   );
  // }

  /* ===== IMAGE CELL ===== */
  const imageCell: Paragraph[] = [];

  for (const f of item.files ?? []) {
    const url = f.file?.url;
    if (!url) continue;

    const img = await fetchImage(url);
    if (!img) continue;

    imageCell.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 120 },
        children: [
          new ImageRun({
            data: img,
            type: url.toLowerCase().endsWith(".png") ? "png" : "jpg",
            transformation: { width: 140, height: 100 },
          }),
        ],
      })
    );
  }

  if (imageCell.length === 0) {
    imageCell.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun("Fotoğraf bulunmamaktadır.")],
      })
    );
  }

  /* ===== ITEM TABLE ===== */
  children.push(
    new Table({
      width: { size: PAGE_WIDTH_DXA, type: WidthType.DXA },
      layout: "fixed",
      rows: [
        /* HEADER */
        new TableRow({
          tableHeader: true,
          children: [
            ["AÇIKLAMA", COL_WIDTHS.description],
            ["RESİMLER", COL_WIDTHS.images],
            ["ÖNEM", COL_WIDTHS.severity],
            ["TERMİN", COL_WIDTHS.deadline],
            ["SORUMLU BÖLÜM", COL_WIDTHS.area],
          ].map(([text, width]) =>
            new TableCell({
              width: { size: width as number, type: WidthType.DXA },
              shading: { fill: "EDEDED" },
              children: [
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [new TextRun({ text: text as string, bold: true })],
                }),
              ],
            })
          ),
        }),

        /* CONTENT */
        new TableRow({
          children: [
            new TableCell({
              width: { size: COL_WIDTHS.description, type: WidthType.DXA },
              children: descriptionCell,
            }),
            new TableCell({
              width: { size: COL_WIDTHS.images, type: WidthType.DXA },
              children: imageCell,
            }),
            new TableCell({
              width: { size: COL_WIDTHS.severity, type: WidthType.DXA },
              shading: {
                fill:
                  item.severity === "Yüksek"
                    ? "F4CCCC"
                    : item.severity === "Orta"
                    ? "FFF2CC"
                    : "D9EAD3",
              },
              children: [new Paragraph(safe(item.severity))],
            }),
            new TableCell({
              width: { size: COL_WIDTHS.deadline, type: WidthType.DXA },
              children: [new Paragraph(safe(item.deadline))],
            }),
            new TableCell({
              width: { size: COL_WIDTHS.area, type: WidthType.DXA },
              children: [new Paragraph(safe(item.area))],
            }),
          ],
        }),
      ],
    })
  );

  index++;
}

/* ================= ANALYSIS ================= */
if (dof.analysis) {
  children.push(new Paragraph({ pageBreakBefore: true }));

  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
      children: [
        new TextRun({
          text: "GENEL DEĞERLENDİRME VE ANALİZ",
          bold: true,
          size: 22,
        }),
      ],
    })
  );

  children.push(
    new Table({
      width: { size: PAGE_WIDTH_DXA, type: WidthType.DXA },
      layout: "fixed",
      rows: [
        new TableRow({
          children: [
            new TableCell({
              children: [
                new Paragraph({
                  spacing: { line: 360 },
                  children: [new TextRun(safe(dof.analysis))],
                }),
              ],
            }),
          ],
        }),
      ],
    })
  );
}

/* ================= EXPORT ================= */

const doc = new Document({
  sections: [
    {
      properties: {
        page: {
          margin: {
            top: 1134,
            bottom: 1134,
            left: 1134,
            right: 1134,
          },
        },
      },
      children,
    },
  ],
});

const buffer = await Packer.toBuffer(doc);

return new NextResponse(new Uint8Array(buffer), {
  headers: {
    "Content-Type":
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "Content-Disposition": `attachment; filename="${dof.report_no}.docx"`,
  },
});

}



