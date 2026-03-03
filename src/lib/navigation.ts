import { Bot, Boxes, Folder, Map, Move, Radar, Sparkles } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  description: string;
};

export const NAV_ITEMS: readonly NavItem[] = [
  {
    href: "/maps",
    label: "Maps",
    icon: Map,
    description: "센서맵 등록 및 업로드",
  },
  {
    href: "/actors",
    label: "Actors",
    icon: Bot,
    description: "Actor 목록 관리",
  },
  {
    href: "/robots",
    label: "Robots",
    icon: Folder,
    description: "Robot 목록 관리",
  },
  {
    href: "/world-editor",
    label: "World Builder",
    icon: Boxes,
    description: "면적/금지영역 영역 편집",
  },
  {
    href: "/simulation",
    label: "Simulation",
    icon: Move,
    description: "Actor 이동 시뮬레이션 및 상태 스트림",
  },
  {
    href: "/monitor",
    label: "Monitor",
    icon: Radar,
    description: "Actor 궤적 이미지 조회",
  },
  {
    href: "/ai",
    label: "AI",
    icon: Sparkles,
    description: "AI 생성/스트리밍 호출",
  },
] as const;

const SEGMENT_LABEL_MAP: Record<string, string> = {
  maps: "Maps",
  actors: "Actors",
  robots: "Robots",
  "world-editor": "World Builder",
  simulation: "Simulation",
  monitor: "Monitor",
  ai: "AI",
};

export type BreadcrumbItem = {
  href: string;
  label: string;
};

export function toTitleCase(value: string) {
  return value
    ? `${value.slice(0, 1).toUpperCase()}${value.slice(1)}`
    : "";
}

export function getPageTitle(pathname: string | null | undefined) {
  const safePathname = pathname ?? "";
  const segments = safePathname.split("/").filter(Boolean);
  const lastSegment = segments[segments.length - 1] ?? "maps";
  return SEGMENT_LABEL_MAP[lastSegment] ?? toTitleCase(lastSegment);
}

export function getBreadcrumbItems(pathname: string | null | undefined): BreadcrumbItem[] {
  const safePathname = pathname ?? "";
  const segments = safePathname.split("/").filter(Boolean);
  if (segments.length === 0) return [{ href: "/", label: "Home" }];

  return segments.map((segment, index) => ({
    href: `/${segments.slice(0, index + 1).join("/")}`,
    label: SEGMENT_LABEL_MAP[segment] ?? toTitleCase(segment),
  }));
}
