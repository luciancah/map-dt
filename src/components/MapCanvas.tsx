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
  Point,
} from "@/lib/map-editor/types";
import { Button } from "@/components/ui/button";

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
  gridStepPx: number | null;
  displayWidth?: number;
  displayHeight?: number;
  displayScale?: number;
};

const DEFAULT_LAYER_OPACITY = 0.35;

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
  gridStepPx,
  displayWidth,
  displayHeight,
  displayScale = 1,
}: MapCanvasProps) {
  const [hoveredPolygonEdge, setHoveredPolygonEdge] = React.useState<{
    layerId: string;
    edgeIndex: number;
  } | null>(null);

  const boardWidth =
    displayWidth ?? mapImage?.width ?? EDITOR_RULES.fallbackMapWidth;
  const boardHeight =
    displayHeight ?? mapImage?.height ?? EDITOR_RULES.fallbackMapHeight;
  const gridSize = (gridStepPx ?? EDITOR_RULES.gridStep) * displayScale;
  const resizeHandleClass: Record<ResizeHandle, string> = {
    nw: "-left-2 -top-2 cursor-nwse-resize",
    n: "left-1/2 -top-2 -translate-x-1/2 cursor-ns-resize",
    ne: "-top-2 -right-2 cursor-nesw-resize",
    e: "-right-2 top-1/2 -translate-y-1/2 cursor-ew-resize",
    se: "-right-2 -bottom-2 cursor-nwse-resize",
    s: "left-1/2 -bottom-2 -translate-x-1/2 cursor-ns-resize",
    sw: "-left-2 -bottom-2 cursor-nesw-resize",
    w: "-left-2 top-1/2 -translate-y-1/2 cursor-ew-resize",
  };

  const getColorPair = (color: string) => ({
    fill: withOpacity(color, DEFAULT_LAYER_OPACITY),
    border: withOpacity(color, 0.9),
  });

  const renderPolygonEdgeControls = (
    layer: Layer,
    layerPoints: { x: number; y: number }[],
    hoveredPolygonEdgeIndex: number | null,
    isLayerSelected: boolean,
  ) => {
    const edgeElements: React.ReactNode[] = [];

    if (!isLayerSelected) {
      return edgeElements;
    }

    layerPoints.forEach((point, index) => {
      const nextPoint = layerPoints[(index + 1) % layerPoints.length];
      const startX = (point.x - layer.x) * displayScale;
      const startY = (point.y - layer.y) * displayScale;
      const endX = (nextPoint.x - layer.x) * displayScale;
      const endY = (nextPoint.y - layer.y) * displayScale;
      const isHovered = hoveredPolygonEdgeIndex === index;

      edgeElements.push(
        <React.Fragment key={`${layer.id}-edge-${index}`}>
          <line
            x1={startX}
            y1={startY}
            x2={endX}
            y2={endY}
            stroke="rgba(249, 115, 22, 0.02)"
            strokeWidth={14}
            onPointerEnter={() =>
              setHoveredPolygonEdge({
                layerId: layer.id,
                edgeIndex: index,
              })
            }
            onPointerLeave={() =>
              setHoveredPolygonEdge((current) =>
                current &&
                current.layerId === layer.id &&
                current.edgeIndex === index
                  ? null
                  : current,
              )
            }
            onPointerDown={(event) =>
              onPolygonEdgePointerDown(event, layer, index)
            }
          />
          {isHovered ? (
            <line
              x1={startX}
              y1={startY}
              x2={endX}
              y2={endY}
              stroke="rgba(249, 115, 22, 0.6)"
              strokeWidth={2}
            />
          ) : null}
        </React.Fragment>,
      );
    });

    layerPoints.forEach((point, index) => {
      const nextPoint = layerPoints[(index + 1) % layerPoints.length];
      const midX =
        ((point.x - layer.x + (nextPoint.x - layer.x)) * displayScale) / 2;
      const midY =
        ((point.y - layer.y + (nextPoint.y - layer.y)) * displayScale) / 2;
      if (hoveredPolygonEdgeIndex !== index) return;

      edgeElements.push(
        <button
          type="button"
          key={`${layer.id}-edge-action-${index}`}
          onPointerEnter={() =>
            setHoveredPolygonEdge({
              layerId: layer.id,
              edgeIndex: index,
            })
          }
          onPointerLeave={() =>
            setHoveredPolygonEdge((current) =>
              current &&
              current.layerId === layer.id &&
              current.edgeIndex === index
                ? null
                : current
            )
          }
          onPointerDown={(event) =>
            onPolygonEdgePointerDown(event, layer, index)
          }
          className="absolute z-10 h-6 w-6 rounded-full border border-orange-100 bg-white/90 text-[11px] font-bold text-orange-800 shadow"
          style={{
            left: `${midX}px`,
            top: `${midY}px`,
            transform: "translate(-50%, -50%)",
          }}
          aria-label={`${layer.name} edge add point`}
        >
          +
        </button>,
      );
    });

    return edgeElements;
  };

  const renderPolygonNodes = (layer: Layer, layerPoints: Point[]) => {
    return layerPoints.map((point, index) => {
      const nodeX = (point.x - layer.x) * displayScale;
      const nodeY = (point.y - layer.y) * displayScale;

      return (
        <button
          type="button"
          key={`${layer.id}-node-${index}`}
          onPointerDown={(event) => onPolygonNodePointerDown(event, layer, index)}
          className="absolute h-3 w-3 rounded-full border border-white bg-orange-400 shadow"
          style={{
            left: `${nodeX}px`,
            top: `${nodeY}px`,
            transform: "translate(-50%, -50%)",
          }}
          aria-label={`${layer.name} node ${index + 1}`}
        />
      );
    });
  };

  return (
    <section className="rounded-2xl border border-stone-300 bg-stone-100 p-3 shadow-sm">
      <div className="relative min-h-[320px] overflow-auto rounded-xl border border-stone-300">
        <div
          ref={frameRef}
          onPointerDown={onPointerDown}
          onContextMenu={(event) => event.preventDefault()}
          className="relative cursor-crosshair touch-none bg-stone-200"
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

            const fillColor = withOpacity(layer.color, DEFAULT_LAYER_OPACITY);
            const borderColor = withOpacity(layer.color, 0.9);
            const layerPoints = layer.points ?? [];
            const isPolygon =
              layer.shape === "polygon" && layerPoints.length >= 3;

            if (isPolygon) {
              const polygonPoints = layerPoints
                .map(
                  (point) =>
                    `${(point.x - layer.x) * displayScale},${(point.y - layer.y) * displayScale}`,
                )
                .join(" ");
              const hoveredPolygonEdgeIndex =
                hoveredPolygonEdge?.layerId === layer.id
                  ? hoveredPolygonEdge.edgeIndex
                  : null;
              const isLayerSelected = layer.id === selectedId;
              const colors = getColorPair(layer.color);

              return (
                <div
                  key={layer.id}
                  data-layer-id={layer.id}
                  className={`pointer-events-auto absolute ${
                    layer.id === selectedId ? "ring-2 ring-white/80" : ""
                  }`}
                  onPointerLeave={() => {
                    setHoveredPolygonEdge((current) =>
                      current?.layerId === layer.id ? null : current,
                    );
                  }}
                  style={{
                    left: `${layer.x * displayScale}px`,
                    top: `${layer.y * displayScale}px`,
                    width: `${layer.width * displayScale}px`,
                    height: `${layer.height * displayScale}px`,
                  }}
                >
                  <svg
                    width={layer.width * displayScale}
                    height={layer.height * displayScale}
                    className="absolute inset-0 h-full w-full"
                  >
                    <polygon
                      points={polygonPoints}
                      fill={colors.fill}
                      stroke={colors.border}
                      strokeWidth={1}
                    />
                    {renderPolygonEdgeControls(
                      layer,
                      layerPoints,
                      hoveredPolygonEdgeIndex,
                      isLayerSelected,
                    )}
                  </svg>
                  {isLayerSelected
                    ? renderPolygonNodes(layer, layerPoints)
                    : null}
                  <div className="pointer-events-none h-full w-full p-1 text-[11px] font-medium text-orange-950/90">
                    {layer.content}
                  </div>
                </div>
              );
            }

            return (
              <div
                key={layer.id}
                data-layer-id={layer.id}
                className={`absolute ${
                  layer.id === selectedId ? "ring-2 ring-white/80" : ""
                }`}
                style={{
                  left: `${layer.x * displayScale}px`,
                  top: `${layer.y * displayScale}px`,
                  width: `${layer.width * displayScale}px`,
                  height: `${layer.height * displayScale}px`,
                  background: fillColor,
                  borderColor,
                  borderWidth: "1px",
                  borderStyle: "solid",
                }}
              >
                <div className="pointer-events-none h-full w-full p-1 text-[11px] font-medium text-orange-950/90">
                  {layer.content}
                </div>
                {layer.id === selectedId ? (
                  <div className="absolute inset-0">
                    {(
                      [
                        "nw",
                        "n",
                        "ne",
                        "e",
                        "se",
                        "s",
                        "sw",
                        "w",
                      ] as ResizeHandle[]
                    ).map((handle) => (
                      <Button
                        variant="outline"
                        size="icon"
                        key={handle}
                        onPointerDown={(event) =>
                          onResizePointerDown(event, layer, handle)
                        }
                        className={`absolute h-4 w-4 rounded-sm border border-orange-700 bg-white p-0 ${resizeHandleClass[handle]}`}
                        aria-label={`Resize ${handle}`}
                      />
                    ))}
                  </div>
                ) : null}
              </div>
            );
          })}

          {draftRect ? (
            <div
              className="pointer-events-none absolute border-2 border-dashed border-orange-600 bg-orange-300/30"
              style={{
                left: `${draftRect.left * displayScale}px`,
                top: `${draftRect.top * displayScale}px`,
                width: `${draftRect.width * displayScale}px`,
                height: `${draftRect.height * displayScale}px`,
              }}
            />
          ) : null}

          {draftPolygon ? (
            <svg className="pointer-events-none absolute inset-0 h-full w-full">
              <polyline
                points={draftPolygon.points
                  .map(
                    (point) =>
                      `${point.x * displayScale},${point.y * displayScale}`,
                  )
                  .join(" ")}
                fill="none"
                stroke="rgba(249, 115, 22, 0.9)"
                strokeWidth={1}
                strokeDasharray="8 6"
              />
              {draftPolygon.points.length >= 3 ? (
                <polygon
                  points={draftPolygon.points
                    .map(
                      (point) =>
                        `${point.x * displayScale},${point.y * displayScale}`,
                    )
                    .join(" ")}
                  fill={withOpacity("#f97316", 0.18)}
                  stroke={withOpacity("#f97316", 0.9)}
                  strokeWidth={1}
                />
              ) : null}
              {draftPolygon.points.length > 0
                ? draftPolygon.points
                    .slice(
                      0,
                      draftPolygon.points.length >= 2 ? -1 : undefined,
                    )
                    .map((point, index) => (
                      <circle
                        key={`${point.x}-${point.y}-${index}`}
                        cx={point.x * displayScale}
                        cy={point.y * displayScale}
                        r={3.5}
                        fill="#fb923c"
                        stroke="rgba(255, 255, 255, 0.95)"
                        strokeWidth={1.5}
                      />
                    ))
                : null}
              {draftPolygon.points.length === 1 ? (
                <circle
                  cx={draftPolygon.points[0]!.x * displayScale}
                  cy={draftPolygon.points[0]!.y * displayScale}
                  r={3.5}
                  fill="#fb923c"
                  stroke="rgba(255, 255, 255, 0.95)"
                  strokeWidth={1.5}
                />
              ) : null}
            </svg>
          ) : null}
        </div>
      </div>
    </section>
  );
}
