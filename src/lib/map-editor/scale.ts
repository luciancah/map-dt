import type { MapScale } from "@/lib/map-editor/types";

export function calculateScaleByWidth({
  pixelWidth,
  realWidthMeters,
  gridCount,
}: {
  pixelWidth: number;
  realWidthMeters: number;
  gridCount: number;
}) {
  if (!Number.isFinite(gridCount) || gridCount <= 0) {
    throw new Error("gridCount must be greater than 0");
  }

  const metersPerPixel = realWidthMeters / pixelWidth;
  const pixelsPerMeter = pixelWidth / realWidthMeters;
  const metersPerGrid = realWidthMeters / gridCount;
  const pixelsPerGrid = pixelWidth / gridCount;

  return {
    pixelWidth,
    realWidthMeters,
    gridCount,
    metersPerPixel,
    pixelsPerMeter,
    pixelsPerGrid,
    metersPerGrid,
  } satisfies MapScale;
}

export function formatScaleValue(value: number) {
  return Number(value).toLocaleString("ko-KR", {
    maximumFractionDigits: 4,
    minimumFractionDigits: 2,
  });
}
