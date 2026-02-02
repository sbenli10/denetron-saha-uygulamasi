// APP/app/admin/tasks/FormWrapper.tsx
"use client";

import { useFormState } from "react-dom";
import SubmitStatus from "./SubmitStatus";

interface FormWrapperProps {
  action: (prev: any, formData: FormData) => Promise<any>;
  children: React.ReactNode;
}

export default function FormWrapper({ action, children }: FormWrapperProps) {
  const [state, formAction] = useFormState(action, null);

  return (
    <form action={formAction} className="space-y-8">
     {children}
      {/* Status */}
      {state && <SubmitStatus result={state} />}
      
      {/* <div className="flex justify-end">
        <button
          type="submit"
          className="
            px-8 py-3 rounded-xl font-semibold
            bg-emerald-500 text-white
            hover:bg-emerald-600
            transition
          "
        >
          Kaydet
        </button>
      </div> */}
    </form>
  );
}
