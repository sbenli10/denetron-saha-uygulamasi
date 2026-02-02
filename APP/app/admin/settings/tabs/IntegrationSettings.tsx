"use client";

import {
  Plug,
  ShieldCheck,
  Key,
  Cloud,
  Save,
  Lock,
} from "lucide-react";
import { useState, useTransition } from "react";
import PremiumRequired from "../../_components/PremiumRequired";
import { updateIntegrations } from "../updateIntegrations";

export interface IntegrationSettingsProps {
  isPremium: boolean;
  role: string | null;
}

export default function IntegrationSettings({
  isPremium,
  role,
}: IntegrationSettingsProps) {
  if (!isPremium) {
    return <PremiumRequired role={role} />;
  }

  const isAdmin = role?.toLowerCase() === "admin";

  /* LOCAL STATE – API’ye bağlanmaya hazır */
  const [ibysEnabled, setIbysEnabled] = useState(true);
  const [ibysEnv, setIbysEnv] = useState<"test" | "prod">("test");
  const [ibysOrgCode, setIbysOrgCode] = useState("");

  const [isPending, startTransition] = useTransition();

  function handleSave() {
    if (!isAdmin) return;

    startTransition(async () => {
      await updateIntegrations({
        ibys_enabled: ibysEnabled,
        ibys_env: ibysEnv,
        ibys_org_code: ibysOrgCode,
      });
    });
  }

  return (
    <div className="space-y-10">

      {/* HEADER */}
      <div className="flex items-center gap-3">
        <Plug className="text-indigo-500" />
        <h2 className="text-xl font-semibold text-slate-900">
          Entegrasyonlar
        </h2>
      </div>

      {/* RESMİ SİSTEMLER */}
      <section className="rounded-2xl border border-slate-200 bg-white/80 backdrop-blur p-6 space-y-6">
        <div className="flex items-center gap-2">
          <ShieldCheck className="text-emerald-500" />
          <h3 className="font-medium text-slate-800">
            Resmî Sistemler
          </h3>
        </div>

        {/* IBYS */}
        <div className="rounded-xl border border-slate-200 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-slate-800">
                İBYS Entegrasyonu
              </h4>
              <p className="text-sm text-slate-500">
                İSG kayıtlarının İBYS sistemine otomatik aktarımı.
              </p>
            </div>

            <input
              type="checkbox"
              checked={ibysEnabled}
              onChange={(e) => setIbysEnabled(e.target.checked)}
              disabled={!isAdmin}
              className="h-5 w-5 accent-indigo-600"
            />
          </div>

          {ibysEnabled && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">

              <div className="space-y-1">
                <label className="text-xs text-slate-500">
                  Kurum Kodu
                </label>
                <input
                  value={ibysOrgCode}
                  onChange={(e) => setIbysOrgCode(e.target.value)}
                  placeholder="IBYS Kurum Kodu"
                  className="w-full h-10 rounded-lg border border-slate-300 px-3 text-sm"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-500">
                  Ortam
                </label>
                <select
                  value={ibysEnv}
                  onChange={(e) =>
                    setIbysEnv(e.target.value as any)
                  }
                  className="w-full h-10 rounded-lg border border-slate-300 px-3 text-sm"
                >
                  <option value="test">Test (UAT)</option>
                  <option value="prod">Canlı (Prod)</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* E-REÇETE */}
        <div className="rounded-xl border border-dashed border-slate-300 p-5 flex items-center justify-between opacity-60">
          <div>
            <h4 className="font-medium text-slate-700 flex items-center gap-2">
              e-Reçete Entegrasyonu
              <Lock size={14} />
            </h4>
            <p className="text-sm text-slate-500">
              İSG hekimi reçete entegrasyonu (yakında).
            </p>
          </div>

          <span className="text-xs text-slate-400">
            Yakında
          </span>
        </div>
      </section>

      {/* API & TEKNİK */}
      <section className="rounded-2xl border border-slate-200 bg-white/80 backdrop-blur p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Key className="text-indigo-500" />
          <h3 className="font-medium text-slate-800">
            API & Teknik Entegrasyonlar
          </h3>
        </div>

        <div className="rounded-xl border border-slate-200 p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Cloud className="text-slate-400" />
            <div>
              <p className="text-sm font-medium text-slate-700">
                API Anahtarı
              </p>
              <p className="text-xs text-slate-500">
                Harici sistemler için güvenli erişim.
              </p>
            </div>
          </div>

          <button className="px-4 py-2 text-xs rounded-lg border border-slate-300 hover:bg-slate-100">
            Görüntüle
          </button>
        </div>
      </section>

      {/* SAVE */}
      {isAdmin && (
        <div className="flex justify-end">
          <button
            onClick={handleSave}
            disabled={isPending}
            className="
              flex items-center gap-2
              px-6 py-3 rounded-xl
              bg-indigo-600 text-white
              text-sm font-medium
              hover:bg-indigo-700
              disabled:opacity-50
              transition
            "
          >
            <Save size={16} />
            Entegrasyonları Kaydet
          </button>
        </div>
      )}
    </div>
  );
}
