"use client";

import Sidebar from "./Sidebar";

export default function SidebarWrapper({
  expanded,
  closeMobile,
}: {
  expanded: boolean;
  closeMobile: () => void;
}) {
  return (
    <div className="h-full w-full">
      <Sidebar expanded={expanded} closeMobile={closeMobile} />
    </div>
  );
}
