"use client";

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

  const selectedLayerContext = selectedLayer?.context ?? layerContext;
  const selectedMapValue = selectedMapId ? String(selectedMapId) : "";

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="space-y-0.5">
          <h2 className="text-sm font-semibold">World Editor</h2>
          <p className="text-xs text-muted-foreground">
            Map별 Area/Keepout 영역을 편집하고 월드 이미지를 생성합니다.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={buildWorld}
          disabled={loading || !mapImage}
        >
          {loading ? "빌드 중..." : "Build"}
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex flex-wrap items-center gap-2">
            컨텍스트
            {mapImage ? (
              <span className="text-xs text-muted-foreground">
                {mapImage.width} x {mapImage.height}
              </span>
            ) : null}
          </CardTitle>
          <CardDescription>편집할 맵과 레이어 컨텍스트를 선택합니다.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-2">
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
              <SelectTrigger id="map-select" className="h-8 min-w-[220px]">
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
          <div className="ml-auto text-xs text-muted-foreground">{message}</div>
        </CardContent>
      </Card>

      <div className="grid gap-4 xl:grid-cols-[1fr_360px]">
        <section className="space-y-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Canvas</CardTitle>
              <CardDescription>
                {mapImage
                  ? `${mapImage.width} x ${mapImage.height}`
                  : "센서맵이 있어야 편집 가능합니다"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex flex-wrap gap-2">
                {TOOL_OPTIONS.map((option) => (
                  <Button
                    key={option.id}
                    size="sm"
                    variant={tool === option.id ? "default" : "outline"}
                    onClick={() => setToolAndContext(option.id)}
                  >
                    {option.label}
                  </Button>
                ))}

                {contextOptions.map((option) => (
                  <Button
                    key={option.id}
                    size="sm"
                    variant={option.id === selectedLayerContext ? "secondary" : "outline"}
                    onClick={() => updateSelectedLayerContext(option.id)}
                  >
                    {option.label}
                  </Button>
                ))}
              </div>

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
                />
              ) : (
                <p className="rounded-md border border-dashed bg-card p-6 text-sm text-muted-foreground">
                  센서맵을 업로드한 Map을 선택하세요.
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Build 결과</CardTitle>
              <CardDescription>월드 이미지 빌드 출력</CardDescription>
            </CardHeader>
            <CardContent>
              {worldImageUrl ? (
                <img
                  src={worldImageUrl}
                  alt="Built world map"
                  className="max-w-full rounded border"
                />
              ) : (
                <p className="rounded-md border border-dashed bg-card p-6 text-sm text-muted-foreground">
                  Build를 실행하면 여기에 결과가 표시됩니다.
                </p>
              )}
            </CardContent>
          </Card>
        </section>

        <aside className="space-y-3">
          <LayerListPanel
            layers={layers}
            selectedId={selectedId}
            onSelectLayer={selectLayerAndApplyContext}
            onToggleLayerVisibility={toggleLayerVisible}
            onDeleteLayer={removeLayer}
          />

          {selectedLayer ? (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>선택 레이어</CardTitle>
                <CardDescription>저장용 메타데이터를 수정합니다.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
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
                    <Button type="submit" size="sm">
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
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor={`metadata-${selectedLayer.id}`}>Metadata JSON</Label>
                      <textarea
                        id={`metadata-${selectedLayer.id}`}
                        value={metadataJson}
                        onChange={(event) => setMetadataJson(event.target.value)}
                        rows={4}
                        className="w-full rounded-md border bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
                      Keepout 활성화
                    </label>
                    <div className="space-y-1.5">
                      <Label htmlFor={`reason-${selectedLayer.id}`}>Reason</Label>
                      <textarea
                        id={`reason-${selectedLayer.id}`}
                        value={keepoutReason}
                        onChange={(event) => setKeepoutReason(event.target.value)}
                        rows={4}
                        className="w-full rounded-md border bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      />
                    </div>
                  </>
                )}

                <div className="flex gap-2">
                  <Button size="sm" onClick={saveSelectedLayer} disabled={saving}>
                    {saving ? "저장 중..." : "저장"}
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={deleteSelectedLayer}
                  >
                    삭제
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : null}
        </aside>
      </div>
    </div>
  );
}
