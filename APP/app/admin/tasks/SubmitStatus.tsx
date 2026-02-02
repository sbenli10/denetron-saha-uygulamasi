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
          ? "bg-green-700/20 text-green-300 border-green-500/40"
          : "bg-red-700/20 text-red-300 border-red-500/40"
      }`}
    >
      {result.message}
    </div>
  );
}
