import { ShieldCheck } from "lucide-react";

export default function IdentityHeader() {
  return (
    <header className="flex items-start gap-3 mb-6">
      <div className="mt-0.5">
        <ShieldCheck size={22} className="text-blue-600" />
      </div>

      <div>
        <h1 className="text-lg font-semibold leading-tight">
          Denetron Secure Access
        </h1>
        <p className="text-xs text-neutral-500 mt-0.5">
          Yetkilendirilmiş kullanıcı erişimi
        </p>
      </div>
    </header>
  );
}
