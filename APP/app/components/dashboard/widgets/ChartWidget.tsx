"use client";

import { useMemo, useState } from "react";
import WidgetContainer from "./WidgetContainer";
import {
  LineChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts";
import { cn } from "@/lib/utils";

type RangeKey = "7d" | "30d" | "12m";
type Point = { label: string; value: number };

const ranges = [
  { label: "7 Gün", value: "7d" },
  { label: "30 Gün", value: "30d" },
  { label: "12 Ay", value: "12m" },
] as const;

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-xl border border-white/10 bg-popover/95 px-4 py-3 backdrop-blur-xl shadow-2xl">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 text-lg font-semibold text-[var(--accent-color)]">
        {payload[0].value}
      </div>
      <div className="mt-1 text-xs text-muted-foreground">
        Denetim adedi
      </div>
    </div>
  );
}

export default function ChartWidget({
  title,
  description,
  data7d,
  data30d,
  data12m,
}: {
  title: string;
  description?: string;
  data7d: Point[];
  data30d: Point[];
  data12m: Point[];
}) {
  const [range, setRange] = useState<RangeKey>("30d");

  const currentData = useMemo(() => {
    switch (range) {
      case "7d":
        return data7d;
      case "12m":
        return data12m;
      default:
        return data30d;
    }
  }, [range, data7d, data30d, data12m]);

  return (
    <WidgetContainer
      title={title}
      description={description}
      actions={
        <div className="inline-flex rounded-xl border border-white/10 bg-muted/30 p-1">
          {ranges.map((r) => (
            <button
              key={r.value}
              onClick={() => setRange(r.value)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-medium transition",
                r.value === range
                  ? "bg-card text-foreground shadow"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {r.label}
            </button>
          ))}
        </div>
      }
    >
      <div className="mt-4 h-[300px]">
        {currentData.length === 0 ? (
          <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-white/10 bg-muted/20">
            <span className="text-sm text-muted-foreground">
              Seçilen aralık için veri bulunamadı
            </span>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={currentData}>
              <CartesianGrid
                vertical={false}
                stroke="rgba(255,255,255,0.08)"
                strokeDasharray="4 4"
              />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                label={{
                  value: "Denetim Sayısı",
                  angle: -90,
                  position: "insideLeft",
                  fill: "var(--muted-foreground)",
                  fontSize: 11,
                }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="value"
                stroke="var(--accent-color)"
                strokeWidth={3}
                dot={false}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </WidgetContainer>
  );
}
