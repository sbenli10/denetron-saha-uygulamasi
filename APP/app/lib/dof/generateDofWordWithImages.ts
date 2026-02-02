//APP\app\lib\dof\generateDofWordWithImages.ts
import fs from "fs";
import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
import ImageModule from "docxtemplater-image-module-free";
import fetch from "node-fetch";

/* ================= TYPES ================= */

type RiskItem = {
  ACIKLAMA: string;
  FAALIYET: string;
  ONEM: string;
  TERMIN: string;
  SORUMLU: string;
  RESIM: string | null;
};

type WordPayload = {
  FIRMA_ADI: string;
  RAPOR_NO: string;
  RAPOR_TARIHI: string;
  IS_UZMANI: string;
  GENEL_RISK_OZETI: string;
  RISK_MADDELERI: RiskItem[];
};

/* ================= MAIN ================= */

export async function generateDofWordWithImages(
  template: string | Buffer,
  data: WordPayload
): Promise<Uint8Array> {
  /* 1️⃣ TEMPLATE OKU (PATH veya BUFFER) */
  const content: Buffer =
    typeof template === "string"
      ? fs.readFileSync(template)
      : template;

  const zip = new PizZip(content);

  /* 2️⃣ IMAGE MODULE */
  const imageModule = new ImageModule({
    centered: false,

    getImage: async (tagValue: string) => {
      const res = await fetch(tagValue);
      if (!res.ok) {
        throw new Error(`Image fetch failed: ${tagValue}`);
      }
      return Buffer.from(await res.arrayBuffer());
    },

    // Word ölçüleri (px değil, EMU’ya çevrilir)
    getSize: () => [300, 200],
  });

  const doc = new Docxtemplater(zip, {
  modules: [imageModule],
  paragraphLoop: true,
  linebreaks: true,
  nullGetter: () => "", // 🔥 BU ÇOK ÖNEMLİ
});


  doc.render(data);

  /* 4️⃣ OUTPUT */
  return doc.getZip().generate({
    type: "uint8array",
    compression: "DEFLATE",
  });
}
