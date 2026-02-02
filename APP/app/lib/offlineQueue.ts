export const OFFLINE_QUEUE_KEY = "offline-photo-queue";

export function getOfflineQueueCount(): number {
  try {
    return JSON.parse(localStorage.getItem(OFFLINE_QUEUE_KEY) || "[]").length;
  } catch {
    return 0;
  }
}

export function clearOfflineQueue() {
  localStorage.removeItem(OFFLINE_QUEUE_KEY);
}
