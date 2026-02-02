"use client";

import { ActionPlanItem } from "./types";

export function ActionCard({
  action,
  onApprove,
}: {
  action: ActionPlanItem;
  onApprove: (id: string) => void;
}) {
  return (
    <div className="rounded-2xl border bg-white p-6 shadow-sm space-y-5">

      {/* FINDING */}
      <div>
        <p className="text-xs font-semibold text-red-600">
          KRİTİK BULGU
        </p>
        <p className="font-medium text-gray-900">
          {action.finding}
        </p>
      </div>

      {/* ACTION */}
      <div>
        <p className="text-xs font-semibold text-blue-600">
          SİSTEM AKSİYONU
        </p>
        <p className="text-gray-800">
          {action.action}
        </p>
      </div>

      {/* META */}
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-gray-500">Kapsam</p>
          <p className="font-medium">
            {action.targetDocuments.join(", ")}
          </p>
        </div>

        <div>
          <p className="text-gray-500">Plan Bölümü</p>
          <p className="font-medium">
            {action.planSection}
          </p>
        </div>

        <div>
          <p className="text-gray-500">Sorumlu</p>
          <p className="font-medium">
            {action.responsible}
          </p>
        </div>

        <div>
          <p className="text-gray-500">Tamamlanma Tarihi</p>
          <p className="font-medium">
            {action.dueDate}
          </p>
        </div>
      </div>

      {/* EVIDENCE */}
      <div className="text-sm text-gray-600">
        <b>Denetim Kanıtı:</b> {action.evidence}
      </div>

      {/* CTA */}
      {action.status === "pending" ? (
        <button
          onClick={() => onApprove(action.id)}
          className="w-full rounded-xl bg-green-600 py-3 text-white font-semibold hover:bg-green-700"
        >
          Aksiyonu Onayla
        </button>
      ) : (
        <div className="rounded-lg bg-green-50 px-4 py-3 text-green-700 font-semibold text-sm">
          ✔ Onaylandı ({action.approvedAt})
        </div>
      )}
    </div>
  );
}
