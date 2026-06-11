"use client";

import { usePathname } from "next/navigation";
import { Sidebar } from "./sidebar";

/** Routes served to the public — rendered without the internal tool chrome. */
const PUBLIC_PREFIXES = ["/blog"];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isPublic = PUBLIC_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );

  if (isPublic) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
