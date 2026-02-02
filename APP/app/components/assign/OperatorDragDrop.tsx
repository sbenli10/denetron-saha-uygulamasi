// APP/app/components/assign/OperatorDragDrop.tsx
"use client";

import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  DragStartEvent,
  DragEndEvent,
} from "@dnd-kit/core";

import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";

import SortableOperatorItem from "./SortableOperatorItem";
import { OperatorDTO } from "./types";
import { Users } from "lucide-react";
import { useState } from "react";

interface Props {
  value: string[];
  onChange: (ids: string[]) => void;
  onRemove: (id: string) => void;
  operators: OperatorDTO[];
}

export default function OperatorDragDrop({
  value,
  onChange,
  onRemove,
  operators,
}: Props) {
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 4 },
    })
  );

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as string);
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveId(null);

    if (!over || active.id === over.id) return;

    const oldIndex = value.indexOf(active.id as string);
    const newIndex = value.indexOf(over.id as string);

    onChange(arrayMove(value, oldIndex, newIndex));
  }

  return (
    <div
      className="
        p-5 rounded-2xl bg-[#0B0E13]/80 border border-white/10
        backdrop-blur-xl shadow-[0_12px_40px_rgba(0,0,0,0.45)]
      "
    >
      <div className="flex items-center gap-2 mb-4">
        <Users size={18} className="text-[#00C4B4]" />
        <h3 className="text-sm font-semibold text-white/90 tracking-wide">
          Seçili Operatörler
        </h3>
      </div>

      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        collisionDetection={closestCenter}
      >
        <SortableContext items={value} strategy={verticalListSortingStrategy}>
          <div className="space-y-3">
            {value.length === 0 ? (
              <div className="text-white/50 text-sm text-center py-4">
                Henüz operatör seçilmedi.
              </div>
            ) : (
              value.map((id: string) => {
                const op = operators.find((o) => o.id === id);
                if (!op) return null;

                return (
                  <SortableOperatorItem
                    key={id}
                    id={id}
                    operator={op}
                    dragging={activeId === id}
                    onRemove={() => onRemove(id)}
                  />
                );
              })
            )}
          </div>
        </SortableContext>

        <DragOverlay>
          {activeId ? (
            <div
              className="
                p-4 rounded-xl bg-[#7C6DFE]/20 border border-[#7C6DFE]/40
                shadow-[0_0_30px_rgba(124,109,254,0.6)] scale-[1.03]
                backdrop-blur-xl text-white/80 text-sm
              "
            >
              Sürükleniyor...
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
