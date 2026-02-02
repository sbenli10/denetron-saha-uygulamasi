"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Plus, Save, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipProvider,
  TooltipTrigger,
  TooltipContent
} from "@/components/ui/tooltip";

/**
 * Desktop Floating Action Menu
 * - Mobile: gizli (MobileBottomToolbar devralıyor)
 * - Desktop: premium floating bar
 */
interface FloatingActionsProps {
  onOpenAddSheet: () => void;
  onSave: () => void;
  onOpenVersions: () => void;
}

export default function FloatingActions({
  onOpenAddSheet,
  onSave,
  onOpenVersions
}: FloatingActionsProps) {
  return (
    <TooltipProvider delayDuration={50}>
      <AnimatePresence>
        <motion.div
          layout
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 14 }}
          transition={{ type: "spring", stiffness: 240, damping: 26 }}
          className="
            hidden md:flex
            fixed bottom-8 right-8 
            flex-col gap-3 z-50
          "
        >
          {/* ADD FIELD */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                onClick={onOpenAddSheet}
                className="
                  h-12 w-12 rounded-2xl shadow-lg 
                  bg-primary text-primary-foreground
                  hover:bg-primary/90
                  transition
                "
              >
                <Plus className="w-5 h-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">Yeni Alan Ekle</TooltipContent>
          </Tooltip>

          {/* SAVE */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                onClick={onSave}
                className="
                  h-12 w-12 rounded-2xl shadow-lg 
                  bg-emerald-600 hover:bg-emerald-700
                  text-white transition
                "
              >
                <Save className="w-5 h-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">Kaydet</TooltipContent>
          </Tooltip>

          {/* VERSIONS */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                onClick={onOpenVersions}
                className="
                  h-12 w-12 rounded-2xl shadow-lg 
                  bg-neutral-700 hover:bg-neutral-600
                  text-white transition
                "
              >
                <Layers className="w-5 h-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">Versiyonlar</TooltipContent>
          </Tooltip>
        </motion.div>
      </AnimatePresence>
    </TooltipProvider>
  );
}
