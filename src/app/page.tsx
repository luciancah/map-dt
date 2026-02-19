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
    startResize,
    selectLayer,
    toggleLayerVisible,
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
          <div className="flex flex-wrap items-center gap-2 rounded-xl border border-stone-300 bg-white p-3">
            <button
              onClick={() => setTool("select")}
              className={`rounded-md px-3 py-1.5 text-sm font-medium ${
                tool === "select"
                  ? "bg-stone-900 text-white"
                  : "bg-stone-200 text-stone-800 hover:bg-stone-300"
              }`}
            >
              Select
            </button>
            <button
              onClick={() => setTool("rect")}
              className={`rounded-md px-3 py-1.5 text-sm font-medium ${
                tool === "rect"
                  ? "bg-orange-500 text-white"
                  : "bg-stone-200 text-stone-800 hover:bg-stone-300"
              }`}
            >
              Rectangle
            </button>
            <button
              onClick={() => mapInputRef.current?.click()}
              className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-500"
            >
              지도 업로드
            </button>
            <button
              onClick={resetMapAndLayers}
              className="rounded-md bg-stone-200 px-3 py-1.5 text-sm font-medium hover:bg-stone-300"
            >
              지도 제거
            </button>
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

          <div className="rounded-2xl border border-stone-300 bg-white p-4">
            <LayerListPanel
              layers={layers}
              selectedId={selectedId}
              onSelectLayer={handleLayerSelect}
              onToggleLayerVisibility={toggleLayerVisible}
              onDeleteLayer={removeLayer}
            />
          </div>

          {selectedLayer ? (
            <div className="rounded-md border border-stone-200 bg-white p-3 text-xs text-stone-700">
              <label className="mb-2 block">
                <span className="mb-1 block text-xs text-stone-600">레이어 이름</span>
                <form
                  key={selectedLayer.id}
                  onSubmit={handleLayerNameSubmit}
                  className="flex gap-2"
                >
                  <input
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
                    className="w-full rounded-md border border-stone-300 px-2 py-1 text-sm"
                  />
                  <button
                    type="submit"
                    className="rounded-md bg-orange-500 px-3 py-1 text-xs text-white hover:bg-orange-400"
                  >
                    적용
                  </button>
                </form>
                <span className="mt-1 block text-xs text-red-600">
                  {layerNameError}
                </span>
              </label>
              <p className="font-semibold text-stone-900">{selectedLayer.name}</p>
              <p>
                x: {Math.round(selectedLayer.x)}, y:{" "}
                {Math.round(selectedLayer.y)}
              </p>
              <p>
                w: {Math.round(selectedLayer.width)}, h:{" "}
                {Math.round(selectedLayer.height)}
              </p>
            </div>
          ) : null}
        </aside>
      </div>
    </main>
  );
}
