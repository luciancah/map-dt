"use client";

import { useEffect, useState } from "react";
import { BuildResultDialog } from "@/features/world-editor/components/BuildResultDialog";
import { WorldEditorCanvasPane } from "@/features/world-editor/components/WorldEditorCanvasPane";
import { WorldEditorInspectorPanel } from "@/features/world-editor/components/WorldEditorInspectorPanel";
import { WorldEditorLeftPanel } from "@/features/world-editor/components/WorldEditorLeftPanel";
import { WorldEditorStatusBar } from "@/features/world-editor/components/WorldEditorStatusBar";
import { useWorldEditorController } from "@/features/world-editor/hooks/useWorldEditorController";

export function WorldEditorPageClient() {
  const {
    areaType,
    buildWorld,
    contextOptions,
    deleteSelectedLayer,
    displayWidth,
    displayHeight,
    gridStepPx,
    interactionDraftPolygon,
    interactionDraftRect,
    insertPolygonPointOnEdge,
    keepoutEnabled,
    keepoutReason,
    layerContext,
    layers,
    loading,
    mapImage,
    mapOptions,
    message,
    metadataJson,
    onCanvasPointerDown,
    onMapSelect,
    onRename,
    removeLayer,
    saveSelectedLayer,
    saving,
    selectedId,
    selectedLayer,
    selectedMapId,
    setAreaType,
    setKeepoutEnabled,
    setKeepoutReason,
    setMetadataJson,
    startPolygonNodeDrag,
    startResize,
    toggleLayerVisible,
    updateSelectedLayerContext,
    buildStreamEvents,
    isBuildStreaming,
    worldImageUrl,
    frameRef,
    tool,
    setToolAndContext,
    selectLayerAndApplyContext,
    viewportRef,
    zoomByStep: onZoomByStep,
    effectiveScale,
  } = useWorldEditorController();

  const [buildResultOpen, setBuildResultOpen] = useState(false);
  const selectedLayerContext = selectedLayer?.context ?? layerContext;
  const selectedMapValue = selectedMapId == null ? "" : String(selectedMapId);

  const handleBuild = async () => {
    await buildWorld();
    setBuildResultOpen(true);
  };

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    viewport.scrollTo({ left: 0, top: 0, behavior: "auto" });
  }, [mapImage, viewportRef]);

  return (
    <>
      <BuildResultDialog
        open={buildResultOpen}
        onOpenChange={setBuildResultOpen}
        worldImageUrl={worldImageUrl}
      />

      <div className="flex h-[calc(100dvh-4rem)] w-full min-h-0 flex-col bg-background">
        <div className="grid min-h-0 flex-1 grid-cols-1 xl:grid-cols-[260px_minmax(0,1fr)_280px]">
          <aside className="min-h-0">
            <WorldEditorLeftPanel
              mapOptions={mapOptions}
              selectedMapValue={selectedMapValue}
              loading={loading}
              mapImage={mapImage}
              buildStreamEvents={buildStreamEvents}
              isBuildStreaming={isBuildStreaming}
              contextOptions={contextOptions}
              selectedLayerContext={selectedLayerContext}
              onMapSelect={onMapSelect}
              onUpdateLayerContext={updateSelectedLayerContext}
              onBuild={handleBuild}
              buildDisabled={loading || !mapImage}
              layers={layers}
              selectedId={selectedId}
              onSelectLayer={selectLayerAndApplyContext}
              onToggleLayerVisibility={toggleLayerVisible}
              onDeleteLayer={removeLayer}
            />
          </aside>

          <section className="min-h-0">
            <WorldEditorCanvasPane
              mapImage={mapImage}
              tool={tool}
              onToolSelect={setToolAndContext}
              frameRef={frameRef}
              layers={layers}
              selectedId={selectedId}
              draftRect={interactionDraftRect}
              draftPolygon={interactionDraftPolygon}
              onPointerDown={onCanvasPointerDown}
              onPolygonNodePointerDown={startPolygonNodeDrag}
              onPolygonEdgePointerDown={insertPolygonPointOnEdge}
              onResizePointerDown={startResize}
              viewportRef={viewportRef}
              onZoomByStep={onZoomByStep}
              displayWidth={displayWidth}
              displayHeight={displayHeight}
              effectiveScale={effectiveScale}
              gridStepPx={gridStepPx}
            />
          </section>

          <aside className="min-h-0">
            <WorldEditorInspectorPanel
              selectedLayer={selectedLayer}
              selectedLayerContext={selectedLayerContext}
              areaType={areaType}
              metadataJson={metadataJson}
              keepoutEnabled={keepoutEnabled}
              keepoutReason={keepoutReason}
              saving={saving}
              onRename={onRename}
              setAreaType={setAreaType}
              setMetadataJson={setMetadataJson}
              setKeepoutEnabled={setKeepoutEnabled}
              setKeepoutReason={setKeepoutReason}
              saveSelectedLayer={saveSelectedLayer}
              deleteSelectedLayer={deleteSelectedLayer}
            />
          </aside>
        </div>

        <WorldEditorStatusBar
          message={message}
          layers={layers}
          selectedId={selectedId}
          displayScale={effectiveScale}
          mapImage={mapImage}
        />
      </div>
    </>
  );
}
