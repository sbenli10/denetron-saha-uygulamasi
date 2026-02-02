import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
import ImageModule from "docxtemplater-image-module-free";
import fs from "fs";

export function generateDofWord(data: {
  firmaAdi: string;
  raporNo: string;
  raporTarihi: string;
  genelRiskOzeti: string;
  isUzmani: string;
  riskMaddeleri: {
    aciklama: string;
    faaliyet: string;
    onem: string;
    termin: string;
    sorumlu: string;
    resimler: string[];
  }[];
}) {
  const content = fs.readFileSync(
    "templates/dof-template.docx",
    "binary"
  );

  const zip = new PizZip(content);

  const imageModule = new ImageModule({
    centered: true,
    getImage: (tagValue: string) =>
      fs.readFileSync(tagValue),
    getSize: () => [400, 300],
  });

  const doc = new Docxtemplater(zip, {
    modules: [imageModule],
  });

  doc.render({
    FIRMA_ADI: data.firmaAdi,
    RAPOR_NO: data.raporNo,
    RAPOR_TARIHI: data.raporTarihi,
    GENEL_RISK_OZETI: data.genelRiskOzeti,
    ISG_UZMANI: data.isUzmani,
    MADDDELER: data.riskMaddeleri.map(m => ({
      RISK_ACIKLAMA: m.aciklama,
      FAALIYET: m.faaliyet,
      ONEM: m.onem,
      TERMIN: m.termin,
      SORUMLU: m.sorumlu,
      RESIMLER: m.resimler,
    })),
  });

  return doc.getZip().generate({
    type: "nodebuffer",
    compression: "DEFLATE",
  });
}
