import type { Layer, LayerContext, Point } from "@/lib/map-editor/types";
import { computePolygonBounds } from "./geometry";

export const toApiVertices = (layer: Pick<Layer, "points" | "shape">, mapHeight: number): string => {
  if (!layer.points || layer.points.length < 3) {
    return "[]";
  }

  return JSON.stringify(
    layer.points.map((point) => [point.x, mapHeight - point.y]),
  );
};

export const fromApiVertices = (verticesJson: string, mapHeight: number): Point[] => {
  if (!verticesJson) return [];
  try {
    const parsed = JSON.parse(verticesJson) as Array<[number, number]>;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((vertex) => {
        if (!Array.isArray(vertex) || vertex.length < 2) return null;
        const x = Number(vertex[0]);
        const y = Number(vertex[1]);
        if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
        return { x, y: mapHeight - y };
      })
      .filter((vertex): vertex is Point => Boolean(vertex));
  } catch {
    return [];
  }
};

export const toLayerBounds = (points: Point[]) => {
  const bounds = computePolygonBounds(points);
  return {
    x: bounds.x,
    y: bounds.y,
    width: bounds.width,
    height: bounds.height,
  };
};

export const makeServerLabel = (context: LayerContext, index: number): string => {
  return `${context === "area" ? "Area" : "Keepout"} ${index + 1}`;
};
