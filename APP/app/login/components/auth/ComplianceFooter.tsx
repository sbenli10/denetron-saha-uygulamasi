import Link from "next/link";

export default function ComplianceFooter() {
  return (
    <footer className="mt-6 text-[11px] text-neutral-500 flex justify-between">
      <span>
        ISO 45001 uyumlu • KVKK kapsamında korunur • Veriler şifrelenir
      </span>
      <Link href="/register" className="hover:underline">
        Kayıt
      </Link>
    </footer>
  );
}
