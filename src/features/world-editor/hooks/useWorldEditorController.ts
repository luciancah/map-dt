"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import type { MapImage, LayerContext, Tool } from "@/lib/map-editor/types";
import { useCanvasViewport } from "@/hooks/useCanvasViewport";
import { useRectLayerEditor } from "@/hooks/useRectLayerEditor";
import { useMapSelection } from "@/features/world-editor/hooks/useMapSelection";
import {
  CONTEXT_OPTIONS,
  DEFAULT_GRID_COUNT,
} from "@/features/world-editor/world-editor-constants";
import {
  buildWorldImage,
  deleteLayer,
  saveLayer,
} from "@/features/world-editor/services/world-editor-service";
import { getDefaultLayerColorByContext } from "@/lib/map-editor/layer-colors";
import { worldApi } from "@/lib/api/client";
import { useWorldEditorMapLoader } from "@/features/world-editor/hooks/useWorldEditorMapLoader";
import {
  useWorldEditorInspectorForm,
  type UseWorldEditorInspectorFormResult,
} from "@/features/world-editor/hooks/useWorldEditorInspectorForm";
import { useWorldEditorLayerMutations } from "@/features/world-editor/hooks/useWorldEditorLayerMutations";

export type WorldEditorController = ReturnType<typeof useWorldEditorController>;

const WORLD_MIN_ZOOM = 0.25;
const WORLD_MAX_ZOOM = 5;
const WORLD_ZOOM_STEP = 0.12;

export function useWorldEditorController() {
  const [mapImage, setMapImage] = useState<MapImage | null>(null);
  const [layerContext, setLayerContext] = useState<LayerContext>("area");
  const [message, setMessage] = useState("");
  const [worldImageUrl, setWorldImageUrl] = useState("");
  const [viewportZoom, setViewportZoom] = useState(1);
  const viewportRef = useRef<HTMLDivElement | null>(null);

  const resetViewport = useCallback(() => {
    setViewportZoom(1);
  }, []);

  const {
    mapOptions,
    selectedMap,
    selectedMapId,
    onMapSelect,
  } = useMapSelection();

  const displaySize = useCanvasViewport(mapImage?.width, mapImage?.height, {
    reservedWidthPx: 560,
    topPaddingPx: 210,
    minHeightPx: 320,
  });

  const effectiveScale = useMemo(
    () => displaySize.scale * viewportZoom,
    [displaySize.scale, viewportZoom],
  );

  const displayWidth = useMemo(
    () => Math.max(1, Math.round(displaySize.width * viewportZoom)),
    [displaySize.width, viewportZoom],
  );

  const displayHeight = useMemo(
    () => Math.max(1, Math.round(displaySize.height * viewportZoom)),
    [displaySize.height, viewportZoom],
  );

  const gridStepPx = mapImage?.width
    ? Math.max(1, Math.floor(mapImage.width / DEFAULT_GRID_COUNT))
    : 1;

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
    displayScale: effectiveScale,
    defaultLayerContext: layerContext,
    canvasViewportRef: viewportRef,
  });

  const handleMapImageChange = useCallback((nextMapImage: MapImage | null) => {
    setMapImage(nextMapImage);
    resetViewport();
  }, [resetViewport]);

  const mapLoader = useWorldEditorMapLoader({
    selectedMap,
    selectedMapId,
    clearAllLayers,
    setLayersFromServer,
    onMessage: setMessage,
    onMapImageChange: handleMapImageChange,
  });

  const inspectorForm: UseWorldEditorInspectorFormResult =
    useWorldEditorInspectorForm({
      selectedLayer,
      defaultLayerContext: layerContext,
    });

  const setWorldImageUrlWithCleanup = useCallback(
    (nextUrl: string) => {
      if (worldImageUrl) {
        URL.revokeObjectURL(worldImageUrl);
      }
      setWorldImageUrl(nextUrl);
    },
    [worldImageUrl],
  );

  const mutation = useWorldEditorLayerMutations({
    selectedLayer,
    selectedMapId,
    mapImage,
    layerContext,
    layers,
    areaType: inspectorForm.areaType,
    metadataJson: inspectorForm.metadataJson,
    keepoutEnabled: inspectorForm.keepoutEnabled,
    keepoutReason: inspectorForm.keepoutReason,
    setLayersFromServer,
    setMessage,
    renameLayer,
    removeLayer,
    onContextUpdated: (nextContext) => {
      setLayerContext(nextContext);
      setDefaultLayerContext(nextContext);
    },
    saveLayer,
    deleteLayer,
    buildWorldImage,
    getDefaultColorByContext: getDefaultLayerColorByContext,
    setWorldImageUrl: setWorldImageUrlWithCleanup,
    subscribeWorldStream: worldApi.subscribeStream,
  });

  const setToolAndContext = useCallback(
    (nextTool: Tool) => {
      if (nextTool !== "select" && !mapImage) {
        setMessage("센서맵을 선택해야 편집 모드를 변경할 수 있습니다.");
        return;
      }

      setTool(nextTool);
    },
    [mapImage, setMessage, setTool],
  );

  const setViewportScale = useCallback((nextZoom: number) => {
    const normalized = Math.max(
      WORLD_MIN_ZOOM,
      Math.min(WORLD_MAX_ZOOM, nextZoom),
    );
    setViewportZoom(normalized);
  }, []);

  const zoomByStep = useCallback(
    (deltaY: number) => {
      const direction = deltaY > 0 ? -1 : 1;
      setViewportScale(viewportZoom * (1 + direction * WORLD_ZOOM_STEP));
    },
    [setViewportScale, viewportZoom],
  );

  const selectLayerAndApplyContext = useCallback(
    (layerId: string) => {
      selectLayer(layerId);

      const nextLayer = layers.find((layer) => layer.id === layerId);
      const nextContext = nextLayer?.context ?? "area";
      setLayerContext(nextContext);
      inspectorForm.setSelectedLayerContext(nextContext);
      setDefaultLayerContext(nextContext);
    },
    [inspectorForm, layers, selectLayer, setDefaultLayerContext],
  );

  const updateSelectedLayerContext = useCallback(
    (nextContext: LayerContext) => {
      setLayerContext(nextContext);
      inspectorForm.setSelectedLayerContext(nextContext);
      setDefaultLayerContext(nextContext);
      mutation.updateSelectedLayerContext(nextContext);
    },
    [inspectorForm, mutation, setDefaultLayerContext],
  );

  const onRename = useCallback(
    (event: React.FormEvent<HTMLFormElement>) => {
      mutation.onRename(event);
    },
    [mutation],
  );

  const saveSelectedLayer = useCallback(async () => {
    await mutation.saveSelectedLayer();
  }, [mutation]);

  const deleteSelectedLayer = useCallback(async () => {
    await mutation.deleteSelectedLayer();
  }, [mutation]);

  const buildWorld = useCallback(async () => {
    await mutation.buildWorld();
  }, [mutation]);

  return {
    mapOptions,
    selectedMapId,
    mapImage,
    layers,
    selectedId,
    selectedLayer,
    selectedMap,
    loading: mapLoader.loading || mutation.saving,
    saving: mutation.saving,
    message,
    worldImageUrl,
    buildStreamEvents: mutation.buildStreamEvents,
    isBuildStreaming: mutation.isBuildStreaming,
    areaType: inspectorForm.areaType,
    metadataJson: inspectorForm.metadataJson,
    keepoutEnabled: inspectorForm.keepoutEnabled,
    keepoutReason: inspectorForm.keepoutReason,
    layerContext,
    contextOptions: CONTEXT_OPTIONS,
    frameRef,
    viewportRef,
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
    zoom: viewportZoom,
    setZoom: setViewportScale,
    zoomByStep,
    worldMinZoom: WORLD_MIN_ZOOM,
    worldMaxZoom: WORLD_MAX_ZOOM,
    worldZoomStep: WORLD_ZOOM_STEP,
    displayWidth,
    displayHeight,
    baseDisplayScale: displaySize.scale,
    effectiveScale,
    resetViewport,
    selectLayerAndApplyContext,
    updateSelectedLayerContext,
    onRename,
    saveSelectedLayer,
    deleteSelectedLayer,
    buildWorld,
    displaySize,
    gridStepPx,
    setAreaType: inspectorForm.setAreaType,
    setMetadataJson: inspectorForm.setMetadataJson,
    setKeepoutEnabled: inspectorForm.setKeepoutEnabled,
    setKeepoutReason: inspectorForm.setKeepoutReason,
    setLayerContext,
    reloadMap: mapLoader.reloadMap,
  };
}
