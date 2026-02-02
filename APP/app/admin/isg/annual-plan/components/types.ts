//APP\app\admin\isg\annual-plan\components\types.ts
export interface AuditorSummary {
  generalStatus: string;
  riskLevel: string;
  auditorOpinion?: string; // ✅ EKLE

   criticalFindings?: string[];
   requiredActions?: string[];
    documents?: {
      docType?: string;
      year?: number;
    }[];
}

export type PlanItem = {
  activity: string;
  period: string;
  months: string[];
  status: string;
  riskLevel: string;
  auditorNote: string;
};

export type AnnualPlanAnalysis = {
  year: number;
  meta: {
    ocrWarning: boolean; // 👈 net
    aiUsed: boolean;
    analyzedAt?: string;
    modelUsed?: "fast" | "robust" | "fallback";
  };
  summary: {
    generalStatus: string;
    riskLevel: string;
    auditorOpinion: string;
    criticalFindings: string[];
    requiredActions: string[];
  };
  items: any[];
  actions: ActionItem[];
};



export type ActionItem = {
  id: string;
  text: string;
  status: "pending" | "applied";
};


export type AssistantAction = {
  id: string;
  text: string;
  status: "pending" | "applied" | "skipped";
  appliedAt?: string; // 👈 EKLENDİ
};


/* ================= ACTION PLAN ================= */

export type ActionPlanItem = {
  id: string;

  finding: string;              // Kritik bulgu
  action: string;               // Sistem aksiyonu

  targetDocuments: string[];    // ["Yıllık Çalışma Planı", "Yıllık Eğitim Planı"]
  planSection: string;          // "Genel Bilgiler / Eğitim Planı"

  responsible: string;          // default: İSG Uzmanı
  dueDate: string;              // 2026-01-31

  evidence: string;             // Denetim kanıtı

  status: "pending" | "approved";
  approvedAt?: string;
};
