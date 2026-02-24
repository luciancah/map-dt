import type { Layer, LayerContext } from "@/lib/map-editor/types";

const getFallbackName = (context: LayerContext | undefined) => {
  return context === "keepout" ? "Keepout" : "Area";
};

export const getLayerDisplayName = (
  layer: Pick<Layer, "name" | "context">,
  index?: number,
): string => {
  if (layer.name.trim()) {
    return layer.name;
  }

  const fallback = getFallbackName(layer.context);
  if (!index || index < 1) {
    return fallback;
  }

  return `${fallback} ${index}`;
};

