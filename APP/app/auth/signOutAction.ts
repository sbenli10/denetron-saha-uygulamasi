"use server";

import { redirect } from "next/navigation";
import { supabaseServerClient } from "@/lib/supabase/server";

export async function signOutAction() {
  console.group("🚪 SIGN OUT ACTION");

  try {
    const supabase = supabaseServerClient();

    console.log("🔐 Calling Supabase global signOut...");

    // 🔥 EN KRİTİK SATIR
    const { error } = await supabase.auth.signOut({
      scope: "global",
    });

    if (error) {
      console.error("❌ Supabase signOut error:", error);
      throw error;
    }

    console.log("✅ Supabase session destroyed (global)");

  } catch (err) {
    console.error("🔥 signOutAction FAILED:", err);
  } finally {
    console.log("➡️ Redirecting to /login");
    console.groupEnd();

    redirect("/login");
  }
}
