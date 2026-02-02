"use client";

import ScheduleBuilder from "@/components/assign/ScheduleBuilder";
import type { BuilderState } from "@/components/assign/ScheduleBuilder";
import FormWrapper from "./FormWrapper";
import { saveSchedule } from "./actions";
import { assignTasks } from "./assign/actions";

interface AssignScheduleClientProps {
  templates: any[];
  operators: any[];
  isPremium: boolean;
  role: string | null;
}

export default function AssignScheduleClient({
  templates,
  operators,
  isPremium,
}: AssignScheduleClientProps) {

  const action = isPremium ? saveSchedule : assignTasks;

  return (
    <div className="relative max-w-7xl mx-auto py-14 space-y-14 px-6">
      <FormWrapper action={action}>
        <input type="hidden" name="template_id" />
        <input type="hidden" name="operator_ids" />
        <input type="hidden" name="frequency" />
        <input type="hidden" name="interval" />
        <input type="hidden" name="day_of_week" />
        <input type="hidden" name="day_of_month" />

        <ScheduleBuilder
          templates={templates}
          operators={operators}
          isPremium={isPremium}
          role={null}
          returnState={(state: BuilderState) => {
            const setVal = (name: string, value: string) => {
              const input = document.querySelector(
                `input[name="${name}"]`
              ) as HTMLInputElement;
              if (input) input.value = value;
            };

            setVal("template_id", state.templateId);
            setVal("operator_ids", JSON.stringify(state.operatorIds));
            setVal("frequency", state.frequency);
            setVal("interval", String(state.interval));
            setVal(
              "day_of_week",
              state.dayOfWeek != null ? String(state.dayOfWeek) : ""
            );
            setVal(
              "day_of_month",
              state.dayOfMonth != null ? String(state.dayOfMonth) : ""
            );
          }}
        />
      </FormWrapper>
    </div>
  );
}
