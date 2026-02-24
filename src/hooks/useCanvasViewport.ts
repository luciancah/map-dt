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

const DESKTOP_BREAKPOINT = 1024;
const BASELINE_PANEL_WIDTH = 420;
const CANVAS_PAGE_PADDING_X = 32;
const CANVAS_TOP_PADDING_Y = 210;

const getFittedMapDisplaySize = (
  imageWidth: number,
  imageHeight: number,
  viewportWidth: number,
  viewportHeight: number,
): MapDisplaySize => {
  const reservedWidth = viewportWidth >= DESKTOP_BREAKPOINT ? BASELINE_PANEL_WIDTH : 0;
  const availableWidth = Math.max(
    320,
    viewportWidth - reservedWidth - CANVAS_PAGE_PADDING_X,
  );
  const availableHeight = Math.max(
    240,
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
  width: window.innerWidth,
  height: window.innerHeight,
});

export const useCanvasViewport = (mapWidth?: number | null, mapHeight?: number | null) => {
  const [viewport, setViewport] = useState<Viewport>(() =>
    typeof window === "undefined"
      ? { width: 1280, height: 720 }
      : getViewport(),
  );

  useEffect(() => {
    const updateViewportSize = () => setViewport(getViewport());
    window.addEventListener("resize", updateViewportSize);
    return () => window.removeEventListener("resize", updateViewportSize);
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
