import { Loader2 } from "lucide-react";
import { AuthPhase } from "./CredentialForm";

export default function SessionStateOverlay({ phase }: { phase: AuthPhase }) {
  if (phase !== "session") return null;

  return (
    <div className="absolute inset-0 z-20 bg-black/40 backdrop-blur rounded-2xl flex items-center justify-center">
      <div className="flex items-center gap-2 text-xs">
        <Loader2 size={14} className="animate-spin" />
        Oturum güvenliği doğrulanıyor
      </div>
    </div>
  );
}
