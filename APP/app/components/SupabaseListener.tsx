"use client";

import { useEffect } from "react";
import { supabaseAuth } from "@/lib/supabase/auth";

interface Props {
  onUserChange: (user: any) => void;
}

export default function SupabaseListener({ onUserChange }: Props) {
  const supabase = supabaseAuth();

  useEffect(() => {
    console.log("[LISTENER] MOUNT - Supabase instance:", supabase);

    const { data: listener } = supabase.auth.onAuthStateChange(
      (event: string, session: any) => {
        console.log("=====================================");
        console.log("[LISTENER] AUTH CHANGE EVENT:", event);
        console.log("[LISTENER] SESSION:", session);
        console.log("=====================================");

        onUserChange(session?.user ?? null);
      }
    );

    return () => listener.subscription.unsubscribe();
  }, []);

  return null;
}
