"use client";

import type { Layer } from "@/lib/map-editor/types";

type WorldEditorStatusBarProps = {
  message: string;
  layers: Layer[];
  selectedId: string | null;
  displayScale: number;
  mapImage: { width: number; height: number } | null;
};

export function WorldEditorStatusBar({
  message,
  layers,
  selectedId,
  displayScale,
  mapImage,
}: Readonly<WorldEditorStatusBarProps>) {
  const selectedLayer = layers.find((layer) => layer.id === selectedId) ?? null;

  return (
    <div className="flex h-8 items-center gap-3 overflow-x-auto border-t bg-background px-3 text-xs text-muted-foreground">
      <span className="whitespace-nowrap">{message || "Ready"}</span>
      <span className="whitespace-nowrap">Layers: {layers.length}</span>
      <span className="whitespace-nowrap">
        Zoom: {Math.round(displayScale * 100)}%
      </span>
      {mapImage ? (
        <span className="whitespace-nowrap">
          Map: {mapImage.width} x {mapImage.height}
        </span>
      ) : null}
      <span className="whitespace-nowrap">
        Selection: {selectedLayer ? selectedLayer.name : "None"}
      </span>
    </div>
  );
}
