"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { MainNav } from "@/components/navigation/MainNav";
import { MapCanvas } from "@/components/MapCanvas";
import { LayerListPanel } from "@/components/LayerListPanel";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCanvasViewport } from "@/hooks/useCanvasViewport";
import { useRectLayerEditor } from "@/hooks/useRectLayerEditor";
import { toApiVertices } from "@/lib/map-editor/coords";
import type { Layer, LayerContext, MapImage, Tool } from "@/lib/map-editor/types";
import { mapServerShapeToLayer } from "@/lib/map-editor/sync";
import { areaApi, keepoutApi, mapApi, worldApi } from "@/lib/api/client";
import type { AreaEntity, KeepoutEntity, MapEntity } from "@/lib/api/types";

const TOOL_OPTIONS: { id: Tool; label: string }[] = [
  { id: "select", label: "선택" },
  { id: "rect", label: "사각형" },
  { id: "polygon", label: "폴리곤" },
];

const CONTEXT_OPTIONS: Array<{ id: LayerContext; label: string }> = [
  { id: "area", label: "Area" },
  { id: "keepout", label: "Keepout" },
];

type EditableMap = MapEntity & { sensorMapImagePath?: string | null };
export default function WorldEditorPage() {
  const router = useRouter();

  const [maps, setMaps] = useState<EditableMap[]>([]);
  const [mapsError, setMapsError] = useState("");
  const [selectedMapId, setSelectedMapId] = useState<number | null>(null);
  const [mapImage, setMapImage] = useState<MapImage | null>(null);
  const [layerContext, setLayerContext] = useState<LayerContext>("area");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [areaType, setAreaType] = useState("NORMAL");
  const [metadataJson, setMetadataJson] = useState("{}");
  const [keepoutEnabled, setKeepoutEnabled] = useState(true);
  const [keepoutReason, setKeepoutReason] = useState("");
  const [worldImageUrl, setWorldImageUrl] = useState("");

  const displaySize = useCanvasViewport(mapImage?.width, mapImage?.height);
  const gridStepPx = mapImage?.width ? Math.max(1, Math.floor(mapImage.width / 64)) : 1;

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

  const loadMapImage = async (mapId: number) => {
    const response = await fetch(mapApi.getSensorMapUrl(mapId));
    if (!response.ok) {
      throw new Error("센서맵을 불러올 수 없습니다.");
    }

    const blob = await response.blob();
    const src = URL.createObjectURL(blob);
    const size = await new Promise<{ width: number; height: number }>((resolve, reject) => {
      const image = new Image();
      image.onload = () =>
        resolve({ width: image.naturalWidth, height: image.naturalHeight });
      image.onerror = () => reject(new Error("센서맵 이미지 크기 확인 실패"));
      image.src = src;
    });

    return { src, ...size };
  };

  const loadShapes = useCallback(async (mapId: number, mapHeightPx: number) => {
    const [areaList, keepoutList] = await Promise.all([
      areaApi.list(mapId).catch(() => [] as AreaEntity[]),
      keepoutApi.list(mapId).catch(() => [] as KeepoutEntity[]),
    ]);

    const areas = areaList.map((area, index) =>
      mapServerShapeToLayer(area, "area", index, mapHeightPx),
    );
    const keepouts = keepoutList.map((keepout, index) =>
      mapServerShapeToLayer(keepout, "keepout", index, mapHeightPx),
    );
    return [...areas, ...keepouts];
  }, []);

  useEffect(() => {
    const loadMaps = async () => {
      const list = await mapApi.list();
      setMaps(list);
      return list;
    };

    loadMaps().catch((caught) => {
      setMapsError(caught instanceof Error ? caught.message : "맵 목록 조회 실패");
    });
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const params = new URLSearchParams(window.location.search);
    const queryMapId = Number(params.get("mapId") || "");
    if (Number.isFinite(queryMapId) && queryMapId > 0) {
      setSelectedMapId(queryMapId);
    } else if (maps.length > 0 && !selectedMapId) {
      setSelectedMapId(maps[0]!.id);
      router.push(`/world-editor?mapId=${maps[0]!.id}`);
    }
  }, [maps, router, selectedMapId]);

  useEffect(() => {
    if (!selectedMapId) {
      clearAllLayers();
      setMapImage(null);
      setWorldImageUrl("");
      return;
    }

    const selectedMap = maps.find((item) => item.id === selectedMapId);
    if (!selectedMap) {
      return;
    }

    if (!selectedMap.sensorMapImagePath) {
      setMapImage(null);
      setMessage("센서맵이 없습니다.");
      clearAllLayers();
      return;
    }

    let objectUrl = "";
    let disposed = false;
    setLoading(true);
    setMessage("");
    setWorldImageUrl("");

    const load = async () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
      clearAllLayers();

      const loadedImage = await loadMapImage(selectedMapId);
      if (disposed) {
        URL.revokeObjectURL(loadedImage.src);
        return;
      }

      objectUrl = loadedImage.src;
      const mapAsset: MapImage = {
        id: String(selectedMapId),
        fileName: selectedMap.name,
        src: loadedImage.src,
        width: loadedImage.width,
        height: loadedImage.height,
      };
      setMapImage(mapAsset);

      const nextLayers = await loadShapes(selectedMapId, loadedImage.height);
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
  }, [clearAllLayers, loadShapes, maps, selectedMapId, setLayersFromServer]);

  useEffect(() => {
    setDefaultLayerContext(layerContext);
  }, [layerContext, setDefaultLayerContext]);

  useEffect(() => {
    if (!selectedLayer) {
      setKeepoutEnabled(true);
      setKeepoutReason("");
      setAreaType("NORMAL");
      setMetadataJson("{}");
      return;
    }

    setKeepoutEnabled(selectedLayer.serverEnabled ?? true);
    setKeepoutReason(selectedLayer.serverReason ?? "");
    setAreaType(selectedLayer.serverType ?? "NORMAL");
    setMetadataJson(selectedLayer.serverMetadataJson ?? "{}");
    setLayerContext(selectedLayer.context ?? "area");
  }, [selectedLayer]);

  const onMapSelect = (value: string) => {
    const nextMapId = Number(value);
    setSelectedMapId(nextMapId);
    router.push(`/world-editor?mapId=${nextMapId}`);
  };

  const setToolAndContext = (nextTool: Tool) => {
    if (nextTool !== "select" && !mapImage) {
      setMessage("센서맵을 선택해야 편집 모드를 변경할 수 있습니다.");
      return;
    }
    setTool(nextTool);
  };

  const ensurePolygonLayer = (layer: Layer): Layer => {
    if (layer.shape === "polygon" && layer.points && layer.points.length >= 3) {
      return layer;
    }

    if (layer.shape !== "rect") {
      return layer;
    }

    const converted: Layer = {
      ...layer,
      shape: "polygon",
      points: [
        { x: layer.x, y: layer.y },
        { x: layer.x + layer.width, y: layer.y },
        { x: layer.x + layer.width, y: layer.y + layer.height },
        { x: layer.x, y: layer.y + layer.height },
      ],
    };

    const nextLayers = layers.map((currentLayer) =>
      currentLayer.id === layer.id ? converted : currentLayer,
    );
    setLayersFromServer(nextLayers);
    return converted;
  };

  const selectLayerAndApplyContext = (layerId: string) => {
    selectLayer(layerId);
    const next = layers.find((layer) => layer.id === layerId);
    if (next) {
      setLayerContext(next.context ?? "area");
    }
  };

  const updateSelectedLayerContext = (nextContext: LayerContext) => {
    if (!selectedLayer) {
      setLayerContext(nextContext);
      return;
    }
    const nextLayers = layers.map((layer) =>
      layer.id === selectedLayer.id
        ? { ...layer, context: nextContext }
        : layer,
    );
    setLayersFromServer(nextLayers);
    setLayerContext(nextContext);
  };

  const onRename = (event: FormEvent<HTMLFormElement>) => {
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
  };

  const saveSelectedLayer = async () => {
    if (!selectedLayer || !selectedMapId) return;
    const polygonLayer = ensurePolygonLayer(selectedLayer);
    if (polygonLayer.shape !== "polygon" || !polygonLayer.points?.length) {
      setMessage("폴리곤 좌표 생성에 실패했습니다.");
      return;
    }

    const context = polygonLayer.context ?? layerContext;
    const verticesJson = toApiVertices(polygonLayer, mapImage?.height ?? 0);
    const payloadName = polygonLayer.name.trim();
    setSaving(true);
    setMessage("");

    try {
      if (context === "area") {
        const basePayload = {
          name: payloadName,
          type: areaType || null,
          verticesJson,
          metadataJson,
        };
        if (polygonLayer.serverId) {
          await areaApi.update(selectedMapId, polygonLayer.serverId, basePayload);
        } else {
          const created = await areaApi.create(selectedMapId, basePayload);
          const nextLayers = layers.map((layer) =>
            layer.id === polygonLayer.id
              ? {
                  ...layer,
                  context,
                  shape: "polygon",
                  points: polygonLayer.points,
                  serverId: created.id,
                  serverType: basePayload.type,
                  serverMetadataJson: basePayload.metadataJson,
                  serverEnabled: true,
                }
              : layer,
          );
          setLayersFromServer(nextLayers);
        }
      } else {
        const basePayload = {
          name: payloadName,
          verticesJson,
          enabled: keepoutEnabled,
          reason: keepoutReason || null,
        };
        if (polygonLayer.serverId) {
          await keepoutApi.update(selectedMapId, polygonLayer.serverId, basePayload);
        } else {
          const created = await keepoutApi.create(selectedMapId, basePayload);
          const nextLayers = layers.map((layer) =>
            layer.id === polygonLayer.id
              ? {
                  ...layer,
                  context,
                  shape: "polygon",
                  points: polygonLayer.points,
                  serverId: created.id,
                  serverEnabled: basePayload.enabled,
                  serverReason: basePayload.reason,
                }
              : layer,
          );
          setLayersFromServer(nextLayers);
        }
      }

      setMessage("저장했습니다.");
    } catch {
      setMessage("저장 실패");
    } finally {
      setSaving(false);
    }
  };

  const deleteSelectedLayer = async () => {
    if (!selectedLayer || !selectedMapId) return;

    if (!selectedLayer.serverId) {
      removeLayer(selectedLayer.id);
      return;
    }

    try {
      if (selectedLayer.context === "keepout") {
        await keepoutApi.remove(selectedMapId, selectedLayer.serverId);
      } else {
        await areaApi.remove(selectedMapId, selectedLayer.serverId);
      }
      removeLayer(selectedLayer.id);
      setMessage("삭제했습니다.");
    } catch {
      setMessage("삭제 실패");
    }
  };

  const buildWorld = async () => {
    if (!selectedMapId) return;
    setLoading(true);
    setMessage("");

    try {
      await worldApi.build(selectedMapId);
      const blob = await worldApi.getImage(selectedMapId);
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
  };

  return (
    <main className="min-h-screen bg-stone-100 p-4 text-stone-900 md:p-6">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-4">
        <MainNav />
        <Card>
          <CardHeader>
            <CardTitle>World Editor</CardTitle>
            <CardDescription>
              Map별 Area/Keepout 영역을 편집하고 /world/{`{mapId}`}/build를 실행합니다.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap items-center gap-2">
            <Label htmlFor="map-select">Map</Label>
            <select
              id="map-select"
              className="h-9 rounded-md border border-stone-300 px-3"
              value={selectedMapId ?? ""}
              onChange={(event) => onMapSelect(event.target.value)}
            >
              {mapOptions.map((map) => (
                <option key={map.id} value={map.id}>
                  {map.name}
                </option>
              ))}
            </select>
            <Button variant="secondary" size="sm" onClick={buildWorld} disabled={loading || !mapImage}>
              {loading ? "빌드 중..." : "Build"}
            </Button>
            {mapsError ? <p className="text-xs text-red-600">{mapsError}</p> : null}
            {message ? <p className="text-xs text-stone-700">{message}</p> : null}
          </CardContent>
        </Card>

        <div className="grid gap-4 xl:grid-cols-[1fr_380px]">
          <section className="space-y-3">
            <Card>
              <CardHeader>
                <CardTitle>Canvas</CardTitle>
                <CardDescription>
                  {mapImage
                    ? `${mapImage.width} x ${mapImage.height}`
                    : "센서맵이 있어야 편집 가능합니다"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
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
                  {CONTEXT_OPTIONS.map((context) => (
                    <Button
                      key={context.id}
                      size="sm"
                      variant={layerContext === context.id ? "secondary" : "outline"}
                      onClick={() => updateSelectedLayerContext(context.id)}
                    >
                      {context.label}
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
                  <p className="rounded-md border border-dashed border-stone-200 bg-white p-3 text-sm text-stone-500">
                    센서맵을 업로드한 Map을 선택하세요.
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Build 결과</CardTitle>
              </CardHeader>
              <CardContent>
                {worldImageUrl ? (
                  <img
                    src={worldImageUrl}
                    alt="Built world map"
                    className="max-w-full rounded border"
                  />
                ) : (
                  <p className="rounded-md border border-dashed border-stone-200 bg-white p-3 text-sm text-stone-500">
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
                <CardHeader>
                  <CardTitle>선택 레이어</CardTitle>
                  <CardDescription>BE 저장용 메타데이터를 입력하세요.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <form onSubmit={onRename} className="space-y-2">
                    <Label htmlFor={`layer-${selectedLayer.id}-name`}>이름</Label>
                    <div className="flex gap-2">
                      <Input
                        id={`layer-${selectedLayer.id}-name`}
                        name="layerName"
                        defaultValue={selectedLayer.name}
                        onChange={() => setMessage("")}
                        className="flex-1"
                      />
                      <Button type="submit" size="sm">
                        적용
                      </Button>
                    </div>
                  </form>

                  {selectedLayer.context === "area" ? (
                    <>
                      <div>
                        <Label htmlFor={`type-${selectedLayer.id}`}>Area Type</Label>
                        <Input
                          id={`type-${selectedLayer.id}`}
                          value={areaType}
                          onChange={(event) => setAreaType(event.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor={`metadata-${selectedLayer.id}`}>Metadata JSON</Label>
                        <textarea
                          id={`metadata-${selectedLayer.id}`}
                          value={metadataJson}
                          onChange={(event) => setMetadataJson(event.target.value)}
                          rows={4}
                          className="w-full rounded-md border border-stone-300 px-3 py-2"
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
                      <div>
                        <Label htmlFor={`reason-${selectedLayer.id}`}>Reason</Label>
                        <textarea
                          id={`reason-${selectedLayer.id}`}
                          value={keepoutReason}
                          onChange={(event) => setKeepoutReason(event.target.value)}
                          rows={4}
                          className="w-full rounded-md border border-stone-300 px-3 py-2"
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

        <Link href="/maps">
          <Button variant="ghost">맵 목록으로</Button>
        </Link>
      </div>
    </main>
  );
}
