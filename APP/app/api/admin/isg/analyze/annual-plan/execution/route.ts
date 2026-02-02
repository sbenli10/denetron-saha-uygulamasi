import { NextResponse } from "next/server";
import { supabaseServerClient } from "@/lib/supabase/server";

export async function GET(req: Request) {
  const requestId = crypto.randomUUID();
  const log = (step: string, data?: unknown) =>
    console.log(
      `[ANNUAL_PLAN_EXECUTION][${requestId}] ${step}`,
      data ?? ""
    );

  log("===== REQUEST START =====");

  const supabase = supabaseServerClient();
  log("Supabase client initialized");

  /* ================= AUTH ================= */
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError) {
    log("Auth error", authError);
  }

  if (!user) {
    log("Unauthorized request");
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  log("Authenticated user", { userId: user.id });

  /* ================= QUERY PARAM ================= */
  const { searchParams } = new URL(req.url);
  const executionId = searchParams.get("execution_id");

  log("Query params parsed", { execution_id: executionId });

  if (!executionId) {
    log("Validation failed: execution_id missing");
    return NextResponse.json(
      { error: "MISSING_EXECUTION_ID" },
      { status: 400 }
    );
  }

  /* ================= ORGANIZATION ================= */
  log("Resolving organization");

  const { data: orgMember, error: orgError } = await supabase
    .from("org_members")
    .select("org_id")
    .eq("user_id", user.id)
    .is("deleted_at", null)
    .single();

  if (orgError) {
    log("Org query error", orgError);
  }

  if (!orgMember) {
    log("Organization not found for user", {
      userId: user.id,
    });

    return NextResponse.json(
      { error: "ORG_NOT_FOUND" },
      { status: 404 }
    );
  }

  log("Organization resolved", {
    orgId: orgMember.org_id,
  });

  /* ================= QUERY ================= */
  log("Querying annual_plan_executions", {
    executionId,
  });

  const { data: execution, error } = await supabase
    .from("annual_plan_executions")
    .select(`
      id,
      organization_id,
      plan_year,
      activity,
      planned_period,
      planned_month,
      executed,
      executed_at,
      evidence_files,
      note,
      created_at
    `)
    .eq("id", executionId)
    .eq("organization_id", orgMember.org_id) // 🔑 TABLOYA UYGUN
    .maybeSingle();

  if (error) {
    log("Execution query ERROR", {
      message: error.message,
      code: error.code,
      details: error.details,
    });

    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }

  if (!execution) {
    log("Execution not found or access denied", {
      executionId,
      orgId: orgMember.org_id,
    });

    return NextResponse.json(
      { error: "Eğitim kaydı bulunamadı" },
      { status: 404 }
    );
  }

  log("Execution fetched successfully", {
    executionId: execution.id,
    executed: execution.executed,
  });

  log("===== REQUEST END =====");

  return NextResponse.json({ execution });
}
