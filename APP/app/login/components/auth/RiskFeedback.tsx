import { AlertTriangle } from "lucide-react";

export default function RiskFeedback({ message }: { message: string | null }) {
  if (!message) return null;

  return (
    <div className="mb-4 flex gap-2 text-xs text-red-600 bg-red-500/10 border border-red-500/20 px-3 py-2 rounded-lg">
      <AlertTriangle size={14} className="mt-0.5" />
      {message}
    </div>
  );
}
