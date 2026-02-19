import React from "react";
import { EDITOR_RULES } from "@/lib/map-editor/rules";
import type {
  DraftRect,
  DraftPolygon,
  Layer,
  MapImage,
  ResizeHandle,
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

const toChannel = (channel: string) => Number.parseInt(channel, 16);

const parseHexColor = (value: string) => {
  const normalized = value.trim();
  if (!normalized.startsWith("#")) return null;

  const hex = normalized.slice(1);
  if (!/^[0-9a-fA-F]+$/.test(hex)) return null;

  if (hex.length === 3) {
    const expanded = `${hex[0]}${hex[0]}${hex[1]}${hex[1]}${hex[2]}${hex[2]}`;
    return {
      r: toChannel(expanded.slice(0, 2)),
      g: toChannel(expanded.slice(2, 4)),
      b: toChannel(expanded.slice(4, 6)),
    };
  }

  if (hex.length !== 6) return null;

  return {
    r: toChannel(hex.slice(0, 2)),
    g: toChannel(hex.slice(2, 4)),
    b: toChannel(hex.slice(4, 6)),
  };
};

const parseRgbColor = (value: string) => {
  const match = value.match(
    /^rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})(?:\s*,\s*[\d.]+)?\s*\)$/i,
  );

  if (!match) return null;

  return {
    r: Number.parseInt(match[1], 10),
    g: Number.parseInt(match[2], 10),
    b: Number.parseInt(match[3], 10),
  };
};

const parseRGB = (value: string) => {
  return (
    parseRgbColor(value) ??
    parseHexColor(value) ?? {
      r: 0,
      g: 0,
      b: 0,
    }
  );
};

const withOpacity = (value: string, alpha: number) => {
  const { r, g, b } = parseRGB(value);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

export function MapCanvas({
  frameRef,
  mapImage,
  layers,
  selectedId,
  draftRect,
  draftPolygon,
  onPointerDown,
  onResizePointerDown,
  gridStepPx,
  displayWidth,
  displayHeight,
  displayScale = 1,
}: MapCanvasProps) {
  const boardWidth = displayWidth ?? (mapImage?.width ?? EDITOR_RULES.fallbackMapWidth);
  const boardHeight = displayHeight ?? (mapImage?.height ?? EDITOR_RULES.fallbackMapHeight);
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

              return (
                <div
                  key={layer.id}
                  data-layer-id={layer.id}
                  className={`pointer-events-auto absolute ${
                    layer.id === selectedId ? "ring-2 ring-white/80" : ""
                  }`}
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
                      fill={fillColor}
                      stroke={borderColor}
                      strokeWidth={Math.max(1, 2 / displayScale)}
                    />
                  </svg>
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
                  .map((point) => `${point.x * displayScale},${point.y * displayScale}`)
                  .join(" ")}
                fill="none"
                stroke="rgba(249, 115, 22, 0.9)"
                strokeWidth={Math.max(1, 2 / displayScale)}
                strokeDasharray="8 6"
              />
              {draftPolygon.points.length >= 3 ? (
                <polygon
                  points={draftPolygon.points
                    .map((point) => `${point.x * displayScale},${point.y * displayScale}`)
                    .join(" ")}
                  fill={withOpacity("#f97316", 0.18)}
                  stroke={withOpacity("#f97316", 0.9)}
                  strokeWidth={Math.max(1, 2 / displayScale)}
                />
              ) : null}
            </svg>
          ) : null}
        </div>
      </div>
    </section>
  );
}
