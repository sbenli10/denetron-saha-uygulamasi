export interface OrgSettings {
  org_id: string;

  logo_url: string | null;
  timezone: string;
  language: "tr" | "en";

  force_2fa: boolean;
  single_session_required: boolean;

  auto_assign_role_id: string | null;

  invite_expiration_hours: number;

  billing_company: string | null;
  billing_tax_number: string | null;
  billing_renewal: string | null;

  updated_at?: string;
}
