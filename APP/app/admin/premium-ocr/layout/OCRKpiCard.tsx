// APP\app\admin\premium-ocr\layout\OCRKpiCard.tsx
export default function OCRKpiCard({ label, value, change }: { label: string, value: string, change?: string }) {
  return (
    <div className="p-4 bg-white border rounded-xl shadow-sm flex flex-col">
      <span className="text-xs text-gray-500">{label}</span>
      <span className="text-2xl font-semibold mt-1">{value}</span>
      {change && <span className="text-xs text-green-600 mt-1">{change}</span>}
    </div>
  );
}
