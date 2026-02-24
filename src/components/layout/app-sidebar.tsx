import Link from "next/link";
import { usePathname } from "next/navigation";
import { Building2, Settings, Sparkles } from "lucide-react";

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
        <div className="rounded-lg border border-sidebar-border/60 bg-sidebar-accent/40 px-2.5 py-2">
          <div className="flex items-center gap-2">
            <span className="inline-flex size-7 items-center justify-center rounded-md bg-sidebar-primary/90 text-sidebar-primary-foreground">
              <Building2 className="size-4" aria-hidden="true" />
            </span>
            <div className={showText ? "min-w-0" : "sr-only"}>
              <p className="truncate text-xs font-semibold tracking-wide">PG Map Twin</p>
              <p className="truncate text-[11px] text-sidebar-foreground/70">Enterprise Workspace</p>
            </div>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Platform</SidebarGroupLabel>
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

        <SidebarGroup>
          <SidebarGroupLabel>Workspace</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  tooltip="추후 지원 예정"
                  onClick={(event) => {
                    event.preventDefault();
                    closeMobileNav();
                  }}
                >
                  <Sparkles className="size-4 opacity-90" aria-hidden="true" />
                  <span className={cn("truncate", showText ? "" : "sr-only")}>Starred</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  tooltip="설정"
                  onClick={(event) => {
                    event.preventDefault();
                    closeMobileNav();
                  }}
                >
                  <Settings className="size-4 opacity-90" aria-hidden="true" />
                  <span className={cn("truncate", showText ? "" : "sr-only")}>Settings</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <div className={cn("space-y-1 px-2", showText ? "" : "sr-only")}>
          <p className="text-xs font-medium text-sidebar-foreground">Lucian Cah</p>
          <p className="text-[11px] text-sidebar-foreground/70">
            최신 맵/엔티티 관리와 월드 빌드를 한 화면에서 운영합니다.
          </p>
        </div>
      </SidebarFooter>
    </nav>
  );
}
