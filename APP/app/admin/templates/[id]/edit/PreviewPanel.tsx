"use client";

import { motion } from "framer-motion";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { Field } from "./TemplateEditor.types";

export default function PreviewPanel({ fields, name }: { fields: Field[]; name: string }) {
  return (
    <motion.div layout initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="rounded-2xl bg-[#1a1f2e]/60 backdrop-blur-xl border border-white/10 shadow-xl">
        <CardHeader>
          <h2 className="text-lg font-semibold text-white/90">Önizleme</h2>
          <p className="text-sm text-white/50">
            Alanların veri yapısı ve form görünümünü gösterir.
          </p>
        </CardHeader>

        <CardContent className="space-y-5">
          <div className="p-3 rounded-xl bg-[#0f1320]/40 border border-white/10">
            <div className="text-xs text-white/50">Şablon Adı</div>
            <div className="text-white/90 font-medium">
              {name || "İsimsiz Şablon"}
            </div>
          </div>

          {fields.map((f, i) => (
            <motion.div
              key={f.__id ?? i}
              layout
              className="p-4 rounded-xl bg-[#0f1320]/40 border border-white/10 space-y-2"
            >
              {f.type === "divider" ? (
                <div className="text-white/80 font-semibold">{f.label}</div>
              ) : (
                <>
                  <div className="text-[11px] text-white/40 font-mono">{f.key}</div>
                  <div className="text-sm text-white/80">{f.label}</div>

                  {f.type === "boolean" && (
                    <div className="text-xs text-white/50">EVET / HAYIR</div>
                  )}

                  {f.type === "text" && (
                    <Input
                      disabled
                      className="bg-[#0f1320]/40 border-white/10 text-white/80 h-9"
                    />
                  )}

                  {f.type === "textarea" && (
                    <Textarea
                      disabled
                      className="bg-[#0f1320]/40 border-white/10 text-white/80"
                    />
                  )}

                  {f.type === "select" && (
                    <select
                      disabled
                      className="bg-[#0f1320]/40 border-white/10 text-white/80 h-9 rounded-lg"
                    >
                      {(f.options ?? []).map((opt) => (
                        <option key={opt}>{opt}</option>
                      ))}
                    </select>
                  )}
                </>
              )}
            </motion.div>
          ))}
        </CardContent>
      </Card>
    </motion.div>
  );
}
