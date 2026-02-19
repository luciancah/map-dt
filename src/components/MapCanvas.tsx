import React from "react";
import { EDITOR_RULES } from "@/lib/map-editor/rules";
import type {
  DraftRect,
  Layer,
  MapImage,
  ResizeHandle,
} from "@/lib/map-editor/types";

type MapCanvasProps = {
  frameRef: React.RefObject<HTMLDivElement | null>;
  mapImage: MapImage | null;
  layers: Layer[];
  selectedId: string | null;
  draftRect: DraftRect | null;
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

export function MapCanvas({
  frameRef,
  mapImage,
  layers,
  selectedId,
  draftRect,
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
            return (
              <div
                key={layer.id}
                data-layer-id={layer.id}
                className={`absolute border ${
                  layer.id === selectedId
                    ? "border-orange-600 ring-2 ring-orange-300"
                    : "border-orange-500/80"
                }`}
                style={{
                  left: `${layer.x * displayScale}px`,
                  top: `${layer.y * displayScale}px`,
                  width: `${layer.width * displayScale}px`,
                  height: `${layer.height * displayScale}px`,
                  background: layer.color,
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
                      <button
                        key={handle}
                        onPointerDown={(event) =>
                          onResizePointerDown(event, layer, handle)
                        }
                        className={`absolute h-4 w-4 rounded-sm border border-orange-700 bg-white ${resizeHandleClass[handle]}`}
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
        </div>
      </div>
    </section>
  );
}
