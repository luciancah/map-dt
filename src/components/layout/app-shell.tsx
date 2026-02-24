"use client";

import Link from "next/link";
import { Menu } from "lucide-react";
import { useMemo, useState } from "react";
import { usePathname } from "next/navigation";

import { AppSidebar } from "@/components/layout/app-sidebar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const routeLabelMap: Record<string, string> = {
  maps: "Maps",
  actors: "Actors",
  robots: "Robots",
  "world-editor": "World Builder",
};

const toTitleCase = (value: string) =>
  value ? `${value.slice(0, 1).toUpperCase()}${value.slice(1)}` : "";

function BreadcrumbTrail() {
  const pathname = usePathname();

  const items = useMemo(() => {
    const segments = pathname.split("/").filter(Boolean);
    if (segments.length === 0) return [{ label: "Home", href: "/" }];

    return segments.map((segment, index) => ({
      href: `/${segments.slice(0, index + 1).join("/")}`,
      label: routeLabelMap[segment] ?? toTitleCase(segment),
    }));
  }, [pathname]);

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

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const pageTitle = useMemo(() => {
    const segments = pathname.split("/").filter(Boolean);
    const lastSegment = segments[segments.length - 1] ?? "dashboard";
    return routeLabelMap[lastSegment] ?? toTitleCase(lastSegment);
  }, [pathname]);

  return (
    <div className="relative min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-14 w-full max-w-[1700px] items-center gap-3 px-3 sm:px-4 md:px-6">
          <Button
            variant="outline"
            size="icon-sm"
            className="md:hidden"
            onClick={() => setMobileMenuOpen(true)}
            aria-label="모바일 메뉴 열기"
          >
            <Menu className="h-4 w-4" />
          </Button>

          <div>
            <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              Workspace
            </p>
            <h1 className="text-sm font-semibold sm:text-base">{pageTitle}</h1>
          </div>
          <div className="ml-4 hidden md:block">
            <BreadcrumbTrail />
          </div>

          <div className="ml-auto">
            <Link
              href="/world-editor"
              className="rounded-md border px-2.5 py-1.5 text-xs font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              월드 빌더 바로가기
            </Link>
          </div>
        </div>
      </header>

      <div className="relative mx-auto flex w-full max-w-[1700px]">
        <aside className="hidden h-[calc(100vh-3.5rem)] w-64 shrink-0 border-r bg-sidebar/70 md:block">
          <AppSidebar />
        </aside>

        {mobileMenuOpen ? (
          <>
          <button
            type="button"
            aria-label="메뉴 닫기"
            className="fixed inset-0 z-40 bg-black/40 md:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
            <aside
              className="fixed left-0 z-50 h-[calc(100vh-3.5rem)] w-72 border-r bg-sidebar md:hidden"
              style={{ top: "3.5rem" }}
            >
              <AppSidebar onNavigate={() => setMobileMenuOpen(false)} />
            </aside>
          </>
        ) : null}

        <main
          className={cn(
            "min-w-0 flex-1 px-3 pb-6 pt-3 sm:px-4 md:px-6",
            mobileMenuOpen ? "overflow-hidden" : "overflow-auto",
          )}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
