"use client";

interface TaskSubmitPanelProps {
  disabled?: boolean;
  operatorCount?: number;
  isPremium: boolean;
  humanSchedule?: string;
}

export default function TaskSubmitPanel({
  disabled = false,
  operatorCount = 0,
  isPremium,
  humanSchedule,
}: TaskSubmitPanelProps) {
  return (
    <div className="rounded-2xl bg-white/80 border border-slate-200 p-8">
      <h3 className="text-xl font-semibold">Görevi Gönder</h3>

      <p className="text-sm text-slate-600 mt-2">
        {isPremium
          ? "Görevler belirlediğiniz zamanlamaya göre otomatik atanır."
          : "Görev kaydedildiği anda atanır ve tekrar etmez."}
      </p>

      <div className="flex gap-3 mt-4 text-sm">
        <span className="px-3 py-1 bg-slate-100 rounded-full">
          {operatorCount} operatör
        </span>

        <span
          className={`px-3 py-1 rounded-full ${
            isPremium
              ? "bg-indigo-100 text-indigo-700"
              : "bg-amber-100 text-amber-700"
          }`}
        >
          {isPremium ? "Otomatik" : "Tek seferlik"}
        </span>
      </div>

      {isPremium && humanSchedule && (
        <div className="mt-3 text-sm text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-lg px-3 py-2">
          Zamanlama: <strong>{humanSchedule}</strong>
        </div>
      )}

      <div className="flex justify-end mt-6">
        <button
          type="submit"
          disabled={disabled}
          className="px-10 py-3 rounded-xl bg-emerald-500 text-white font-semibold disabled:opacity-50"
        >
          {isPremium ? "Görev Planını Kaydet" : "Görevi Gönder"}
        </button>
      </div>
    </div>
  );
}
