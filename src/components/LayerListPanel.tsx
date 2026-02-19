import type { Layer } from "@/lib/map-editor/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

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
    <Card>
      <CardHeader>
        <CardTitle>Layers</CardTitle>
        <CardDescription>
          레이어를 클릭해서 선택하고 보이기/삭제를 설정하세요.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-2">
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
                <span className="min-w-0 truncate text-left text-sm font-medium text-stone-800">
                  {layer.name}
                </span>
                <Badge className="text-[10px]">
                  z: {layers.findIndex((item) => item.id === layer.id) + 1}
                </Badge>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded disabled:opacity-40"
                  onClick={(event) => {
                    event.stopPropagation();
                    onMoveLayer(layer.id, "up");
                  }}
                  disabled={isTop}
                  aria-label="Move layer up"
                >
                  ▲
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded disabled:opacity-40"
                  onClick={(event) => {
                    event.stopPropagation();
                    onMoveLayer(layer.id, "down");
                  }}
                  disabled={isBottom}
                  aria-label="Move layer down"
                >
                  ▼
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="ml-auto"
                  onClick={(event) => {
                    event.stopPropagation();
                    onToggleLayerVisibility(layer.id);
                  }}
                >
                  {layer.visible ? "Hide" : "Show"}
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={(event) => {
                    event.stopPropagation();
                    onDeleteLayer(layer.id);
                  }}
                >
                  삭제
                </Button>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
