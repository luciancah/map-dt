"use client";

import { useSearchParams, useRouter } from "next/navigation";
import {
  type FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useCanvasViewport } from "@/hooks/useCanvasViewport";
import { useRectLayerEditor } from "@/hooks/useRectLayerEditor";
import type { Layer, LayerContext, MapImage, Tool } from "@/lib/map-editor/types";
import {
  CONTEXT_OPTIONS,
  DEFAULT_AREA_TYPE,
  DEFAULT_GRID_COUNT,
  DEFAULT_METADATA_JSON,
} from "@/features/world-editor/world-editor-constants";
import {
  buildWorldImage,
  deleteLayer,
  ensurePolygonLayer,
  loadMapAsset,
  loadMapLayers,
  loadMaps,
  saveLayer,
  toServerState,
} from "@/features/world-editor/services/world-editor-service";
import { getDefaultLayerColorByContext } from "@/lib/map-editor/layer-colors";
import type { EditableMap } from "@/features/world-editor/types";

export type WorldEditorController = ReturnType<typeof useWorldEditorController>;

export function useWorldEditorController() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [maps, setMaps] = useState<EditableMap[]>([]);
  const [mapsError, setMapsError] = useState("");
  const [selectedMapId, setSelectedMapId] = useState<number | null>(null);
  const [mapImage, setMapImage] = useState<MapImage | null>(null);
  const [layerContext, setLayerContext] = useState<LayerContext>("area");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [areaType, setAreaType] = useState(DEFAULT_AREA_TYPE);
  const [metadataJson, setMetadataJson] = useState(DEFAULT_METADATA_JSON);
  const [keepoutEnabled, setKeepoutEnabled] = useState(true);
  const [keepoutReason, setKeepoutReason] = useState("");
  const [worldImageUrl, setWorldImageUrl] = useState("");

  const displaySize = useCanvasViewport(
    mapImage?.width,
    mapImage?.height,
    {
      reservedWidthPx: 560,
      topPaddingPx: 210,
      minHeightPx: 320,
    },
  );
  const gridStepPx = useMemo(
    () => (mapImage?.width ? Math.max(1, Math.floor(mapImage.width / DEFAULT_GRID_COUNT)) : 1),
    [mapImage?.width],
  );

  const {
    frameRef,
    layers,
    tool,
    setTool,
    selectedId,
    selectedLayer,
    interactionDraftRect,
    interactionDraftPolygon,
    onCanvasPointerDown,
    renameLayer,
    insertPolygonPointOnEdge,
    startPolygonNodeDrag,
    startResize,
    selectLayer,
    toggleLayerVisible,
    removeLayer,
    clearAllLayers,
    setDefaultLayerContext,
    setLayersFromServer,
  } = useRectLayerEditor({
    hasMapImage: Boolean(mapImage),
    mapWidth: mapImage?.width,
    mapHeight: mapImage?.height,
    gridStepPx,
    displayScale: displaySize.scale,
    defaultLayerContext: layerContext,
  });

  const mapOptions = useMemo(
    () => maps.map((item) => ({ id: item.id, name: item.name })),
    [maps],
  );
  const selectedMap = useMemo(
    () => maps.find((item) => item.id === selectedMapId),
    [maps, selectedMapId],
  );
  const queryMapId = useMemo(() => {
    const nextMapId = Number(searchParams.get("mapId") || "");
    return Number.isFinite(nextMapId) && nextMapId > 0 ? nextMapId : null;
  }, [searchParams]);

  useEffect(() => {
    const load = async () => {
      const list = await loadMaps();
      setMaps(list);
      setMapsError("");
    };

    load().catch((caught) => {
      setMapsError(caught instanceof Error ? caught.message : "맵 목록 조회 실패");
    });
  }, []);

  useEffect(() => {
    if (queryMapId !== null) {
      if (selectedMapId !== queryMapId) {
        setSelectedMapId(queryMapId);
      }

      return;
    }

    if (maps.length > 0 && !selectedMapId) {
      const fallbackMapId = maps[0]!.id;
      setSelectedMapId(fallbackMapId);
      router.replace(`/world-editor?mapId=${fallbackMapId}`);
    }
  }, [maps, queryMapId, router, selectedMapId]);

  useEffect(() => {
    setDefaultLayerContext(layerContext);
  }, [layerContext, setDefaultLayerContext]);

  useEffect(() => {
    if (!selectedMapId) {
      clearAllLayers();
      setMapImage(null);
      setWorldImageUrl("");
      return;
    }

    if (!selectedMap) {
      clearAllLayers();
      setMapImage(null);
      setMessage("선택한 맵을 찾을 수 없습니다.");
      return;
    }

    if (!selectedMap.sensorMapImagePath) {
      clearAllLayers();
      setMapImage(null);
      setMessage("센서맵이 없습니다.");
      return;
    }

    let disposed = false;
    let objectUrl = "";

    const load = async () => {
      setLoading(true);
      setMessage("");
      setWorldImageUrl("");
      clearAllLayers();

      const loadedImage = await loadMapAsset(selectedMap);
      if (disposed) {
        URL.revokeObjectURL(loadedImage.src);
        return;
      }

      objectUrl = loadedImage.src;
      setMapImage(loadedImage);

      const nextLayers = await loadMapLayers(selectedMap.id, loadedImage.height);
      if (!disposed) {
        setLayersFromServer(nextLayers);
      }
    };

    load()
      .catch((caught) => {
        if (!disposed) {
          setMessage(caught instanceof Error ? caught.message : "맵 로딩 실패");
        }
      })
      .finally(() => {
        if (!disposed) {
          setLoading(false);
        }
      });

    return () => {
      disposed = true;
      clearAllLayers();
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [clearAllLayers, selectedMap, selectedMapId, setLayersFromServer]);

  useEffect(() => {
    if (!selectedLayer) {
      setKeepoutEnabled(true);
      setKeepoutReason("");
      setAreaType(DEFAULT_AREA_TYPE);
      setMetadataJson(DEFAULT_METADATA_JSON);
      return;
    }

    setKeepoutEnabled(selectedLayer.serverEnabled ?? true);
    setKeepoutReason(selectedLayer.serverReason ?? "");
    setAreaType(selectedLayer.serverType ?? DEFAULT_AREA_TYPE);
    setMetadataJson(selectedLayer.serverMetadataJson ?? DEFAULT_METADATA_JSON);
    setLayerContext(selectedLayer.context ?? "area");
  }, [selectedLayer]);

  const mapSelectErrorMessage =
    mapImage === null && selectedMap?.sensorMapImagePath
      ? "맵 이미지를 로드할 수 없습니다."
      : "";

  const onMapSelect = useCallback(
    (value: string) => {
      const nextMapId = Number(value);
      if (!Number.isFinite(nextMapId) || nextMapId <= 0) {
        return;
      }

      setSelectedMapId(nextMapId);
      router.replace(`/world-editor?mapId=${nextMapId}`);
    },
    [router],
  );

  const setToolAndContext = useCallback(
    (nextTool: Tool) => {
      if (nextTool !== "select" && !mapImage) {
        setMessage("센서맵을 선택해야 편집 모드를 변경할 수 있습니다.");
        return;
      }

      setTool(nextTool);
    },
    [mapImage, setTool],
  );

  const selectLayerAndApplyContext = useCallback(
    (layerId: string) => {
      selectLayer(layerId);
      const next = layers.find((layer) => layer.id === layerId);
      if (next) {
        setLayerContext(next.context ?? "area");
      }
    },
    [layers, selectLayer],
  );

  const updateSelectedLayerContext = useCallback(
    (nextContext: LayerContext) => {
      setLayerContext(nextContext);
      if (!selectedLayer) return;

      const nextColor = getDefaultLayerColorByContext(nextContext);
      setLayersFromServer(
        layers.map((layer) =>
          layer.id === selectedLayer.id
            ? { ...layer, context: nextContext, color: nextColor }
            : layer,
        ),
      );
    },
    [layers, selectedLayer, setLayersFromServer],
  );

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
    [renameLayer, selectedLayer],
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
              shape: "polygon" as const,
              serverId: nextState.serverId,
              serverType: nextState.serverType,
              serverMetadataJson: nextState.serverMetadataJson,
              serverEnabled: nextState.serverEnabled,
              serverReason: nextState.serverReason,
            } as Layer
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
    mapImage,
    metadataJson,
    layers,
    selectedLayer,
    selectedMapId,
    setLayersFromServer,
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
  }, [removeLayer, selectedLayer, selectedMapId]);

  const buildWorld = useCallback(async () => {
    if (!selectedMapId) return;

    setLoading(true);
    setMessage("");

    try {
      const blob = await buildWorldImage(selectedMapId);
      if (worldImageUrl) {
        URL.revokeObjectURL(worldImageUrl);
      }
      setWorldImageUrl(URL.createObjectURL(blob));
      setMessage("빌드 완료");
    } catch {
      setMessage("빌드 실패");
    } finally {
      setLoading(false);
    }
  }, [selectedMapId, worldImageUrl]);

  return {
    mapOptions,
    selectedMapId,
    mapImage,
    layers,
    selectedId,
    selectedLayer,
    selectedMap,
    loading,
    saving,
    message: mapsError || message || mapSelectErrorMessage,
    worldImageUrl,
    areaType,
    metadataJson,
    keepoutEnabled,
    keepoutReason,
    layerContext,
    contextOptions: CONTEXT_OPTIONS,
    frameRef,
    tool,
    interactionDraftRect,
    interactionDraftPolygon,
    onCanvasPointerDown,
    startPolygonNodeDrag,
    insertPolygonPointOnEdge,
    startResize,
    toggleLayerVisible,
    removeLayer,
    clearAllLayers,
    onMapSelect,
    setToolAndContext,
    selectLayerAndApplyContext,
    updateSelectedLayerContext,
    onRename,
    saveSelectedLayer,
    deleteSelectedLayer,
    buildWorld,
    displaySize,
    gridStepPx,
    setAreaType,
    setMetadataJson,
    setKeepoutEnabled,
    setKeepoutReason,
    setLayerContext,
  };
}
