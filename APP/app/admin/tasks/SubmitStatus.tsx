//APP\app\admin\tasks\SubmitStatus.tsx
"use client";

interface SubmitResult {
  success: boolean;
  message: string;
}

export default function SubmitStatus({ result }: { result: SubmitResult | null }) {
  if (!result) return null;

  const isSuccess = result.success;

  return (
    <div
      className={`px-4 py-3 rounded-lg text-sm mt-4 border ${
        isSuccess
        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
        : "bg-red-50 text-red-700 border-red-200"
      }`}
    >
      {result.message}
    </div>

  );
}
