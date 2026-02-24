import { useEffect, useMemo, useState } from "react";
import { EDITOR_RULES } from "@/lib/map-editor/rules";

type Viewport = {
  width: number;
  height: number;
};

type MapDisplaySize = {
  width: number;
  height: number;
  scale: number;
};

const CANVAS_PADDING_X = 32;
const CANVAS_PADDING_Y = 24;
const DEFAULT_RESERVED_WIDTH = 0;

type CanvasViewportLayout = {
  reservedWidthPx?: number;
  topPaddingPx?: number;
  minWidthPx?: number;
  minHeightPx?: number;
};

const getFittedMapDisplaySize = (
  imageWidth: number,
  imageHeight: number,
  viewportWidth: number,
  viewportHeight: number,
  layout: Required<CanvasViewportLayout>,
): MapDisplaySize => {
  const availableWidth = Math.max(
    layout.minWidthPx,
    viewportWidth - layout.reservedWidthPx - CANVAS_PADDING_X,
  );
  const availableHeight = Math.max(
    layout.minHeightPx,
    viewportHeight - layout.topPaddingPx,
  );

  const widthScale = availableWidth / imageWidth;
  const heightScale = availableHeight / imageHeight;
  const scale = Math.min(1, widthScale, heightScale);

  return {
    width: Math.max(1, Math.round(imageWidth * scale)),
    height: Math.max(1, Math.round(imageHeight * scale)),
    scale,
  };
};

const getViewport = (): Viewport => ({
  width: globalThis.window.innerWidth,
  height: globalThis.window.innerHeight,
});

export function useCanvasViewport(
  mapWidth?: number | null,
  mapHeight?: number | null,
  layout: CanvasViewportLayout = {},
) {
  const [viewport, setViewport] = useState<Viewport>(() =>
    globalThis.window === undefined
      ? { width: 1280, height: 720 }
      : getViewport(),
  );

  useEffect(() => {
    const updateViewportSize = () => setViewport(getViewport());
    globalThis.window.addEventListener("resize", updateViewportSize);
    return () => globalThis.window.removeEventListener("resize", updateViewportSize);
  }, []);

  return useMemo(() => {
    const baseWidth = mapWidth ?? EDITOR_RULES.fallbackMapWidth;
    const baseHeight = mapHeight ?? EDITOR_RULES.fallbackMapHeight;
    const normalizedLayout = {
      reservedWidthPx: layout.reservedWidthPx ?? DEFAULT_RESERVED_WIDTH,
      topPaddingPx: layout.topPaddingPx ?? CANVAS_PADDING_Y,
      minWidthPx: layout.minWidthPx ?? 360,
      minHeightPx: layout.minHeightPx ?? 280,
    };

    return getFittedMapDisplaySize(
      baseWidth,
      baseHeight,
      viewport.width,
      viewport.height,
      normalizedLayout,
    );
  }, [
    layout.minHeightPx,
    layout.minWidthPx,
    layout.reservedWidthPx,
    layout.topPaddingPx,
    mapHeight,
    mapWidth,
    viewport.height,
    viewport.width,
  ]);
}
