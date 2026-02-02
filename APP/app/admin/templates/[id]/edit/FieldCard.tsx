"use client";

import { motion } from "framer-motion";
import {
  ChevronUp,
  ChevronDown,
  Copy,
  Trash2,
  GripVertical,
  AlertTriangle
} from "lucide-react";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardContent } from "@/components/ui/card";

import type {
  Field,
  FBoolean,
  FText,
  FTextArea,
  FSelect
} from "./TemplateEditor.types";

/* ------------------------------------------------------------
   TYPE COLOR BADGES (Dark & Light Mode Compatible)
------------------------------------------------------------ */
function typeColor(type: Field["type"]) {
  switch (type) {
    case "boolean":
      return "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20";
    case "text":
      return "bg-sky-500/15 text-sky-400 border border-sky-500/20";
    case "textarea":
      return "bg-amber-500/15 text-amber-400 border border-amber-500/20";
    case "select":
      return "bg-violet-500/15 text-violet-400 border border-violet-500/20";
    case "divider":
      return "bg-neutral-500/15 text-neutral-400 border border-neutral-500/20";
    default:
      return "bg-neutral-500/15 text-neutral-400 border border-neutral-500/20";
  }
}

/* ------------------------------------------------------------
   MAIN COMPONENT
------------------------------------------------------------ */
export default function FieldCard({
  id,
  field,
  index,
  updateField,
  duplicate,
  remove,
  move
}: {
  id: string;
  field: Field;
  index: number;
  updateField: (i: number, patch: Partial<Field>) => void;
  duplicate: (i: number) => void;
  remove: (i: number) => void;
  move: (i: number, dir: -1 | 1) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1
  };

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ type: "spring", stiffness: 200, damping: 22 }}
      className="select-none"
    >
      <Card className="
        relative overflow-hidden rounded-2xl shadow-xl
        bg-card border border-border
        transition-all
      ">
        {/* HEADER */}
        <CardHeader
          className="
            flex flex-row items-center gap-3 px-5 py-4 
            bg-muted/40 border-b border-border
          "
        >
          {/* DRAG HANDLE */}
          <div
            {...attributes}
            {...listeners}
            className="
              cursor-grab active:cursor-grabbing 
              text-muted-foreground hover:text-foreground
              transition
            "
          >
            <GripVertical className="w-4 h-4" />
          </div>

          {/* TYPE BADGE */}
          <Badge
            className={`
              ${typeColor(field.type)}
              text-[10px] font-semibold px-2 py-0.5 rounded-full
            `}
          >
            {field.type.toUpperCase()}
          </Badge>

          {/* ACTION BUTTONS */}
          <div className="ml-auto flex items-center gap-1.5">
            <ActionBtn icon={<ChevronUp className="w-4 h-4" />} onClick={() => move(index, -1)} />
            <ActionBtn icon={<ChevronDown className="w-4 h-4" />} onClick={() => move(index, 1)} />
            <ActionBtn icon={<Copy className="w-4 h-4" />} onClick={() => duplicate(index)} />
            <ActionBtn
              danger
              icon={<Trash2 className="w-4 h-4" />}
              onClick={() => remove(index)}
            />
          </div>
        </CardHeader>

        {/* CONTENT */}
        <CardContent className="p-5 space-y-4">

          {/* --- DIVIDER FIELD --- */}
          {field.type === "divider" && (
            <Input
              value={field.label ?? ""}
              onChange={(e) => updateField(index, { label: e.target.value })}
              placeholder="Bölüm başlığı"
              className="editor-input"
            />
          )}

          {/* --- NON-DIVIDER FIELDS --- */}
          {field.type !== "divider" && (
            <div className="space-y-4">

              {/* LABEL + KEY */}
              <div className="grid md:grid-cols-2 gap-4">
                <FieldBlock label="Label">
                  <Input
                    value={field.label ?? ""}
                    onChange={(e) => updateField(index, { label: e.target.value })}
                  />
                </FieldBlock>

                <FieldBlock label="Key">
                  <Input
                    value={(field as any).key ?? ""}
                    onChange={(e) => updateField(index, { key: e.target.value })}
                  />
                </FieldBlock>
              </div>

              {/* BOOLEAN */}
              {field.type === "boolean" && (
                <div className="flex items-center gap-3">
                  <Switch
                    checked={(field as FBoolean).critical ?? false}
                    onCheckedChange={(v) => updateField(index, { critical: v })}
                  />
                  <AlertTriangle className="w-4 h-4 text-red-400" />
                  <span className="text-sm">Kritik Alan</span>
                </div>
              )}

              {/* TEXT FIELD */}
              {field.type === "text" && (
                <FieldBlock label="Placeholder">
                  <Input
                    value={(field as FText).placeholder ?? ""}
                    onChange={(e) =>
                      updateField(index, { placeholder: e.target.value })
                    }
                  />
                </FieldBlock>
              )}

              {/* TEXTAREA */}
              {field.type === "textarea" && (
                <FieldBlock label="Max Length">
                  <Input
                    type="number"
                    value={(field as FTextArea).maxLength ?? ""}
                    onChange={(e) =>
                      updateField(index, {
                        maxLength: Number(e.target.value) || undefined
                      })
                    }
                    className="w-32"
                  />
                </FieldBlock>
              )}

              {/* --- SELECT FIELD --- */}
              {field.type === "select" && (
                <div className="space-y-3">

                  <FieldBlock label="Varsayılan Değer">
                    <Input
                      value={(field as FSelect).default ?? ""}
                      onChange={(e) =>
                        updateField(index, { default: e.target.value })
                      }
                    />
                  </FieldBlock>

                  {/* OPTIONS LIST */}
                  <FieldBlock label="Seçenekler">
                    <div className="space-y-2">
                      {(field as FSelect).options?.map((opt, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <Input
                            value={opt}
                            onChange={(e) => {
                              const list = [...((field as FSelect).options ?? [])];
                              list[idx] = e.target.value;
                              updateField(index, { options: list });
                            }}
                            className="flex-1"
                          />
                          <button
                            className="text-red-400 hover:text-red-500 text-xs"
                            onClick={() => {
                              const list = [...((field as FSelect).options ?? [])];
                              list.splice(idx, 1);
                              updateField(index, { options: list });
                            }}
                          >
                            Sil
                          </button>
                        </div>
                      ))}

                      <button
                        className="
                          px-3 py-1 rounded-md text-xs
                          bg-muted/40 border border-border
                          hover:bg-muted
                        "
                        onClick={() => {
                          const list = (field as FSelect).options ?? [];
                          updateField(index, { options: [...list, ""] });
                        }}
                      >
                        + Seçenek Ekle
                      </button>
                    </div>
                  </FieldBlock>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

/* ------------------------------------------------------------
   SMALL SUBCOMPONENTS
------------------------------------------------------------ */

function ActionBtn({
  icon,
  onClick,
  danger
}: {
  icon: any;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        p-1 rounded-lg transition
        ${danger ? "hover:bg-red-500/20" : "hover:bg-muted"}
      `}
    >
      <div className={danger ? "text-red-400" : "text-muted-foreground"}>
        {icon}
      </div>
    </button>
  );
}

function FieldBlock({
  label,
  children
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col">
      <label className="text-xs text-muted-foreground mb-1">{label}</label>
      {children}
    </div>
  );
}
