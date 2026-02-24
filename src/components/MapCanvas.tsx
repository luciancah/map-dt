"use client";

import React from "react";
import { EDITOR_RULES } from "@/lib/map-editor/rules";
import { withOpacity } from "@/lib/map-editor/colors";
import type {
  DraftRect,
  DraftPolygon,
  Layer,
  MapImage,
  ResizeHandle,
  Tool,
} from "@/lib/map-editor/types";
import { RESIZE_CURSOR_BY_HANDLE } from "@/components/map-canvas/resize";
import { DraftShapes } from "@/components/map-canvas/DraftShapes";
import { PoiLayer } from "@/components/map-canvas/PoiLayer";
import { PolygonLayer } from "@/components/map-canvas/PolygonLayer";
import { RectLayer } from "@/components/map-canvas/RectLayer";
import { cn } from "@/lib/utils";

type MapCanvasProps = {
  frameRef: React.RefObject<HTMLDivElement | null>;
  mapImage: MapImage | null;
  layers: Layer[];
  selectedId: string | null;
  draftRect: DraftRect | null;
  draftPolygon: DraftPolygon | null;
  onPointerDown: (event: React.PointerEvent<HTMLDivElement>) => void;
  onPolygonNodePointerDown: (
    event: React.PointerEvent<HTMLButtonElement>,
    layer: Layer,
    nodeIndex: number,
  ) => void;
  onPolygonEdgePointerDown: (
    event: React.PointerEvent<SVGLineElement | HTMLButtonElement>,
    layer: Layer,
    edgeIndex: number,
  ) => void;
  onResizePointerDown: (
    event: React.PointerEvent<HTMLButtonElement>,
    layer: Layer,
    handle: ResizeHandle,
  ) => void;
  onPoiDirectionPointerDown: (
    event: React.PointerEvent<HTMLButtonElement>,
    layer: Layer,
  ) => void;
  tool: Tool;
  gridStepPx: number | null;
  displayWidth?: number;
  displayHeight?: number;
  displayScale?: number;
  onZoomByStep?: (deltaY: number) => void;
  canvasViewportRef?: React.RefObject<HTMLDivElement | null>;
  className?: string;
};

const DEFAULT_LAYER_OPACITY = 0.35;

type HoveredPolygonEdge = {
  layerId: string;
  edgeIndex: number;
} | null;

export function MapCanvas({
  frameRef,
  mapImage,
  layers,
  selectedId,
  draftRect,
  draftPolygon,
  onPointerDown,
  onPolygonNodePointerDown,
  onPolygonEdgePointerDown,
  onResizePointerDown,
  onPoiDirectionPointerDown,
  tool,
  gridStepPx,
  displayWidth,
  displayHeight,
  displayScale = 1,
  onZoomByStep,
  canvasViewportRef,
  className,
}: Readonly<MapCanvasProps>) {
  const [hoveredPolygonEdge, setHoveredPolygonEdge] =
    React.useState<HoveredPolygonEdge>(null);
  const [canvasCursorClass, setCanvasCursorClass] = React.useState(
    "cursor-crosshair",
  );
  const viewportRef = canvasViewportRef ?? null;
  const isPanningRef = React.useRef(false);
  const activePanPointerIdRef = React.useRef<number | null>(null);
  const panStartRef = React.useRef({
    x: 0,
    y: 0,
    scrollLeft: 0,
    scrollTop: 0,
  });

  const boardWidth =
    displayWidth ?? mapImage?.width ?? EDITOR_RULES.fallbackMapWidth;
  const boardHeight =
    displayHeight ?? mapImage?.height ?? EDITOR_RULES.fallbackMapHeight;
  const gridSize = (gridStepPx ?? EDITOR_RULES.gridStep) * displayScale;

  const getColorPair = (color: string) => ({
    fill: withOpacity(color, DEFAULT_LAYER_OPACITY),
    border: withOpacity(color, 0.9),
  });

  const getCanvasCursorClass = (target: EventTarget | null) => {
    if (!target) {
      return tool === "select" ? "cursor-default" : "cursor-crosshair";
    }

    const element = target as HTMLElement;
    const resizeHandle = element.closest<HTMLElement>("[data-resize-handle]");
    if (resizeHandle) {
      const resizeHandleType = resizeHandle.dataset.resizeHandle as
        | ResizeHandle
        | undefined;
      return resizeHandleType
        ? RESIZE_CURSOR_BY_HANDLE[resizeHandleType]
        : "cursor-default";
    }

    const polygonNode = element.closest<HTMLElement>("[data-polygon-node]");
    if (polygonNode) {
      return "cursor-grab";
    }

    const poiDirectionHandle = element.closest<HTMLElement>(
      "[data-poi-direction]",
    );
    if (poiDirectionHandle) {
      return "cursor-grab";
    }

    const edgeAction = element.closest<HTMLElement>("[data-edge-action]");
    if (edgeAction) {
      return "cursor-copy";
    }

    const polygonEdge = element.closest<HTMLElement>("[data-polygon-edge]");
    if (polygonEdge) {
      return "cursor-crosshair";
    }

    const layerElement = element.closest<HTMLElement>("[data-layer-id]");
    if (layerElement) {
      return tool === "rect" ? "cursor-crosshair" : "cursor-grab";
    }

    return tool === "select" ? "cursor-default" : "cursor-crosshair";
  };

  const shouldStartPan = (event: React.PointerEvent<HTMLDivElement>) =>
    event.button === 1 ||
    (event.button === 0 && (event.ctrlKey || event.shiftKey));

  const handleFramePointerDown = (
    event: React.PointerEvent<HTMLDivElement>,
  ) => {
    if (shouldStartPan(event)) return;
    onPointerDown(event);
  };

  const handleCanvasPointerMove = (
    event: React.PointerEvent<HTMLDivElement>,
  ) => {
    const nextCursor = getCanvasCursorClass(event.target);
    setCanvasCursorClass(nextCursor);
  };

  const clamp = (value: number, min: number, max: number) => {
    if (value < min) return min;
    if (value > max) return max;
    return value;
  };

  const beginCanvasPan = (event: React.PointerEvent<HTMLDivElement>) => {
    const viewport = viewportRef?.current;
    if (!viewport || !shouldStartPan(event)) return;

    event.preventDefault();
    isPanningRef.current = true;
    activePanPointerIdRef.current = event.pointerId;
    panStartRef.current = {
      x: event.clientX,
      y: event.clientY,
      scrollLeft: viewport.scrollLeft,
      scrollTop: viewport.scrollTop,
    };
    setCanvasCursorClass("cursor-grabbing");
    event.currentTarget.setPointerCapture?.(event.pointerId);
  };

  const updateCanvasPan = (event: React.PointerEvent<HTMLDivElement>) => {
    if (
      !isPanningRef.current ||
      activePanPointerIdRef.current !== event.pointerId
    ) {
      return;
    }

    const viewport = viewportRef?.current;
    if (!viewport) return;

    const deltaX = event.clientX - panStartRef.current.x;
    const deltaY = event.clientY - panStartRef.current.y;

    const nextScrollLeft = clamp(
      panStartRef.current.scrollLeft - deltaX,
      0,
      Math.max(0, viewport.scrollWidth - viewport.clientWidth),
    );
    const nextScrollTop = clamp(
      panStartRef.current.scrollTop - deltaY,
      0,
      Math.max(0, viewport.scrollHeight - viewport.clientHeight),
    );
    viewport.scrollTo({
      left: nextScrollLeft,
      top: nextScrollTop,
      behavior: "auto",
    });
  };

  const endCanvasPan = (event?: React.PointerEvent<HTMLDivElement>) => {
    const pointerId = activePanPointerIdRef.current;
    isPanningRef.current = false;
    activePanPointerIdRef.current = null;

    if (
      pointerId !== null &&
      typeof event?.currentTarget?.releasePointerCapture === "function"
    ) {
      event.currentTarget.releasePointerCapture(pointerId);
    }

    setCanvasCursorClass((previous) => {
      if (previous !== "cursor-grabbing") return previous;
      return tool === "select" ? "cursor-default" : "cursor-crosshair";
    });
  };

  const handleCanvasWheel = (event: React.WheelEvent<HTMLDivElement>) => {
    if (!onZoomByStep) return;
    event.preventDefault();
    onZoomByStep(event.deltaY);
  };

  const resetCanvasCursor = () => {
    setCanvasCursorClass(tool === "select" ? "cursor-default" : "cursor-crosshair");
  };

  React.useEffect(() => {
    setCanvasCursorClass(tool === "select" ? "cursor-default" : "cursor-crosshair");
  }, [tool]);

  return (
    <section
      className={cn(
        "relative h-full min-h-0 w-full border-t bg-background",
        className,
      )}
    >
      <div
        ref={viewportRef}
        className="relative h-full min-h-0 overflow-auto touch-none"
        onPointerDown={beginCanvasPan}
        onPointerMove={updateCanvasPan}
        onPointerUp={endCanvasPan}
        onPointerCancel={endCanvasPan}
        onPointerLeave={endCanvasPan}
        onWheel={handleCanvasWheel}
      >
        <div
          ref={frameRef}
          onPointerDown={handleFramePointerDown}
          onPointerMove={handleCanvasPointerMove}
          onPointerLeave={resetCanvasCursor}
          onContextMenu={(event) => event.preventDefault()}
          role="application"
          aria-label="월드 편집 캔버스"
          className={`relative touch-none bg-muted/60 ${canvasCursorClass}`}
          style={{
            width: boardWidth,
            height: boardHeight,
            backgroundImage: mapImage ? `url(${mapImage.src})` : undefined,
            backgroundRepeat: "no-repeat",
            backgroundPosition: "0 0",
            backgroundSize: mapImage ? "100% 100%" : "auto",
            backgroundColor: mapImage ? undefined : "hsl(var(--muted))",
          }}
        >
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              backgroundImage:
                "linear-gradient(to right, rgba(15,23,42,0.2) 1px, transparent 1px), linear-gradient(to bottom, rgba(15,23,42,0.2) 1px, transparent 1px)",
              backgroundSize: `${gridSize}px ${gridSize}px`,
            }}
          />

          {mapImage === null ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <p className="rounded-md border border-dashed border-border bg-background px-4 py-2 text-sm text-muted-foreground">
                지도를 업로드해서 편집을 시작하세요
              </p>
            </div>
          ) : null}

          {layers.map((layer) => {
            if (!layer.visible) return null;

            const layerPoints = layer.points ?? [];
            const isPolygon = layer.shape === "polygon" && layerPoints.length >= 3;
            const colors = getColorPair(layer.color);

            if (isPolygon) {
              return (
                <PolygonLayer
                  key={layer.id}
                  layer={layer}
                  selectedLayerId={selectedId}
                  displayScale={displayScale}
                  colors={colors}
                  hoveredPolygonEdge={hoveredPolygonEdge}
                  setHoveredPolygonEdge={setHoveredPolygonEdge}
                  onNodePointerDown={onPolygonNodePointerDown}
                  onEdgePointerDown={onPolygonEdgePointerDown}
                />
              );
            }

            if (layer.shape === "poi") {
              return (
                <PoiLayer
                  key={layer.id}
                  layer={layer}
                  selectedLayerId={selectedId}
                  displayScale={displayScale}
                  colors={colors}
                  onDirectionPointerDown={onPoiDirectionPointerDown}
                />
              );
            }

            return (
              <RectLayer
                key={layer.id}
                layer={layer}
                selectedLayerId={selectedId}
                displayScale={displayScale}
                colors={colors}
                onResizePointerDown={onResizePointerDown}
              />
            );
          })}

          <DraftShapes
            draftRect={draftRect}
            draftPolygon={draftPolygon}
            displayScale={displayScale}
          />
        </div>
      </div>
    </section>
  );
}
