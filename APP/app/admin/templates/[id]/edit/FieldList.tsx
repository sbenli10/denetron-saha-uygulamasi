//APP\app\admin\templates\[id]\edit\FieldList.tsx
"use client";

import { motion, AnimatePresence } from "framer-motion";
import DragSortableWrapper from "./DragSortableWrapper";
import FieldCard from "./FieldCard";
import type { Field } from "./TemplateEditor.types";

interface FieldListProps {
  fields: Field[];
  updateField: (index: number, patch: Partial<Field>) => void;
  removeField: (index: number) => void;
  duplicateField: (index: number) => void;
  moveField: (index: number, dir: -1 | 1) => void;
  reorderFields: (fields: Field[]) => void;
}

export default function FieldList({
  fields,
  updateField,
  removeField,
  duplicateField,
  moveField,
  reorderFields
}: FieldListProps) {
  return (
    <div className="space-y-4">

      {/* EMPTY STATE — DARK & PREMIUM */}
      {fields.length === 0 && (
        <motion.div
          layout
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="
            p-10 rounded-2xl 
            bg-[#0f1320]/60 
            border border-white/10 
            text-center 
            text-neutral-400 
            shadow-xl 
            backdrop-blur-md
          "
        >
          Henüz bir alan eklenmedi.
          <div className="text-sm mt-1 text-neutral-500">
            Üstteki araç çubuğunu kullanarak yeni alanlar ekleyin.
          </div>
        </motion.div>
      )}

      {/* FIELD LIST */}
      <DragSortableWrapper
        items={fields.map((f, i) => ({ ...f, _id: f.__id ?? String(i) }))}
        onChange={(newOrder) => reorderFields(newOrder)}
      >
        <AnimatePresence initial={false}>
          {fields.map((field, index) => (
            <motion.div
              key={field.__id ?? index}
              layout
              exit={{ opacity: 0 }}
              transition={{ type: "spring", stiffness: 240, damping: 26 }}
            >
              <FieldCard
                id={field.__id ?? String(index)}
                field={field}
                index={index}
                updateField={updateField}
                duplicate={duplicateField}
                remove={removeField}
                move={moveField}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </DragSortableWrapper>
    </div>
  );
}
