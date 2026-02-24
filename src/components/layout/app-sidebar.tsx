import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { NAV_ITEMS } from "@/lib/navigation";
import { cn } from "@/lib/utils";

type AppSidebarProps = {
  className?: string;
};

function getIsActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AppSidebar({ className }: AppSidebarProps) {
  const pathname = usePathname();
  const { isMobile, open, setOpenMobile } = useSidebar();
  const showText = isMobile || open;

  const closeMobileNav = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  return (
    <nav aria-label="Primary" className="flex h-full w-full flex-col" data-slot="sidebar-nav">
      <SidebarHeader className={className}>
        <div className="px-1">
          <p className="rounded-md border border-sidebar-border/40 bg-sidebar/70 px-2 py-2 text-xs font-semibold tracking-wide">
            PG Map Twin
          </p>
          <p className={`mt-2 text-xs text-sidebar-foreground/70 ${showText ? "" : "sr-only"}`}>Map Editor</p>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {NAV_ITEMS.map((item) => {
                const isActive = getIsActive(pathname, item.href);
                const Icon = item.icon;
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton asChild isActive={isActive} onClick={closeMobileNav} tooltip={item.description} href={item.href}>
                      <Link href={item.href}>
                        <Icon className="size-4 opacity-90" aria-hidden="true" />
                        <span className={cn("truncate", showText ? "" : "sr-only")}>
                          {item.label}
                        </span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <p className="px-2 text-xs text-sidebar-foreground/70">
          최신 맵/엔티티 관리와 월드 빌드 작업을 한 번에.
        </p>
      </SidebarFooter>
    </nav>
  );
}
