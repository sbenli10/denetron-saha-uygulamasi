//APP\app\components\layout\Sidebar.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ClipboardList,
  PlusCircle,
  Settings,
  ShieldAlert,
} from "lucide-react";

export default function Sidebar({ open }: { open: boolean }) {
  const pathname = usePathname();

  const menu = [
    {
      label: "Dashboard",
      href: "/dashboard",
      icon: <LayoutDashboard className="w-5 h-5" />,
      roles: ["admin", "manager"],
    },
    {
      label: "Denetimler",
      href: "/dashboard/submissions",
      icon: <ClipboardList className="w-5 h-5" />,
      roles: ["admin", "manager", "operator"],
    },
    {
      label: "Yeni Denetim",
      href: "/operator/new",
      icon: <PlusCircle className="w-5 h-5" />,
      roles: ["operator"],
    },
    {
      label: "Ayarlar",
      href: "/dashboard/settings",
      icon: <Settings className="w-5 h-5" />,
      roles: ["admin"],
    },
  ];

  return (
    <aside
      className={`${
        open ? "w-64" : "w-20"
      } bg-white border-r transition-all duration-300 shadow-sm`}
    >
      <div className="p-4 flex items-center space-x-3">
        <ShieldAlert className="w-8 h-8 text-blue-600" />
        {open && <span className="text-xl font-bold">DENETRON</span>}
      </div>

      <nav className="mt-6">
        {menu.map((item) => {
          const active = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center space-x-3 px-4 py-3 text-sm font-medium transition
                ${active ? "bg-blue-50 text-blue-700" : "text-gray-600 hover:bg-gray-100"}
              `}
            >
              <span>{item.icon}</span>
              {open && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
