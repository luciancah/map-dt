import { type FormEvent, useCallback, useState } from "react";
import type {
  Layer,
  LayerContext,
  MapImage,
} from "@/lib/map-editor/types";
import type { MapResponseEntity } from "@/features/world-editor/types";
import {
  ensurePolygonLayer,
  toServerState,
} from "@/features/world-editor/services/world-editor-service";

type UseWorldEditorLayerMutationsOptions = {
  selectedLayer: Layer | null;
  selectedMapId: number | null;
  mapImage: MapImage | null;
  layerContext: LayerContext;
  layers: Layer[];
  areaType: string;
  metadataJson: string;
  keepoutEnabled: boolean;
  keepoutReason: string;
  setLayersFromServer: (nextLayers: Layer[]) => void;
  setMessage: (message: string) => void;
  renameLayer: (layerId: string, nextName: string) => boolean;
  removeLayer: (layerId: string) => void;
  onContextUpdated?: (context: LayerContext) => void;
  saveLayer: (
    mapId: number,
    layer: Layer,
    context: LayerContext,
    areaType: string,
    metadataJson: string,
    keepoutEnabled: boolean,
    keepoutReason: string,
    mapHeight: number,
  ) => Promise<{ entity: MapResponseEntity }>;
  deleteLayer: (mapId: number, layer: Layer) => Promise<void>;
  buildWorldImage: (mapId: number) => Promise<Blob>;
  getDefaultColorByContext: (context: LayerContext) => string;
  setWorldImageUrl: (nextUrl: string) => void;
};

type UseWorldEditorLayerMutationsResult = {
  saving: boolean;
  onRename: (event: FormEvent<HTMLFormElement>) => void;
  updateSelectedLayerContext: (nextContext: LayerContext) => void;
  saveSelectedLayer: () => Promise<void>;
  deleteSelectedLayer: () => Promise<void>;
  buildWorld: () => Promise<void>;
};

export function useWorldEditorLayerMutations({
  selectedLayer,
  selectedMapId,
  mapImage,
  layerContext,
  layers,
  areaType,
  metadataJson,
  keepoutEnabled,
  keepoutReason,
  setLayersFromServer,
  setMessage,
  renameLayer,
  removeLayer,
  onContextUpdated,
  saveLayer,
  deleteLayer,
  buildWorldImage,
  getDefaultColorByContext,
  setWorldImageUrl,
}: UseWorldEditorLayerMutationsOptions): UseWorldEditorLayerMutationsResult {
  const [saving, setSaving] = useState(false);

  const onRename = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (!selectedLayer) return;

      const nextName = new FormData(event.currentTarget)
        .get("layerName")
        ?.toString()
        ?.trim();
      if (!nextName) return;

      const updated = renameLayer(selectedLayer.id, nextName);
      if (!updated) {
        setMessage("이미 사용 중인 레이어 이름입니다.");
      }
    },
    [renameLayer, selectedLayer, setMessage],
  );

  const updateSelectedLayerContext = useCallback(
    (nextContext: LayerContext) => {
      if (!selectedLayer) return;

      setMessage("");
      const nextColor = getDefaultColorByContext(nextContext);
      onContextUpdated?.(nextContext);
      setLayersFromServer(
        layers.map((layer) =>
          layer.id === selectedLayer.id
            ? { ...layer, context: nextContext, color: nextColor }
            : layer,
        ),
      );
    },
    [getDefaultColorByContext, layers, onContextUpdated, selectedLayer, setLayersFromServer, setMessage],
  );

  const saveSelectedLayer = useCallback(async () => {
    if (!selectedLayer || !selectedMapId || !mapImage) return;

    const polygonLayer = ensurePolygonLayer(selectedLayer);
    if (!polygonLayer || !polygonLayer.points?.length) {
      setMessage("폴리곤 좌표 생성에 실패했습니다.");
      return;
    }

    const context = polygonLayer.context ?? layerContext;
    setSaving(true);
    setMessage("");

    try {
      const result = await saveLayer(
        selectedMapId,
        polygonLayer,
        context,
        areaType,
        metadataJson,
        keepoutEnabled,
        keepoutReason,
        mapImage.height,
      );

      const nextState = toServerState(context, result.entity);
      const nextLayers = layers.map((layer): Layer =>
        layer.id === polygonLayer.id
          ? {
              ...layer,
              ...polygonLayer,
              context,
              shape: "polygon",
              serverId: nextState.serverId,
              serverType: nextState.serverType,
              serverMetadataJson: nextState.serverMetadataJson,
              serverEnabled: nextState.serverEnabled,
              serverReason: nextState.serverReason,
            }
          : layer,
      );
      setLayersFromServer(nextLayers);
      setMessage("저장했습니다.");
    } catch {
      setMessage("저장 실패");
    } finally {
      setSaving(false);
    }
  }, [
    areaType,
    keepoutEnabled,
    keepoutReason,
    layerContext,
    layers,
    mapImage,
    metadataJson,
    saveLayer,
    selectedLayer,
    selectedMapId,
    setLayersFromServer,
    setMessage,
  ]);

  const deleteSelectedLayer = useCallback(async () => {
    if (!selectedLayer || !selectedMapId) return;

    try {
      if (selectedLayer.serverId) {
        await deleteLayer(selectedMapId, selectedLayer);
      }
      removeLayer(selectedLayer.id);
      setMessage("삭제했습니다.");
    } catch {
      setMessage("삭제 실패");
    }
  }, [deleteLayer, removeLayer, selectedLayer, selectedMapId, setMessage]);

  const buildWorld = useCallback(async () => {
    if (!selectedMapId) return;
    const previousMessage = "빌드 실패";
    const inProgressMessage = "빌드 중...";
    setMessage(inProgressMessage);
    try {
      const blob = await buildWorldImage(selectedMapId);
      const createObjectURL = URL.createObjectURL;
      if (typeof createObjectURL !== "function") {
        setMessage(previousMessage);
        return;
      }

      const blobUrl = createObjectURL(blob);
      setWorldImageUrl(blobUrl);
      setMessage("빌드 완료");
    } catch {
      setMessage(previousMessage);
    }
  }, [buildWorldImage, selectedMapId, setMessage, setWorldImageUrl]);

  return {
    saving,
    onRename,
    updateSelectedLayerContext,
    saveSelectedLayer,
    deleteSelectedLayer,
    buildWorld,
  };
}
