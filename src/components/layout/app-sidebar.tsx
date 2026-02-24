import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bot, Boxes, Folder, Map } from "lucide-react";

import { cn } from "@/lib/utils";

const navItems = [
  { href: "/maps", label: "Maps", icon: Map },
  { href: "/actors", label: "Actors", icon: Bot },
  { href: "/robots", label: "Robots", icon: Folder },
  { href: "/world-editor", label: "World Builder", icon: Boxes },
] as const;

type AppSidebarProps = {
  onNavigate?: () => void;
  className?: string;
};

const getLabel = (item: { href: string }) => {
  if (item.href === "/maps") return "지도";
  if (item.href === "/actors") return "Actor";
  if (item.href === "/robots") return "Robot";
  return "월드 빌더";
};

export function AppSidebar({ onNavigate, className }: AppSidebarProps) {
  const pathname = usePathname();

  return (
    <aside className={cn("flex w-full flex-col bg-sidebar text-sidebar-foreground", className)}>
      <div className="px-3 pt-3">
        <p className="px-2 pb-2 text-xs font-semibold tracking-wide text-muted-foreground">
          Navigation
        </p>
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href ||
              (pathname.startsWith(item.href) && item.href !== "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                className={cn(
                  "group flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-sidebar-primary text-sidebar-primary-foreground"
                    : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                )}
                aria-current={isActive ? "page" : undefined}
              >
                <Icon className="h-4 w-4 opacity-85" aria-hidden="true" />
                <span className="truncate">{item.label}</span>
                <span className="ml-auto hidden text-xs text-muted-foreground sm:inline group-hover:text-current">
                  {getLabel(item)}
                </span>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="mt-auto px-3 pb-3 pt-4">
        <div className="rounded-md border p-2 text-[11px] text-muted-foreground">
          <p className="font-medium text-sidebar-foreground">PG Map Twin</p>
          <p>모던 SaaS형 지도 편집 인터페이스</p>
        </div>
      </div>
    </aside>
  );
}
