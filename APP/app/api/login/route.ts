// app/api/login/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import {
  supabaseServerClient,
  supabaseServiceRoleClient,
} from "@/lib/supabase/server";

export async function POST(req: Request) {
  try {
    const { email, password, rememberMe } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email ve şifre zorunlu" },
        { status: 400 }
      );
    }

    // Cookie yazan client
    const supabase = supabaseServerClient(
      Boolean(rememberMe)
    );

    // 1️⃣ Login
    const { data, error } =
      await supabase.auth.signInWithPassword({
        email,
        password,
      });

    if (error || !data?.user) {
      return NextResponse.json(
        { error: "Email veya şifre hatalı" },
        { status: 401 }
      );
    }

    const user = data.user;

    // 2️⃣ Role & organization kontrolü
    const adminClient =
      supabaseServiceRoleClient();

    const { data: members } = await adminClient
      .from("org_members")
      .select("role, org_id")
      .eq("user_id", user.id)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(1);

    const member = members?.[0];

    if (!member) {
      return NextResponse.json(
        {
          error:
            "Kullanıcı bir organizasyona bağlı değil",
        },
        { status: 403 }
      );
    }

    // 3️⃣ OK
    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
      },
      role: member.role,
      orgId: member.org_id,
    });
  } catch (err) {
    console.error("[LOGIN ERROR]", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
