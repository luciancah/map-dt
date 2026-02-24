import type { MouseEvent } from "react";
import type { Layer } from "@/lib/map-editor/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type LayerListPanelProps = {
  layers: Layer[];
  selectedId: string | null;
  onSelectLayer: (layerId: string) => void;
  onToggleLayerVisibility: (layerId: string) => void;
  onDeleteLayer: (layerId: string) => void;
  className?: string;
};

export function LayerListPanel({
  layers,
  selectedId,
  onSelectLayer,
  onToggleLayerVisibility,
  onDeleteLayer,
  className,
}: Readonly<LayerListPanelProps>) {
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
    <section className={cn("space-y-2", className)}>
      {layers.length === 0 ? (
        <p className="rounded-md border border-dashed bg-muted/40 px-3 py-4 text-sm text-muted-foreground">
          아직 레이어가 없습니다.
        </p>
      ) : (
        visibleLayers.map((layer) => {
          return (
            <div
              key={layer.id}
              className={cn(
                "flex items-center gap-2 rounded-md border bg-background px-2 py-2 transition-colors",
                layer.id === selectedId
                  ? "border-primary/30 bg-primary/5"
                  : "border-border hover:bg-accent/40",
              )}
            >
              <button
                type="button"
                onClick={() => handleSelectLayer(layer.id)}
                className="min-w-0 flex-1 truncate text-left text-sm font-medium"
                aria-label={`${layer.name} 레이어 선택`}
              >
                {layer.name}
              </button>
              <Badge
                className={cn(
                  "text-[10px]",
                  layer.context === "keepout"
                    ? "border-blue-200 bg-blue-100 text-blue-700"
                    : "border-amber-200 bg-amber-100 text-amber-700",
                )}
              >
                {layer.context === "keepout" ? "Keepout" : "Area"}
              </Badge>
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
                  className={cn(action.key === "visibility" ? "ml-auto" : "", "disabled:opacity-40")}
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
    </section>
  );
}
