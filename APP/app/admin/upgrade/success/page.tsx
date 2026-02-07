import Link from "next/link";
import { CheckCircle2 } from "lucide-react";

export default function UpgradeSuccessPage() {
  return (
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-10">
        <div className="rounded-3xl border border-slate-200 bg-white/80 backdrop-blur p-8 shadow-[0_20px_60px_rgba(0,0,0,0.08)]">
          <div className="flex items-center gap-3 text-emerald-700">
            <CheckCircle2 />
            <h1 className="text-2xl font-semibold text-slate-900">
              Ödeme Akışı Başlatıldı (Mock)
            </h1>
          </div>

          <p className="mt-2 text-sm text-slate-600">
            Bu adım şu an mock. Bir sonraki adımda gerçek ödeme sağlayıcısını bağlayıp,
            ödeme tamamlandığında organizasyonu Premium’a çekeceğiz.
          </p>

          <div className="mt-6 flex gap-3">
            <Link
              href="/admin/settings?tab=billing"
              className="px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition text-sm"
            >
              Faturalama’ya dön
            </Link>

            <Link
              href="/admin/settings?tab=integrations"
              className="px-4 py-2 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 transition text-sm"
            >
              Entegrasyonları gör
            </Link>
          </div>
        </div>
      </div>
  );
}
