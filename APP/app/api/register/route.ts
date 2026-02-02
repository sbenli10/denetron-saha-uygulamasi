// APP/app/api/register/route.ts
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log("REGISTER BODY:", body);

    const { fullName, orgName, email, password } = body;

    if (!fullName || !orgName || !email || !password) {
      return NextResponse.json(
        { error: "Eksik bilgiler gönderildi." },
        { status: 400 }
      );
    }

    // 1️⃣ AUTH USER OLUŞTUR (admin API ile, email onaylı)
    const { data: userRes, error: userErr } =
      await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: fullName },
      });

    if (userErr || !userRes?.user) {
      console.error("SIGNUP ERROR:", userErr);
      return NextResponse.json(
        { error: userErr?.message || "Kullanıcı oluşturulamadı." },
        { status: userErr?.status ?? 400 }
      );
    }

    const user = userRes.user;

    // 2️⃣ ORGANIZATION OLUŞTUR
    // 2️⃣ ORGANIZATION (Service Role)
    const slug = orgName
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "");

    const { data: org, error: orgError } = await supabaseAdmin
      .from("organizations")                 // ✅ orgs DEĞİL, organizations
      .insert({ name: orgName, slug })
      .select()
      .single();


    if (orgError || !org) {
      console.error("ORG INSERT ERROR:", orgError);
      return NextResponse.json(
        { error: "Organizasyon oluşturulamadı: " + orgError?.message },
        { status: 400 }
      );
    }

    // 3️⃣ PROFILES → kullanıcıyı admin + org ile bağla
    // 3️⃣ PROFILES → kullanıcıyı admin + org ile bağla
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .upsert(
        {
          id: user.id,
          full_name: fullName,
          organization_id: org.id,
          role: "admin",
          email, // ⭐ burada email’i de yazıyoruz
        },
        {
          onConflict: "id",
        }
      );


    if (profileError) {
      console.error("PROFILE UPSERT ERROR:", profileError);
      return NextResponse.json(
        { error: "Profil oluşturulamadı: " + profileError.message },
        { status: 400 }
      );
    }


    // 4️⃣ ORG_MEMBERS → org'a üye olarak ekle
    const { error: memberError } = await supabaseAdmin
      .from("org_members")
      .insert({
        org_id: org.id,    // senin tablonda kolon adı 'org_id'
        user_id: user.id,
        role: "admin",
      });

    if (memberError) {
      console.error("MEMBER INSERT ERROR:", memberError);
      return NextResponse.json(
        { error: "Üyelik eklenemedi: " + memberError.message },
        { status: 400 }
      );
    }

    // 5️⃣ OK
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (e: any) {
    console.error("REGISTER ERROR:", e);
    return NextResponse.json(
      { error: "Server error: " + e.message },
      { status: 500 }
    );
  }
}
