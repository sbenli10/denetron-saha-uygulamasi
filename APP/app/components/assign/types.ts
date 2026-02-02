// APP/app/components/assign/types.ts

export type TemplateDTO = {
  id: string;
  name: string;
  description?: string | null;
};

export type OperatorDTO = {
  id: string;
  full_name: string | null;
  email: string | null;
};
