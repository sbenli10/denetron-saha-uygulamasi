"use client";

import { Timer } from "lucide-react";

function getRemainingDays(expiresAt: string) {
  const now = new Date();
  const end = new Date(expiresAt);
  const diffMs = end.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
}

export default function TrialBanner({
  expiresAt,
}: {
  expiresAt: string;
}) {
  const totalDays = 7;
  const remaining = getRemainingDays(expiresAt);

  const progress = Math.max(
    0,
    Math.min(100, (remaining / totalDays) * 100)
  );

  const isEndingSoon = remaining <= 3;

  return (
    <div
      className={`
        flex items-center justify-between gap-6
        rounded-2xl border p-5
        ${isEndingSoon
          ? "bg-red-50 border-red-200"
          : "bg-indigo-50 border-indigo-200"}
      `}
    >
      {/* LEFT */}
      <div className="flex items-start gap-3">
        <Timer
          className={`mt-1 ${
            isEndingSoon ? "text-red-600" : "text-indigo-600"
          }`}
        />

        <div className="space-y-2">
          <p className="text-sm font-semibold">
            Deneme planı aktif
          </p>

          <p className="text-sm text-muted-foreground">
            Premium özellikler{" "}
            <span className="font-medium">
              {remaining} gün
            </span>{" "}
            daha açık.
          </p>

          {/* Progress */}
          <div className="w-64 h-2 bg-white rounded-full overflow-hidden">
            <div
              className={`h-full transition-all ${
                isEndingSoon
                  ? "bg-red-500"
                  : "bg-indigo-600"
              }`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* RIGHT CTA */}
      <button
        className={`
          rounded-xl px-4 py-2 text-sm font-medium text-white
          ${isEndingSoon
            ? "bg-red-600 hover:bg-red-700"
            : "bg-indigo-600 hover:bg-indigo-700"}
        `}
      >
        Premium’a Geç
      </button>
    </div>
  );
}
