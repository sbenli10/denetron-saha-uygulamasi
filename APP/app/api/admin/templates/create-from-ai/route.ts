//APP\app\api\admin\templates\create-from-ai\route.ts
import { NextResponse } from "next/server";
import { getAdminContext } from "@/lib/admin/context";
import { supabaseServiceRoleClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  const { org } = await getAdminContext();
  const db = supabaseServiceRoleClient();

  const body = await req.json();
  const template = body.template;

  if (!template?.name || !template?.fields) {
    return NextResponse.json({ success: false, error: "INVALID_TEMPLATE" });
  }

  const { error } = await db.from("templates").insert({
    org_id: org.id,
    name: template.name,
    fields: template.fields,
    schema: { fields: template.fields },
    is_active: true,
  });

  if (error) {
    return NextResponse.json({ success: false, error: error.message });
  }

  return NextResponse.json({ success: true });
}
