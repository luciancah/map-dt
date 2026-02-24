import type { MouseEvent } from "react";
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
};

export function LayerListPanel({
  layers,
  selectedId,
  onSelectLayer,
  onToggleLayerVisibility,
  onDeleteLayer,
}: LayerListPanelProps) {
  const visibleLayers = layers.slice().reverse();
  const layerZIndexById = new Map(
    layers.map((layer, index) => [layer.id, index + 1] as const),
  );

  const handleSelectLayer = (layerId: string) => {
    onSelectLayer(layerId);
  };

  const handleToggleVisibility = (
    event: MouseEvent<HTMLButtonElement>,
    layerId: string,
  ) => {
    event.stopPropagation();
    onToggleLayerVisibility(layerId);
  };

  const handleDeleteLayer = (
    event: MouseEvent<HTMLButtonElement>,
    layerId: string,
  ) => {
    event.stopPropagation();
    onDeleteLayer(layerId);
  };

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
          visibleLayers.map((layer) => {
            return (
              <div
                key={layer.id}
                onClick={() => handleSelectLayer(layer.id)}
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
                    handleSelectLayer(layer.id);
                  }
                }}
              >
                <span className="min-w-0 truncate text-left text-sm font-medium text-stone-800">
                  {layer.name}
                </span>
                <Badge className="text-[10px]">
                  z: {layerZIndexById.get(layer.id) ?? ""}
                </Badge>
                {[
                  {
                    key: "visibility",
                    label: layer.visible ? "Hide" : "Show",
                    variant: "ghost" as const,
                    onClick: (event: MouseEvent<HTMLButtonElement>) =>
                      handleToggleVisibility(event, layer.id),
                    disabled: false,
                    ariaLabel: layer.visible
                      ? `${layer.name} 레이어 숨기기`
                      : `${layer.name} 레이어 보이기`,
                  },
                  {
                    key: "delete",
                    label: "삭제",
                    variant: "destructive" as const,
                    onClick: (event: MouseEvent<HTMLButtonElement>) =>
                      handleDeleteLayer(event, layer.id),
                    disabled: false,
                    ariaLabel: `${layer.name} 레이어 삭제`,
                  },
                ].map((action) => (
                  <Button
                    key={action.key}
                    variant={action.variant}
                    size="sm"
                    className={`rounded ${
                      action.key === "visibility" ? "ml-auto" : ""
                    } disabled:opacity-40`}
                    onClick={action.onClick}
                    disabled={action.disabled}
                    aria-label={action.ariaLabel}
                  >
                    {action.label}
                  </Button>
                ))}
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
