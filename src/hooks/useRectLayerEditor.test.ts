import { act, waitFor } from "@testing-library/react";
import { renderHook, type RenderHookResult } from "@testing-library/react";
import { useRectLayerEditor } from "./useRectLayerEditor";
import { describe, expect, it } from "vitest";

type RectLayerEditorHook = ReturnType<typeof useRectLayerEditor>;
type RectLayerEditorHookResult = RenderHookResult<RectLayerEditorHook, void>["result"];

type PointerDownEvent = Parameters<
  ReturnType<typeof useRectLayerEditor>["onCanvasPointerDown"]
>[0];

const createFrameElement = () => {
  const frame = document.createElement("div");
  frame.getBoundingClientRect = () =>
    ({
      x: 0,
      y: 0,
      width: 500,
      height: 400,
      top: 0,
      right: 500,
      bottom: 400,
      left: 0,
      toJSON() {
        return {};
      },
    }) as DOMRect;
  return frame;
};

const pointerEvent = (x: number, y: number, button = 0) =>
  ({
    button,
    clientX: x,
    clientY: y,
  }) as PointerDownEvent;

const pointerButtonEvent = (button = 0) =>
  ({
    button,
    stopPropagation: () => {},
  }) as Parameters<
    ReturnType<typeof useRectLayerEditor>["startPoiDirectionDrag"]
  >[0];

const createRectLayer = async (
  result: RectLayerEditorHookResult,
  startX: number,
  startY: number,
  endX: number,
  endY: number,
  expectedLength: number,
) => {
  act(() => {
    result.current.setTool("rect");
  });

  act(() => {
    result.current.onCanvasPointerDown(pointerEvent(startX, startY));
  });

  await waitFor(() => {
    expect(result.current.interactionDraftRect).not.toBeNull();
  });

  act(() => {
    window.dispatchEvent(
      new PointerEvent("pointermove", { clientX: endX, clientY: endY }),
    );
    window.dispatchEvent(
      new PointerEvent("pointerup", { clientX: endX, clientY: endY }),
    );
  });

  await waitFor(() => {
    expect(result.current.layers).toHaveLength(expectedLength);
  });
};

describe("useRectLayerEditor", () => {
  const createHook = (gridStepPx: number | null = 10) => {
    const result = renderHook<RectLayerEditorHook, void>(() =>
      useRectLayerEditor({
        hasMapImage: true,
        mapWidth: 500,
        mapHeight: 400,
        gridStepPx,
      }),
    ).result;
    const frame = createFrameElement();
    result.current.frameRef.current = frame;
    return result;
  };

  it("creates a rectangle layer via pointer drag", async () => {
    const result = createHook();

    await createRectLayer(result, 12, 18, 142, 138, 1);

    await waitFor(() => {
      expect(result.current.layers).toHaveLength(1);
      expect(result.current.tool).toBe("select");
    });

    const layer = result.current.layers[0];
    expect(layer.name).toBe("Rectangle");
    expect(layer.shape).toBe("rect");
    expect(layer.x).toBe(10);
    expect(layer.y).toBe(20);
    expect(layer.width).toBeGreaterThanOrEqual(24);
    expect(layer.height).toBeGreaterThanOrEqual(24);
    expect(result.current.selectedLayer?.id).toBe(layer.id);
  });

  it("prevents duplicate layer names on rename and updates layer content", async () => {
    const result = createHook();

    await createRectLayer(result, 10, 10, 80, 80, 1);
    await createRectLayer(result, 120, 10, 180, 80, 2);

    expect(result.current.layers).toHaveLength(2);
    const first = result.current.layers[0];
    const second = result.current.layers[1];

    expect(result.current.renameLayer(second.id, " rectangle ")).toBe(false);
    expect(second.name).toBe("Rectangle 1");

    expect(result.current.renameLayer(first.id, "ZONE A")).toBe(true);

    await waitFor(() => {
      expect(result.current.layers[0].name).toBe("ZONE A");
      expect(result.current.layers[0].content).toBe("ZONE A");
    });
  });

  it("updates layer color and visibility", async () => {
    const result = createHook();

    await createRectLayer(result, 16, 16, 106, 106, 1);

    await waitFor(() => {
      expect(result.current.layers).toHaveLength(1);
    });

    const layerId = result.current.layers[0].id;

    act(() => {
      result.current.setLayerColor(layerId, "#123456");
      result.current.toggleLayerVisible(layerId);
    });

    expect(result.current.layers[0].color).toBe("#123456");
    expect(result.current.layers[0].visible).toBe(false);
  });

  it("creates a POI layer and updates direction", async () => {
    const result = createHook();

    act(() => {
      result.current.setTool("poi");
    });

    act(() => {
      result.current.onCanvasPointerDown(pointerEvent(60, 80));
    });

    await waitFor(() => {
      expect(result.current.layers).toHaveLength(1);
      expect(result.current.layers[0].shape).toBe("poi");
    });

    const poiLayer = result.current.layers[0];

    act(() => {
      result.current.startPoiDirectionDrag(pointerButtonEvent(), poiLayer);
    });

    act(() => {
      window.dispatchEvent(
        new PointerEvent("pointermove", { clientX: 60, clientY: 110 }),
      );
      window.dispatchEvent(
        new PointerEvent("pointerup", { clientX: 60, clientY: 110 }),
      );
    });

    await waitFor(() => {
      expect(result.current.selectedLayer?.shape).toBe("poi");
      expect(result.current.selectedLayer?.direction).toBeGreaterThan(80);
      expect(result.current.selectedLayer?.direction).toBeLessThan(100);
    });
  });

  it("converts a rectangle to polygon shape", async () => {
    const result = createHook();

    await createRectLayer(result, 32, 38, 132, 98, 1);

    await waitFor(() => {
      expect(result.current.layers).toHaveLength(1);
    });

    const target = result.current.layers[0];
    const converted = result.current.convertRectToPolygon(target.id);

    expect(converted).toBe(true);
    await waitFor(() => {
      expect(result.current.layers[0]).toMatchObject({
        id: target.id,
        shape: "polygon",
        points: expect.any(Array),
      });
    });
  });

  it("reorders, removes, and clears layers", async () => {
    const result = createHook();

    await createRectLayer(result, 20, 20, 80, 80, 1);
    await createRectLayer(result, 100, 20, 160, 80, 2);

    await waitFor(() => {
      expect(result.current.layers).toHaveLength(2);
    });

    const firstId = result.current.layers[0].id;
    const secondId = result.current.layers[1].id;

    act(() => {
      result.current.moveLayer(firstId, "up");
    });

    expect(result.current.layers.map((layer) => layer.id)).toEqual([
      secondId,
      firstId,
    ]);

    act(() => {
      result.current.removeLayer(secondId);
    });

    expect(result.current.layers.map((layer) => layer.id)).toEqual([firstId]);

    act(() => {
      result.current.clearAllLayers();
    });

    await waitFor(() => {
      expect(result.current.layers).toHaveLength(0);
    });
  });
});
