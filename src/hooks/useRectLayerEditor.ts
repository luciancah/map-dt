import {
  MutableRefObject,
  PointerEvent as ReactPointerEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  DraftRect,
  Interaction,
  Layer,
  Point,
  ResizeHandle,
  Tool,
} from "@/lib/map-editor/types";
import { EDITOR_RULES } from "@/lib/map-editor/rules";

type UseRectLayerEditor = {
  tool: Tool;
  setTool: (tool: Tool) => void;
  frameRef: MutableRefObject<HTMLDivElement | null>;
  layers: Layer[];
  selectedId: string | null;
  selectedLayer: Layer | null;
  interactionDraftRect: DraftRect | null;
  onCanvasPointerDown: (event: ReactPointerEvent<HTMLDivElement>) => void;
  renameLayer: (layerId: string, nextName: string) => boolean;
  setLayerColor: (layerId: string, nextColor: string) => void;
  startResize: (
    event: ReactPointerEvent<HTMLButtonElement>,
    layer: Layer,
    handle: ResizeHandle,
  ) => void;
  selectLayer: (layerId: string | null) => void;
  toggleLayerVisible: (layerId: string) => void;
  removeLayer: (layerId: string) => void;
  moveLayer: (layerId: string, direction: "up" | "down") => void;
  clearAllLayers: () => void;
};

type UseRectLayerEditorOptions = {
  hasMapImage: boolean;
  mapWidth?: number | null;
  mapHeight?: number | null;
  gridStepPx?: number | null;
  displayScale?: number;
};

const clamp = (value: number, min: number, max: number) => {
  return Math.max(min, Math.min(max, value));
};

const normalizeRect = (
  startX: number,
  startY: number,
  endX: number,
  endY: number,
) => {
  const left = Math.min(startX, endX);
  const top = Math.min(startY, endY);
  const width = Math.abs(endX - startX);
  const height = Math.abs(endY - startY);
  return { left, top, width, height };
};

const normalizeLayerName = (value: string) => value.trim();

const normalizeLayerNameForCompare = (value: string) =>
  normalizeLayerName(value).toLowerCase();

const makeUniqueLayerName = (
  layers: Layer[],
  baseName: string,
  excludedLayerId?: string,
) => {
  const normalizedBase = normalizeLayerName(baseName);
  if (!normalizedBase) return "";

  const existing = new Set(
    layers
      .filter((layer) => layer.id !== excludedLayerId)
      .map((layer) => normalizeLayerNameForCompare(layer.name)),
  );

  if (!existing.has(normalizeLayerNameForCompare(normalizedBase))) {
    return normalizedBase;
  }

  for (let index = 1; index <= layers.length + 1; index += 1) {
    const candidate = `${normalizedBase} ${index}`;
    if (!existing.has(normalizeLayerNameForCompare(candidate))) {
      return candidate;
    }
  }

  return `${normalizedBase} ${Date.now()}`;
};

const DEFAULT_LAYER_COLOR = "#ff7e36";

export function useRectLayerEditor({
  hasMapImage,
  mapWidth,
  mapHeight,
  gridStepPx,
  displayScale = 1,
}: UseRectLayerEditorOptions): UseRectLayerEditor {
  const frameRef = useRef<HTMLDivElement>(null);
  const [tool, setToolState] = useState<Tool>("rect");
  const [layers, setLayers] = useState<Layer[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [interaction, setInteraction] = useState<Interaction | null>(null);

  const setTool = useCallback((next: Tool) => {
    setToolState(next);
    setInteraction(null);
  }, []);

  const clampInsideMapX = useCallback(
    (value: number, width: number, boundaryWidth?: number | null) => {
      const maxWidth = boundaryWidth ?? mapWidth ?? 0;
      return clamp(value, 0, Math.max(0, maxWidth - width));
    },
    [mapWidth],
  );

  const clampInsideMapY = useCallback(
    (value: number, height: number, boundaryHeight?: number | null) => {
      const maxHeight = boundaryHeight ?? mapHeight ?? 0;
      return clamp(value, 0, Math.max(0, maxHeight - height));
    },
    [mapHeight],
  );

  const snapToGrid = useCallback(
    (value: number) => {
      if (!gridStepPx || !Number.isFinite(gridStepPx) || gridStepPx <= 0) {
        return value;
      }
      return Math.round(value / gridStepPx) * gridStepPx;
    },
    [gridStepPx],
  );

  const getLocalPoint = useCallback(
    (event: { clientX: number; clientY: number }) => {
      const pixelScale = Number.isFinite(displayScale) && displayScale > 0 ? displayScale : 1;
      const frame = frameRef.current;
      if (!frame) return null;
      const bounds = frame.getBoundingClientRect();
      const point: Point = {
        x: clamp(
          (event.clientX - bounds.left) / pixelScale,
          0,
          bounds.width / pixelScale,
        ),
        y: clamp(
          (event.clientY - bounds.top) / pixelScale,
          0,
          bounds.height / pixelScale,
        ),
      } satisfies Point;
      return {
        x: snapToGrid(point.x),
        y: snapToGrid(point.y),
      };
    },
    [displayScale, snapToGrid],
  );

  const snapRect = useCallback(
    (rect: DraftRect) => {
      const boundaryWidth = mapWidth ?? rect.width;
      const boundaryHeight = mapHeight ?? rect.height;
      const snappedWidth = snapToGrid(rect.width);
      const snappedHeight = snapToGrid(rect.height);
      const width = clamp(
        snappedWidth,
        EDITOR_RULES.minShapeSize,
        Math.max(
          EDITOR_RULES.minShapeSize,
          boundaryWidth - snapToGrid(rect.left),
        ),
      );
      const height = clamp(
        snappedHeight,
        EDITOR_RULES.minShapeSize,
        Math.max(
          EDITOR_RULES.minShapeSize,
          boundaryHeight - snapToGrid(rect.top),
        ),
      );
      const left = clamp(
        snapToGrid(rect.left),
        0,
        Math.max(0, boundaryWidth - width),
      );
      const top = clamp(
        snapToGrid(rect.top),
        0,
        Math.max(0, boundaryHeight - height),
      );
      return { left, top, width, height };
    },
    [mapHeight, mapWidth, snapToGrid],
  );

  const getResizedRectByHandle = useCallback(
    (
      baseX: number,
      baseY: number,
      baseWidth: number,
      baseHeight: number,
      handle: ResizeHandle,
      deltaX: number,
      deltaY: number,
    ) => {
      let nextX = baseX;
      let nextY = baseY;
      let nextWidth = baseWidth;
      let nextHeight = baseHeight;

      switch (handle) {
        case "nw":
          nextX = baseX + deltaX;
          nextY = baseY + deltaY;
          nextWidth = baseWidth - deltaX;
          nextHeight = baseHeight - deltaY;
          break;
        case "n":
          nextY = baseY + deltaY;
          nextHeight = baseHeight - deltaY;
          break;
        case "ne":
          nextY = baseY + deltaY;
          nextHeight = baseHeight - deltaY;
          nextWidth = baseWidth + deltaX;
          break;
        case "w":
          nextX = baseX + deltaX;
          nextWidth = baseWidth - deltaX;
          break;
        case "e":
          nextWidth = baseWidth + deltaX;
          break;
        case "sw":
          nextX = baseX + deltaX;
          nextWidth = baseWidth - deltaX;
          nextHeight = baseHeight + deltaY;
          break;
        case "s":
          nextHeight = baseHeight + deltaY;
          break;
        case "se":
        default:
          nextWidth = baseWidth + deltaX;
          nextHeight = baseHeight + deltaY;
          break;
      }

      const hasHorizontalBoundary = Number.isFinite(mapWidth ?? NaN) && (mapWidth ?? 0) > 0;
      const hasVerticalBoundary = Number.isFinite(mapHeight ?? NaN) && (mapHeight ?? 0) > 0;
      const boundaryWidth = mapWidth ?? Number.POSITIVE_INFINITY;
      const boundaryHeight = mapHeight ?? Number.POSITIVE_INFINITY;

      const snappedX = snapToGrid(nextX);
      const snappedY = snapToGrid(nextY);
      const snappedWidth = Math.max(
        EDITOR_RULES.minShapeSize,
        snapToGrid(Math.abs(nextWidth)),
      );
      const snappedHeight = Math.max(
        EDITOR_RULES.minShapeSize,
        snapToGrid(Math.abs(nextHeight)),
      );

      const boundedX = hasHorizontalBoundary
        ? clamp(snappedX, 0, boundaryWidth)
        : snappedX;
      const boundedY = hasVerticalBoundary
        ? clamp(snappedY, 0, boundaryHeight)
        : snappedY;

      const clampedWidth = clamp(
        snappedWidth,
        EDITOR_RULES.minShapeSize,
        hasHorizontalBoundary
          ? Math.max(EDITOR_RULES.minShapeSize, boundaryWidth - boundedX)
          : snappedWidth,
      );
      const clampedHeight = clamp(
        snappedHeight,
        EDITOR_RULES.minShapeSize,
        hasVerticalBoundary
          ? Math.max(EDITOR_RULES.minShapeSize, boundaryHeight - boundedY)
          : snappedHeight,
      );

      let finalX = boundedX;
      let finalY = boundedY;
      const finalWidth = clampedWidth;
      const finalHeight = clampedHeight;

      if (hasHorizontalBoundary) {
        finalX = clamp(finalX, 0, Math.max(0, boundaryWidth - finalWidth));
      }

      if (hasVerticalBoundary) {
        finalY = clamp(finalY, 0, Math.max(0, boundaryHeight - finalHeight));
      }

      return {
        x: finalX,
        y: finalY,
        width: finalWidth,
        height: finalHeight,
      };
    },
    [mapHeight, mapWidth, snapToGrid],
  );

  const clampedLayers = useMemo(
    () =>
      !mapWidth || !mapHeight
        ? layers
        : layers.map((layer) => ({
            ...layer,
            x: clamp(layer.x, 0, Math.max(0, mapWidth - layer.width)),
            y: clamp(layer.y, 0, Math.max(0, mapHeight - layer.height)),
            width: clamp(
              layer.width,
              EDITOR_RULES.minShapeSize,
              Math.max(0, mapWidth - layer.x),
            ),
            height: clamp(
              layer.height,
              EDITOR_RULES.minShapeSize,
              Math.max(0, mapHeight - layer.y),
            ),
        })),
    [layers, mapHeight, mapWidth],
  );

  const renameLayer = useCallback(
    (layerId: string, nextName: string) => {
      const next = normalizeLayerName(nextName);
      if (!next) return false;

      const normalizedNext = normalizeLayerNameForCompare(next);
      const isDuplicate = clampedLayers.some(
        (layer) =>
          layer.id !== layerId &&
          normalizeLayerNameForCompare(layer.name) === normalizedNext,
      );

      if (isDuplicate) {
        return false;
      }

      setLayers((prev) =>
        prev.map((layer) =>
          layer.id === layerId
            ? { ...layer, name: next, content: next }
            : layer,
        ),
      );
      return true;
    },
    [clampedLayers],
  );

  const setLayerColor = useCallback((layerId: string, nextColor: string) => {
    setLayers((prev) =>
      prev.map((layer) =>
        layer.id === layerId ? { ...layer, color: nextColor } : layer,
      ),
    );
  }, []);

  const onCanvasPointerDown = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (event.button !== 0) return;
      const point = getLocalPoint(event);
      if (!point) return;

      const clickedLayerId = (event.target as HTMLElement).closest<HTMLElement>(
        "[data-layer-id]",
      )?.dataset.layerId;

      if (tool === "select" && clickedLayerId) {
        const activeLayer = clampedLayers.find(
          (layer) => layer.id === clickedLayerId,
        );
        if (!activeLayer) return;
        setSelectedId(clickedLayerId);
        setInteraction({
          type: "dragging",
          layerId: clickedLayerId,
          startX: point.x,
          startY: point.y,
          originX: activeLayer.x,
          originY: activeLayer.y,
        });
        return;
      }

      if (tool === "rect" && hasMapImage) {
        setSelectedId(null);
        setInteraction({
          type: "drawing",
          startX: point.x,
          startY: point.y,
          currentX: point.x,
          currentY: point.y,
        });
        return;
      }

      setSelectedId(null);
    },
    [clampedLayers, getLocalPoint, hasMapImage, tool],
  );

  const startResize = useCallback(
    (
      event: ReactPointerEvent<HTMLButtonElement>,
      layer: Layer,
      handle: ResizeHandle,
    ) => {
      event.stopPropagation();
      if (event.button !== 0) return;
      const point = getLocalPoint(event);
      if (!point) return;

      setSelectedId(layer.id);
      setInteraction({
        type: "resizing",
        layerId: layer.id,
        startX: point.x,
        startY: point.y,
        originX: layer.x,
        originY: layer.y,
        originWidth: layer.width,
        originHeight: layer.height,
        handle,
      });
    },
    [getLocalPoint],
  );

  useEffect(() => {
    if (!interaction) return;

    const onPointerMove = (event: globalThis.PointerEvent) => {
      const point = getLocalPoint(event);
      if (!point) return;

      if (interaction.type === "drawing") {
        setInteraction((current) =>
          current?.type === "drawing"
            ? { ...current, currentX: point.x, currentY: point.y }
            : current,
        );
        return;
      }

      if (interaction.type === "dragging") {
        const dx = point.x - interaction.startX;
        const dy = point.y - interaction.startY;
        setLayers((prev) =>
          prev.map((layer) => {
            if (layer.id !== interaction.layerId) return layer;
            const nextX = clampInsideMapX(
              snapToGrid(interaction.originX + dx),
              layer.width,
            );
            const nextY = clampInsideMapY(
              snapToGrid(interaction.originY + dy),
              layer.height,
            );
            return { ...layer, x: nextX, y: nextY };
          }),
        );
        return;
      }

      const dx = point.x - interaction.startX;
      const dy = point.y - interaction.startY;
      setLayers((prev) =>
        prev.map((layer) => {
          if (layer.id !== interaction.layerId) return layer;
          const resized = getResizedRectByHandle(
            interaction.originX,
            interaction.originY,
            interaction.originWidth,
            interaction.originHeight,
            interaction.handle,
            dx,
            dy,
          );

          return { ...layer, ...resized };
        }),
      );
    };

    const onPointerUp = () => {
      if (interaction.type === "drawing") {
        const draft = normalizeRect(
          interaction.startX,
          interaction.startY,
          interaction.currentX,
          interaction.currentY,
        );
        const snappedDraft = snapRect(draft);

        if (
          snappedDraft.width >= EDITOR_RULES.minShapeSize &&
          snappedDraft.height >= EDITOR_RULES.minShapeSize
        ) {
          const layerName = makeUniqueLayerName(
            clampedLayers,
            "Rectangle",
          );
          const newLayer: Layer = {
            id: crypto.randomUUID(),
            name: layerName,
            x: snappedDraft.left,
            y: snappedDraft.top,
            width: snappedDraft.width,
            height: snappedDraft.height,
            color: DEFAULT_LAYER_COLOR,
            visible: true,
            content: layerName,
          };

          setLayers((prev) => [...prev, newLayer]);
          setSelectedId(newLayer.id);
          setTool("select");
        }
      }
      setInteraction(null);
    };

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    };
  }, [
    clampInsideMapX,
    clampInsideMapY,
    getLocalPoint,
    interaction,
    clampedLayers,
    getResizedRectByHandle,
    snapRect,
    snapToGrid,
    setTool,
  ]);

  const interactionDraftRect = useMemo(
    () =>
      interaction?.type === "drawing"
        ? snapRect(
            normalizeRect(
              interaction.startX,
              interaction.startY,
              interaction.currentX,
              interaction.currentY,
            ),
          )
        : null,
    [interaction, snapRect],
  );

  const selectedLayer = useMemo(
    () => clampedLayers.find((layer) => layer.id === selectedId) ?? null,
    [clampedLayers, selectedId],
  );

  const selectLayer = (layerId: string | null) => {
    setSelectedId(layerId);
    setInteraction(null);
  };

  const toggleLayerVisible = (layerId: string) => {
    setLayers((prev) =>
      prev.map((layer) =>
        layer.id === layerId ? { ...layer, visible: !layer.visible } : layer,
      ),
    );
  };

  const removeLayer = (layerId: string) => {
    setLayers((prev) => prev.filter((layer) => layer.id !== layerId));
    if (selectedId === layerId) {
      setSelectedId(null);
    }
  };

  const moveLayer = (layerId: string, direction: "up" | "down") => {
    setLayers((prev) => {
      const currentIndex = prev.findIndex((layer) => layer.id === layerId);
      if (currentIndex === -1) return prev;

      const nextIndex =
        direction === "up" ? currentIndex + 1 : currentIndex - 1;

      if (nextIndex < 0 || nextIndex >= prev.length) return prev;

      const nextLayers = [...prev];
      const [target] = nextLayers.splice(currentIndex, 1);
      nextLayers.splice(nextIndex, 0, target);
      return nextLayers;
    });
  };

  const clearAllLayers = () => {
    setLayers([]);
    setSelectedId(null);
  };

  return {
    tool,
    setTool,
    frameRef,
    layers: clampedLayers,
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
  };
}
