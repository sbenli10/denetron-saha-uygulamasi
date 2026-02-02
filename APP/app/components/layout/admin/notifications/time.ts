export function formatRelativeTime(date: string | number | Date) {
  const diff = Date.now() - new Date(date).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "şimdi";
  if (min < 60) return `${min} dk`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h} sa`;
  return `${Math.floor(h / 24)} gün`;
}
