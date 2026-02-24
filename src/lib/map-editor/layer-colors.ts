import type { LayerContext } from "@/lib/map-editor/types";

export const DEFAULT_LAYER_COLOR_BY_CONTEXT: Record<LayerContext, string> = {
  area: "#f97316",
  keepout: "#2563eb",
};

export const getDefaultLayerColorByContext = (context: LayerContext) =>
  DEFAULT_LAYER_COLOR_BY_CONTEXT[context];
