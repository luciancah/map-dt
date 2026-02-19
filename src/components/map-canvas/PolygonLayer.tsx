import React from "react";
import type { Layer, Point } from "@/lib/map-editor/types";

type LayerColor = {
  fill: string;
  border: string;
};

type HoveredPolygonEdge = {
  layerId: string;
  edgeIndex: number;
} | null;

type PolygonLayerProps = {
  layer: Layer;
  selectedLayerId: string | null;
  displayScale: number;
  colors: LayerColor;
  hoveredPolygonEdge: HoveredPolygonEdge;
  setHoveredPolygonEdge: React.Dispatch<
    React.SetStateAction<HoveredPolygonEdge>
  >;
  onNodePointerDown: (
    event: React.PointerEvent<HTMLButtonElement>,
    layer: Layer,
    nodeIndex: number,
  ) => void;
  onEdgePointerDown: (
    event: React.PointerEvent<SVGLineElement | HTMLButtonElement>,
    layer: Layer,
    edgeIndex: number,
  ) => void;
};

const getLayerPoints = (layer: Layer): Point[] => layer.points ?? [];

export function PolygonLayer({
  layer,
  selectedLayerId,
  displayScale,
  colors,
  hoveredPolygonEdge,
  setHoveredPolygonEdge,
  onNodePointerDown,
  onEdgePointerDown,
}: PolygonLayerProps) {
  const layerPoints = getLayerPoints(layer);
  const isLayerSelected = layer.id === selectedLayerId;
  const hoveredPolygonEdgeIndex =
    hoveredPolygonEdge?.layerId === layer.id
      ? hoveredPolygonEdge.edgeIndex
      : null;

  const polygonPoints = layerPoints
    .map(
      (point) =>
        `${(point.x - layer.x) * displayScale},${
          (point.y - layer.y) * displayScale
        }`,
    )
    .join(" ");

  const renderEdgeControls = () => {
    if (!isLayerSelected) return [];

    const edgeElements: React.ReactNode[] = [];

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
            data-polygon-edge="1"
            data-layer-id={layer.id}
            aria-label={`${layer.name} edge ${index + 1}`}
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
            onPointerDown={(event) => onEdgePointerDown(event, layer, index)}
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
      if (hoveredPolygonEdgeIndex !== index) return null;

      edgeElements.push(
        <button
          type="button"
          key={`${layer.id}-edge-action-${index}`}
          data-polygon-edge="1"
          data-edge-action="1"
          data-layer-id={layer.id}
          data-edge-index={index}
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
          onPointerDown={(event) => onEdgePointerDown(event, layer, index)}
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

  const renderNodes = () => {
    if (!isLayerSelected) return null;

    return layerPoints.map((point, index) => {
      const nodeX = (point.x - layer.x) * displayScale;
      const nodeY = (point.y - layer.y) * displayScale;

      return (
        <button
          type="button"
          key={`${layer.id}-node-${index}`}
          data-polygon-node="1"
          data-layer-id={layer.id}
          data-node-index={index}
          onPointerDown={(event) => onNodePointerDown(event, layer, index)}
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
    <div
      data-layer-id={layer.id}
      data-layer-shape={layer.shape}
      className={`pointer-events-auto absolute ${
        isLayerSelected ? "ring-2 ring-white/80" : ""
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
        {renderEdgeControls()}
      </svg>
      {renderNodes()}
      <div className="pointer-events-none h-full w-full p-1 text-[11px] font-medium text-orange-950/90">
        {layer.content}
      </div>
    </div>
  );
}
