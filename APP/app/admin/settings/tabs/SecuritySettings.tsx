//APP\app\admin\settings\tabs\SecuritySettings.tsx
"use client";

import { useEffect, useState } from "react";
import {
  Smartphone,
  Monitor,
  KeyRound,
  Lock,
  LogOut,
  RefreshCw,
  Crown,
} from "lucide-react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

import PremiumRequired from "../../_components/PremiumRequired";
import { cn } from "@/lib/utils";
import { parseDevice } from "@/lib/device";

import {
  getSessions,
  getDevices,
  revokeSession,
  revokeAllSessionsExceptCurrent,
  toggleTrustedDevice,
} from "@/app/actions/security";

import { Database } from "@/app/lib/supabase.types";


/**
 * Props
 * - isPremium: organizasyon premium mu?
 * - role: member.role (admin / operator / viewer vs.)
 */
export interface SecuritySettingsProps {
  isPremium: boolean;
  role: string | null;
  userId: string;
  orgId: string;
}

/**
 * Production-ready UI modeli (şimdilik mock).
 * Sonraki adım: Supabase auth/session + device fingerprint/agent log tablosuna bağlanacak.
 */
type SessionItem = {
  id: string;            // device_sessions.id
  sessionId: string;     // refresh_token
  label: string;         // "Chrome · Windows"
  isCurrent: boolean;    // is_current
  lastSeenAt: string;
};



type DeviceItem = {
  id: string;
  name: string;
  platform?: string;
  lastSeenAt: string;
  trusted?: boolean;
};



function formatTimeTR(iso: string) {
  try {
    return new Date(iso).toLocaleString("tr-TR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function RoleGate({
  role,
  children,
}: {
  role: string | null;
  children: React.ReactNode;
}) {
  // “admin” dışındakiler kritik aksiyonları yapamasın
  const isAdmin = (role ?? "").toLowerCase() === "admin";
  return (
    <div className={cn(!isAdmin && "opacity-60 pointer-events-none select-none")}>
      {children}
    </div>
  );
}

function SectionShell({
  icon: Icon,
  title,
  description,
  right,
  children,
}: {
  icon: any;
  title: string;
  description?: string;
  right?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section
      className="
        rounded-2xl border border-border
        bg-background/40
        backdrop-blur-xl
        shadow-[0_10px_40px_rgba(0,0,0,0.10)]
        p-5 sm:p-6
        space-y-4
      "
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div
            className="
              h-10 w-10 rounded-xl
              bg-primary/10
              border border-border
              flex items-center justify-center
            "
          >
            <Icon className="h-5 w-5 text-primary" />
          </div>

          <div className="space-y-1">
            <div className="text-base font-semibold text-foreground">{title}</div>
            {description && (
              <div className="text-sm text-foreground/60 leading-snug">
                {description}
              </div>
            )}
          </div>
        </div>

        {right && <div className="shrink-0">{right}</div>}
      </div>

      <div>{children}</div>
    </section>
  );
}



/* ================= COMPONENT ================= */

export default function SecuritySettings({
  isPremium,
  role,
  userId,
  orgId,
}: SecuritySettingsProps) {
  const isAdmin = (role ?? "").toLowerCase() === "admin";

  const [loading, setLoading] = useState(false);
  const [twoFAEnabled, setTwoFAEnabled] = useState(false);
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [devices, setDevices] = useState<DeviceItem[]>([]);
  const supabase = createClientComponentClient<Database>();
  const [sessionReady, setSessionReady] = useState(false);
  const [enrolling2FA, setEnrolling2FA] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [factorId, setFactorId] = useState<string | null>(null);
  const [challengeId, setChallengeId] = useState<string | null>(null);
  const [otp, setOtp] = useState("");
  const [verifying, setVerifying] = useState(false);
  
  function reset2FAState() {
  setEnrolling2FA(false);
  setQrCode(null);
  setOtp("");
  setFactorId(null);
  setChallengeId(null);
}


  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (mounted) setSessionReady(!!data.session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) {
        setSessionReady(!!session);

        // Session değiştiyse MFA flow resetlenir
        reset2FAState();
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [supabase]);




  useEffect(() => {
    if (!sessionReady) return;

    supabase.auth.mfa
      .listFactors()
      .then((res) => {
        const totpCount = res.data?.totp?.length ?? 0;
        setTwoFAEnabled(totpCount > 0);
      })
      .catch(() => setTwoFAEnabled(false));
  }, [sessionReady, supabase]);


async function start2FAEnrollment() {
  // 🔐 1. Session hazır mı? (UI-level guard)
  if (!sessionReady) {
    alert("Oturum henüz hazır değil. Lütfen tekrar deneyin.");
    return;
  }

  // 🧱 2. Double click / race guard
  if (enrolling2FA) return;

  // 🔥 3. HARD GUARD → MFA için TEK güvenilir kontrol
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    console.error("AUTH STATE BOZUK:", userError);
    alert(
      "Kimlik doğrulama durumu bozuk. Lütfen çıkış yapıp tekrar giriş yapın."
    );
    reset2FAState();
    return;
  }

  // (İsteğe bağlı ama DEBUG için çok faydalı)
  if (process.env.NODE_ENV === "development") {
    const session = await supabase.auth.getSession();
    console.log("SESSION:", session);
    console.log("USER:", user);
  }

  setEnrolling2FA(true);

  try {
    // 4️⃣ ENROLL (TOTP + QR)
    const { data: enrollData, error: enrollError } =
      await supabase.auth.mfa.enroll({
        factorType: "totp",
      });

    if (enrollError || !enrollData?.totp) {
      throw enrollError ?? new Error("Enroll başarısız");
    }

    setFactorId(enrollData.id);
    setQrCode(enrollData.totp.qr_code);

    // 5️⃣ CHALLENGE (verify öncesi ZORUNLU)
    const { data: challengeData, error: challengeError } =
      await supabase.auth.mfa.challenge({
        factorId: enrollData.id,
      });

    if (challengeError || !challengeData) {
      throw challengeError ?? new Error("Challenge başarısız");
    }

    setChallengeId(challengeData.id);
  } catch (err) {
    console.error("MFA ENROLL ERROR:", err);
    reset2FAState();
    alert("2FA başlatılırken hata oluştu. Lütfen tekrar deneyin.");
  }
}




  async function onVerify2FA() {
    if (!factorId || !challengeId || otp.length !== 6) return;

    setVerifying(true);
    try {
      const { error } = await supabase.auth.mfa.verify({
        factorId,
        challengeId,
        code: otp,
      });

      if (error) throw error;

      // ✅ BAŞARILI
      setTwoFAEnabled(true);
      reset2FAState();
    } catch {
      // ❌ HATALI → factor’ü temizle
      await supabase.auth.mfa.unenroll({ factorId });
      reset2FAState();
    } finally {
      setVerifying(false);
    }
  }






  /* ================= FETCH ================= */

  async function loadData() {
  setLoading(true);
  try {
    const sessionRows = await getSessions(userId, orgId);
    const deviceRows  = await getDevices(userId, orgId);

    setSessions(
      sessionRows.map((r: any): SessionItem => ({
        id: r.id,
        sessionId: r.session_id,
        label: parseDevice(r.agent).label,
        isCurrent: r.is_current === true,
        lastSeenAt: r.last_seen_at,
      }))
    );

    setDevices(
      deviceRows.map((d: any): DeviceItem => ({
        id: d.id,
        name: d.label ?? "Bilinmeyen cihaz",
        platform: d.platform,
        lastSeenAt: d.last_seen_at,
        trusted: d.trusted,
      }))
    );
  } finally {
    setLoading(false);
  }
}


  useEffect(() => {
    loadData();
  }, [userId, orgId]);

  /* ================= ACTIONS ================= */

  async function onRefresh() {
    await loadData();
  }

  async function onRevokeOthers() {
    const current = sessions.find(s => s.isCurrent);
    if (!current) return;

    await revokeAllSessionsExceptCurrent(
      userId,
      current.sessionId
    );

    await loadData();
  }



  async function onToggleDevice(deviceId: string) {
    if (!isAdmin) return;
    await toggleTrustedDevice(deviceId);
    await loadData();
  }

  /* ================= RENDER ================= */

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-semibold">Güvenlik</h2>
          <p className="text-sm text-foreground/60">
            Oturumlar, cihazlar ve güvenlik ayarları
          </p>
        </div>

        <button
          onClick={onRefresh}
          className="h-10 px-4 rounded-xl border bg-background/50 text-sm"
        >
          <RefreshCw
            className={cn("h-4 w-4 inline mr-1", loading && "animate-spin")}
          />
          Yenile
        </button>
      </div>

     {/* 2FA */}
      <SectionShell
        icon={KeyRound}
        title="İki Aşamalı Doğrulama (2FA)"
        description="Ekstra güvenlik katmanı"
        right={
          !isPremium && (
            <span className="inline-flex items-center gap-1 text-xs">
              <Crown className="h-4 w-4 text-amber-500" /> Premium
            </span>
          )
        }
      >
        {!isPremium ? (
          <PremiumRequired role={role} />
        ) : (
          <>
            {/* 2FA AKTİF DEĞİL */}
            {!twoFAEnabled && !enrolling2FA && (
              <button
                disabled={!sessionReady}
                onClick={start2FAEnrollment}
                className="
                  h-10 px-4 rounded-xl
                  bg-primary text-primary-foreground
                  disabled:opacity-50 disabled:cursor-not-allowed
                "
              >
                2FA’yı Etkinleştir
              </button>
            )}

            {/* 2FA ENROLL FLOW */}
            {enrolling2FA && factorId && challengeId && (
              <div className="space-y-4 mt-4">
                {qrCode && (
                  <div className="flex flex-col items-center gap-2">
                    <img
                      src={qrCode}
                      alt="2FA QR Code"
                      className="w-40 h-40"
                    />
                    <p className="text-xs text-foreground/60 text-center">
                      Authenticator uygulamasıyla QR kodu okut
                    </p>
                  </div>
                )}

                <input
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="6 haneli kod"
                  inputMode="numeric"
                  maxLength={6}
                  className="h-10 w-full rounded-xl border px-3"
                />

                <button
                  onClick={onVerify2FA}
                  disabled={verifying || otp.length !== 6}
                  className="
                    h-10 px-4 rounded-xl
                    bg-emerald-600 text-white
                    disabled:opacity-50
                  "
                >
                  {verifying ? "Doğrulanıyor..." : "Doğrula"}
                </button>

                <button
                  onClick={async () => {
                    if (factorId) {
                      await supabase.auth.mfa.unenroll({ factorId });
                    }
                    reset2FAState();
                  }}
                  className="h-10 px-4 rounded-xl border text-sm"
                >
                  Vazgeç
                </button>
              </div>
            )}

            {/* 2FA AKTİF */}
            {twoFAEnabled && (
              <div className="text-sm text-emerald-600 font-medium">
                2FA aktif
              </div>
            )}
          </>
        )}
      </SectionShell>



      {/* Sessions */}
      <SectionShell
        icon={Monitor}
        title="Aktif Oturumlar"
        description="Bu cihaz hariç tüm oturumlar kapatılır"
        right={
          <button
            onClick={onRevokeOthers}
            className="h-10 px-4 rounded-xl border text-sm"
          >
            <LogOut className="h-4 w-4 inline mr-1" />
            Diğerlerini Kapat
          </button>
        }
      >
        {sessions.length === 0 ? (
          <div className="text-sm text-foreground/60">
            Oturum yok
          </div>
        ) : (
          <div className="space-y-2">
            {sessions.map((s) => (
              <div
                key={s.id}
                className="
                  rounded-xl border border-border
                  bg-background/30
                  p-4
                  flex flex-col sm:flex-row
                  sm:items-center sm:justify-between
                  gap-3
                "
              >
                {/* SOL TARAF */}
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">
                      {s.label}
                    </span>

                    {s.isCurrent && (
                      <span
                        className="
                          text-[11px] px-2 py-0.5 rounded-full
                          bg-emerald-500/15 text-emerald-600
                          border border-emerald-500/30
                        "
                      >
                        Bu cihaz
                      </span>
                    )}
                  </div>

                  <div className="text-xs text-foreground/60">
                    Son aktivite: {formatTimeTR(s.lastSeenAt)}
                  </div>
                </div>

                {/* SAĞ TARAF */}
                {!s.isCurrent && (
                  <button
                    onClick={async () => {
                      await revokeSession(s.sessionId);
                      await loadData();
                    }}
                    className="
                      h-9 px-4 rounded-xl
                      border border-border
                      text-sm font-medium
                      hover:bg-accent
                      transition
                      self-start sm:self-auto
                    "
                  >
                    Oturumu Kapat
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </SectionShell>

      {/* Devices */}
      <SectionShell
        icon={Smartphone}
        title="Cihazlar"
        description="Güven durumu"
        right={
          <span className="inline-flex items-center gap-1 text-sm">
            <Lock className="h-4 w-4" />
            {isAdmin ? "Yönetici" : "Salt okunur"}
          </span>
        }
      >
        <RoleGate role={role}>
          <div className="space-y-2">
            {devices.map((d) => (
              <div
                key={d.id}
                className="rounded-xl border bg-background/30 p-4 flex justify-between"
              >
                <div>
                  <div className="font-medium">{d.name}</div>
                  <div className="text-xs text-foreground/60">
                    {d.platform} • {formatTimeTR(d.lastSeenAt)}
                  </div>
                </div>

                {isAdmin && (
                  <button
                    onClick={() => onToggleDevice(d.id)}
                    className="h-9 px-3 rounded-xl border text-sm"
                  >
                    {d.trusted ? "Güvenilir" : "Standart"}
                  </button>
                )}
              </div>
            ))}

          </div>
        </RoleGate>
      </SectionShell>
    </div>
  );
}
