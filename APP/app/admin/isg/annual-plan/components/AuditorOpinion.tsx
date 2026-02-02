//APP\app\admin\isg\annual-plan\components\AuditorOpinion.tsx
export default function AuditorOpinion({ text }: { text: string }) {
  return (
    <div className="rounded-xl border bg-gray-50 p-6">
      <h3 className="font-semibold mb-2">
        Denetçi Görüşü (Özet)
      </h3>
      <p className="text-sm leading-relaxed text-gray-700 whitespace-pre-line">
        {text}
      </p>
    </div>
  );
}
