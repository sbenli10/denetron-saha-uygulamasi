//APP\app\admin\settings\tabs\SecuritySettings.tsx
"use client";

import { useMemo, useState } from "react";
import {
  Shield,
  Smartphone,
  Monitor,
  KeyRound,
  Lock,
  LogOut,
  RefreshCw,
  Crown,
  AlertTriangle,
} from "lucide-react";

import PremiumRequired from "../../_components/PremiumRequired";
import { cn } from "@/lib/utils";

/**
 * Props
 * - isPremium: organizasyon premium mu?
 * - role: member.role (admin / operator / viewer vs.)
 */
export interface SecuritySettingsProps {
  isPremium: boolean;
  role: string | null;
}

/**
 * Production-ready UI modeli (şimdilik mock).
 * Sonraki adım: Supabase auth/session + device fingerprint/agent log tablosuna bağlanacak.
 */
type SessionItem = {
  id: string;
  device: string;
  ip?: string;
  city?: string;
  lastSeenAt: string;
  current?: boolean;
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

export default function SecuritySettings({ isPremium, role }: SecuritySettingsProps) {
  const isAdmin = (role ?? "").toLowerCase() === "admin";

  // ---- Mock state (sonraki adım: fetch ile dolduracağız)
  const [twoFAEnabled, setTwoFAEnabled] = useState(false);
  const [loadingRefresh, setLoadingRefresh] = useState(false);

  const sessions: SessionItem[] = useMemo(
    () => [
      {
        id: "sess_current",
        device: "Chrome • Windows",
        ip: "88.XXX.XX.10",
        city: "İstanbul",
        lastSeenAt: new Date().toISOString(),
        current: true,
      },
      {
        id: "sess_2",
        device: "Safari • iPhone",
        ip: "88.XXX.XX.11",
        city: "İzmir",
        lastSeenAt: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(),
      },
    ],
    []
  );

  const devices: DeviceItem[] = useMemo(
    () => [
      {
        id: "dev_1",
        name: "iPhone 14",
        platform: "iOS",
        lastSeenAt: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
        trusted: true,
      },
      {
        id: "dev_2",
        name: "Dell Latitude",
        platform: "Windows",
        lastSeenAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
        trusted: false,
      },
    ],
    []
  );

  async function onRefresh() {
    setLoadingRefresh(true);
    try {
      // TODO: burada gerçek endpoint/server action çağrısı yapılacak
      await new Promise((r) => setTimeout(r, 450));
    } finally {
      setLoadingRefresh(false);
    }
  }

  function onRevokeSession(sessionId: string) {
    // TODO: server action -> session revoke
    alert(`Oturum kapatma (mock): ${sessionId}`);
  }

  function onRevokeAllOther() {
    // TODO: server action -> revoke all except current
    alert("Diğer tüm oturumları kapat (mock)");
  }

  function onToggleTrustedDevice(deviceId: string) {
    // TODO: server action -> device trust toggle
    alert(`Cihaz güven durumu değiştir (mock): ${deviceId}`);
  }

  function onDisable2FA() {
    // TODO: server action -> disable
    setTwoFAEnabled(false);
  }

  function onEnable2FA() {
    // Premium + admin gate
    if (!isPremium) return;
    if (!isAdmin) return;

    // TODO: enroll flow (QR + doğrulama kodu)
    setTwoFAEnabled(true);
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="text-xl sm:text-2xl font-semibold text-foreground">
            Güvenlik
          </div>
          <div className="text-sm text-foreground/60">
            Hesap güvenliği, aktif oturumlar ve cihaz yetkilendirmelerini yönetin.
          </div>
        </div>

        <button
          onClick={onRefresh}
          className="
            inline-flex items-center gap-2
            h-10 px-4 rounded-xl
            border border-border
            bg-background/50 hover:bg-accent
            text-sm font-medium
            transition
          "
        >
          <RefreshCw className={cn("h-4 w-4", loadingRefresh && "animate-spin")} />
          Yenile
        </button>
      </div>

      {/* 2FA */}
      <SectionShell
        icon={KeyRound}
        title="İki Aşamalı Doğrulama (2FA)"
        description="Yetkisiz erişim riskini azaltmak için 2FA önerilir."
        right={
          <div className="flex items-center gap-2">
            {!isPremium && (
              <div
                className="
                  inline-flex items-center gap-1.5
                  px-3 py-1.5 rounded-xl
                  border border-border
                  bg-background/50
                  text-xs text-foreground/70
                "
              >
                <Crown className="h-4 w-4 text-amber-500" />
                Premium
              </div>
            )}

            {twoFAEnabled ? (
              <div className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                Aktif
              </div>
            ) : (
              <div className="text-xs font-medium text-foreground/60">Kapalı</div>
            )}
          </div>
        }
      >
        {!isPremium ? (
          <div className="rounded-2xl border border-border bg-background/30 p-4">
            <PremiumRequired role={role} />
          </div>
        ) : (
          <RoleGate role={role}>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="space-y-1">
                <div className="text-sm font-medium text-foreground">
                  {twoFAEnabled ? "2FA etkin" : "2FA devre dışı"}
                </div>
                <div className="text-sm text-foreground/60">
                  {twoFAEnabled
                    ? "Hesabınız ek doğrulama ile korunuyor."
                    : "Kritik işlemler için ekstra güvenlik katmanı ekleyin."}
                </div>
              </div>

              <div className="flex gap-2">
                {twoFAEnabled ? (
                  <button
                    onClick={onDisable2FA}
                    className="
                      h-10 px-4 rounded-xl
                      border border-border
                      bg-background hover:bg-accent
                      text-sm font-medium
                      transition
                    "
                  >
                    2FA’yı Kapat
                  </button>
                ) : (
                  <button
                    onClick={onEnable2FA}
                    className="
                      h-10 px-4 rounded-xl
                      bg-primary text-primary-foreground
                      hover:opacity-90
                      text-sm font-semibold
                      transition
                    "
                  >
                    2FA’yı Etkinleştir
                  </button>
                )}
              </div>
            </div>

            <div
              className="
                mt-4 rounded-xl
                border border-border
                bg-background/30
                p-4
                flex items-start gap-3
              "
            >
              <Shield className="h-5 w-5 text-primary mt-0.5" />
              <div className="text-sm text-foreground/70 leading-relaxed">
                2FA etkinleştirme akışı (QR + doğrulama kodu) bir sonraki adımda Supabase MFA
                veya kendi OTP servisiniz ile bağlanacak.
              </div>
            </div>
          </RoleGate>
        )}
      </SectionShell>

      {/* Active Sessions */}
      <SectionShell
        icon={Monitor}
        title="Aktif Oturumlar"
        description="Hesabınızla açık olan oturumları izleyin ve gerekirse kapatın."
        right={
          <button
            onClick={onRevokeAllOther}
            className="
              h-10 px-4 rounded-xl
              border border-border
              bg-background/50 hover:bg-accent
              text-sm font-medium
              transition
              inline-flex items-center gap-2
            "
          >
            <LogOut className="h-4 w-4" />
            Diğerlerini Kapat
          </button>
        }
      >
        <RoleGate role={role}>
          {sessions.length === 0 ? (
            <div className="rounded-xl border border-border bg-background/30 p-4 text-sm text-foreground/60">
              Aktif oturum bulunamadı.
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
                    flex flex-col sm:flex-row sm:items-center sm:justify-between
                    gap-3
                  "
                >
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-xl border border-border bg-background/50 flex items-center justify-center">
                      <Monitor className="h-5 w-5 text-foreground/70" />
                    </div>

                    <div className="space-y-0.5">
                      <div className="text-sm font-medium text-foreground">
                        {s.device}{" "}
                        {s.current && (
                          <span className="ml-2 text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                            Bu cihaz
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-foreground/60">
                        {s.city ? `${s.city} • ` : ""}
                        {s.ip ? `${s.ip} • ` : ""}
                        Son aktivite: {formatTimeTR(s.lastSeenAt)}
                      </div>
                    </div>
                  </div>

                  {!s.current && (
                    <button
                      onClick={() => onRevokeSession(s.id)}
                      className="
                        h-10 px-4 rounded-xl
                        border border-border
                        bg-background hover:bg-accent
                        text-sm font-medium
                        transition
                        inline-flex items-center gap-2
                        self-start sm:self-auto
                      "
                    >
                      <LogOut className="h-4 w-4" />
                      Oturumu Kapat
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="mt-4 flex items-start gap-2 text-xs text-foreground/60">
            <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5" />
            <div>
              Oturum yönetimi için ideal yaklaşım: auth session’larını (refresh token dahil) sunucu
              tarafında revoke etmek ve cihaz bilgisini agent log tablosunda saklamak.
            </div>
          </div>
        </RoleGate>
      </SectionShell>

      {/* Devices */}
      <SectionShell
        icon={Smartphone}
        title="Cihazlar"
        description="Güvenilen cihazları yönetin. Şüpheli cihazları kaldırın."
        right={
          <div
            className="
              inline-flex items-center gap-2
              h-10 px-4 rounded-xl
              border border-border
              bg-background/50
              text-sm text-foreground/70
            "
          >
            <Lock className="h-4 w-4" />
            {isAdmin ? "Yönetici Modu" : "Salt Okunur"}
          </div>
        }
      >
        <RoleGate role={role}>
          {devices.length === 0 ? (
            <div className="rounded-xl border border-border bg-background/30 p-4 text-sm text-foreground/60">
              Cihaz kaydı bulunamadı.
            </div>
          ) : (
            <div className="space-y-2">
              {devices.map((d) => (
                <div
                  key={d.id}
                  className="
                    rounded-xl border border-border
                    bg-background/30
                    p-4
                    flex flex-col sm:flex-row sm:items-center sm:justify-between
                    gap-3
                  "
                >
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-xl border border-border bg-background/50 flex items-center justify-center">
                      <Smartphone className="h-5 w-5 text-foreground/70" />
                    </div>

                    <div className="space-y-0.5">
                      <div className="text-sm font-medium text-foreground">
                        {d.name}
                        {d.trusted ? (
                          <span className="ml-2 text-[11px] px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                            Güvenilir
                          </span>
                        ) : (
                          <span className="ml-2 text-[11px] px-2 py-0.5 rounded-full bg-muted text-foreground/70 border border-border">
                            Standart
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-foreground/60">
                        {d.platform ? `${d.platform} • ` : ""}
                        Son görünme: {formatTimeTR(d.lastSeenAt)}
                      </div>
                    </div>
                  </div>

                  {isAdmin && (
                    <button
                      onClick={() => onToggleTrustedDevice(d.id)}
                      className="
                        h-10 px-4 rounded-xl
                        border border-border
                        bg-background hover:bg-accent
                        text-sm font-medium
                        transition
                        self-start sm:self-auto
                      "
                    >
                      Güven Durumunu Değiştir
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="mt-4 text-xs text-foreground/60">
            Cihaz yönetimi için öneri: <span className="font-medium">org_id + user_id</span> bazlı bir
            “device_sessions” tablosu (agent, platform, ip, last_seen, trusted) ile kayıt.
          </div>
        </RoleGate>
      </SectionShell>
    </div>
  );
}
