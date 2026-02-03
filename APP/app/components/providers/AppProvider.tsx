"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
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
  setUser: (u: any) => void;
  profile: Profile | null;
  member: Member | null;
  organization: Organization | null;
  orgSettings: OrgSettings | null;
  loading: boolean;
}

/* ===================== CONTEXT ===================== */

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

  /* ---------- INITIAL AUTH ---------- */
  useEffect(() => {
    let active = true;

    supabase.auth.getUser().then(({ data }) => {
      if (!active) return;
      setUser(data.user ?? null);
    });

    return () => {
      active = false;
    };
  }, [supabase]);

  /* ---------- AUTH LISTENER ---------- */
  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
        setProfile(null);
        setMember(null);
        setOrganization(null);
        setOrgSettings(null);
      }
    );

    return () => {
      listener.subscription.unsubscribe();
    };
  }, [supabase]);

  /* ---------- LOAD APP DATA ---------- */
  useEffect(() => {
    if (!user) {
      setProfile(null);
      setMember(null);
      setOrganization(null);
      setOrgSettings(null);
      setLoading(false);
      return;
    }

    let active = true;

    const loadData = async () => {
      setLoading(true);

      const { data: pRaw } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle<Profile>();

      if (!active) return;
      setProfile(pRaw ?? null);

      const { data: mRaw } = await supabase
        .from("org_members")
        .select("*")
        .eq("user_id", user.id)
        .is("deleted_at", null)
        .maybeSingle<Member>();

      if (!active) return;
      setMember(mRaw ?? null);

      if (mRaw?.org_id) {
        const { data: orgRaw } = await supabase
          .from("organizations")
          .select("*")
          .eq("id", mRaw.org_id)
          .maybeSingle<Organization>();

        if (!active) return;
        setOrganization(orgRaw ?? null);

        const { data: settingsRaw } = await supabase
          .from("org_settings")
          .select("org_id, logo_url")
          .eq("org_id", mRaw.org_id)
          .maybeSingle<OrgSettings>();

        if (!active) return;
        setOrgSettings(settingsRaw ?? null);
      } else {
        setOrganization(null);
        setOrgSettings(null);
      }

      setLoading(false);
    };

    loadData();

    return () => {
      active = false;
    };
  }, [user, supabase]);

  /* ---------- PROVIDER ---------- */
  return (
    <AppContext.Provider
      value={{
        user,
        setUser,
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
