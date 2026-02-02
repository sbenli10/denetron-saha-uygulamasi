//APP\app\components\layout\admin\shell\AdminShell.tsx
"use client";

import ShellLayout from "./ShellLayout";

export default function AdminShell({
  user,
  org,
  children,
}: {
  user: any;
  org?: any;
  children: React.ReactNode;
}) {
  return (
    <ShellLayout>
      {children}
    </ShellLayout>
  );
}
