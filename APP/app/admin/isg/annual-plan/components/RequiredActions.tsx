export default function RequiredActions({ items }: { items: string[] }) {
  if (!items.length) return null;

  return (
    <div className="rounded-xl border bg-green-50 p-6">
      <h3 className="font-semibold mb-2">
        ✅ Denetçi Tarafından Önerilen Aksiyonlar
      </h3>
      <ul className="list-disc list-inside text-sm space-y-1">
        {items.map((i, idx) => (
          <li key={idx}>{i}</li>
        ))}
      </ul>
    </div>
  );
}
