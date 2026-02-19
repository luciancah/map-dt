import type { Layer } from "@/lib/map-editor/types";

type LayerListPanelProps = {
  layers: Layer[];
  selectedId: string | null;
  onSelectLayer: (layerId: string) => void;
  onToggleLayerVisibility: (layerId: string) => void;
  onDeleteLayer: (layerId: string) => void;
  onMoveLayer: (layerId: string, direction: "up" | "down") => void;
};

export function LayerListPanel({
  layers,
  selectedId,
  onSelectLayer,
  onToggleLayerVisibility,
  onDeleteLayer,
  onMoveLayer,
}: LayerListPanelProps) {
  const visibleLayers = layers.slice().reverse();

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
          visibleLayers.map((layer, displayIndex) => {
            const isTop = displayIndex === 0;
            const isBottom = displayIndex === visibleLayers.length - 1;

            return (
              <div
                key={layer.id}
                onClick={() => onSelectLayer(layer.id)}
                className={`flex items-center gap-2 rounded-md border px-2 py-2 ${
                  layer.id === selectedId
                    ? "border-orange-300 bg-orange-50"
                    : "border-stone-200 bg-stone-50"
                }`}
                role="button"
                tabIndex={0}
                aria-label={`${layer.name} 레이어 선택`}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    onSelectLayer(layer.id);
                  }
                }}
                >
                <span className="truncate text-left text-sm font-medium text-stone-800">
                  {layer.name}
                </span>
                <button
                  className="rounded border border-stone-300 px-2 py-1 text-xs text-stone-700 disabled:opacity-40"
                  onClick={(event) => {
                    event.stopPropagation();
                    onMoveLayer(layer.id, "up");
                  }}
                  disabled={isTop}
                  aria-label="Move layer up"
                >
                  ▲
                </button>
                <button
                  className="rounded border border-stone-300 px-2 py-1 text-xs text-stone-700 disabled:opacity-40"
                  onClick={(event) => {
                    event.stopPropagation();
                    onMoveLayer(layer.id, "down");
                  }}
                  disabled={isBottom}
                  aria-label="Move layer down"
                >
                  ▼
                </button>
                <button
                  className="ml-auto rounded border border-stone-300 px-2 py-1 text-xs text-stone-700 hover:bg-stone-200"
                  onClick={(event) => {
                    event.stopPropagation();
                    onToggleLayerVisibility(layer.id);
                  }}
                >
                  {layer.visible ? "Hide" : "Show"}
                </button>
                <button
                  className="rounded border border-red-300 px-2 py-1 text-xs text-red-700 hover:bg-red-50"
                  onClick={(event) => {
                    event.stopPropagation();
                    onDeleteLayer(layer.id);
                  }}
                >
                  삭제
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
