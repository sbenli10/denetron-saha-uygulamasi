// APP/app/admin/cron-history/types.ts
export type CronRunDTO = {
  id: string;
  ran_at: string;
  created_tasks: number;
  status: "success" | "failed" |"skipped";
  error?: string | null;
  schedule: {
    template_name: string;
  };
};
