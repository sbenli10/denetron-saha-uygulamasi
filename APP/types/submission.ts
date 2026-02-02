export type FileRecord = {
  id: string;
  url: string;
  type: "photo" | "video";
  question_id: string | null;
  metadata?: Record<string, any> | null;
};

export interface RawAnswer {
  questionId: string;
  questionText?: string;
  answer: "yes" | "no";
  media?: FileRecord[];

  // submission_findings entegrasyonu
  findingText?: string | null;
  severity?: string | null;
}

export interface SubmissionFinding {
  id: string;
  question_id: string;
  question_text: string | null;
  finding_text: string | null;
  severity: string | null;
  created_at: string;
}

export interface SubmissionRecord {
  id: string;
  completed_at: string | null;
  operator_name: string | null;
  operator_email: string | null;
  template_name: string | null;
  severity: string | null;
  answers: RawAnswer[] | null;
  files: FileRecord[];
  findings: SubmissionFinding[]; // ⬅️ optional DEĞİL
}
