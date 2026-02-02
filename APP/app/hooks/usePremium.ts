"use client";

import { useAppContext } from "@/components/providers/AppProvider";

export function usePremium() {
  const ctx = useAppContext();

  if (!ctx)
    return {
      isPremium: false,
      canWritePremium: false,
      isLoading: true,
    };

  const { member, organization, loading } = ctx;

  const isPremium = organization?.is_premium === true;
  const isAdmin = member?.role === "admin";

  return {
    isPremium,
    canWritePremium: isPremium && isAdmin,
    isLoading: loading,
  };
}
