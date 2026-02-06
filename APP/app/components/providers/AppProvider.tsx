// APP/app/components/providers/AppProvider.tsx
"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { supabaseAuth } from "@/lib/supabase/auth";
import type { User } from "@supabase/supabase-js";

/* ===================== TYPES ===================== */

export interface Profile {
  id: string;
  organization_id: string | null;
  role: string | null;
  full_name: string | null;
  email?: string | null;
}

export interface Member {
  id: string;
  user_id: string;
  org_id: string;
  role: string;
  role_id?: string | null;
  created_at: string;
  deleted_at?: string | null;
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
  force_2fa?: boolean | null;
  single_session_required?: boolean | null;
}

export interface AppContextState {
  user: User | null;
  profile: Profile | null;
  member: Member | null;
  organization: Organization | null;
  orgSettings: OrgSettings | null;

  /** auth + app data fully ready */
  ready: boolean;

  /** convenience */
  loading: boolean;

  /** safe actions */
  refresh: () => Promise<void>;
  signOut: () => Promise<void>;
}

/* ===================== CONTEXT ===================== */

export const AppContext = createContext<AppContextState | null>(null);

/* ===================== PROVIDER ===================== */

export function AppProvider({ children }: { children: ReactNode }) {
  const supabase = supabaseAuth();

  // Auth state
  const [user, setUser] = useState<User | null>(null);

  // App data state
  const [profile, setProfile] = useState<Profile | null>(null);
  const [member, setMember] = useState<Member | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [orgSettings, setOrgSettings] = useState<OrgSettings | null>(null);

  // Readiness gates (prevents stale UI)
  const [authReady, setAuthReady] = useState(false);
  const [dataReady, setDataReady] = useState(false);

  // Prevent out-of-order responses applying to new user
  const loadSeq = useRef(0);

  const loading = !authReady || !dataReady;
  const ready = !loading;

  const resetAppState = () => {
    setProfile(null);
    setMember(null);
    setOrganization(null);
    setOrgSettings(null);
    setDataReady(false);
  };

  /* ---------- 1) INITIAL AUTH (GATE) ---------- */
  useEffect(() => {
    let active = true;

    (async () => {
      const { data, error } = await supabase.auth.getUser();

      if (!active) return;

      // Fail-closed: auth error -> treat as signed out
      if (error) {
        setUser(null);
        resetAppState();
        setAuthReady(true);
        return;
      }

      setUser(data.user ?? null);
      setAuthReady(true);
    })();

    return () => {
      active = false;
    };
  }, [supabase]);

  /* ---------- 2) AUTH LISTENER (HARD RESET ON CHANGE) ---------- */
  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        // On every auth transition, invalidate pending loads
        loadSeq.current += 1;

        setUser(session?.user ?? null);

        // Reset app state so old user's name/org never flashes
        resetAppState();

        // Auth is now known for this event
        setAuthReady(true);
      }
    );

    return () => {
      listener.subscription.unsubscribe();
    };
  }, [supabase]);

  /* ---------- 3) LOAD APP DATA (RACE-SAFE) ---------- */
  const loadAppData = async (u: User) => {
    const seq = ++loadSeq.current;

    // While loading for this user:
    setDataReady(false);

    // PROFILE
    const { data: pRaw, error: pErr } = await supabase
      .from("profiles")
      .select("id, organization_id, role, full_name, email")
      .eq("id", u.id)
      .maybeSingle<Profile>();

    // If a newer auth event happened, abort applying results
    if (seq !== loadSeq.current) return;

    if (pErr) {
      // Fail-closed on UI: wipe state
      resetAppState();
      setDataReady(true);
      return;
    }

    setProfile(pRaw ?? null);

    // MEMBER: choose most recent membership to avoid “double org” randomness
    const { data: members, error: mErr } = await supabase
    .from("org_members")
    .select(
      "id, user_id, org_id, role, role_id, created_at, deleted_at"
    )
    .eq("user_id", u.id)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .returns<Member[]>(); // 🔥 KRİTİK


    if (seq !== loadSeq.current) return;

    if (mErr) {
      resetAppState();
      setDataReady(true);
      return;
    }

    const mRaw: Member | null =
    Array.isArray(members) && members.length > 0
      ? members[0]
      : null;

    setMember(mRaw);


    // ORG + SETTINGS
    if (mRaw?.org_id) {
      const { data: orgRaw, error: orgErr } = await supabase
        .from("organizations")
        .select("id, name, slug, is_premium")
        .eq("id", mRaw.org_id)
        .maybeSingle<Organization>();

      if (seq !== loadSeq.current) return;

      if (orgErr) {
        setOrganization(null);
      } else {
        setOrganization(orgRaw ?? null);
      }

      const { data: settingsRaw, error: sErr } = await supabase
        .from("org_settings")
        .select("org_id, logo_url, force_2fa, single_session_required")
        .eq("org_id", mRaw.org_id)
        .maybeSingle<OrgSettings>();

      if (seq !== loadSeq.current) return;

      if (sErr) {
        setOrgSettings(null);
      } else {
        setOrgSettings(settingsRaw ?? null);
      }
    } else {
      setOrganization(null);
      setOrgSettings(null);
    }

    setDataReady(true);
  };

  useEffect(() => {
    // Auth not resolved yet -> do nothing
    if (!authReady) return;

    // Signed out -> app data is “ready” (empty state), no stale UI
    if (!user) {
      resetAppState();
      setDataReady(true);
      return;
    }

    loadAppData(user);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authReady, user?.id]); // only rerun when user changes

  /* ---------- ACTIONS ---------- */
  const refresh = async () => {
    if (!user) return;
    await loadAppData(user);
  };

  const signOut = async () => {
    // UI fail-closed immediately
    loadSeq.current += 1;
    setUser(null);
    resetAppState();
    setAuthReady(true);
    setDataReady(true);

    await supabase.auth.signOut();
  };

  const value = useMemo<AppContextState>(
    () => ({
      user,
      profile,
      member,
      organization,
      orgSettings,
      ready,
      loading,
      refresh,
      signOut,
    }),
    [user, profile, member, organization, orgSettings, ready, loading]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

/* ===================== HOOK ===================== */

export function useAppContext() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useAppContext must be used inside AppProvider");
  return ctx;
}
