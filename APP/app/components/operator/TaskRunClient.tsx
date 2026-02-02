//APP\app\components\operator\TaskRunClient.tsx
"use client";

import { useState, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import InspectionFlow, {
  AnswerRecord,
  InspectionQuestion,
} from "@/components/operator/InspectionFlow";

type OperatorUser = {
  id: string;
  name?: string | null;
  email?: string | null;
};

type OperatorOrg = {
  id: string;
  name: string;
};

type TaskRunClientProps = {
  taskId: string;
  user: OperatorUser;
  org: OperatorOrg;
  questions: InspectionQuestion[];
};

export default function TaskRunClient({
  taskId,
  user,
  org,
  questions,
}: TaskRunClientProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // 🔒 ÇİFT SUBMIT KİLİDİ
  const submitLock = useRef(false);

  // referans stabilitesi
  const memoQuestions = useMemo(() => questions, [questions]);

    async function handleComplete(answers: AnswerRecord[]) {
      if (submitLock.current) {
        console.log("⛔ duplicate submit prevented");
        return;
      }

      submitLock.current = true;
      setLoading(true);

      console.log("📤 SUBMIT answers:", answers);

      try {
        const res = await fetch(
          `/api/operator/assigned-tasks/${taskId}/complete`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ answers }),
          }
        );

        // 🔁 Görev zaten tamamlanmışsa → sessizce çık
        if (res.status === 409) {
          router.replace("/operator/tasks");
          return;
        }

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          console.error("❌ submit failed:", err);
          alert("Kaydedilirken hata oluştu.");
          submitLock.current = false;
          setLoading(false);
          return;
        }

        // ✅ başarılı
        router.replace("/operator/tasks");
      } catch (err) {
        console.error("❌ network error:", err);
        alert("Bağlantı hatası oluştu.");
        submitLock.current = false;
        setLoading(false);
      }
    }

    return (
      <div className="p-3">
      <InspectionFlow
          questions={memoQuestions}
          onComplete={handleComplete}
          orgId={org.id}
          taskId={taskId}
        />
        {loading && (
          <div className="mt-3 text-center text-sm text-neutral-400">
            Kaydediliyor…
          </div>
        )} 
      </div>
    );
  }
