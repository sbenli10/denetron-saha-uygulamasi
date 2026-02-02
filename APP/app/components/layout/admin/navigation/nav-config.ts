import {
  LayoutGrid,
  ClipboardList,
  FileText,
  Users,
  Settings,
  BarChart3,
  Folder,
  GraduationCap,   // 🎓 İSG
  CalendarCheck,   // 📅 Bu Ayın Eğitimleri
  FileSpreadsheet, // 📊 Plan / Rapor
} from "lucide-react";

export interface SidebarNavItem {
  label: string;
  href?: string;
  icon: any;
  roles: string[];
  premium?: boolean;
  children?: {
    label: string;
    href: string;
    premium?: boolean;
  }[];
}

export const NAV_ITEMS: SidebarNavItem[] = [
  {
    label: "Dashboard",
    href: "/admin",
    icon: LayoutGrid,
    roles: ["admin", "manager"],
  },

  /* ----------------------------------
     DENETİMLER
  ---------------------------------- */
  {
    label: "Denetimler",
    icon: ClipboardList,
    roles: ["admin", "manager"],
    children: [
      { label: "Tüm Denetimler", href: "/admin/submissions" },
      { label: "Denetim Oluşturma", href: "/admin/tasks" },
      { label: "Kullanıcı Tanımlı DÖF’ler", href: "/admin/dof/manual" },
      {
        label: "Otomatik Denetimler",
        href: "/admin/cron",
        premium: true,
      },
      {
        label: "Otomatik Görev Geçmişi",
        href: "/admin/cron-history",
        premium: true,
      },
    ],
  },

  /* ----------------------------------
     İSG – EĞİTİM PLANLAMA
  ---------------------------------- */
  {
    label: "İSG",
    icon: GraduationCap,
    roles: ["admin", "manager"],
    premium: true,
    children: [
      {
        label: "Eğitim Analizi",
        href: "/admin/isg/training",
      },
      {
        label: "📅 Bu Ayın Eğitimleri",
        href: "/admin/isg/training/todo",
      },
      {
        label: "📊 Eğitim Durum Raporu",
        href: "/admin/isg/training/report",
      },
    ],
  },

  /* ----------------------------------
     RAPORLAR
  ---------------------------------- */
  {
    label: "Raporlar",
    icon: FileText,
    roles: ["admin", "manager"],
    children: [
      { label: "Tüm Raporlar", href: "/admin/reports" },
      { label: "Şablonlar", href: "/admin/templates" },
      { label: "DÖF Raporları", href: "/admin/dof" },
    ],
  },

  /* ----------------------------------
     KÜTÜPHANE
  ---------------------------------- */
  {
    label: "Dosya Kütüphanesi",
    href: "/admin/library",
    icon: Folder,
    roles: ["admin", "manager"],
  },

  /* ----------------------------------
     KULLANICILAR
  ---------------------------------- */
  {
    label: "Kullanıcılar",
    icon: Users,
    roles: ["admin"],
    children: [
      { label: "Rol Düzenleme", href: "/admin/roles" },
      { label: "Kullanıcılar", href: "/admin/users" },
    ],
  },

  /* ----------------------------------
     PREMIUM MODÜLLER
  ---------------------------------- */
  {
    label: "İSG İş Asistanı",
    href: "/admin/premium/ocr/dashboard",
    icon: BarChart3,
    roles: ["admin", "manager"],
    premium: true,
  },

  /* ----------------------------------
     AYARLAR
  ---------------------------------- */
  {
    label: "Ayarlar",
    href: "/admin/settings",
    icon: Settings,
    roles: ["admin", "manager"],
  },
];
