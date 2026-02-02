// APP/app/operator/history/page.tsx
import { getOperatorContext } from "@/lib/operator/context";

export const dynamic = "force-dynamic";

export default async function OperatorHistoryPage() {
  await getOperatorContext();

  return (
    <div className="flex h-full flex-col gap-3">
      <h1 className="text-lg font-semibold text-neutral-50">
        Gönderim Geçmişi
      </h1>
      <p className="text-xs text-neutral-400">
        Yakında: bu organizasyonda yaptığınız kontrollerin geçmişi burada
        listelenecek.
      </p>
      <div className="mt-4 rounded-2xl border border-dashed border-white/15 bg-black/40 p-4 text-sm text-neutral-400">
        submissions + ai_analysis + insights akışını bağladığımızda, burada
        yapay zeka destekli geçmiş kayıtlar ve risk özetleri görünecek.
      </div>
    </div>
  );
}
