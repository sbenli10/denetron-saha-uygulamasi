// APP/app/api/ai/audit/ai/route.ts
import { cookies } from "next/headers";
import { randomUUID } from "crypto";
import { supabaseServiceRoleClient } from "@/lib/supabase/server";
import { createServerClient } from "@supabase/ssr";

const ALLOWED_ACTIONS = [
  "presented",
  "acknowledged",
  "ignored",
  "confirmed",
] as const;

type OperatorAction = (typeof ALLOWED_ACTIONS)[number];

export async function POST(req: Request) {
  const requestId = randomUUID();
  console.log(`[audit-ai][${requestId}] POST received`);

  try {
    const body = await req.json();
    console.log(`[audit-ai][${requestId}] body`, body);

    const {
      source,
      ai_used,
      reason,
      confidence,
      operator_action,
      task_id,
    } = body;

    /* ================= AUTH SESSION ================= */

    const cookieStore = cookies();

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get: name => cookieStore.get(name)?.value,
        },
      }
    );

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      console.warn(`[audit-ai][${requestId}] unauthorized`);
      return Response.json({ error: "unauthorized" }, { status: 401 });
    }

    /* ================= ORG RESOLUTION ================= */

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    if (profileError || !profile?.organization_id) {
      console.error(
        `[audit-ai][${requestId}] org_not_found`,
        profileError
      );
      return Response.json(
        { error: "org_not_found" },
        { status: 400 }
      );
    }

    /* ================= NORMALIZATION ================= */

    const safeOperatorAction: OperatorAction =
      ALLOWED_ACTIONS.includes(operator_action)
        ? operator_action
        : "presented";

    const safeConfidence =
      typeof confidence === "number" ? confidence : null;

    /* ================= DB INSERT ================= */

    const serviceDb = supabaseServiceRoleClient();

    const { error } = await serviceDb.from("ai_audit_logs").insert({
      actor_user_id: user.id,
      org_id: profile.organization_id,
      context: source,
      ai_used: ai_used ?? false,
      confidence: safeConfidence,
      decision: reason ?? null,
      operator_action: safeOperatorAction,
      operator_note: body.operator_note ?? (
        task_id
          ? `AI farkındalık bildirimi (task_id=${task_id})`
          : "AI farkındalık bildirimi"
      ),
    });

    if (error) {
      console.error(`[audit-ai][${requestId}] db_error`, error);
      return Response.json(
        { error: "db_insert_failed" },
        { status: 500 }
      );
    }

    console.log(
      `[audit-ai][${requestId}] success actor=${user.id}`
    );

    return Response.json({ ok: true });

  } catch (e) {
    console.error(`[audit-ai][${requestId}] exception`, e);
    return Response.json({ error: "audit_failed" }, { status: 500 });
  }
}
