import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useWorldEditorInspectorForm } from "./useWorldEditorInspectorForm";
import type { Layer } from "@/lib/map-editor/types";

const createLayer = (overrides: Partial<Layer> = {}): Layer => ({
  id: "layer-1",
  name: "",
  x: 0,
  y: 0,
  width: 10,
  height: 10,
  shape: "rect",
  context: "area",
  color: "#f97316",
  visible: true,
  content: "Layer",
  ...overrides,
});

describe("useWorldEditorInspectorForm", () => {
  it("syncs form state from selected layer", async () => {
    const { result, rerender } = renderHook(
      (selectedLayer: Layer | null) =>
        useWorldEditorInspectorForm({ selectedLayer, defaultLayerContext: "area" }),
      { initialProps: null },
    );

    await waitFor(() => {
      expect(result.current.areaType).toBe("NORMAL");
      expect(result.current.keepoutReason).toBe("");
    });

    const areaLayer = createLayer({
      id: "layer-1",
      context: "area",
      serverType: "GRID",
      serverMetadataJson: '{"a":1}',
      serverEnabled: false,
      serverReason: "area reason",
    });

    rerender(areaLayer);

    await waitFor(() => {
      expect(result.current.selectedLayerContext).toBe("area");
      expect(result.current.areaType).toBe("GRID");
      expect(result.current.metadataJson).toBe('{"a":1}');
    });

    act(() => {
      result.current.setAreaType("UPDATED");
      result.current.setMetadataJson('{"b":2}');
      result.current.setKeepoutEnabled(false);
      result.current.setKeepoutReason("should not persist");
    });

    const keepoutLayer = createLayer({
      id: "layer-1",
      context: "keepout",
      serverType: "KEEPOUT",
      serverMetadataJson: "{}",
      serverEnabled: true,
      serverReason: "blocked",
      serverId: 10,
    });

    rerender(keepoutLayer);

    await waitFor(() => {
      expect(result.current.selectedLayerContext).toBe("keepout");
      expect(result.current.keepoutReason).toBe("blocked");
      expect(result.current.keepoutEnabled).toBe(true);
    });
    expect(result.current.areaType).toBe("KEEPOUT");
  });

  it("supports manual reset", async () => {
    const selectedLayer = createLayer({
      context: "keepout",
      serverEnabled: false,
      serverReason: "keepout",
    });

    const { result } = renderHook(
      ({ layer }) =>
        useWorldEditorInspectorForm({
          selectedLayer: layer,
          defaultLayerContext: "keepout",
        }),
      { initialProps: { layer: selectedLayer } },
    );

    act(() => {
      result.current.setSelectedLayerContext("area");
      result.current.setAreaType("X");
      result.current.setMetadataJson("{}");
      result.current.setKeepoutEnabled(false);
      result.current.setKeepoutReason("Y");
    });

    act(() => {
      result.current.reset();
    });

    expect(result.current.selectedLayerContext).toBe("keepout");
    await waitFor(() => {
      expect(result.current.keepoutEnabled).toBe(true);
      expect(result.current.keepoutReason).toBe("");
      expect(result.current.areaType).toBe("NORMAL");
    });
  });
});
