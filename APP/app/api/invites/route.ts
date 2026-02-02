// APP/app/api/invites/route.ts
import { NextResponse } from "next/server";
import { supabaseServerClient } from "@/lib/supabase/server";
import { randomUUID } from "crypto";

export async function POST(req: Request) {
  const { email, orgId, role_id } = await req.json();
  const supabase = supabaseServerClient();

  const token = randomUUID();

  const { error } = await supabase.from("invites").insert({
    email: email.toLowerCase(),
    org_id: orgId,
    role_id,
    used: false,
    token,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({
    ok: true,
    inviteUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/invite/${token}`,
  });
}
