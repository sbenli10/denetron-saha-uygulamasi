export type AIMediaItem = {
  url: string;
  type: "photo" | "video";
};

export type AIAnalysisResult = {
  text: string;
  legalNote: string;
};


export type AIRiskReportItem = {
  id: string;
  label: string;
  severity: "low" | "medium" | "high";
  confidence?: number;

  awareness?: string;
  mitigation?: string;
  consequence?: string;
};

