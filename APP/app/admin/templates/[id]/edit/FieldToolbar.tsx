"use client";

import { motion } from "framer-motion";
import { ToggleLeft, Type, FileText, List, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import type { Field } from "./TemplateEditor.types";

export default function FieldToolbar({ add }: { add: (t: Field["type"]) => void }) {
  const items = [
    { icon: ToggleLeft, type: "boolean", label: "Boolean Alan" },
    { icon: Type, type: "text", label: "Metin Alanı" },
    { icon: FileText, type: "textarea", label: "Not / Açıklama" },
    { icon: List, type: "select", label: "Seçim Alanı" },
    { icon: Minus, type: "divider", label: "Bölüm Ayırıcı" }
  ] as const;

  return (
    <TooltipProvider delayDuration={80}>
      <div className="flex gap-2">
        {items.map((item) => (
          <Tooltip key={item.type}>
            <TooltipTrigger asChild>
              <motion.div whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.92 }}>
                <Button
                  variant="ghost"
                  className="
                    h-9 w-9 p-0 rounded-xl
                    bg-white/5 border border-white/10
                    hover:bg-white/10
                    shadow-sm
                    flex items-center justify-center
                  "
                  onClick={() => add(item.type)}
                >
                  <item.icon className="w-4 h-4 text-white/70" />
                </Button>
              </motion.div>
            </TooltipTrigger>
            <TooltipContent side="top" className="bg-[#0d111c] text-white border-white/10">
              {item.label}
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
    </TooltipProvider>
  );
}
