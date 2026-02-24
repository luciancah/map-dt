"use client";

import * as React from "react";
import { Menu, ChevronLeft, ChevronRight, X } from "lucide-react";
import { Slot } from "@radix-ui/react-slot";

import { useMediaQuery } from "@/hooks/useMediaQuery";
import { cn } from "@/lib/utils";

type SidebarContextValue = {
  open: boolean;
  setOpen: (value: boolean) => void;
  openMobile: boolean;
  setOpenMobile: (value: boolean) => void;
  isMobile: boolean;
  toggle: () => void;
};

const SidebarContext = React.createContext<SidebarContextValue | null>(null);

function useSidebar() {
  const context = React.useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within SidebarProvider");
  }
  return context;
}

type SidebarProviderProps = {
  children: React.ReactNode;
  defaultOpen?: boolean;
};

function SidebarProvider({
  children,
  defaultOpen = true,
}: SidebarProviderProps) {
  const [open, setOpen] = React.useState(defaultOpen);
  const [openMobile, setOpenMobile] = React.useState(false);
  const isMobile = useMediaQuery("(max-width: 1024px)", false);

  React.useEffect(() => {
    if (!isMobile) {
      setOpenMobile(false);
    }
  }, [isMobile]);

  React.useEffect(() => {
    if (!isMobile || !openMobile) {
      return;
    }

    const onKeydown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpenMobile(false);
      }
    };

    window.addEventListener("keydown", onKeydown);
    return () => window.removeEventListener("keydown", onKeydown);
  }, [isMobile, openMobile]);

  const toggle = React.useCallback(() => {
    if (isMobile) {
      setOpenMobile((value) => !value);
      return;
    }
    setOpen((value) => !value);
  }, [isMobile]);

  return (
    <SidebarContext.Provider
      value={{
        open,
        setOpen,
        openMobile,
        setOpenMobile,
        isMobile,
        toggle,
      }}
    >
      {children}
    </SidebarContext.Provider>
  );
}

type SidebarProps = React.ComponentProps<"aside"> & {
  side?: "left" | "right";
  width?: string;
  collapsedWidth?: string;
};

function Sidebar({
  className,
  side = "left",
  width = "17rem",
  collapsedWidth = "4rem",
  children,
  ...props
}: SidebarProps) {
  const { isMobile, open, openMobile, setOpenMobile } = useSidebar();
  const isOpen = isMobile ? openMobile : open;
  const desktopWidth = isOpen ? width : collapsedWidth;
  const mobileTranslate = isOpen ? "translate-x-0" : side === "left" ? "-translate-x-full" : "translate-x-full";
  const desktopTranslate = "translate-x-0";

  return (
    <>
      {isMobile ? (
        <button
          type="button"
          aria-label="사이드바 닫기"
          onClick={() => setOpenMobile(false)}
          className={cn(
            "fixed inset-x-0 top-16 z-40 bg-black/50 transition-opacity duration-200",
            isOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0",
          )}
        />
      ) : null}

      <aside
        data-slot="sidebar"
        data-state={isOpen ? "expanded" : "collapsed"}
        data-side={side}
        className={cn(
          "group/sidebar z-50 flex flex-col border-r bg-sidebar text-sidebar-foreground shadow-sm",
          "h-[calc(100dvh-4rem)] lg:h-screen",
          isMobile ? "fixed inset-y-0 top-16" : "relative top-0",
          "top-16 lg:top-0",
          isMobile ? (side === "left" ? "left-0" : "right-0") : side === "left" ? "left-0" : "right-0",
          isMobile ? mobileTranslate : desktopTranslate,
          "transition-[width,transform] duration-200",
          "lg:w-auto",
          isMobile ? "w-72" : "w-0",
          className,
        )}
        style={{ width: isMobile ? "18.5rem" : desktopWidth }}
        aria-label="사이드바"
        {...props}
      >
        {children}
      </aside>
    </>
  );
}

type SidebarTriggerProps = React.ComponentProps<"button">;

function SidebarTrigger({
  className,
  "aria-label": ariaLabel,
  ...props
}: SidebarTriggerProps) {
  const { isMobile, open, openMobile, toggle } = useSidebar();
  const isOpen = isMobile ? openMobile : open;

  return (
    <button
      type="button"
      data-slot="sidebar-trigger"
      onClick={toggle}
      aria-label={
        ariaLabel ??
        (isMobile ? (isOpen ? "사이드바 닫기" : "사이드바 열기") : isOpen ? "사이드바 접기" : "사이드바 펼치기")
      }
      aria-expanded={isOpen}
      aria-controls="app-sidebar"
      data-state={isOpen ? "expanded" : "collapsed"}
      className={cn(
        "inline-flex h-9 w-9 items-center justify-center rounded-md border border-transparent",
        "transition-colors hover:bg-accent hover:text-accent-foreground",
        className,
      )}
      {...props}
    >
      {isMobile ? (
        isOpen ? <X className="size-4" aria-hidden="true" /> : <Menu className="size-4" aria-hidden="true" />
      ) : (
        isOpen ? <ChevronLeft className="size-4" aria-hidden="true" /> : <ChevronRight className="size-4" aria-hidden="true" />
      )}
    </button>
  );
}

type SidebarInsetProps = React.ComponentProps<"main">;
const SidebarInset = React.forwardRef<HTMLElement, SidebarInsetProps>(
  ({ className, ...props }, ref) => (
    <main
      ref={ref}
      data-slot="sidebar-inset"
      className={cn("relative flex min-h-svh flex-1 flex-col", className)}
      {...props}
    />
  ),
);
SidebarInset.displayName = "SidebarInset";

type SidebarHeaderProps = React.ComponentProps<"div">;
const SidebarHeader = React.forwardRef<HTMLDivElement, SidebarHeaderProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      data-slot="sidebar-header"
      className={cn("flex flex-col gap-2 border-b px-2 py-3", className)}
      {...props}
    />
  ),
);
SidebarHeader.displayName = "SidebarHeader";

type SidebarContentProps = React.ComponentProps<"div">;
const SidebarContent = React.forwardRef<HTMLDivElement, SidebarContentProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      data-slot="sidebar-content"
      className={cn("flex-1 overflow-auto px-2 py-2", className)}
      {...props}
    />
  ),
);
SidebarContent.displayName = "SidebarContent";

type SidebarFooterProps = React.ComponentProps<"div">;
const SidebarFooter = React.forwardRef<HTMLDivElement, SidebarFooterProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      data-slot="sidebar-footer"
      className={cn("mt-auto border-t px-2 py-3", className)}
      {...props}
    />
  ),
);
SidebarFooter.displayName = "SidebarFooter";

type SidebarGroupProps = React.ComponentProps<"div">;
const SidebarGroup = React.forwardRef<HTMLDivElement, SidebarGroupProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      data-slot="sidebar-group"
      className={cn("px-2 py-2", className)}
      {...props}
    />
  ),
);
SidebarGroup.displayName = "SidebarGroup";

type SidebarGroupLabelProps = React.ComponentProps<"h4">;
const SidebarGroupLabel = React.forwardRef<HTMLHeadingElement, SidebarGroupLabelProps>(
  ({ className, ...props }, ref) => (
    <h4
      ref={ref}
      data-slot="sidebar-group-label"
      className={cn("px-2 pb-2 text-[11px] font-semibold tracking-wide text-sidebar-foreground/80", className)}
      {...props}
    />
  ),
);
SidebarGroupLabel.displayName = "SidebarGroupLabel";

type SidebarGroupContentProps = React.ComponentProps<"div">;
const SidebarGroupContent = React.forwardRef<HTMLDivElement, SidebarGroupContentProps>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("space-y-1", className)} {...props} />
  ),
);
SidebarGroupContent.displayName = "SidebarGroupContent";

type SidebarMenuProps = React.ComponentProps<"ul">;
const SidebarMenu = React.forwardRef<HTMLUListElement, SidebarMenuProps>(
  ({ className, ...props }, ref) => (
    <ul
      ref={ref}
      data-slot="sidebar-menu"
      className={cn("space-y-1", className)}
      {...props}
    />
  ),
);
SidebarMenu.displayName = "SidebarMenu";

type SidebarMenuItemProps = React.ComponentProps<"li">;
const SidebarMenuItem = React.forwardRef<HTMLLIElement, SidebarMenuItemProps>(
  ({ className, ...props }, ref) => (
    <li ref={ref} data-slot="sidebar-menu-item" className={cn("relative", className)} {...props} />
  ),
);
SidebarMenuItem.displayName = "SidebarMenuItem";

type SidebarMenuButtonProps = React.ComponentProps<"a"> & {
  asChild?: boolean;
  isActive?: boolean;
  tooltip?: string;
};

function SidebarMenuButton({
  asChild,
  className,
  isActive,
  tooltip,
  ...props
}: SidebarMenuButtonProps) {
  const Comp = asChild ? Slot : "a";
  const { open, isMobile } = useSidebar();
  const isExpanded = isMobile || open;

  return (
    <Comp
      data-slot="sidebar-menu-button"
      data-active={isActive ? "true" : undefined}
      aria-current={isActive ? "page" : undefined}
      className={cn(
        "group/menu-button relative flex w-full items-center gap-2 rounded-md border border-transparent px-2.5 py-2 text-sm font-medium transition-colors",
        "outline-none ring-0",
        "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
        isActive
          ? "bg-sidebar-primary text-sidebar-primary-foreground"
          : "text-sidebar-foreground/80 hover:border-sidebar-accent",
        isExpanded ? "justify-start" : "justify-center px-2",
        className,
      )}
      title={tooltip}
      {...props}
    />
  );
}

export {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarTrigger,
  useSidebar,
};
