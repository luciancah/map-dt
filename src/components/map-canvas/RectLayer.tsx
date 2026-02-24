import React from "react";
import { getLayerDisplayName } from "@/lib/map-editor/layer-display";
import { Button } from "@/components/ui/button";
import type { Layer, ResizeHandle } from "@/lib/map-editor/types";
import { RESIZE_HANDLES, RESIZE_HANDLE_CLASS } from "./resize";

type LayerColor = {
  fill: string;
  border: string;
};

type RectLayerProps = {
  layer: Layer;
  selectedLayerId: string | null;
  displayScale: number;
  colors: LayerColor;
  onResizePointerDown: (
    event: React.PointerEvent<HTMLButtonElement>,
    layer: Layer,
    handle: ResizeHandle,
  ) => void;
};

export function RectLayer({
  layer,
  selectedLayerId,
  displayScale,
  colors,
  onResizePointerDown,
}: RectLayerProps) {
  const displayName = getLayerDisplayName(layer);

  return (
    <div
      data-layer-id={layer.id}
      data-layer-shape="rect"
      className={`absolute ${layer.id === selectedLayerId ? "ring-2 ring-white/80" : ""}`}
      style={{
        left: `${layer.x * displayScale}px`,
        top: `${layer.y * displayScale}px`,
        width: `${layer.width * displayScale}px`,
        height: `${layer.height * displayScale}px`,
        background: colors.fill,
        borderColor: colors.border,
        borderWidth: "1px",
        borderStyle: "solid",
      }}
    >
      <div className="pointer-events-none h-full w-full p-1 text-[11px] font-medium text-orange-950/90">
        {displayName}
      </div>
      {layer.id === selectedLayerId ? (
        <div className="absolute inset-0">
          {RESIZE_HANDLES.map((handle) => (
            <Button
              key={handle}
              variant="outline"
              size="icon"
              onPointerDown={(event) => onResizePointerDown(event, layer, handle)}
              data-resize-handle={handle}
              data-layer-id={layer.id}
              className={`absolute h-4 w-4 rounded-sm border border-orange-700 bg-white p-0 ${RESIZE_HANDLE_CLASS[handle]}`}
              aria-label={`Resize ${handle}`}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
