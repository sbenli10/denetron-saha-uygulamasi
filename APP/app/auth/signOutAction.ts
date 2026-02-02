//APP\app\auth\signOutAction.ts
"use server";

import { supabaseServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function signOutAction() {
  const supabase = await supabaseServerClient();

  await supabase.auth.signOut();

  redirect("/login");
}
