//APP\app\api\migrate\route.ts
import { migrateTemplateFields } from "@/scripts/migrateTemplateFields";

export async function GET() {
  await migrateTemplateFields();
  return Response.json({ ok: true });
}
