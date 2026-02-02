"use client";

import { motion } from "framer-motion";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface FormPreviewProps {
  fields: any[];
}

export default function FormPreview({ fields }: FormPreviewProps) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 260, damping: 26 }}
      className="sticky top-10 space-y-5"
    >
      <Card
        className="
          rounded-2xl 
          bg-[#1a1f2e]/60 
          backdrop-blur-xl 
          shadow-[0_4px_20px_rgba(0,0,0,0.35)] 
          border border-white/10
        "
      >
        <CardHeader>
          <h2 className="text-lg font-semibold text-white/90">Önizleme</h2>
          <p className="text-sm text-white/50">
            Form alanlarının kullanıcıya nasıl görüneceğini gösterir.
          </p>
        </CardHeader>

        <CardContent className="space-y-6 pt-2">
          {fields.map((f, i) => (
            <motion.div
              key={i}
              layout
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-2"
            >
              {/* Divider */}
              {f.type === "divider" && (
                <h3 className="text-sm font-semibold text-white/80 mt-6">
                  {f.label}
                </h3>
              )}

              {/* Boolean */}
              {f.type === "boolean" && (
                <label className="flex items-center gap-2 text-sm text-white/80">
                  <input
                    type="checkbox"
                    className="
                      h-4 w-4 
                      rounded 
                      border border-white/20 
                      bg-[#0f1320]/60
                      accent-[#4f9cff]
                      cursor-not-allowed
                    "
                    disabled
                  />
                  {f.label}
                </label>
              )}

              {/* Text */}
              {f.type === "text" && (
                <Input
                  placeholder={f.placeholder || f.label}
                  disabled
                  className="
                    h-10
                    rounded-xl
                    bg-[#0f1320]/50
                    border border-white/10
                    text-white/80
                    placeholder:text-white/40
                    cursor-not-allowed
                  "
                />
              )}

              {/* Textarea */}
              {f.type === "textarea" && (
                <Textarea
                  disabled
                  placeholder={f.label}
                  rows={3}
                  className="
                    rounded-xl
                    bg-[#0f1320]/50 
                    border border-white/10 
                    text-white/80
                    placeholder:text-white/40
                    cursor-not-allowed
                  "
                />
              )}

              {/* Select */}
              {f.type === "select" && (
                <select
                  disabled
                  className="
                    h-10 w-full 
                    rounded-xl 
                    bg-[#0f1320]/50 
                    border border-white/10 
                    text-white/80 
                    px-3 text-sm
                    cursor-not-allowed
                  "
                >
                  {(f.options ?? []).map((o: any, idx: number) => (
                    <option key={idx} value={o.value} className="text-white/80 bg-[#0f1320]">
                      {o.label}
                    </option>
                  ))}
                </select>
              )}
            </motion.div>
          ))}
        </CardContent>
      </Card>
    </motion.div>
  );
}
