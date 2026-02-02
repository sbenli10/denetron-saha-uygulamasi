"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { ActionCard } from "../components/ActionCard";
import { ActionPlanItem } from "../components/types";

export default function ActionPlanPage() {
  const [actions, setActions] = useState<ActionPlanItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/isg/analyze/annual-plan/actions")
      .then(r => r.json())
      .then(data => setActions(data))
      .finally(() => setLoading(false));
  }, []);

  function approve(id: string) {
    fetch(`/api/admin/isg/analyze/annual-plan/actions/${id}`, {
      method: "PATCH",
    }).then(() =>
      setActions(prev =>
        prev.map(a =>
          a.id === id
            ? {
                ...a,
                status: "approved",
                approvedAt: new Date().toISOString().split("T")[0],
              }
            : a
        )
      )
    );
  }

  if (loading) {
    return <div className="p-10 text-gray-500">Yükleniyor…</div>;
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-10 space-y-8">

      {/* HEADER */}
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold">
          Aksiyon Planı
        </h1>
        <p className="text-gray-600">
          Aşağıdaki aksiyonlar, yıllık İSG planınızın denetimde risk
          oluşturabilecek noktalarına karşı sistem tarafından
          otomatik olarak üretilmiştir.
        </p>
      </header>

      {actions.length === 0 && (
        <div className="rounded-xl border bg-gray-50 p-6 text-gray-600">
          Onay bekleyen aksiyon bulunmamaktadır.
        </div>
      )}

      <div className="space-y-6">
        {actions.map(action => (
          <ActionCard
            key={action.id}
            action={action}
            onApprove={approve}
          />
        ))}
      </div>
    </div>
  );
}
