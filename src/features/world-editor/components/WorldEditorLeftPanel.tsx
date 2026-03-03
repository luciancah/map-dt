"use client";

import { LayerListPanel } from "@/components/LayerListPanel";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import type { LayerContext } from "@/lib/map-editor/types";

type Option = {
  id: string;
  label: string;
};

type MapOption = {
  id: number;
  name: string;
};

type WorldEditorLeftPanelProps = {
  mapOptions: MapOption[];
  selectedMapValue: string;
  loading: boolean;
  mapImage: { width: number; height: number } | null;
  contextOptions: Option[];
  selectedLayerContext: LayerContext;
  onMapSelect: (value: string) => void;
  onUpdateLayerContext: (context: LayerContext) => void;
  onBuild: () => void | Promise<void>;
  buildDisabled: boolean;
  layers: Parameters<typeof LayerListPanel>[0]["layers"];
  selectedId: string | null;
  onSelectLayer: (layerId: string) => void;
  onToggleLayerVisibility: (layerId: string) => void;
  onDeleteLayer: (layerId: string) => void;
};

export function WorldEditorLeftPanel({
  mapOptions,
  selectedMapValue,
  loading,
  mapImage,
  contextOptions,
  selectedLayerContext,
  onMapSelect,
  onUpdateLayerContext,
  onBuild,
  buildDisabled,
  layers,
  selectedId,
  onSelectLayer,
  onToggleLayerVisibility,
  onDeleteLayer,
}: Readonly<WorldEditorLeftPanelProps>) {
  return (
    <section className="flex h-full min-h-0 flex-col border-r bg-background">
      <header className="border-b px-3 py-2">
        <h2 className="text-sm font-semibold">Layers</h2>
      </header>

      <div className="space-y-3 border-b px-3 py-3">
        <div className="space-y-2">
          <Label htmlFor="map-select" className="text-xs text-muted-foreground">
            Map
          </Label>
          {mapOptions.length === 0 ? (
            <p className="text-xs text-muted-foreground">맵이 없습니다.</p>
          ) : (
            <select
              id="map-select"
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50"
              value={selectedMapValue}
              onChange={(event) => onMapSelect(event.target.value)}
              disabled={loading}
            >
              {mapOptions.map((item) => (
                <option key={item.id} value={String(item.id)}>
                  {item.name}
                </option>
              ))}
            </select>
          )}
          {mapImage ? (
            <p className="text-[11px] text-muted-foreground">
              {mapImage.width} x {mapImage.height}
            </p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Context</Label>
          <div className="flex flex-wrap gap-1.5">
            {contextOptions.map((option) => (
              <Button
                key={option.id}
                size="sm"
                variant={option.id === selectedLayerContext ? "secondary" : "outline"}
                className="h-8 px-2.5"
                onClick={() => onUpdateLayerContext(option.id as LayerContext)}
              >
                {option.label}
              </Button>
            ))}
          </div>
        </div>

        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={onBuild}
          disabled={buildDisabled}
          className="w-full"
        >
          Build
        </Button>
      </div>

      <div className="min-h-0 flex-1 overflow-auto px-3 py-3">
        <LayerListPanel
          layers={layers}
          selectedId={selectedId}
          onSelectLayer={onSelectLayer}
          onToggleLayerVisibility={onToggleLayerVisibility}
          onDeleteLayer={onDeleteLayer}
        />
      </div>
    </section>
  );
}
