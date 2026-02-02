export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="h-8 w-64 rounded bg-slate-200 animate-pulse" />

      <div className="h-14 rounded-2xl bg-slate-100 animate-pulse" />

      <div className="space-y-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="h-12 rounded-xl bg-slate-100 animate-pulse"
          />
        ))}
      </div>
    </div>
  );
}
