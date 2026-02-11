// APP/app/operator/ai-analiz/components/LegalNotice.tsx
"use client";

import { ShieldAlert, CheckCircle2 } from "lucide-react";
import { Badge, Card, CardContent, CardHeader, SectionTitle } from "@/app/components/ui/ui";

export default function LegalNotice({
  accepted,
  onChange,
}: {
  accepted: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <Card className="border-[color:color-mix(in_oklab,var(--op-warning)_35%,transparent)] bg-[color:color-mix(in_oklab,var(--op-warning)_10%,transparent)]">
      <CardHeader>
        <SectionTitle
          title="Hukuki Bilgilendirme"
          subtitle="AI yalnızca destek ve farkındalık amaçlıdır."
          right={
            accepted ? (
              <Badge tone="success" className="border-0">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Kabul edildi
              </Badge>
            ) : (
              <Badge tone="warning" className="border-0">
                <ShieldAlert className="h-3.5 w-3.5" />
                Onay gerekli
              </Badge>
            )
          }
        />
      </CardHeader>

      <CardContent className="pt-2">
        <div className="rounded-[16px] border border-[color:var(--op-border)] bg-black/15 p-4 text-[12px] text-[color:var(--op-text)]">
          <div className="font-semibold">Önemli</div>
          <div className="mt-1 text-[color:var(--op-muted)]">
            Bu yapay zeka analizi yalnızca destek ve farkındalık amaçlıdır. Nihai değerlendirme ve sorumluluk tamamen
            operatöre aittir.
          </div>
        </div>

        <label className="mt-4 flex items-start gap-3 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={accepted}
            onChange={(e) => onChange(e.target.checked)}
            className="mt-1 h-5 w-5 accent-[color:var(--op-warning)]"
          />
          <span className="text-[13px] font-semibold text-[color:var(--op-text)]">
            Okudum, anladım ve kabul ediyorum
          </span>
        </label>
      </CardContent>
    </Card>
  );
}
