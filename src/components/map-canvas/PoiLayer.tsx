import React from "react";
import { getLayerDisplayName } from "@/lib/map-editor/layer-display";
import type { Layer } from "@/lib/map-editor/types";

type LayerColor = {
  fill: string;
  border: string;
};

const DEFAULT_POI_SIZE = 24;
const HEAD_SIZE = 6;

const getDirectionPoint = (
  centerX: number,
  centerY: number,
  direction: number,
  length: number,
) => {
  const radians = (direction * Math.PI) / 180;
  return {
    x: centerX + Math.cos(radians) * length,
    y: centerY + Math.sin(radians) * length,
  };
};

const createArrowHead = (
  endX: number,
  endY: number,
  direction: number,
) => {
  const radians = (direction * Math.PI) / 180;
  const leftRadians = radians + Math.PI * 0.8;
  const rightRadians = radians - Math.PI * 0.8;

  return `${endX},${endY} ${endX + Math.cos(leftRadians) * HEAD_SIZE},${
    endY + Math.sin(leftRadians) * HEAD_SIZE
  } ${endX + Math.cos(rightRadians) * HEAD_SIZE},${
    endY + Math.sin(rightRadians) * HEAD_SIZE
  }`;
};

type PoiLayerProps = {
  layer: Layer;
  selectedLayerId: string | null;
  displayScale: number;
  colors: LayerColor;
  onDirectionPointerDown: (
    event: React.PointerEvent<HTMLButtonElement>,
    layer: Layer,
  ) => void;
};

export function PoiLayer({
  layer,
  selectedLayerId,
  displayScale,
  colors,
  onDirectionPointerDown,
}: PoiLayerProps) {
  const displayName = getLayerDisplayName(layer);
  const sizePx = Math.max(layer.width, DEFAULT_POI_SIZE) * displayScale;
  const centerX = sizePx * 0.5;
  const centerY = sizePx * 0.5;
  const direction = layer.direction ?? 0;
  const directionLength = Math.max(sizePx * 0.55, 12);
  const handleSizePx = Math.max(10, 8 + displayScale * 2);
  const lineEnd = getDirectionPoint(
    centerX,
    centerY,
    direction,
    directionLength,
  );
  const isSelected = layer.id === selectedLayerId;

  return (
    <div
      data-layer-id={layer.id}
      data-layer-shape="poi"
      className={`absolute overflow-visible ${isSelected ? "ring-2 ring-white/80" : ""}`}
      style={{
        left: `${layer.x * displayScale}px`,
        top: `${layer.y * displayScale}px`,
        width: `${sizePx}px`,
        height: `${sizePx}px`,
      }}
    >
      <svg
        width={sizePx}
        height={sizePx}
        className="pointer-events-none absolute inset-0 h-full w-full"
      >
        <line
          x1={centerX}
          y1={centerY}
          x2={lineEnd.x}
          y2={lineEnd.y}
          stroke={colors.border}
          strokeWidth={2}
        />
        <polygon
          points={createArrowHead(lineEnd.x, lineEnd.y, direction)}
          fill={colors.border}
        />
        <circle
          cx={sizePx / 2}
          cy={sizePx / 2}
          r={Math.max(2.5, sizePx * 0.12)}
          fill={colors.fill}
          stroke={colors.border}
          strokeWidth={1.5}
        />
      </svg>
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-[11px] font-medium text-orange-950/90">
        {displayName}
      </div>
      {isSelected ? (
        <button
          type="button"
          onPointerDown={(event) => onDirectionPointerDown(event, layer)}
          data-poi-direction="1"
          data-layer-id={layer.id}
          className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-white/90 shadow"
          style={{
            left: `${lineEnd.x}px`,
            top: `${lineEnd.y}px`,
            width: `${handleSizePx}px`,
            height: `${handleSizePx}px`,
          }}
          aria-label={`${displayName} 방향 조정`}
        />
      ) : null}
    </div>
  );
}
