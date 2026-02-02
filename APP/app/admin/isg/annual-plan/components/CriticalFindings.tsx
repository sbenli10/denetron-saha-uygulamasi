//APP\app\admin\isg\annual-plan\components\CriticalFindings.tsx
export default function CriticalFindings({ items }: { items: string[] }) {
  if (!items.length) return null;

  return (
    <div className="rounded-xl border border-red-200 bg-red-50 p-6">
      <h3 className="font-semibold text-red-700 mb-2">
        ❗ Kritik Denetim Bulguları
      </h3>
      <ul className="list-disc list-inside text-sm text-red-700 space-y-1">
        {items.map((i, idx) => (
          <li key={idx}>{i}</li>
        ))}
      </ul>
    </div>
  );
}
