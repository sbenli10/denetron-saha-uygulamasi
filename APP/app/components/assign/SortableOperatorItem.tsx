// APP/app/components/assign/SortableOperatorItem.tsx
"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { OperatorDTO } from "./types";
import { X } from "lucide-react";

interface Props {
  id: string;
  operator: OperatorDTO;
  onRemove: () => void;

  // PREMIUM: dragging state
  dragging?: boolean;
}

export default function SortableOperatorItem({
  id,
  operator,
  onRemove,
  dragging = false,
}: Props) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`
        flex items-center justify-between px-4 py-3 rounded-xl text-sm
        border backdrop-blur-xl cursor-grab active:cursor-grabbing
        transition-all
        ${
          dragging
            ? "border-[#7C6DFE] bg-[#7C6DFE]/20 shadow-[0_0_25px_rgba(124,109,254,0.4)] scale-[1.03]"
            : "border-white/10 bg-white/[0.05] hover:bg-white/[0.08]"
        }
      `}
    >
      <span className="text-white/90 font-medium">
        {operator.full_name}
      </span>

      <button
        onClick={onRemove}
        className="text-red-300 hover:text-red-400 transition"
      >
        <X size={16} />
      </button>
    </div>
  );
}
