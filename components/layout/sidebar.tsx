"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  Clapperboard,
  FlaskConical,
  Calendar,
  Bot,
  Settings,
  Sparkles,
  Zap,
  Atom,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { BRAND_NAME, SERIES_NAME } from "@/lib/brand/voice";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/papers", label: "Paper Library", icon: FileText },
  { href: "/episodes", label: "Episodes", icon: Clapperboard },
  { href: "/viral", label: "Viral Lab", icon: Zap },
  { href: "/labs", label: "Unicorn Labs", icon: Atom },
  { href: "/demos", label: "Demos", icon: FlaskConical },
  { href: "/calendar", label: "Calendar", icon: Calendar },
  { href: "/agents", label: "Agents", icon: Bot },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex w-64 flex-col bg-sidebar text-sidebar-foreground">
      <div className="border-b border-sidebar-muted p-6">
        <div className="flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-sidebar-accent" />
          <div>
            <p className="text-xs uppercase tracking-wider text-sidebar-foreground/60">Content Engine</p>
            <p className="font-display text-lg font-semibold">{BRAND_NAME}</p>
          </div>
        </div>
        <p className="mt-2 text-xs text-sidebar-foreground/70">{SERIES_NAME}</p>
      </div>
      <nav className="flex-1 space-y-1 p-4">
        {NAV.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
                active
                  ? "bg-sidebar-accent text-white"
                  : "text-sidebar-foreground/80 hover:bg-sidebar-muted hover:text-sidebar-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
