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
  startResize: (
    event: ReactPointerEvent<HTMLButtonElement>,
    layer: Layer,
  ) => void;
  selectLayer: (layerId: string | null) => void;
  toggleLayerVisible: (layerId: string) => void;
  removeLayer: (layerId: string) => void;
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
    (event: ReactPointerEvent<HTMLButtonElement>, layer: Layer) => {
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
        originWidth: layer.width,
        originHeight: layer.height,
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
          const maxWidth = (mapWidth ?? layer.width) - layer.x;
          const maxHeight = (mapHeight ?? layer.height) - layer.y;
          const nextWidth = snapToGrid(interaction.originWidth + dx);
          const nextHeight = snapToGrid(interaction.originHeight + dy);

          return {
            ...layer,
            width: clamp(
              nextWidth,
              EDITOR_RULES.minShapeSize,
              Math.max(EDITOR_RULES.minShapeSize, maxWidth),
            ),
            height: clamp(
              nextHeight,
              EDITOR_RULES.minShapeSize,
              Math.max(EDITOR_RULES.minShapeSize, maxHeight),
            ),
          };
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
          const newLayer: Layer = {
            id: crypto.randomUUID(),
            name: `Rectangle ${clampedLayers.length + 1}`,
            x: snappedDraft.left,
            y: snappedDraft.top,
            width: snappedDraft.width,
            height: snappedDraft.height,
            color: "rgba(255, 126, 54, 0.35)",
            visible: true,
            content: "Context",
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
    clampedLayers.length,
    mapHeight,
    mapWidth,
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
    startResize,
    selectLayer,
    toggleLayerVisible,
    removeLayer,
    clearAllLayers,
  };
}
