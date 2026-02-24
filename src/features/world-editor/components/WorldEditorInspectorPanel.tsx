"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getLayerDisplayName } from "@/lib/map-editor/layer-display";
import type { Layer, LayerContext } from "@/lib/map-editor/types";

type WorldEditorInspectorPanelProps = {
  selectedLayer: Layer | null;
  selectedLayerContext: LayerContext;
  areaType: string;
  metadataJson: string;
  keepoutEnabled: boolean;
  keepoutReason: string;
  saving: boolean;
  onRename: (event: React.SyntheticEvent<HTMLFormElement>) => void;
  setAreaType: (value: string) => void;
  setMetadataJson: (value: string) => void;
  setKeepoutEnabled: (value: boolean) => void;
  setKeepoutReason: (value: string) => void;
  saveSelectedLayer: () => void | Promise<void>;
  deleteSelectedLayer: () => void | Promise<void>;
};

export function WorldEditorInspectorPanel({
  selectedLayer,
  selectedLayerContext,
  areaType,
  metadataJson,
  keepoutEnabled,
  keepoutReason,
  saving,
  onRename,
  setAreaType,
  setMetadataJson,
  setKeepoutEnabled,
  setKeepoutReason,
  saveSelectedLayer,
  deleteSelectedLayer,
}: Readonly<WorldEditorInspectorPanelProps>) {
  const displayName = selectedLayer ? getLayerDisplayName(selectedLayer) : "";

  return (
    <section className="flex h-full min-h-0 flex-col border-l bg-background">
      <header className="border-b px-3 py-2">
        <h2 className="text-sm font-semibold">Inspector</h2>
      </header>

      {selectedLayer ? (
        <div className="min-h-0 flex-1 space-y-3 overflow-auto px-3 py-3">
          <form key={selectedLayer.id} onSubmit={onRename} className="space-y-2">
            <Label htmlFor={`layer-${selectedLayer.id}-name`}>이름</Label>
            <div className="flex gap-2">
              <Input
                id={`layer-${selectedLayer.id}-name`}
                name="layerName"
                defaultValue={displayName}
                className="flex-1"
              />
              <Button type="submit" size="sm">
                적용
              </Button>
            </div>
          </form>

          {selectedLayerContext === "area" ? (
            <>
              <div className="space-y-1.5">
                <Label htmlFor={`type-${selectedLayer.id}`}>Area Type</Label>
                <Input
                  id={`type-${selectedLayer.id}`}
                  value={areaType}
                  onChange={(event) => setAreaType(event.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor={`metadata-${selectedLayer.id}`}>Metadata JSON</Label>
                <textarea
                  id={`metadata-${selectedLayer.id}`}
                  value={metadataJson}
                  onChange={(event) => setMetadataJson(event.target.value)}
                  rows={6}
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>
            </>
          ) : (
            <>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={keepoutEnabled}
                  onChange={(event) => setKeepoutEnabled(event.target.checked)}
                />
                <span>Keepout 활성화</span>
              </label>
              <div className="space-y-1.5">
                <Label htmlFor={`reason-${selectedLayer.id}`}>Reason</Label>
                <textarea
                  id={`reason-${selectedLayer.id}`}
                  value={keepoutReason}
                  onChange={(event) => setKeepoutReason(event.target.value)}
                  rows={6}
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>
            </>
          )}

          <div className="flex gap-2">
            <Button size="sm" onClick={saveSelectedLayer} disabled={saving}>
              {saving ? "저장 중..." : "저장"}
            </Button>
            <Button size="sm" variant="destructive" onClick={deleteSelectedLayer}>
              삭제
            </Button>
          </div>
        </div>
      ) : (
        <div className="min-h-0 flex-1 px-3 py-3">
          <p className="rounded-md border border-dashed bg-muted/40 p-4 text-sm text-muted-foreground">
            레이어를 선택하면 속성 편집이 가능합니다.
          </p>
        </div>
      )}
    </section>
  );
}
