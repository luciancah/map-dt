import type { Layer, Point } from "@/lib/map-editor/types";
import { EDITOR_RULES } from "@/lib/map-editor/rules";

export const clamp = (value: number, min: number, max: number) => {
  return Math.max(min, Math.min(max, value));
};

export const normalizeRect = (
  startX: number,
  startY: number,
  endX: number,
  endY: number,
) => {
  const left = Math.min(startX, endX);
  const top = Math.min(startY, endY);
  const width = Math.abs(endX - startX);
  const height = Math.abs(endY - startY);
  return { left, top, width, height };
};

export const normalizeLayerName = (value: string) => value.trim();

export const normalizeLayerNameForCompare = (value: string) =>
  normalizeLayerName(value).toLowerCase();

export const makeUniqueLayerName = (
  layers: Layer[],
  baseName: string,
  excludedLayerId?: string,
) => {
  const normalizedBase = normalizeLayerName(baseName);
  if (!normalizedBase) return "";

  const existing = new Set(
    layers
      .filter((layer) => layer.id !== excludedLayerId)
      .map((layer) => normalizeLayerNameForCompare(layer.name)),
  );

  if (!existing.has(normalizeLayerNameForCompare(normalizedBase))) {
    return normalizedBase;
  }

  for (let index = 1; index <= layers.length + 1; index += 1) {
    const candidate = `${normalizedBase} ${index}`;
    if (!existing.has(normalizeLayerNameForCompare(candidate))) {
      return candidate;
    }
  }

  return `${normalizedBase} ${Date.now()}`;
};

export const isValidPolygon = (points: Point[]) => {
  if (points.length < 3) return false;
  return points.some((point, index, collection) => {
    if (index === 0) return false;
    const previous = collection[index - 1];
    return point.x !== previous.x || point.y !== previous.y;
  });
};

export const computePolygonBounds = (points: Point[]) => {
  const xValues = points.map((point) => point.x);
  const yValues = points.map((point) => point.y);
  const left = Math.min(...xValues);
  const top = Math.min(...yValues);
  const right = Math.max(...xValues);
  const bottom = Math.max(...yValues);

  return {
    x: left,
    y: top,
    width: Math.max(EDITOR_RULES.minShapeSize, right - left),
    height: Math.max(EDITOR_RULES.minShapeSize, bottom - top),
  };
};

export const clampPointToBounds = (
  point: Point,
  mapWidth?: number | null,
  mapHeight?: number | null,
) => ({
  x: mapWidth ? clamp(point.x, 0, mapWidth) : point.x,
  y: mapHeight ? clamp(point.y, 0, mapHeight) : point.y,
});
