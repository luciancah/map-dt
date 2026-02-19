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
  DraftPolygon,
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
  interactionDraftPolygon: DraftPolygon | null;
  onCanvasPointerDown: (event: ReactPointerEvent<HTMLDivElement>) => void;
  renameLayer: (layerId: string, nextName: string) => boolean;
  setLayerColor: (layerId: string, nextColor: string) => void;
  startPolygonNodeDrag: (
    event: ReactPointerEvent<HTMLButtonElement>,
    layer: Layer,
    nodeIndex: number,
  ) => void;
  startResize: (
    event: ReactPointerEvent<HTMLButtonElement>,
    layer: Layer,
    handle: ResizeHandle,
  ) => void;
  selectLayer: (layerId: string | null) => void;
  toggleLayerVisible: (layerId: string) => void;
  convertRectToPolygon: (layerId: string) => boolean;
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

const isValidPolygon = (points: Point[]) => {
  if (points.length < 3) return false;
  return points.some((point, index, collection) => {
    if (index === 0) return false;
    const previous = collection[index - 1];
    return point.x !== previous.x || point.y !== previous.y;
  });
};

const computePolygonBounds = (points: Point[]) => {
  const xValues = points.map((point) => point.x);
  const yValues = points.map((point) => point.y);
  const left = Math.min(...xValues);
  const top = Math.min(...yValues);
  const right = Math.max(...xValues);
  const bottom = Math.max(...yValues);

  return {
    x: left,
    y: top,
    width: Math.max(EDITOR_RULES.minShapeSize, right - left),
    height: Math.max(EDITOR_RULES.minShapeSize, bottom - top),
  };
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
        : layers.map((layer) => {
            if (layer.shape === "polygon" && layer.points && layer.points.length >= 3) {
              const clampedPoints = layer.points.map((point) => ({
                x: clamp(point.x, 0, mapWidth),
                y: clamp(point.y, 0, mapHeight),
              }));
              const bounds = computePolygonBounds(clampedPoints);

              return {
                ...layer,
                x: clamp(layer.x, 0, Math.max(0, mapWidth - bounds.width)),
                y: clamp(layer.y, 0, Math.max(0, mapHeight - bounds.height)),
                width: bounds.width,
                height: bounds.height,
                points: clampedPoints,
              };
            }

            return {
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
            };
          }),
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

  const createPolygonLayer = useCallback(
    (points: Point[]) => {
      if (!isValidPolygon(points) || points.length < 3) return null;
      const bounds = computePolygonBounds(points);
      if (
        bounds.width < EDITOR_RULES.minShapeSize ||
        bounds.height < EDITOR_RULES.minShapeSize
      ) {
        return null;
      }

      const layerName = makeUniqueLayerName(clampedLayers, "Polygon");

      const newLayer: Layer = {
        id: crypto.randomUUID(),
        name: layerName,
        x: clamp(
          bounds.x,
          0,
          Math.max(0, (mapWidth ?? bounds.x + bounds.width) - bounds.width),
        ),
        y: clamp(
          bounds.y,
          0,
          Math.max(0, (mapHeight ?? bounds.y + bounds.height) - bounds.height),
        ),
        width: bounds.width,
        height: bounds.height,
        shape: "polygon",
        points,
        color: DEFAULT_LAYER_COLOR,
        visible: true,
        content: layerName,
      };

      setLayers((prev) => [...prev, newLayer]);
      setSelectedId(newLayer.id);
      return newLayer.id;
    },
    [clampedLayers, mapHeight, mapWidth],
  );

  const onCanvasPointerDown = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      const point = getLocalPoint(event);
      if (!point) return;

      const clickedLayerId = (event.target as HTMLElement).closest<HTMLElement>(
        "[data-layer-id]",
      )?.dataset.layerId;

      if (tool !== "polygon" && event.button !== 0) {
        return;
      }

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

      if (tool === "polygon" && hasMapImage) {
        if (interaction?.type === "polygon-drawing") {
          if (event.button === 2) {
            const nextPoints = [...interaction.points, point];
            const createdLayerId = createPolygonLayer(nextPoints);
            if (createdLayerId) {
              setTool("select");
              setInteraction(null);
              event.preventDefault();
              return;
            }

            setInteraction({
              ...interaction,
              points: nextPoints,
              currentX: point.x,
              currentY: point.y,
            });
            event.preventDefault();
            return;
          }

          if (event.button !== 0) return;

          const nextPoint = point;

          if (event.detail >= 2 && interaction.points.length >= 2) {
            const nextPoints = [...interaction.points, nextPoint];
            const createdLayerId = createPolygonLayer(nextPoints);
            if (createdLayerId) {
              setTool("select");
            }
            setInteraction(null);
            return;
          }

          setInteraction({
            ...interaction,
            points: [...interaction.points, nextPoint],
            currentX: nextPoint.x,
            currentY: nextPoint.y,
          });
          return;
        }

        if (event.button === 0) {
          setSelectedId(null);
          setInteraction({
            type: "polygon-drawing",
            points: [point],
            currentX: point.x,
            currentY: point.y,
          });
        }
        return;
      }

      if (event.button !== 0) return;
      setSelectedId(null);
    },
    [
      clampedLayers,
      createPolygonLayer,
      getLocalPoint,
      hasMapImage,
      setTool,
      tool,
      interaction,
    ],
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
      if (layer.shape === "polygon") return;

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

  const startPolygonNodeDrag = useCallback(
    (
      event: ReactPointerEvent<HTMLButtonElement>,
      layer: Layer,
      nodeIndex: number,
    ) => {
      event.stopPropagation();
      if (event.button !== 0) return;
      if (layer.shape !== "polygon" || !layer.points) return;

      const point = getLocalPoint(event);
      if (!point) return;
      if (!layer.points[nodeIndex]) return;

      setSelectedId(layer.id);
      setInteraction({
        type: "polygon-node-dragging",
        layerId: layer.id,
        nodeIndex,
        startX: point.x,
        startY: point.y,
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

      if (interaction.type === "polygon-drawing") {
        setInteraction((current) =>
          current?.type === "polygon-drawing"
            ? { ...current, currentX: point.x, currentY: point.y }
            : current,
        );
        return;
      }

      if (interaction.type === "polygon-node-dragging") {
        setLayers((prev) =>
          prev.map((layer) => {
            if (layer.id !== interaction.layerId || !layer.points) return layer;

            const nextPoints = layer.points.map((layerPoint, index) => {
              if (index !== interaction.nodeIndex) return layerPoint;

              const nextPoint = {
                x: snapToGrid(point.x),
                y: snapToGrid(point.y),
              };

              const boundedPoint = {
                x: mapWidth ? clamp(nextPoint.x, 0, mapWidth) : nextPoint.x,
                y: mapHeight ? clamp(nextPoint.y, 0, mapHeight) : nextPoint.y,
              };

              return boundedPoint;
            });

            const bounds = computePolygonBounds(nextPoints);

            return {
              ...layer,
              points: nextPoints,
              x: bounds.x,
              y: bounds.y,
              width: bounds.width,
              height: bounds.height,
            };
          }),
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
            const moveX = nextX - layer.x;
            const moveY = nextY - layer.y;
            if (layer.shape !== "polygon" || !layer.points) {
              return { ...layer, x: nextX, y: nextY };
            }

            return {
              ...layer,
              x: nextX,
              y: nextY,
              points: layer.points.map((point) => ({
                x: point.x + moveX,
                y: point.y + moveY,
              })),
            };
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
            shape: "rect",
            color: DEFAULT_LAYER_COLOR,
            visible: true,
            content: layerName,
          };

          setLayers((prev) => [...prev, newLayer]);
          setSelectedId(newLayer.id);
          setTool("select");
        }
      }
      if (interaction.type === "polygon-drawing") {
        return;
      }

      setInteraction(null);
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (interaction.type !== "polygon-drawing") return;

      if (event.key === "Escape") {
        setInteraction(null);
        return;
      }

      if (event.key !== "Enter") return;

      const nextPoints = [
        ...interaction.points,
        { x: interaction.currentX, y: interaction.currentY },
      ];
      const createdLayerId = createPolygonLayer(nextPoints);

      if (createdLayerId) {
        setTool("select");
      }

      setInteraction(null);
    };

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("keydown", onKeyDown);
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
    createPolygonLayer,
    mapWidth,
    mapHeight,
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

  const interactionDraftPolygon = useMemo(() => {
    if (interaction?.type !== "polygon-drawing") return null;

    return {
      points: [...interaction.points, { x: interaction.currentX, y: interaction.currentY }],
      currentX: interaction.currentX,
      currentY: interaction.currentY,
    };
  }, [interaction]);

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

  const convertRectToPolygon = useCallback((layerId: string) => {
    const targetLayer = clampedLayers.find(
      (layer) => layer.id === layerId && layer.shape === "rect",
    );
    if (!targetLayer) return false;

    const points = [
      { x: targetLayer.x, y: targetLayer.y },
      { x: targetLayer.x + targetLayer.width, y: targetLayer.y },
      {
        x: targetLayer.x + targetLayer.width,
        y: targetLayer.y + targetLayer.height,
      },
      { x: targetLayer.x, y: targetLayer.y + targetLayer.height },
    ];

    setLayers((prev) =>
      prev.map((layer) =>
        layer.id === layerId
          ? { ...layer, shape: "polygon", points }
          : layer,
      ),
    );

    setSelectedId(layerId);
    return true;
  }, [clampedLayers]);

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
    interactionDraftPolygon,
    onCanvasPointerDown,
    renameLayer,
    setLayerColor,
    startPolygonNodeDrag,
    startResize,
    selectLayer,
    toggleLayerVisible,
    convertRectToPolygon,
    moveLayer,
    removeLayer,
    clearAllLayers,
  };
}
