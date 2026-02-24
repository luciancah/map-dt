"use client";

import { useState } from "react";
import { Dialog } from "@/components/ui/dialog";
import { MapCanvas } from "@/components/MapCanvas";
import { LayerListPanel } from "@/components/LayerListPanel";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useWorldEditorController } from "@/features/world-editor/hooks/useWorldEditorController";
import { TOOL_OPTIONS } from "@/features/world-editor/world-editor-constants";

export default function WorldEditorPage() {
  const {
    areaType,
    buildWorld,
    contextOptions,
    deleteSelectedLayer,
    displaySize,
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
    worldImageUrl,
    frameRef,
    tool,
    setToolAndContext,
    selectLayerAndApplyContext,
  } = useWorldEditorController();

  const [buildResultOpen, setBuildResultOpen] = useState(false);
  const selectedLayerContext = selectedLayer?.context ?? layerContext;
  const selectedMapValue = selectedMapId ? String(selectedMapId) : "";

  const handleBuild = async () => {
    await buildWorld();
    setBuildResultOpen(true);
  };

  return (
    <>
      <Dialog
        open={buildResultOpen && Boolean(worldImageUrl)}
        onOpenChange={setBuildResultOpen}
        title="Build 결과"
        description="월드 빌드 결과 이미지를 확인하세요."
      >
        <div className="space-y-3">
          {worldImageUrl ? (
            <img
              src={worldImageUrl}
              alt="Built world map"
              className="max-h-[70vh] w-full rounded-md border object-contain"
            />
          ) : (
            <p className="rounded-md border border-dashed bg-card px-4 py-6 text-sm text-muted-foreground">
              Build를 실행하면 결과가 표시됩니다.
            </p>
          )}
          <div className="flex justify-end gap-2">
            <Button size="sm" variant="outline" onClick={() => setBuildResultOpen(false)}>
              닫기
            </Button>
          </div>
        </div>
      </Dialog>

      <div className="h-[calc(100dvh-3.5rem)] min-h-0">
        <div className="grid h-full min-h-0 gap-3 grid-cols-1 lg:grid-cols-[320px_minmax(0,1fr)_340px]">
          <aside className="flex min-h-0">
            <Card className="flex min-h-0 h-full w-full flex-col border-stone-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Canvas Context</CardTitle>
                <CardDescription>
                  맵 선택 후 레이어를 편집하고 Build하세요.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="map-select" className="text-sm text-muted-foreground">
                    Map
                  </Label>
                  {mapOptions.length === 0 ? (
                    <p className="text-xs text-muted-foreground">맵이 없습니다.</p>
                  ) : (
                    <Select
                      value={selectedMapValue || undefined}
                      onValueChange={onMapSelect}
                      disabled={loading}
                    >
                      <SelectTrigger id="map-select" className="h-9 w-full">
                        <SelectValue placeholder="맵 선택" />
                      </SelectTrigger>
                      <SelectContent>
                        {mapOptions.map((item) => (
                          <SelectItem key={item.id} value={String(item.id)}>
                            {item.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  {mapImage ? (
                    <p className="text-xs text-muted-foreground">
                      원본 크기: {mapImage.width} x {mapImage.height}
                    </p>
                  ) : null}
                </div>

                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">레이어 컨텍스트</Label>
                  <div className="flex flex-wrap gap-2">
                    {contextOptions.map((option) => (
                      <Button
                        key={option.id}
                        size="sm"
                        variant={option.id === selectedLayerContext ? "secondary" : "outline"}
                        className="rounded-none"
                        onClick={() => updateSelectedLayerContext(option.id)}
                      >
                        {option.label}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="pt-1">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleBuild}
                    disabled={loading || !mapImage}
                    className="w-full rounded-none"
                  >
                    {loading ? "빌드 중..." : "Build"}
                  </Button>
                  <p className="mt-2 text-xs text-muted-foreground">{message}</p>
                </div>
              </CardContent>

              <div className="mt-auto min-h-0 flex-1 overflow-hidden border-t border-stone-200 px-3 py-3">
                <LayerListPanel
                  layers={layers}
                  selectedId={selectedId}
                  onSelectLayer={selectLayerAndApplyContext}
                  onToggleLayerVisibility={toggleLayerVisible}
                  onDeleteLayer={removeLayer}
                  className="h-full min-h-0 border-0"
                />
              </div>
            </Card>
          </aside>

          <section className="relative min-h-0 h-full">
            <Card className="relative h-full min-h-0 w-full overflow-hidden border-stone-300">
              <div className="pointer-events-none absolute inset-x-0 top-4 z-10 flex justify-center px-4">
                <div className="pointer-events-auto flex flex-wrap items-center gap-2 rounded-none border border-stone-300 bg-white/95 px-2 py-1 shadow-sm">
                  {TOOL_OPTIONS.map((option) => (
                    <Button
                      key={option.id}
                      size="sm"
                      variant={tool === option.id ? "default" : "outline"}
                      className="rounded-none"
                      onClick={() => setToolAndContext(option.id)}
                    >
                      {option.label}
                    </Button>
                  ))}
                </div>
              </div>

              <CardContent className="h-full min-h-0">
                {mapImage ? (
                  <MapCanvas
                    frameRef={frameRef}
                    mapImage={mapImage}
                    layers={layers}
                    selectedId={selectedId}
                    draftRect={interactionDraftRect}
                    draftPolygon={interactionDraftPolygon}
                    onPointerDown={onCanvasPointerDown}
                    onPolygonNodePointerDown={startPolygonNodeDrag}
                    onPolygonEdgePointerDown={insertPolygonPointOnEdge}
                    onResizePointerDown={startResize}
                    onPoiDirectionPointerDown={() => {}}
                    tool={tool}
                    gridStepPx={gridStepPx}
                    displayWidth={displaySize.width}
                    displayHeight={displaySize.height}
                    displayScale={displaySize.scale}
                    className="h-full"
                  />
                ) : (
                  <p className="rounded-md border border-dashed bg-card p-6 text-sm text-muted-foreground">
                    센서맵을 업로드한 Map을 선택하세요.
                  </p>
                  )}
              </CardContent>
            </Card>
          </section>

          <aside className="flex min-h-0">
            <Card className="flex min-h-0 h-full w-full flex-col border-stone-200">
              <CardHeader className="pb-2">
                <CardTitle>Inspector</CardTitle>
                <CardDescription>레이어 메타데이터를 수정합니다.</CardDescription>
              </CardHeader>

              {selectedLayer ? (
                <CardContent className="min-h-0 flex-1 space-y-3 overflow-auto">
                  <form
                    key={selectedLayer.id}
                    onSubmit={onRename}
                    className="space-y-2"
                  >
                    <Label htmlFor={`layer-${selectedLayer.id}-name`}>이름</Label>
                    <div className="flex gap-2">
                      <Input
                        id={`layer-${selectedLayer.id}-name`}
                        name="layerName"
                        defaultValue={selectedLayer.name}
                        className="flex-1"
                      />
                      <Button type="submit" size="sm" className="rounded-none">
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
                          className="rounded-none"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor={`metadata-${selectedLayer.id}`}>Metadata JSON</Label>
                        <textarea
                          id={`metadata-${selectedLayer.id}`}
                          value={metadataJson}
                          onChange={(event) => setMetadataJson(event.target.value)}
                          rows={6}
                          className="min-h-0 w-full rounded-md border bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
                    <Button
                      size="sm"
                      className="rounded-none"
                      onClick={saveSelectedLayer}
                      disabled={saving}
                    >
                      {saving ? "저장 중..." : "저장"}
                    </Button>
                    <Button
                      size="sm"
                      className="rounded-none"
                      variant="destructive"
                      onClick={deleteSelectedLayer}
                    >
                      삭제
                    </Button>
                  </div>
                </CardContent>
              ) : (
                <CardContent className="min-h-0 flex-1">
                  <p className="rounded-md border border-dashed bg-card p-4 text-sm text-muted-foreground">
                    레이어를 선택하면 속성 편집이 가능합니다.
                  </p>
                </CardContent>
              )}
            </Card>
          </aside>
        </div>
      </div>
    </>
  );
}
