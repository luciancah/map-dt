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

const LAPTOP_BREAKPOINT = 1024;
const WIDE_DESKTOP_BREAKPOINT = 1440;
const STANDARD_PANEL_WIDTH = 420;
const WIDE_LAYOUT_RESERVED_WIDTH = 760;
const CANVAS_PAGE_PADDING_X = 72;
const CANVAS_TOP_PADDING_Y = 240;

const getFittedMapDisplaySize = (
  imageWidth: number,
  imageHeight: number,
  viewportWidth: number,
  viewportHeight: number,
): MapDisplaySize => {
  let reservedWidth = 0;
  if (viewportWidth >= WIDE_DESKTOP_BREAKPOINT) {
    reservedWidth = WIDE_LAYOUT_RESERVED_WIDTH;
  } else if (viewportWidth >= LAPTOP_BREAKPOINT) {
    reservedWidth = STANDARD_PANEL_WIDTH;
  }
  const availableWidth = Math.max(
    360,
    viewportWidth - reservedWidth - CANVAS_PAGE_PADDING_X,
  );
  const availableHeight = Math.max(
    280,
    viewportHeight - CANVAS_TOP_PADDING_Y,
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

export const useCanvasViewport = (mapWidth?: number | null, mapHeight?: number | null) => {
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
    return getFittedMapDisplaySize(
      baseWidth,
      baseHeight,
      viewport.width,
      viewport.height,
    );
  }, [mapHeight, mapWidth, viewport.height, viewport.width]);
};
