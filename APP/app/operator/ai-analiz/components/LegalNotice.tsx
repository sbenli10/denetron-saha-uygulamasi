export default function LegalNotice({
  accepted,
  onChange,
}: {
  accepted: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <section className="rounded-2xl border border-yellow-500/30 bg-yellow-500/10 p-4 space-y-3">
      <div className="rounded-xl bg-yellow-100 text-yellow-900 p-4 text-xs">
        <strong>Hukuki Bilgilendirme</strong><br />
        Bu yapay zeka analizi yalnızca destek ve farkındalık amaçlıdır.
        Nihai değerlendirme ve sorumluluk tamamen operatöre aittir.
        </div>
      <label className="flex items-start gap-2 text-sm text-yellow-200 cursor-pointer">
        <input
          type="checkbox"
          checked={accepted}
          onChange={e => onChange(e.target.checked)}
          className="
            mt-1 accent-yellow-500
            focus:ring-2 focus:ring-yellow-500/50
          "
        />
        <span>
          Okudum, anladım ve kabul ediyorum
        </span>
      </label>
    </section>
  );
}
