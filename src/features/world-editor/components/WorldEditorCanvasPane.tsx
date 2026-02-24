"use client";

import { MapCanvas } from "@/components/MapCanvas";
import { WorldEditorToolbar } from "@/features/world-editor/components/WorldEditorToolbar";
import type {
  DraftPolygon,
  DraftRect,
  Layer,
  MapImage,
  ResizeHandle,
  Tool,
} from "@/lib/map-editor/types";

type WorldEditorCanvasPaneProps = {
  mapImage: MapImage | null;
  tool: Tool;
  onToolSelect: (tool: Tool) => void;
  frameRef: React.RefObject<HTMLDivElement | null>;
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
  displaySize: { width: number; height: number; scale: number };
};

export function WorldEditorCanvasPane({
  mapImage,
  tool,
  onToolSelect,
  frameRef,
  layers,
  selectedId,
  draftRect,
  draftPolygon,
  onPointerDown,
  onPolygonNodePointerDown,
  onPolygonEdgePointerDown,
  onResizePointerDown,
  gridStepPx,
  displaySize,
}: Readonly<WorldEditorCanvasPaneProps>) {
  return (
    <section className="relative flex h-full min-h-0 flex-col bg-background">
      <header className="z-10 border-b px-3 py-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-semibold">Canvas</h2>
          <p className="text-xs text-muted-foreground">
            {mapImage
              ? `${mapImage.width} x ${mapImage.height}`
              : "센서맵 선택 필요"}
          </p>
        </div>
      </header>

      <div className="relative min-h-0 flex-1">
        <div className="pointer-events-none absolute inset-x-0 top-4 z-20 flex justify-center px-4">
          <WorldEditorToolbar
            tool={tool}
            onToolSelect={onToolSelect}
            className="pointer-events-auto"
          />
        </div>

        {mapImage ? (
          <MapCanvas
            frameRef={frameRef}
            mapImage={mapImage}
            layers={layers}
            selectedId={selectedId}
            draftRect={draftRect}
            draftPolygon={draftPolygon}
            onPointerDown={onPointerDown}
            onPolygonNodePointerDown={onPolygonNodePointerDown}
            onPolygonEdgePointerDown={onPolygonEdgePointerDown}
            onResizePointerDown={onResizePointerDown}
            onPoiDirectionPointerDown={() => {}}
            tool={tool}
            gridStepPx={gridStepPx}
            displayWidth={displaySize.width}
            displayHeight={displaySize.height}
            displayScale={displaySize.scale}
            className="h-full"
          />
        ) : (
          <div className="flex h-full items-center justify-center border-t border-dashed bg-muted/20 p-6">
            <p className="text-sm text-muted-foreground">
              센서맵을 업로드한 Map을 선택하세요.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
