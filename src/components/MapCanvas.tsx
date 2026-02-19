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
}: MapCanvasProps) {
  const [hoveredPolygonEdge, setHoveredPolygonEdge] =
    React.useState<HoveredPolygonEdge>(null);
  const [canvasCursorClass, setCanvasCursorClass] = React.useState(
    "cursor-crosshair",
  );

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

  const handleCanvasPointerMove = (
    event: React.PointerEvent<HTMLDivElement>,
  ) => {
    const nextCursor = getCanvasCursorClass(event.target);
    setCanvasCursorClass(nextCursor);
  };

  const resetCanvasCursor = () => {
    setCanvasCursorClass(tool === "select" ? "cursor-default" : "cursor-crosshair");
  };

  React.useEffect(() => {
    setCanvasCursorClass(tool === "select" ? "cursor-default" : "cursor-crosshair");
  }, [tool]);

  return (
    <section className="rounded-2xl border border-stone-300 bg-stone-100 p-3 shadow-sm">
      <div className="relative min-h-[320px] overflow-auto rounded-xl border border-stone-300">
        <div
          ref={frameRef}
          onPointerDown={onPointerDown}
          onPointerMove={handleCanvasPointerMove}
          onPointerLeave={resetCanvasCursor}
          onContextMenu={(event) => event.preventDefault()}
          className={`relative touch-none bg-stone-200 ${canvasCursorClass}`}
          style={{
            width: boardWidth,
            height: boardHeight,
            backgroundImage: mapImage ? `url(${mapImage.src})` : undefined,
            backgroundRepeat: "no-repeat",
            backgroundPosition: "0 0",
            backgroundSize: mapImage ? "100% 100%" : "auto",
            backgroundColor: mapImage ? undefined : "#e2e8f0",
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

          {!mapImage ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <p className="rounded-md border border-dashed border-stone-300 bg-white/70 px-4 py-2 text-sm text-stone-600">
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
