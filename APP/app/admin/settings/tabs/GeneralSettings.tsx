// APP/app/admin/settings/tabs/GeneralSettings.tsx
"use client";

import {
  Building2,
  Globe,
  Clock,
  Save,
} from "lucide-react";
import { useEffect, useState, useTransition } from "react";
import LogoUploader from "../LogoUploader";
import { updateOrgSettings } from "../updateOrgSettings";

interface GeneralSettingsProps {
  initial: {
    orgName: string;
    logoUrl: string | null;
    language: string;
    timezone: string;
  };
}

export default function GeneralSettings({ initial }: GeneralSettingsProps) {
  const [orgName, setOrgName] = useState(initial.orgName);
  const [language, setLanguage] = useState(initial.language);
  const [timezone, setTimezone] = useState(initial.timezone);
  const [logoUrl, setLogoUrl] = useState<string | null>(initial.logoUrl);

  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    console.log("[GENERAL SETTINGS] initial:", initial);
  }, [initial]);

  function handleSave() {
    startTransition(async () => {
      console.log("[GENERAL SETTINGS] saving:", {
        orgName,
        language,
        timezone,
        logoUrl,
      });

      await updateOrgSettings({
        org_name: orgName,
        language,
        timezone,
        logo_url: logoUrl,
      });
    });
  }

  return (
    <div className="space-y-10">
      <div className="flex items-center gap-3">
        <Building2 className="text-indigo-500" />
        <h2 className="text-xl font-semibold text-slate-900">
          Genel Ayarlar
        </h2>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white/80 backdrop-blur p-6 space-y-6">
        <h3 className="font-semibold text-sm text-slate-700">
          Organizasyon Bilgileri
        </h3>

        <div className="space-y-2">
          <label className="text-xs text-slate-500">
            Organizasyon Adı
          </label>
          <input
            value={orgName}
            onChange={(e) => setOrgName(e.target.value)}
            className="w-full h-11 rounded-xl px-4 border border-slate-300 text-sm bg-white"
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs text-slate-500">
            Organizasyon Logosu
          </label>

          <div className="flex items-center gap-6">
            <LogoUploader
              value={logoUrl}
              onChange={setLogoUrl}
            />

            <div className="text-xs text-slate-500">
              PNG veya JPG<br />
              Maksimum 2MB
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white/80 backdrop-blur p-6 space-y-6">
        <h3 className="font-semibold text-sm text-slate-700">
          Bölgesel Ayarlar
        </h3>

        <div className="space-y-2">
          <label className="text-xs text-slate-500 flex items-center gap-1">
            <Globe size={14} />
            Dil
          </label>

          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="w-full h-11 rounded-xl px-4 border border-slate-300 text-sm bg-white"
          >
            <option value="tr">Türkçe</option>
            <option value="en">English</option>
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-xs text-slate-500 flex items-center gap-1">
            <Clock size={14} />
            Zaman Dilimi
          </label>

          <select
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
            className="w-full h-11 rounded-xl px-4 border border-slate-300 text-sm bg-white"
          >
            <option value="Europe/Istanbul">
              (UTC+03:00) İstanbul
            </option>
            <option value="Europe/Berlin">
              (UTC+01:00) Berlin
            </option>
            <option value="UTC">UTC</option>
          </select>
        </div>
      </section>

      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={isPending}
          className="flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
        >
          <Save size={16} />
          Kaydet
        </button>
      </div>
    </div>
  );
}
