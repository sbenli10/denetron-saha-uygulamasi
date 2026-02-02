function getStatusBadge(
  plannedMonth: number,
  executed: boolean
) {
  const currentMonth = new Date().getMonth() + 1;

  if (executed) {
    return {
      label: "✔ Yapıldı",
      className: "text-green-600",
    };
  }

  if (plannedMonth < currentMonth) {
    return {
      label: "⛔ Gecikti",
      className: "text-red-600 font-semibold",
    };
  }

  return {
    label: "⏳ Bekleniyor",
    className: "text-orange-600",
  };
}
