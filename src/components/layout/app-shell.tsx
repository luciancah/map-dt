"use client";

import { useMemo } from "react";
import { usePathname } from "next/navigation";

import { AppSidebar } from "@/components/layout/app-sidebar";
import {
  Sidebar,
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { getPageTitle } from "@/lib/navigation";

type AppShellProps = {
  children: React.ReactNode;
};

export function AppShell({ children }: Readonly<AppShellProps>) {
  const pathname = usePathname();
  const safePathname = pathname ?? "/";
  const pageTitle = useMemo(() => getPageTitle(safePathname), [safePathname]);
  const isWorldEditorRoute = safePathname.startsWith("/world-editor");

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
                <h1 className="truncate text-sm font-semibold sm:text-base">{pageTitle}</h1>
              </div>
              <div className="ml-auto" />
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
