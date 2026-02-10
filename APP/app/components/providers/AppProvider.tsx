
//APP\app\components\providers\AppProvider.tsx
"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
  ReactNode,
} from "react";
import { supabaseAuth } from "@/lib/supabase/auth";

/* ===================== TYPES ===================== */

export interface Profile {
  id: string;
  organization_id: string | null;
  role: string | null;
  full_name: string | null;
}

export interface Member {
  id: string;
  user_id: string;
  org_id: string;
  role: string;
  created_at: string;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  is_premium?: boolean;
}

export interface OrgSettings {
  org_id: string;
  logo_url: string | null;
}

export interface AppContextState {
  user: any;
  profile: Profile | null;
  member: Member | null;
  organization: Organization | null;
  orgSettings: OrgSettings | null;
  loading: boolean;
}

export const AppContext = createContext<AppContextState | null>(null);

/* ===================== PROVIDER ===================== */

export function AppProvider({ children }: { children: ReactNode }) {
  const supabase = supabaseAuth();

  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [member, setMember] = useState<Member | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [orgSettings, setOrgSettings] = useState<OrgSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const activeUserIdRef = useRef<string | null>(null);
  const initialState = {
    user: null,
    profile: null,
    member: null,
    organization: null,
    orgSettings: null,
    loading: true,
  };

  const requestIdRef = useRef(0);

  /* ===================== STATE LOGGER ===================== */
  useEffect(() => {
    console.log("🧠 APP STATE UPDATE", {
      user,
      profile,
      member,
      organization,
      orgSettings,
      loading,
    });
  }, [user, profile, member, organization, orgSettings, loading]);

  /* ===================== LOAD USER DATA ===================== */
  const loadUserData = async (userId: string) => {
    const reqId = ++requestIdRef.current;

    console.group(`🚀 loadUserData START [reqId=${reqId}]`);
    console.log("👤 userId:", userId);
    setLoading(true);

    try {
      console.log("📄 Fetching profile...");
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle<Profile>();

      console.log("📄 profile result:", profile);

      if (reqId !== requestIdRef.current) {
        console.warn("⛔ profile ignored (stale req)");
        return;
      }

      setProfile(profile ?? null);

      console.log("👥 Fetching org_members...");
      const { data: member } = await supabase
        .from("org_members")
        .select("*")
        .eq("user_id", userId)
        .is("deleted_at", null)
        .maybeSingle<Member>();

      console.log("👥 member result:", member);

      if (reqId !== requestIdRef.current) {
        console.warn("⛔ member ignored (stale req)");
        return;
      }

      setMember(member ?? null);

      if (!member?.org_id) {
        console.log("ℹ️ No org found for user");
        setOrganization(null);
        setOrgSettings(null);
        return;
      }

      console.log("🏢 Fetching organization...");
      const { data: org } = await supabase
        .from("organizations")
        .select("*")
        .eq("id", member.org_id)
        .maybeSingle<Organization>();

      console.log("🏢 organization result:", org);

      if (reqId !== requestIdRef.current) {
        console.warn("⛔ org ignored (stale req)");
        return;
      }

      setOrganization(org ?? null);

      console.log("⚙️ Fetching org_settings...");
      const { data: settings } = await supabase
        .from("org_settings")
        .select("org_id, logo_url")
        .eq("org_id", member.org_id)
        .maybeSingle<OrgSettings>();

      console.log("⚙️ settings result:", settings);

      if (reqId !== requestIdRef.current) {
        console.warn("⛔ settings ignored (stale req)");
        return;
      }

      setOrgSettings(settings ?? null);
    } catch (err) {
      console.error("🔥 loadUserData ERROR:", err);
    } finally {
      if (reqId === requestIdRef.current) {
        console.log("✅ loadUserData END → loading=false");
        setLoading(false);
      } else {
        console.warn("⛔ loadUserData END skipped (stale req)");
      }
      console.groupEnd();
    }
  };

  /* ===================== AUTH LISTENER ===================== */
    useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      requestIdRef.current++;

     if (session?.user) {
    // 🔥 SAME USER → IGNORE
    if (activeUserIdRef.current === session.user.id) {
      console.log("🟡 Same user event ignored:", session.user.id);
      return;
    }

    console.log("🆕 New user detected → reset state:", session.user.id);

    activeUserIdRef.current = session.user.id;

    // 🧹 ÖNCE TÜM ESKİ VERİLERİ TEMİZLE
    setUser(session.user);
    setProfile(null);
    setMember(null);
    setOrganization(null);
    setOrgSettings(null);
    setLoading(true);

    // 🚀 SONRA YENİ USER DATA YÜKLE
    loadUserData(session.user.id);
  }

    });

    return () => data.subscription.unsubscribe();
  }, [supabase]);


  /* ===================== INITIAL SESSION ===================== */
  useEffect(() => {
    console.log("🟡 Initial session check");

    const init = async () => {
      const { data } = await supabase.auth.getSession();
      const u = data.session?.user ?? null;

      console.log("🧾 getSession result:", u);

      if (!u) {
        console.log("❌ No session found → loading=false");
        setLoading(false);
        return;
      }

      console.log("✅ Session exists → setUser + loadUserData");
      setUser(u);
      await loadUserData(u.id);
    };

    init();
  }, [supabase]);

  return (
    <AppContext.Provider
      value={{
        user,
        profile,
        member,
        organization,
        orgSettings,
        loading,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

/* ===================== HOOK ===================== */

export function useAppContext() {
  const ctx = useContext(AppContext);
  if (!ctx) {
    throw new Error("useAppContext must be used inside AppProvider");
  }
  return ctx;
}
