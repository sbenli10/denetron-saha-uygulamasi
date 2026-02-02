"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AutoTemplateLoader() {
  const router = useRouter();

  useEffect(() => {
    // Sadece redirect – yükleme wrapper içinde olacak
    router.replace("/admin/templates/new");
  }, [router]);

  return null;
}
