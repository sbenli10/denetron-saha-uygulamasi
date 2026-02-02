// APP/app/admin/submissions/[id]/dof/types.ts

export interface MediaItem {
  file_id: string;
  url: string;
  type: "photo" | "video" | string | null;
}

export interface CriticalAnswer {
  questionId: string;
  questionText: string;
  answer?: string | boolean | null;
  answerText?: string;
  findingText?: string;
  media: MediaItem[];
}
