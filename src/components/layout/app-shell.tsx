"use client";

import Link from "next/link";
import { useMemo } from "react";
import { usePathname } from "next/navigation";

import { AppSidebar } from "@/components/layout/app-sidebar";
import {
  Sidebar,
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { getBreadcrumbItems, getPageTitle } from "@/lib/navigation";

function BreadcrumbTrail() {
  const pathname = usePathname();
  const items = useMemo(() => getBreadcrumbItems(pathname), [pathname]);

  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        return (
          <span key={item.href} className="inline-flex items-center gap-2">
            {index > 0 ? <span className="text-muted-foreground/70">/</span> : null}
            {isLast ? (
              <span className="text-foreground">{item.label}</span>
            ) : (
              <Link href={item.href} className="transition-colors hover:text-foreground">
                {item.label}
              </Link>
            )}
          </span>
        );
      })}
    </div>
  );
}

type AppShellProps = {
  children: React.ReactNode;
};

export function AppShell({ children }: Readonly<AppShellProps>) {
  const pathname = usePathname();
  const pageTitle = useMemo(() => getPageTitle(pathname), [pathname]);
  const isWorldEditorRoute = pathname.startsWith("/world-editor");

  return (
    <SidebarProvider>
      <div className="relative min-h-screen bg-background text-foreground">
        <div className="flex min-h-screen w-full">
          <Sidebar id="app-sidebar">
            <AppSidebar />
          </Sidebar>

          <SidebarInset className="min-h-screen">
            <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/70">
              <div className="mx-auto flex h-16 w-full max-w-[1680px] items-center gap-3 px-4 md:px-6 lg:px-8">
                <SidebarTrigger />
                <div className="min-w-0">
                  <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                    Workspace
                  </p>
                  <h1 className="truncate text-sm font-semibold sm:text-base">{pageTitle}</h1>
                </div>
                <div className="ml-4 hidden xl:block">
                  <BreadcrumbTrail />
                </div>
                <div className="ml-auto">
                  <Link
                    href="/world-editor"
                    className="rounded-md border px-3 py-2 text-xs font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
                  >
                    월드 빌더 바로가기
                  </Link>
                </div>
              </div>
            </header>

            <main
              className={
                isWorldEditorRoute
                  ? "min-w-0 w-full flex-1 p-0"
                  : "mx-auto min-w-0 w-full max-w-[1680px] flex-1 px-4 pb-8 pt-4 md:px-6 lg:px-8"
              }
            >
              {children}
            </main>
          </SidebarInset>
        </div>
      </div>
    </SidebarProvider>
  );
}
