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
import { supabaseAuth } from "@/lib/supabase/auth";

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
  id: string;
  sessionId: string;
  deviceHash: string;   // ✅ EKLE
  agent: string;
  isCurrent: boolean;
  lastSeenAt: string;
};

type RawSessionRow = {
  id: string;
  session_id: string;
  device_hash: string;
  agent: string;
  platform: string;
  ip: string;
  is_current: boolean;
  last_seen_at: string;
};


type GroupedSession = {
  deviceHash: string;
  label: string;
  lastSeenAt: string;
  sessionCount: number;
  isCurrentDevice: boolean;
  sessions: {
    sessionId: string;
    isCurrent: boolean;
  }[];
};



type DeviceItem = {
  id: string;
  deviceHash: string;   // 🔥 EKLE
  name: string;
  platform?: string;
  lastSeenAt: string;
  trusted: boolean;
};




function formatTimeTRSafe(iso?: string) {
  if (!iso) return "—";
  const d = new Date(iso);
  return isNaN(d.getTime())
    ? "—"
    : d.toLocaleString("tr-TR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
}


function groupSessionsByDevice(
  rows: RawSessionRow[]
): GroupedSession[] {
  const map = new Map<string, GroupedSession>();

  for (const row of rows) {
    const key = row.device_hash;

    if (!map.has(key)) {
      map.set(key, {
        deviceHash: key,
        label: parseDevice(row.agent).label,
        isCurrentDevice: false,
        sessionCount: 0,
        lastSeenAt: row.last_seen_at,
        sessions: [],
      });
    }

    const group = map.get(key)!;

    // ✅ DOĞRU SHAPE
    group.sessions.push({
      sessionId: row.session_id,
      isCurrent: row.is_current === true,
    });

    group.sessionCount += 1;

    if (row.is_current) {
      group.isCurrentDevice = true;
    }

    if (new Date(row.last_seen_at) > new Date(group.lastSeenAt)) {
      group.lastSeenAt = row.last_seen_at;
    }
  }

  return Array.from(map.values()).sort(
    (a, b) =>
      new Date(b.lastSeenAt).getTime() -
      new Date(a.lastSeenAt).getTime()
  );
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

async function revokeAllForDevice(
  sessions: { sessionId: string; isCurrent: boolean }[]
) {
  for (const s of sessions) {
    if (!s.isCurrent) {
      await revokeSession(s.sessionId);
    }
  }
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
  const supabase = supabaseAuth();
  const [sessionReady, setSessionReady] = useState(false);
  const [enrolling2FA, setEnrolling2FA] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [factorId, setFactorId] = useState<string | null>(null);
  const [challengeId, setChallengeId] = useState<string | null>(null);
  const [otp, setOtp] = useState("");
  const [verifying, setVerifying] = useState(false);
  const groupedSessions = groupSessionsByDevice(
    sessions.map((s) => ({
      id: s.id,
      session_id: s.sessionId,
      device_hash: s.deviceHash,   // ✅ GERÇEK HASH
      agent: s.agent,
      platform: "",
      ip: "",
      is_current: s.isCurrent,
      last_seen_at: s.lastSeenAt,
    }))
  );

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
  const supabase = supabaseAuth();

  // 0️⃣ Session HARD CHECK
  const { data: sessionData } = await supabase.auth.getSession();
  if (!sessionData.session) {
    alert("Oturum bulunamadı. Lütfen tekrar giriş yapın.");
    return;
  }

  // 1️⃣ Mevcut factor'leri al
  const { data: factors, error: factorError } =
    await supabase.auth.mfa.listFactors();

  if (factorError) {
    alert("2FA durumu alınamadı.");
    return;
  }

  const existingTotp = factors?.totp?.[0];

  // 2️⃣ YARIM KALMIŞ ENROLL VARSA → DEVAM ET
  if (existingTotp) {
    const confirmResume = confirm(
      "Daha önce başlatılmış bir 2FA doğrulaması var. Devam etmek ister misiniz?"
    );

    if (!confirmResume) {
      // 🔥 KULLANICI SIFIRLAMAK İSTİYOR
      await supabase.auth.mfa.unenroll({
        factorId: existingTotp.id,
      });
    } else {
      // ✅ DEVAM
      const { data: challengeData, error } =
        await supabase.auth.mfa.challenge({
          factorId: existingTotp.id,
        });

      if (error || !challengeData) {
        alert("Mevcut doğrulama başlatılamadı.");
        return;
      }

      setFactorId(existingTotp.id);
      setChallengeId(challengeData.id);
      setEnrolling2FA(true);
      return;
    }
  }

  // 3️⃣ YENİ ENROLL
  try {
    const { data: enrollData, error: enrollError } =
      await supabase.auth.mfa.enroll({
        factorType: "totp",
      });

    if (enrollError || !enrollData?.totp) {
      throw enrollError;
    }

    setFactorId(enrollData.id);
    setQrCode(enrollData.totp.qr_code);

    const { data: challengeData, error: challengeError } =
      await supabase.auth.mfa.challenge({
        factorId: enrollData.id,
      });

    if (challengeError || !challengeData) {
      throw challengeError;
    }

    setChallengeId(challengeData.id);
    setEnrolling2FA(true);
  } catch (err) {
    console.error("MFA ENROLL ERROR:", err);
    alert("2FA başlatılırken hata oluştu.");
  }
}




async function onVerify2FA() {
  if (!factorId || !challengeId || otp.length !== 6) return;

  setVerifying(true);

  try {
    const supabase = supabaseAuth();

    const { error } = await supabase.auth.mfa.verify({
      factorId,
      challengeId,
      code: otp,
    });

    if (error) throw error;

    setTwoFAEnabled(true);
    reset2FAState();
  } catch (err) {
    console.error("VERIFY ERROR:", err);

    // ❗ FAIL → FACTOR SİL
    const supabase = supabaseAuth();
    await supabase.auth.mfa.unenroll({ factorId });

    reset2FAState();
    alert("Kod doğrulanamadı. Lütfen tekrar deneyin.");
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
        deviceHash: r.device_hash,   // 🔥 KRİTİK
        agent: r.agent,
        isCurrent: r.is_current === true,
        lastSeenAt: r.last_seen_at,
      }))
    );


   setDevices(
      deviceRows.map((d: any): DeviceItem => ({
        id: d.id,
        deviceHash: d.device_hash, // 🔥 BURASI
        name: d.name,
        platform: d.platform,
        lastSeenAt: d.lastSeenAt,
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


  const [togglingDevice, setTogglingDevice] = useState<string | null>(null);

 async function onToggleDevice(deviceHash: string) {
    if (!isAdmin) return;

    setTogglingDevice(deviceHash);

    // 1️⃣ Optimistic UI
    setDevices(prev =>
      prev.map(d =>
        d.deviceHash === deviceHash
          ? { ...d, trusted: !d.trusted }
          : d
      )
    );

    try {
      await toggleTrustedDevice(userId, orgId, deviceHash);
    } catch (err) {
      console.error("Toggle device failed", err);

      // ❌ rollback
      setDevices(prev =>
        prev.map(d =>
          d.deviceHash === deviceHash
            ? { ...d, trusted: !d.trusted }
            : d
        )
      );
    } finally {
      setTogglingDevice(null);

      // 2️⃣ Final sync (tek kaynak DB)
      await loadData();
    }
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

     {/* ================= GİRİŞ GÜVENLİĞİ (2FA) ================= */}
    <SectionShell
      icon={KeyRound}
      title="Giriş Güvenliği (Telefonla Onay)"
      description="Hesabınızı izinsiz girişlere karşı korur"
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
      {/* ===== AÇIKLAMA ===== */}
      <p className="text-sm text-foreground/70 leading-relaxed">
        Bu özellik açıkken hesabınıza giriş yaparken:
        <br />
        <strong>Şifrenizden sonra telefonunuzdan gelen tek kullanımlık bir kod</strong> sorulur.
        <br />
        <span className="text-xs text-foreground/50">
          Böylece şifreniz başkalarının eline geçse bile hesabınıza girilemez.
        </span>
      </p>

      {/* ===== AKTİF DEĞİL ===== */}
      {!twoFAEnabled && !enrolling2FA && (
        <div className="pt-4 space-y-2">
          <button
            disabled={!sessionReady}
            onClick={start2FAEnrollment}
            className="
              h-10 px-4 rounded-xl
              bg-primary text-primary-foreground
              disabled:opacity-50 disabled:cursor-not-allowed
            "
          >
            Telefonla Giriş Güvenliğini Aç
          </button>

          <p className="text-xs text-foreground/50">
            Kurulum 1 dakikadan kısa sürer.
          </p>

          {!sessionReady && (
            <p className="text-xs text-foreground/50">
              Oturum doğrulanıyor, lütfen bekleyin…
            </p>
          )}
        </div>
      )}

      {/* ===== KURULUM (QR + KOD) ===== */}
      {enrolling2FA && factorId && challengeId && (
        <div className="space-y-4 mt-6">
          {qrCode && (
            <div className="flex flex-col items-center gap-2">
              <img
                src={qrCode}
                alt="Güvenlik Kodu"
                className="w-40 h-40"
              />
              <p className="text-xs text-foreground/60 text-center">
                Telefonunuza bir doğrulama uygulaması yükleyip bu kodu okutun.
                <br />
                (Google Authenticator, Microsoft Authenticator vb.)
              </p>
            </div>
          )}

          <input
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            placeholder="Telefondaki 6 haneli kod"
            inputMode="numeric"
            maxLength={6}
            className="h-10 w-full rounded-xl border px-3"
          />

          <div className="flex gap-2">
            <button
              onClick={onVerify2FA}
              disabled={verifying || otp.length !== 6}
              className="
                flex-1 h-10 rounded-xl
                bg-emerald-600 text-white
                disabled:opacity-50
              "
            >
              {verifying ? "Kontrol ediliyor…" : "Onayla"}
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

          <p className="text-xs text-foreground/50 text-center">
            Bu adım tamamlanmadan güvenlik aktif olmaz.
          </p>
        </div>
      )}

      {/* ===== AKTİF ===== */}
      {twoFAEnabled && (
        <div className="mt-4 space-y-1">
          <div className="text-sm text-emerald-600 font-medium">
            Telefonla giriş güvenliği açık
          </div>
          <p className="text-xs text-foreground/60">
            Yeni bir cihazdan giriş yaparken telefonunuza doğrulama kodu sorulur.
          </p>
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
  {groupedSessions.length === 0 ? (
    <div className="text-sm text-foreground/60">
      Oturum yok
    </div>
  ) : (
    <div className="space-y-3">
      {groupedSessions.map((d) => (
        <div
          key={d.deviceHash}
          className="
            rounded-xl border border-border
            bg-background/30
            p-4
            flex flex-col gap-2
          "
        >
          {/* ÜST SATIR */}
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-medium">
                  {d.label}
                </span>

                {d.isCurrentDevice && (
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
                Son aktivite: {formatTimeTRSafe(d.lastSeenAt)}
              </div>

              <div className="text-xs text-foreground/60">
                Aktif oturum: {d.sessionCount}
              </div>
            </div>

            {/* AKSİYON */}
            {!d.isCurrentDevice && (
              <button
                onClick={async () => {
                  await revokeAllForDevice(d.sessions);
                  await loadData();
                }}
                className="
                  h-9 px-4 rounded-xl
                  border border-border
                  text-sm font-medium
                  hover:bg-accent
                  transition
                "
              >
                Tümünü kapat
              </button>
            )}
          </div>
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
                    {d.platform} • {formatTimeTRSafe(d.lastSeenAt)}
                  </div>
                </div>

                {isAdmin && (
                <button
                  type="button"
                  disabled={togglingDevice === d.deviceHash}
                  onClick={() => onToggleDevice(d.deviceHash)}
                  className={cn(
                    "h-9 min-w-[120px] px-4 rounded-xl text-sm font-medium transition-all",
                    "border focus:outline-none focus:ring-2 focus:ring-offset-2",
                    d.trusted
                      ? "bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100 focus:ring-emerald-400"
                      : "bg-background text-foreground border-border hover:bg-accent focus:ring-primary",
                    togglingDevice === d.deviceHash && "opacity-60 cursor-not-allowed"
                  )}
                >
                  {togglingDevice === d.deviceHash
                    ? "Güncelleniyor…"
                    : d.trusted
                      ? "Güvenilir"
                      : "Standart"}
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
