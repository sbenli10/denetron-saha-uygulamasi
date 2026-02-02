// APP/lib/isg/action-templates.ts

export type ActionTemplate = {
  finding_key: string;
  finding_pattern: string[];
  severity: "critical" | "major" | "minor";
  action_template: {
    action: string;
    planSection: string;
    targetDocuments: string[];
    evidence: string;
    responsible: string;
    dueDateRule: "end_of_january" | "within_30_days" | "end_of_year";
    legalBasis?: string;
  };
};

export const ACTION_TEMPLATES: ActionTemplate[] = [
  {
    finding_key: "risk_class_missing",
    finding_pattern: [
      "risk sınıfı belirtilmemiş",
      "işyerinin risk sınıfı bulunmuyor",
      "az tehlikeli",
      "tehlikeli",
      "çok tehlikeli"
    ],
    severity: "critical",
    action_template: {
      action:
        "İşyerinin NACE koduna göre risk sınıfı belirlenerek Yıllık İSG Çalışma ve Eğitim Planlarının başlık bölümüne eklenecektir.",
      planSection: "Genel Bilgiler / Plan Başlığı",
      targetDocuments: [
        "İSG Yıllık Çalışma Planı",
        "İSG Yıllık Eğitim Planı"
      ],
      evidence: "Risk sınıfı bilgisi eklenmiş ve imzalı yıllık planlar",
      responsible: "İSG Uzmanı",
      dueDateRule: "end_of_january",
      legalBasis: "6331 sayılı Kanun"
    }
  },

  {
    finding_key: "risk_assessment_not_january",
    finding_pattern: [
      "risk değerlendirmesi",
      "ocak ayına"
    ],
    severity: "critical",
    action_template: {
      action:
        "Risk değerlendirmesi kontrolü/güncellenmesi faaliyeti ilgili yılın OCAK ayına bağlanarak yıllık çalışma planında netleştirilecektir.",
      planSection: "Faaliyet Tablosu / Risk Değerlendirmesi",
      targetDocuments: ["İSG Yıllık Çalışma Planı"],
      evidence: "Ocak ayı belirtilmiş güncel plan",
      responsible: "İSG Uzmanı",
      dueDateRule: "end_of_january",
      legalBasis: "Risk Değerlendirmesi Yönetmeliği"
    }
  }
];
