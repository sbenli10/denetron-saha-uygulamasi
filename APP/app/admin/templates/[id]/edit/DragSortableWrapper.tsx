"use client";

import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  DragEndEvent,
  useSensor,
  useSensors
} from "@dnd-kit/core";

import {
  SortableContext,
  arrayMove,
  verticalListSortingStrategy
} from "@dnd-kit/sortable";

import { AnimatePresence, motion } from "framer-motion";

/**
 * Ultra-Smooth Sortable Wrapper
 * - Notion-level animation
 * - Mobile & Desktop optimized
 * - Theme-friendly transitions
 */
export default function DragSortableWrapper({
  items,
  onChange,
  children
}: {
  items: any[];
  onChange: (items: any[]) => void;
  children: React.ReactNode;
}) {
  /* ------------------------------------------------------------
     SENSORS (Better Mobile + Desktop Support)
  ------------------------------------------------------------ */
  const sensors = useSensors(
    // Mouse & Desktop
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 4 // daha hızlı tepki
      }
    }),

    // Touch Devices (Mobile / Tablet)
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 90,
        tolerance: 4
      }
    })
  );

  /* ------------------------------------------------------------
     ON DRAG END — Reorder array
  ------------------------------------------------------------ */
  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    const oldIndex = items.findIndex((x) => x._id === active.id);
    const newIndex = items.findIndex((x) => x._id === over.id);

    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = arrayMove(items, oldIndex, newIndex);
    onChange(reordered);
  }

  /* ------------------------------------------------------------
     RENDER
  ------------------------------------------------------------ */
  return (
    <AnimatePresence mode="popLayout">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={items.map((x) => x._id)}
          strategy={verticalListSortingStrategy}
        >
          <motion.div
            layout
            transition={{
              type: "spring",
              stiffness: 220,
              damping: 28,
              mass: 0.4
            }}
            className="
              w-full
              space-y-4
              transition-colors
            "
          >
            {children}
          </motion.div>
        </SortableContext>
      </DndContext>
    </AnimatePresence>
  );
}
