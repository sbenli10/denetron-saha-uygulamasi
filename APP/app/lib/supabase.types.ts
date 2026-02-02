export interface Database {
  public: {
    Tables: {
      inspections: {
        Row: {
          id: string;
          org_id: string;
          operator_id: string;
          task_id: string | null;
          template_id: string | null;
          status: string;
          answers: any;
          findings: any | null;
          photos: any | null;
          risk_score: number | null;
          severity: string | null;
          location: string | null;
          equipment: string | null;
          started_at: string | null;
          completed_at: string | null;
          created_at: string | null;
        };

        Insert: {
          id?: string;
          org_id: string;
          operator_id: string;
          task_id?: string | null;
          template_id?: string | null;
          status?: string;
          answers: any;
          findings?: any | null;
          photos?: any | null;
          risk_score?: number | null;
          severity?: string | null;
          location?: string | null;
          equipment?: string | null;
          started_at?: string | null;
          completed_at?: string | null;
          created_at?: string | null;
        };

        Update: {
          id?: string;
          org_id?: string;
          operator_id?: string;
          task_id?: string | null;
          template_id?: string | null;
          status?: string;
          answers?: any;
          findings?: any | null;
          photos?: any | null;
          risk_score?: number | null;
          severity?: string | null;
          location?: string | null;
          equipment?: string | null;
          started_at?: string | null;
          completed_at?: string | null;
          created_at?: string | null;
        };
      };
    };
  };
}
