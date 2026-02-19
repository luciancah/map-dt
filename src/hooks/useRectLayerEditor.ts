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
import {
  clamp,
  computePolygonBounds,
  isValidPolygon,
  makeUniqueLayerName,
  normalizeLayerName,
  normalizeLayerNameForCompare,
  normalizeRect,
  clampPointToBounds,
} from "@/lib/map-editor/geometry";

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
  insertPolygonPointOnEdge: (
    event: ReactPointerEvent<SVGLineElement | HTMLButtonElement>,
    layer: Layer,
    edgeIndex: number,
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

  const getPolygonLayerGeometry = useCallback(
    (points: Point[]) => {
      const clampedPoints = points.map((point) =>
        clampPointToBounds(point, mapWidth, mapHeight),
      );
      const bounds = computePolygonBounds(clampedPoints);

      return {
        points: clampedPoints,
        x: mapWidth
          ? clamp(bounds.x, 0, Math.max(0, mapWidth - bounds.width))
          : bounds.x,
        y: mapHeight
          ? clamp(bounds.y, 0, Math.max(0, mapHeight - bounds.height))
          : bounds.y,
        width: bounds.width,
        height: bounds.height,
      };
    },
    [mapHeight, mapWidth],
  );

  const clampedLayers = useMemo(
    () =>
      !mapWidth || !mapHeight
        ? layers
        : layers.map((layer) => {
            if (layer.shape === "polygon" && layer.points && layer.points.length >= 3) {
              const polygonLayer = getPolygonLayerGeometry(layer.points);

              return {
                ...layer,
                x: polygonLayer.x,
                y: polygonLayer.y,
                width: polygonLayer.width,
                height: polygonLayer.height,
                points: polygonLayer.points,
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
    [getPolygonLayerGeometry, layers, mapHeight, mapWidth],
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
      const polygonGeometry = getPolygonLayerGeometry(points);

      const bounds = {
        x: polygonGeometry.x,
        y: polygonGeometry.y,
        width: polygonGeometry.width,
        height: polygonGeometry.height,
      };
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
        x: bounds.x,
        y: bounds.y,
        width: bounds.width,
        height: bounds.height,
        shape: "polygon",
        points: polygonGeometry.points,
        color: DEFAULT_LAYER_COLOR,
        visible: true,
        content: layerName,
      };

      setLayers((prev) => [...prev, newLayer]);
      setSelectedId(newLayer.id);
      return newLayer.id;
    },
    [clampedLayers, getPolygonLayerGeometry],
  );

  const getClickedLayerId = useCallback((event: { target: EventTarget | null }) => {
    return (event.target as HTMLElement).closest<HTMLElement>("[data-layer-id]")
      ?.dataset.layerId ?? null;
  }, []);

  const completePolygonByPoints = useCallback(
    (candidatePoints: Point[]) => {
      const createdLayerId = createPolygonLayer(candidatePoints);
      if (!createdLayerId) return false;

      setTool("select");
      setInteraction(null);
      return true;
    },
    [createPolygonLayer, setTool],
  );

  const addPolygonPointToInteraction = useCallback(
    (
      currentInteraction: Extract<Interaction, { type: "polygon-drawing" }>,
      point: Point,
    ) => {
      const nextPoints = [...currentInteraction.points, point];
      return setInteraction({
        ...currentInteraction,
        points: nextPoints,
        currentX: point.x,
        currentY: point.y,
      });
    },
    [],
  );

  const handleSelectToolDown = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>, point: Point) => {
      const clickedLayerId = getClickedLayerId(event);
      if (!clickedLayerId) return false;

      const activeLayer = clampedLayers.find((layer) => layer.id === clickedLayerId);
      if (!activeLayer) return false;

      setSelectedId(clickedLayerId);
      setInteraction({
        type: "dragging",
        layerId: clickedLayerId,
        startX: point.x,
        startY: point.y,
        originX: activeLayer.x,
        originY: activeLayer.y,
      });
      return true;
    },
    [clampedLayers, getClickedLayerId],
  );

  const handleRectToolDown = useCallback((point: Point) => {
    if (!hasMapImage) return false;

    setSelectedId(null);
    setInteraction({
      type: "drawing",
      startX: point.x,
      startY: point.y,
      currentX: point.x,
      currentY: point.y,
    });
    return true;
  }, [hasMapImage]);

  const handleExistingPolygonDown = useCallback(
    (
      event: ReactPointerEvent<HTMLDivElement>,
      interactionState: Extract<Interaction, { type: "polygon-drawing" }>,
      point: Point,
    ) => {
      if (event.button === 2) {
        const nextPoints = [...interactionState.points, point];
        const isCreated = completePolygonByPoints(nextPoints);
        if (isCreated) {
          event.preventDefault();
          return;
        }

        addPolygonPointToInteraction(interactionState, point);
        event.preventDefault();
        return;
      }

      if (event.button !== 0) return;

      if (event.detail >= 2 && interactionState.points.length >= 2) {
        const nextPoints = [...interactionState.points, point];
        completePolygonByPoints(nextPoints);
        setInteraction(null);
        return;
      }

      addPolygonPointToInteraction(interactionState, point);
    },
    [addPolygonPointToInteraction, completePolygonByPoints],
  );

  const handleNewPolygonDown = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>, point: Point) => {
      if (event.button !== 0) return;

      setSelectedId(null);
      setInteraction({
        type: "polygon-drawing",
        points: [point],
        currentX: point.x,
        currentY: point.y,
      });
    },
    [],
  );

  const handlePolygonToolDown = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>, point: Point) => {
      if (!interaction || interaction.type !== "polygon-drawing") {
        handleNewPolygonDown(event, point);
        return;
      }

      handleExistingPolygonDown(event, interaction, point);
    },
    [handleExistingPolygonDown, handleNewPolygonDown, interaction],
  );

  const onCanvasPointerDown = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      const point = getLocalPoint(event);
      if (!point) return;

      if (tool !== "polygon" && event.button !== 0) return;

      if (tool === "select") {
        if (handleSelectToolDown(event, point)) return;
      }

      if (tool === "rect") {
        if (handleRectToolDown(point)) return;
      }

      if (tool === "polygon") {
        if (!hasMapImage) return;
        handlePolygonToolDown(event, point);
        return;
      }

      if (event.button !== 0) return;
      setSelectedId(null);
    },
    [
      getLocalPoint,
      handleRectToolDown,
      handleSelectToolDown,
      handlePolygonToolDown,
      hasMapImage,
      setSelectedId,
      tool,
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

  const insertPolygonPointOnEdge = useCallback(
    (
      event: ReactPointerEvent<SVGLineElement | HTMLButtonElement>,
      layer: Layer,
      edgeIndex: number,
    ) => {
      event.stopPropagation();
      if (event.button !== 0) return;
      if (layer.shape !== "polygon" || !layer.points) return;

      const point = getLocalPoint(event);
      if (!point) return;

      const snappedPoint = {
        x: snapToGrid(point.x),
        y: snapToGrid(point.y),
      };
      const clampedPoint = clampPointToBounds(snappedPoint, mapWidth, mapHeight);

      const safeEdgeIndex = Math.max(
        0,
        Math.min(edgeIndex, layer.points.length - 1),
      );
      const insertIndex = safeEdgeIndex + 1;

      setLayers((prev) =>
        prev.map((currentLayer) => {
          if (currentLayer.id !== layer.id) return currentLayer;
          if (!currentLayer.points) return currentLayer;

          const nextPoints = [
            ...currentLayer.points.slice(0, insertIndex),
            clampedPoint,
            ...currentLayer.points.slice(insertIndex),
          ];
          const nextGeometry = getPolygonLayerGeometry(nextPoints);

          return {
            ...currentLayer,
            ...nextGeometry,
          };
        }),
      );

      setSelectedId(layer.id);
      setInteraction({
        type: "polygon-node-dragging",
        layerId: layer.id,
        nodeIndex: insertIndex,
        startX: clampedPoint.x,
        startY: clampedPoint.y,
      });
    },
    [getLocalPoint, getPolygonLayerGeometry, mapHeight, mapWidth, snapToGrid],
  );

  const updatePolygonNodeByInteraction = useCallback(
    (
      interactionState: Extract<Interaction, { type: "polygon-node-dragging" }>,
      point: Point,
    ) => {
      const clampedPoint = clampPointToBounds(
        {
          x: snapToGrid(point.x),
          y: snapToGrid(point.y),
        },
        mapWidth,
        mapHeight,
      );

      setLayers((prev) =>
        prev.map((layer) => {
          if (layer.id !== interactionState.layerId || !layer.points) return layer;

          const nextPoints = layer.points.map((layerPoint, index) => {
            if (index !== interactionState.nodeIndex) return layerPoint;
            return clampedPoint;
          });
          const nextGeometry = getPolygonLayerGeometry(nextPoints);

          return {
            ...layer,
            points: nextGeometry.points,
            x: nextGeometry.x,
            y: nextGeometry.y,
            width: nextGeometry.width,
            height: nextGeometry.height,
          };
        }),
      );
    },
    [getPolygonLayerGeometry, mapHeight, mapWidth, snapToGrid],
  );

  const updateLayerDragByInteraction = useCallback(
    (
      interactionState: Extract<Interaction, { type: "dragging" }>,
      point: Point,
    ) => {
      const dx = point.x - interactionState.startX;
      const dy = point.y - interactionState.startY;

      setLayers((prev) =>
        prev.map((layer) => {
          if (layer.id !== interactionState.layerId) return layer;
          const nextX = clampInsideMapX(
            snapToGrid(interactionState.originX + dx),
            layer.width,
          );
          const nextY = clampInsideMapY(
            snapToGrid(interactionState.originY + dy),
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
            points: layer.points.map((vertex) => ({
              x: vertex.x + moveX,
              y: vertex.y + moveY,
            })),
          };
        }),
      );
    },
    [clampInsideMapX, clampInsideMapY, snapToGrid],
  );

  const updateLayerResizeByInteraction = useCallback(
    (
      interactionState: Extract<Interaction, { type: "resizing" }>,
      point: Point,
    ) => {
      const dx = point.x - interactionState.startX;
      const dy = point.y - interactionState.startY;

      setLayers((prev) =>
        prev.map((layer) => {
          if (layer.id !== interactionState.layerId) return layer;
          const resized = getResizedRectByHandle(
            interactionState.originX,
            interactionState.originY,
            interactionState.originWidth,
            interactionState.originHeight,
            interactionState.handle,
            dx,
            dy,
          );

          return { ...layer, ...resized };
        }),
      );
    },
    [getResizedRectByHandle],
  );

  const finalizeDrawingLayer = useCallback(() => {
    if (!interaction || interaction.type !== "drawing") return;

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
      const layerName = makeUniqueLayerName(clampedLayers, "Rectangle");
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
  }, [clampedLayers, interaction, setTool, snapRect]);

  const setDraftInteractionPoint = useCallback(
    (
      interactionState:
        | Extract<Interaction, { type: "drawing" }>
        | Extract<Interaction, { type: "polygon-drawing" }>,
      point: Point,
    ) => {
      setInteraction({
        ...interactionState,
        currentX: point.x,
        currentY: point.y,
      });
    },
    [],
  );

  const updateInteractionByType = useCallback(
    (interactionState: Interaction, point: Point) => {
      switch (interactionState.type) {
        case "drawing":
        case "polygon-drawing":
          setDraftInteractionPoint(interactionState, point);
          return;
        case "polygon-node-dragging":
          updatePolygonNodeByInteraction(interactionState, point);
          return;
        case "dragging":
          updateLayerDragByInteraction(interactionState, point);
          return;
        case "resizing":
          updateLayerResizeByInteraction(interactionState, point);
          return;
        default:
          break;
      }
    },
    [
      setDraftInteractionPoint,
      updateLayerDragByInteraction,
      updateLayerResizeByInteraction,
      updatePolygonNodeByInteraction,
    ],
  );

  const handleInteractionPointerMove = useCallback(
    (event: globalThis.PointerEvent) => {
      const point = getLocalPoint(event);
      if (!interaction || !point) return;
      updateInteractionByType(interaction, point);
    },
    [getLocalPoint, interaction, updateInteractionByType],
  );

  const finalizePolygonDrawingLayer = useCallback(
    (event: globalThis.KeyboardEvent) => {
      if (interaction?.type !== "polygon-drawing") return;

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
    },
    [createPolygonLayer, interaction, setTool],
  );

  const finalizeInteractionByType = useCallback(
    (interactionState: Interaction) => {
      switch (interactionState.type) {
        case "drawing":
          finalizeDrawingLayer();
          break;
        case "polygon-drawing":
          break;
        default:
          setInteraction(null);
          break;
      }
    },
    [finalizeDrawingLayer],
  );

  const handleInteractionPointerUp = useCallback(() => {
    if (!interaction) return;
    finalizeInteractionByType(interaction);
  }, [finalizeInteractionByType, interaction]);

  useEffect(() => {
    if (!interaction) return;

    window.addEventListener("pointermove", handleInteractionPointerMove);
    window.addEventListener("pointerup", handleInteractionPointerUp);
    window.addEventListener("keydown", finalizePolygonDrawingLayer);
    return () => {
      window.removeEventListener("pointermove", handleInteractionPointerMove);
      window.removeEventListener("pointerup", handleInteractionPointerUp);
      window.removeEventListener("keydown", finalizePolygonDrawingLayer);
    };
  }, [handleInteractionPointerMove, handleInteractionPointerUp, finalizePolygonDrawingLayer, interaction]);

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
    insertPolygonPointOnEdge,
    startResize,
    selectLayer,
    toggleLayerVisible,
    convertRectToPolygon,
    moveLayer,
    removeLayer,
    clearAllLayers,
  };
}
