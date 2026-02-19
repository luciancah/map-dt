"use client";

import {
  ChangeEvent,
  FormEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { MapCanvas } from "@/components/MapCanvas";
import { LayerListPanel } from "@/components/LayerListPanel";
import { ScalePanel } from "@/components/ScalePanel";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useMapImageUploader } from "@/hooks/useMapImageUploader";
import { useMapScale } from "@/hooks/useMapScale";
import { useRectLayerEditor } from "@/hooks/useRectLayerEditor";
import { EDITOR_RULES } from "@/lib/map-editor/rules";

type MapDisplaySize = {
  width: number;
  height: number;
  scale: number;
};

const DESKTOP_BREAKPOINT = 1024;
const BASELINE_PANEL_WIDTH = 390;
const CANVAS_PAGE_PADDING_X = 24 * 2;
const CANVAS_TOP_PADDING_Y = 220;

const getFittedMapDisplaySize = (
  imageWidth: number,
  imageHeight: number,
  viewportWidth: number,
  viewportHeight: number,
): MapDisplaySize => {
  const reservedWidth =
    viewportWidth >= DESKTOP_BREAKPOINT ? BASELINE_PANEL_WIDTH : 0;
  const availableWidth = Math.max(
    320,
    viewportWidth - reservedWidth - CANVAS_PAGE_PADDING_X,
  );
  const availableHeight = Math.max(240, viewportHeight - CANVAS_TOP_PADDING_Y);

  const widthScale = availableWidth / imageWidth;
  const heightScale = availableHeight / imageHeight;
  const scale = Math.min(1, widthScale, heightScale);

  return {
    width: Math.max(1, Math.round(imageWidth * scale)),
    height: Math.max(1, Math.round(imageHeight * scale)),
    scale,
  };
};

export default function Home() {
  const mapInputRef = useRef<HTMLInputElement>(null);
  const {
    mapImage,
    mapError,
    loading: mapLoading,
    onFileInputChange,
    clearMapImage,
  } = useMapImageUploader();
  const {
    realWidthText,
    unit,
    realWidthError,
    gridCountText,
    gridCountError,
    gridStepPx,
    scale,
    setRealWidthText,
    setUnit,
    setGridCountText,
  } = useMapScale(mapImage?.width ?? null);

  const [viewportSize, setViewportSize] = useState(() => {
    if (typeof window === "undefined") {
      return {
        width: 1280,
        height: 720,
      };
    }

    return {
      width: window.innerWidth,
      height: window.innerHeight,
    };
  });

  const layerColorPresets = [
    "#f97316",
    "#22c55e",
    "#3b82f6",
    "#8b5cf6",
    "#ef4444",
  ];

  const mapDisplaySize = useMemo(() => {
    const baseWidth = mapImage?.width ?? EDITOR_RULES.fallbackMapWidth;
    const baseHeight = mapImage?.height ?? EDITOR_RULES.fallbackMapHeight;

    return getFittedMapDisplaySize(
      baseWidth,
      baseHeight,
      viewportSize.width,
      viewportSize.height,
    );
  }, [mapImage?.width, mapImage?.height, viewportSize]);

  useEffect(() => {
    const handleResize = () =>
      setViewportSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const {
    tool,
    setTool,
    frameRef,
    layers,
    selectedId,
    selectedLayer,
    interactionDraftRect,
    onCanvasPointerDown,
    renameLayer,
    setLayerColor,
    startResize,
    selectLayer,
    toggleLayerVisible,
    moveLayer,
    removeLayer,
    clearAllLayers,
  } = useRectLayerEditor({
    hasMapImage: Boolean(mapImage),
    mapWidth: mapImage?.width,
    mapHeight: mapImage?.height,
    gridStepPx,
    displayScale: mapDisplaySize.scale,
  });

  const [layerNameError, setLayerNameError] = useState("");

  const submitLayerName = (form: HTMLFormElement) => {
    if (!selectedLayer) return;

    const formData = new FormData(form);
    const nextName = String(formData.get("layerName") ?? "").trim();

    if (!nextName) {
      setLayerNameError("이름을 비워둘 수 없습니다.");
      return;
    }

    const changed = renameLayer(selectedLayer.id, nextName);
    if (!changed) {
      setLayerNameError("이미 존재하는 레이어 이름입니다.");
      return;
    }

    setLayerNameError("");
  };

  const handleLayerNameSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    submitLayerName(event.currentTarget);
  };

  const handleLayerSelect = (layerId: string) => {
    selectLayer(layerId);
  };

  const handleLayerColorChange = (nextColor: string) => {
    if (!selectedLayer) return;
    setLayerColor(selectedLayer.id, nextColor);
  };

  const resetMapAndLayers = () => {
    clearMapImage();
    clearAllLayers();
  };

  const handleMapFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    clearAllLayers();
    onFileInputChange(event);
  };

  return (
    <main className="min-h-screen bg-stone-100 p-4 text-stone-900 md:p-6">
      <div className="mx-auto flex w-full max-w-[1500px] flex-col gap-4 lg:flex-row">
        <section className="order-2 flex-1 space-y-3 md:order-1">
          <Card>
            <CardHeader>
              <CardTitle>Map Canvas</CardTitle>
              <CardDescription>도구 선택 후 지도 위에서 사각형을 그려보세요.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  onClick={() => setTool("select")}
                  variant={tool === "select" ? "default" : "secondary"}
                  size="sm"
                >
                  Select
                </Button>
                <Button
                  onClick={() => setTool("rect")}
                  variant={tool === "rect" ? "default" : "secondary"}
                  size="sm"
                >
                  Rectangle
                </Button>
                <Button onClick={() => mapInputRef.current?.click()} size="sm">
                  지도 업로드
                </Button>
                <Button onClick={resetMapAndLayers} variant="outline" size="sm">
                  지도 제거
                </Button>
                <span className="ml-auto text-xs text-stone-500">
                  Tool: {tool === "rect" ? "Rect Draw" : "Select/Move"}
                </span>
              </div>

              {mapImage ? (
                <p className="rounded-md bg-stone-50 px-3 py-2 text-xs text-stone-600">
                  현재 지도: {mapImage.fileName} ({mapImage.width} ×{" "}
                  {mapImage.height}px)
                </p>
              ) : null}

              {mapError ? (
                <p className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-xs text-red-700">
                  {mapError}
                </p>
              ) : null}
              {mapLoading ? (
                <p className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-700">
                  업로드 처리 중...
                </p>
              ) : null}
            </CardContent>
          </Card>

          <MapCanvas
            frameRef={frameRef}
            mapImage={mapImage}
            layers={layers}
            selectedId={selectedId}
            draftRect={interactionDraftRect}
            onPointerDown={onCanvasPointerDown}
            onResizePointerDown={startResize}
            gridStepPx={gridStepPx}
            displayWidth={mapDisplaySize.width}
            displayHeight={mapDisplaySize.height}
            displayScale={mapDisplaySize.scale}
          />
        </section>

        <aside className="order-1 flex w-full flex-col gap-4 lg:order-2 lg:w-96">
          <input
            ref={mapInputRef}
            type="file"
            accept="image/*"
            onChange={handleMapFileChange}
            className="hidden"
          />

          <ScalePanel
            mapImage={mapImage}
            realWidthText={realWidthText}
            unit={unit}
            error={realWidthError}
            onRealWidthChange={setRealWidthText}
            onUnitChange={setUnit}
            gridCountText={gridCountText}
            gridCountError={gridCountError}
            onGridCountChange={setGridCountText}
            pixelsPerMeter={scale ? scale.pixelsPerMeter : null}
            metersPerPixel={scale ? scale.metersPerPixel : null}
            pixelsPerGrid={scale ? scale.pixelsPerGrid : null}
            metersPerGrid={scale ? scale.metersPerGrid : null}
          />

          <LayerListPanel
            layers={layers}
            selectedId={selectedId}
            onSelectLayer={handleLayerSelect}
            onToggleLayerVisibility={toggleLayerVisible}
            onMoveLayer={moveLayer}
            onDeleteLayer={removeLayer}
          />

          {selectedLayer ? (
            <Card>
              <CardHeader>
                <CardTitle>선택 레이어</CardTitle>
                <CardDescription>레이어 속성 수정</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <form
                  key={selectedLayer.id}
                  onSubmit={handleLayerNameSubmit}
                  className="space-y-2"
                >
                  <Label htmlFor={`layer-name-${selectedLayer.id}`}>레이어 이름</Label>
                  <div className="flex gap-2">
                    <Input
                      id={`layer-name-${selectedLayer.id}`}
                      name="layerName"
                      defaultValue={selectedLayer.name}
                      onChange={() => {
                        setLayerNameError("");
                      }}
                      onBlur={(event) => {
                        const form = event.currentTarget.form;
                        if (form) {
                          submitLayerName(form);
                        }
                      }}
                    />
                    <Button type="submit" size="sm" className="shrink-0">
                      적용
                    </Button>
                  </div>
                  <span className="text-xs text-red-600">{layerNameError}</span>
                </form>

                <div className="space-y-1">
                  <Label htmlFor={`layer-color-${selectedLayer.id}`}>레이어 색상</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id={`layer-color-${selectedLayer.id}`}
                      type="color"
                      value={selectedLayer.color}
                      onChange={(event) =>
                        handleLayerColorChange(event.target.value)
                      }
                      className="h-9 w-20 cursor-pointer p-0"
                    />
                    <div className="flex flex-wrap gap-2">
                      {layerColorPresets.map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          aria-label={`Set color ${preset}`}
                          className="h-7 w-7 rounded-full border border-stone-300"
                          style={{ backgroundColor: preset }}
                          onClick={() => handleLayerColorChange(preset)}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                <div className="text-xs text-stone-700">
                  <p className="text-sm font-semibold text-stone-900">
                    {selectedLayer.name}
                  </p>
                  <p>
                    x: {Math.round(selectedLayer.x)}, y: {Math.round(selectedLayer.y)}
                  </p>
                  <p>
                    w: {Math.round(selectedLayer.width)}, h:{" "}
                    {Math.round(selectedLayer.height)}
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : null}
        </aside>
      </div>
    </main>
  );
}
