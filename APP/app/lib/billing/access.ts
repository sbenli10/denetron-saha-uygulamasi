// APP/app/lib/billing/access.ts

export type SubscriptionPlan = "free" | "trial" | "premium";
export type SubscriptionStatus = "active" | "expired" | "cancelled";

export type SubscriptionLike = {
  plan: SubscriptionPlan;
  status?: SubscriptionStatus;
  expires_at?: string | null;
  trial_used?: boolean;
} | null;

/**
 * Trial ve Premium -> premium erişimi verir.
 * Free -> vermez.
 */
export function hasPremiumAccess(subscription: SubscriptionLike): boolean {
  if (!subscription) return false;
  return subscription.plan === "trial" || subscription.plan === "premium";
}

/**
 * Sadece Trial aktif mi?
 */
export function isTrial(subscription: SubscriptionLike): boolean {
  return !!subscription && subscription.plan === "trial";
}

/**
 * Trial gün sayısı (UI banner için)
 */
export function getTrialRemainingDays(expiresAt?: string | null): number | null {
  if (!expiresAt) return null;
  const now = new Date();
  const end = new Date(expiresAt);
  const diffMs = end.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
}
