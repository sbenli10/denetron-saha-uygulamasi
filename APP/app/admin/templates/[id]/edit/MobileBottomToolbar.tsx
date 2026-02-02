"use client";

import { motion } from "framer-motion";
import { Plus, Eye, Save } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MobileBottomToolbarProps {
  onAddField: () => void;
  onOpenPreview: () => void;
  onSave: () => void;
}

/**
 * Mobil alt toolbar – yalnızca mobil/tablet için görünür.
 */
export default function MobileBottomToolbar({
  onAddField,
  onOpenPreview,
  onSave
}: MobileBottomToolbarProps) {
  return (
    <motion.div
      initial={{ y: 30, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 260, damping: 22 }}
      className="
        fixed bottom-0 left-0 right-0
        flex items-center justify-around
        p-3
        bg-background/90
        backdrop-blur-xl
        border-t border-border/40
        shadow-xl
        z-50
        lg:hidden
      "
    >
      {/* Add Field */}
      <Button
        variant="outline"
        className="
          flex flex-col items-center justify-center 
          h-14 w-20 rounded-xl text-xs
          border-border/40 bg-muted/40
        "
        onClick={onAddField}
      >
        <Plus className="w-4 h-4 mb-1" />
        Ekle
      </Button>

      {/* Preview */}
      <Button
        variant="outline"
        className="
          flex flex-col items-center justify-center 
          h-14 w-20 rounded-xl text-xs
          border-border/40 bg-muted/40
        "
        onClick={onOpenPreview}
      >
        <Eye className="w-4 h-4 mb-1" />
        Önizle
      </Button>

      {/* Save */}
      <Button
        className="
          flex flex-col items-center justify-center 
          h-14 w-20 rounded-xl text-xs
          bg-primary text-primary-foreground
        "
        onClick={onSave}
      >
        <Save className="w-4 h-4 mb-1" />
        Kaydet
      </Button>
    </motion.div>
  );
}
