//APP\app\components\providers\AppProvider.tsx
"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";

import { supabaseAuth } from "@/lib/supabase/auth";

/* =====================================================================
   TYPES
===================================================================== */

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

/* =====================================================================
   CONTEXT
===================================================================== */

export const AppContext = createContext<AppContextState | null>(null);

/* =====================================================================
   PROVIDER
===================================================================== */

export function AppProvider({
  children,
  initialUser,
}: {
  children: ReactNode;
  initialUser: any;
}) {

  const supabase = supabaseAuth();

  const [user, setUser] = useState<any>(initialUser);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [member, setMember] = useState<Member | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [orgSettings, setOrgSettings] = useState<OrgSettings | null>(null);
  const [loading, setLoading] = useState(true);


  /* =====================================================================
   1) AUTH STATE LISTENER (LOGIN / LOGOUT / REFRESH)
===================================================================== */

    useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);

        setProfile(null);
        setMember(null);
        setOrganization(null);
        setOrgSettings(null);

        if (event !== "TOKEN_REFRESHED") {
          setLoading(false);
        }
      }
    );

    return () => {
      listener.subscription?.unsubscribe();
    };
  }, [supabase]);




  /* =====================================================================
      2) LOAD PROFILE + MEMBER + ORGANIZATION + ORG SETTINGS
  ===================================================================== */

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

      /* -----------------------------
         PROFILE
      ------------------------------ */
      const { data: pRaw } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

      if (!active) return;
      setProfile(pRaw ? (pRaw as Profile) : null);

      /* -----------------------------
         MEMBER
      ------------------------------ */
      const { data: mRaw } = await supabase
        .from("org_members")
        .select("*")
        .eq("user_id", user.id)
        .is("deleted_at", null)
        .maybeSingle();

      if (!active) return;
      const m = mRaw ? (mRaw as Member) : null;
      setMember(m);

      /* -----------------------------
         ORGANIZATION + SETTINGS
      ------------------------------ */
      if (m?.org_id) {
        const { data: orgRaw } = await supabase
          .from("organizations")
          .select("*")
          .eq("id", m.org_id)
          .maybeSingle();

        if (!active) return;
        setOrganization(orgRaw ? (orgRaw as Organization) : null);

        // 👇 LOGO BURADAN GELİYOR (PDF ROUTE İLE AYNI)
        const { data: settingsRaw } = await supabase
        .from("org_settings")
        .select("org_id, logo_url")
        .eq("org_id", m.org_id)
        .maybeSingle<OrgSettings>();

      console.log("[ORG_SETTINGS RAW]", settingsRaw);

      if (!active) return;

      setOrgSettings(
        settingsRaw
          ? {
              org_id: settingsRaw.org_id,
              logo_url: settingsRaw.logo_url ?? null,
            }
          : null
      );

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

  /* =====================================================================
      PROVIDER
  ===================================================================== */

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

/* =====================================================================
   HELPER HOOK
===================================================================== */

export function useAppContext() {
  return useContext(AppContext);
}
