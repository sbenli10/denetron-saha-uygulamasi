//APP\app\components\dof\DofProgress.tsx
export default function DofProgress({
  completed,
  total,
}: {
  completed: number;
  total: number;
}) {
  const percent =
    total === 0 ? 0 : Math.round((completed / total) * 100);

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span>DÖF İlerleme</span>
        <span>%{percent}</span>
      </div>
      <div className="h-2 bg-gray-200 rounded-full">
        <div
          className="h-2 bg-emerald-600 rounded-full"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
