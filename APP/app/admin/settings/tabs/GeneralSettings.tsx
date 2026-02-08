"use client";

import {
  Building2,
  Globe,
  Clock,
  Save,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { useEffect, useMemo, useState, useTransition } from "react";
import LogoUploader from "../LogoUploader";
import { updateOrgSettings } from "../updateOrgSettings";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

interface GeneralSettingsProps {
  initial: {
    orgName: string;
    logoUrl: string | null;
    language: string;
    timezone: string;
  };
}

type SaveStatus = "idle" | "success" | "error";

export default function GeneralSettings({ initial }: GeneralSettingsProps) {
  /* =======================
     State
  ======================= */
  const [orgName, setOrgName] = useState(initial.orgName);
  const [language, setLanguage] = useState(initial.language);
  const [timezone, setTimezone] = useState(initial.timezone);
  const [logoUrl, setLogoUrl] = useState<string | null>(initial.logoUrl);
  const router = useRouter();
  const [status, setStatus] = useState<SaveStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [isPending, startTransition] = useTransition();

  /* =======================
     Dirty check (UX & perf)
  ======================= */
  const isDirty = useMemo(() => {
    return (
      orgName.trim() !== initial.orgName ||
      language !== initial.language ||
      timezone !== initial.timezone ||
      logoUrl !== initial.logoUrl
    );
  }, [orgName, language, timezone, logoUrl, initial]);

  /* =======================
     Reset feedback on change
  ======================= */
  useEffect(() => {
    if (status !== "idle") {
      setStatus("idle");
      setErrorMessage(null);
    }
  }, [orgName, language, timezone, logoUrl]);

  /* =======================
     Save handler
  ======================= */
  function handleSave() {
    if (!isDirty || orgName.trim().length < 2) return;

    setStatus("idle");
    setErrorMessage(null);

    startTransition(async () => {
      try {
        await updateOrgSettings({
          org_name: orgName,
          language,
          timezone,
          logo_url: logoUrl,
        });

        setStatus("success");
        router.refresh();

      } catch (err: any) {
        console.error("[GENERAL SETTINGS] save error:", err);
        setErrorMessage(
          err?.message ??
            "Ayarlar kaydedilirken beklenmeyen bir hata oluştu."
        );
        setStatus("error");
      }
    });
  }

  /* =======================
     Shared input classes
  ======================= */
  const inputClass =
    "w-full h-11 rounded-xl px-4 text-sm bg-white border border-slate-300 " +
    "focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500";

  return (
    <div className="space-y-10">
      {/* ================= HEADER ================= */}
      <header className="flex items-center gap-3">
        <Building2 className="text-indigo-500" />
        <h2 className="text-xl font-semibold text-slate-900">
          Genel Ayarlar
        </h2>
      </header>

      {/* ================= ORGANIZATION ================= */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 space-y-6">
        <h3 className="text-sm font-semibold text-slate-700">
          Firma Bilgileri
        </h3>

        {/* Org name */}
        <div className="space-y-2">
          <label
            htmlFor="orgName"
            className="text-xs font-medium text-slate-500"
          >
            Firma Adı
          </label>
          <input
            id="orgName"
            value={orgName}
            onChange={(e) => setOrgName(e.target.value)}
            className={inputClass}
            placeholder="Organizasyon adı"
          />
          {orgName.trim().length > 0 && orgName.trim().length < 2 && (
            <p className="text-xs text-red-500">
              Organizasyon adı en az 2 karakter olmalıdır.
            </p>
          )}
        </div>

        {/* Logo */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-slate-500">
            Firma Logosu
          </label>

          <div className="flex items-center gap-6">
            <LogoUploader value={logoUrl} onChange={setLogoUrl} />
            <p className="text-xs text-slate-500">
              PNG veya JPG<br />
              Maksimum 2MB
            </p>
          </div>
        </div>
      </section>

      {/* ================= REGIONAL ================= */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 space-y-6">
        <h3 className="text-sm font-semibold text-slate-700">
          Bölgesel Ayarlar
        </h3>

        {/* Language */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-slate-500 flex items-center gap-1">
            <Globe size={14} />
            Dil
          </label>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className={inputClass}
          >
            <option value="tr">Türkçe</option>
            <option value="en">English</option>
          </select>
        </div>

        {/* Timezone */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-slate-500 flex items-center gap-1">
            <Clock size={14} />
            Zaman Dilimi
          </label>
          <select
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
            className={inputClass}
          >
            <option value="Europe/Istanbul">
              (UTC+03:00) İstanbul
            </option>
            <option value="Europe/Berlin">
              (UTC+01:00) Berlin
            </option>
            <option value="UTC">UTC
            </option>
          </select>
        </div>
      </section>

      {/* ================= FEEDBACK ================= */}
      {status === "success" && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          <CheckCircle2 size={16} />
          Ayarlar başarıyla kaydedildi.
        </div>
      )}

      {status === "error" && errorMessage && (
        <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertTriangle size={16} />
          {errorMessage}
        </div>
      )}

      {/* ================= ACTION ================= */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={!isDirty || isPending || orgName.trim().length < 2}
          className={cn(
            "flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-medium transition",
            isDirty && !isPending
              ? "bg-indigo-600 text-white hover:bg-indigo-700"
              : "bg-slate-200 text-slate-500 cursor-not-allowed"
          )}
        >
          <Save size={16} />
          {isPending ? "Kaydediliyor…" : "Kaydet"}
        </button>
      </div>
    </div>
  );
}
