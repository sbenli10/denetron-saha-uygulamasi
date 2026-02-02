// APP/app/admin/users/CancelInviteButton.tsx
"use client";

import { useRouter } from "next/navigation";

export default function CancelInviteButton({ inviteId }: { inviteId: string }) {
  const router = useRouter();

  async function cancel() {
    console.log("🟨 [CancelInviteButton] Clicked", inviteId);

    const res = await fetch("/api/invites/cancel", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ inviteId }),
    });

    console.log(
      "🟨 [CancelInviteButton] response",
      res.status,
      await res.clone().json()
    );

    console.log("🔄 [CancelInviteButton] router.refresh()");
    router.refresh();
  }

  return (
    <button onClick={cancel} className="text-red-600 hover:underline">
      İptal Et
    </button>
  );
}
