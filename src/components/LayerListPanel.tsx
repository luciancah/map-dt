import type { Layer } from "@/lib/map-editor/types";

type LayerListPanelProps = {
  layers: Layer[];
  selectedId: string | null;
  onSelectLayer: (layerId: string) => void;
  onToggleLayerVisibility: (layerId: string) => void;
  onDeleteLayer: (layerId: string) => void;
};

export function LayerListPanel({
  layers,
  selectedId,
  onSelectLayer,
  onToggleLayerVisibility,
  onDeleteLayer,
}: LayerListPanelProps) {
  return (
    <div>
      <h2 className="text-sm font-semibold text-stone-900">Layers</h2>
      <p className="mt-1 text-xs text-stone-500">
        레이어를 클릭해서 선택하고 보이기/삭제를 설정하세요.
      </p>

      <div className="mt-3 space-y-2">
        {layers.length === 0 ? (
          <p className="rounded-md border border-dashed border-stone-300 bg-stone-50 px-3 py-4 text-sm text-stone-500">
            아직 레이어가 없습니다.
          </p>
        ) : (
          layers
            .slice()
            .reverse()
            .map((layer) => (
              <div
                key={layer.id}
                className={`flex items-center gap-2 rounded-md border px-2 py-2 ${
                  layer.id === selectedId
                    ? "border-orange-300 bg-orange-50"
                    : "border-stone-200 bg-stone-50"
                }`}
              >
                <button
                  className="truncate text-left text-sm font-medium text-stone-800"
                  onClick={() => onSelectLayer(layer.id)}
                >
                  {layer.name}
                </button>
                <button
                  className="ml-auto rounded border border-stone-300 px-2 py-1 text-xs text-stone-700 hover:bg-stone-200"
                  onClick={() => onToggleLayerVisibility(layer.id)}
                >
                  {layer.visible ? "Hide" : "Show"}
                </button>
                <button
                  className="rounded border border-red-300 px-2 py-1 text-xs text-red-700 hover:bg-red-50"
                  onClick={() => onDeleteLayer(layer.id)}
                >
                  삭제
                </button>
              </div>
            ))
        )}
      </div>
    </div>
  );
}
