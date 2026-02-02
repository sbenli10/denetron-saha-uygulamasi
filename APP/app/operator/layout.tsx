// APP/app/operator/layout.tsx
import OperatorShell from "@/components/operator/OperatorShell";
import { getOperatorContext } from "@/lib/operator/context";

export default async function OperatorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, member } = await getOperatorContext();

  const org = {
    id: member.org_id,
    name: "Organizasyon Adı", // sonra DB’den çekersin
  };

  return (
    <OperatorShell user={user} org={org}>
      {children}
    </OperatorShell>
  );
}
