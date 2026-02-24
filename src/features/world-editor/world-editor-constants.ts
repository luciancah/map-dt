import type { LayerContext, Tool } from "@/lib/map-editor/types";

export const TOOL_OPTIONS: { id: Tool; label: string }[] = [
  { id: "select", label: "선택" },
  { id: "rect", label: "사각형" },
  { id: "polygon", label: "폴리곤" },
];

export const CONTEXT_OPTIONS: Array<{ id: LayerContext; label: string }> = [
  { id: "area", label: "Area" },
  { id: "keepout", label: "Keepout" },
];

export const DEFAULT_GRID_COUNT = 64;
export const DEFAULT_AREA_TYPE = "NORMAL";
export const DEFAULT_METADATA_JSON = "{}";
