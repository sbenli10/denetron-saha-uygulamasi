// APP/app/components/assign/OperatörPicker.tsx

"use client";

import OperatorDragDrop from "./OperatorDragDrop";
import { OperatorDTO } from "./types";

interface Props {
  value: string[];
  onChange: (list: string[]) => void;
}

export default function OperatorPicker({ value, onChange }: Props) {
  
  const operators: OperatorDTO[] = [];

  return (
    <div>
      <OperatorDragDrop
        value={value}
        onChange={onChange}
        onRemove={(id) => onChange(value.filter((x) => x !== id))}
        operators={operators}
      />
    </div>
  );
}
