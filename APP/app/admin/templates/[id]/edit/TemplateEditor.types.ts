// -----------------------------
// TemplateEditor.types.ts
// -----------------------------

export type FieldType =
  | "boolean"
  | "text"
  | "textarea"
  | "select"
  | "divider";

interface BaseField {
  __id: string;
  label?: string;
}

/* -----------------------------
 * DIVIDER
 * ----------------------------- */
export interface FDivider extends BaseField {
  type: "divider";
}

/* -----------------------------
 * BOOLEAN
 * ----------------------------- */
export interface FBoolean extends BaseField {
  type: "boolean";
  key: string;
  critical?: boolean;
}

/* -----------------------------
 * TEXT
 * ----------------------------- */
export interface FText extends BaseField {
  type: "text";
  key: string;
  placeholder?: string;
}

/* -----------------------------
 * TEXTAREA
 * ----------------------------- */
export interface FTextArea extends BaseField {
  type: "textarea";
  key: string;
  maxLength?: number;
}

/* -----------------------------
 * SELECT FIELD
 *
 * UI string[] ile çalıştığı için 
 * options: string[] olarak düzeltilmiştir.
 * ----------------------------- */
export interface FSelect extends BaseField {
  type: "select";
  key: string;
  default?: string;
  options?: string[]; // <––– DOĞRU TİP (UI ile uyumlu)
}

/* -----------------------------
 * FIELD UNION
 * ----------------------------- */
export type Field =
  | FDivider
  | FBoolean
  | FText
  | FTextArea
  | FSelect;

/* -----------------------------
 * TEMPLATE ROW (templates)
 * ----------------------------- */
export interface TemplateRow {
  id: string;
  name: string;
  is_active: boolean;
  fields: Field[];
  created_at?: string;
  updated_at?: string;
  org_id?: string | null;
  schema?: any;
  fields_count?: number;
}

/* -----------------------------
 * TEMPLATE VERSION ROW
 * ----------------------------- */
export interface TemplateVersion {
  id: string;
  template_id: string;
  version: string; 
  created_at: string;
  created_by: string | null;
  fields: Field[];
  schema?: any;
}
