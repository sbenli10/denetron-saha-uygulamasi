// app/components/dashboard/widgets/ChartWidget.tsx
"use client";

import { useMemo, useState } from "react";
import WidgetContainer from "./WidgetContainer";
import { LineChart, Line, ResponsiveContainer, Tooltip, CartesianGrid, XAxis, YAxis } from "recharts";
import { cn } from "@/lib/utils";

type RangeKey = "7d" | "30d" | "12m";
type Point = { label: string; value: number };

const ranges = [
  { label: "7G", value: "7d" },
  { label: "30G", value: "30d" },
  { label: "12A", value: "12m" },
] as const;

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-xl border border-white/10 bg-popover/90 px-3 py-2 backdrop-blur-md shadow-xl">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-sm font-semibold text-[var(--accent-color)]">{payload[0].value}</div>
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
  const [range, setRange] = useState<RangeKey>("7d");

  const currentData = useMemo(() => {
    if (range === "7d") return data7d;
    if (range === "30d") return data30d;
    return data12m;
  }, [range, data7d, data30d, data12m]);

  const hasData = currentData.length > 0;

  return (
    <WidgetContainer
      title={title}
      description={description}
      className="hover:shadow-xl"
      actions={
        <div className="inline-flex rounded-xl border border-white/10 bg-muted/30 p-1 backdrop-blur-xl">
          {ranges.map((r) => {
            const active = r.value === range;
            return (
              <button
                key={r.value}
                onClick={() => setRange(r.value)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs transition",
                  active
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-card/40"
                )}
              >
                {r.label}
              </button>
            );
          })}
        </div>
      }
    >
      <div className="mt-2 h-[260px] md:h-[320px]">
        {!hasData ? (
          <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-white/10 bg-muted/20">
            <span className="text-sm text-muted-foreground">Grafik verisi bulunamadı</span>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={currentData} margin={{ top: 10, right: 12, left: 0, bottom: 0 }}>
              <CartesianGrid
                vertical={false}
                stroke="rgba(255,255,255,0.08)"
                strokeDasharray="3 3"
              />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                tickMargin={8}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                width={38}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="value"
                stroke="var(--accent-color)"
                strokeWidth={2.5}
                dot={false}
                activeDot={{
                  r: 5,
                  stroke: "var(--accent-color)",
                  strokeWidth: 2,
                  fill: "#fff",
                }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </WidgetContainer>
  );
}
