// APP/app/operator/page.tsx
import OperatorHome from "@/components/operator/OperatorHome";

export default function OperatorRootPage() {
  const stats = {
    todayTasks: 3,
    completedInspections: 12,
    openForms: 1,
  };

  return <OperatorHome stats={stats} />;
}
