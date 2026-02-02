"use client";

type Point = { date: string; count: number };

export default function TrendLine({
  data,
  height = 260,
}: {
  data: Point[];
  height?: number;
}) {
  return (
    <div
      style={{ height }}
      className="flex items-center justify-center text-xs text-slate-500"
    >
      {data.length === 0 ? "Veri yok." : "Trend grafiği burada gösterilecek."}
    </div>
  );
}
