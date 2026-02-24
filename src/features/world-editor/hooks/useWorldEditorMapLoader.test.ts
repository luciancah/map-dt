import { renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useWorldEditorMapLoader } from "./useWorldEditorMapLoader";
import * as worldService from "@/features/world-editor/services/world-editor-service";
import type { MapImage } from "@/lib/map-editor/types";
import type { EditableMap } from "@/features/world-editor/types";

const mapA: EditableMap = { id: 1, name: "Map A", sensorMapImagePath: "path-a" };
const layerA = {
  id: "a",
  name: "Layer",
  x: 0,
  y: 0,
  width: 10,
  height: 10,
  shape: "rect" as const,
  color: "#f97316",
  visible: true,
  content: "Layer",
};

const mapImageA: MapImage = {
  id: "1",
  fileName: "map-a.png",
  src: "blob:map-a",
  width: 120,
  height: 80,
};

describe("useWorldEditorMapLoader", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("loads map image and layers when map is valid", async () => {
    const loadMapAsset = vi
      .spyOn(worldService, "loadMapAsset")
      .mockResolvedValue(mapImageA);
    const loadMapLayers = vi
      .spyOn(worldService, "loadMapLayers")
      .mockResolvedValue([layerA]);
    const onMessage = vi.fn();
    const clearAllLayers = vi.fn();
    const setLayersFromServer = vi.fn();
    const onMapImageChange = vi.fn();

    const { result } = renderHook(() =>
      useWorldEditorMapLoader({
        selectedMap: mapA,
        selectedMapId: 1,
        clearAllLayers,
        setLayersFromServer,
        onMessage,
        onMapImageChange,
      }),
    );

    await waitFor(() => {
      expect(loadMapAsset).toHaveBeenCalledWith(mapA);
    });
    await waitFor(() => {
      expect(loadMapLayers).toHaveBeenCalledWith(1, mapImageA.height);
    });
    await waitFor(() => {
      expect(result.current.mapImage).toEqual(mapImageA);
      expect(result.current.loading).toBe(false);
    });
    expect(onMessage).toHaveBeenCalledWith("");
    expect(onMapImageChange).toHaveBeenCalledWith(mapImageA);
    expect(setLayersFromServer).toHaveBeenCalledWith([layerA]);
    expect(clearAllLayers).toHaveBeenCalled();
  });

  it("clears state and warns when image is unavailable", async () => {
    const loadMapAsset = vi
      .spyOn(worldService, "loadMapAsset")
      .mockResolvedValue(mapImageA);
    const loadMapLayers = vi
      .spyOn(worldService, "loadMapLayers")
      .mockResolvedValue([layerA]);

    const clearAllLayers = vi.fn();
    const setLayersFromServer = vi.fn();
    const onMessage = vi.fn();
    const onMapImageChange = vi.fn();

    const { rerender, result } = renderHook(
      ({ selectedMap, selectedMapId }) =>
        useWorldEditorMapLoader({
          selectedMap,
          selectedMapId,
          clearAllLayers,
          setLayersFromServer,
          onMessage,
          onMapImageChange,
        }),
      { initialProps: { selectedMap: mapA, selectedMapId: 1 } },
    );

    await waitFor(() => {
      expect(loadMapLayers).toHaveBeenCalledTimes(1);
    });

    rerender({ selectedMap: null, selectedMapId: null });

    await waitFor(() => {
      expect(clearAllLayers).toHaveBeenCalled();
    });
    await waitFor(() => {
      expect(clearAllLayers).toHaveBeenCalledTimes(2);
      expect(onMapImageChange).toHaveBeenCalledWith(null);
      expect(result.current.mapImage).toBeNull();
    });
    expect(onMessage).toHaveBeenCalledWith("");

    expect(loadMapAsset).toHaveBeenCalledTimes(1);
    expect(loadMapLayers).toHaveBeenCalledTimes(1);
  });

  it("returns validation message when sensor map does not exist", async () => {
    const loadMapAsset = vi
      .spyOn(worldService, "loadMapAsset")
      .mockResolvedValue(mapImageA);
    const loadMapLayers = vi
      .spyOn(worldService, "loadMapLayers")
      .mockResolvedValue([]);

    const onMessage = vi.fn();
    const clearAllLayers = vi.fn();
    const setLayersFromServer = vi.fn();
    const onMapImageChange = vi.fn();

    renderHook(() =>
      useWorldEditorMapLoader({
        selectedMap: { id: 3, name: "No Sensor", sensorMapImagePath: null },
        selectedMapId: 3,
        clearAllLayers,
        setLayersFromServer,
        onMessage,
        onMapImageChange,
      }),
    );

    await waitFor(() => {
      expect(onMessage).toHaveBeenCalledWith("센서맵이 없습니다.");
    });
    expect(loadMapAsset).not.toHaveBeenCalled();
    expect(loadMapLayers).not.toHaveBeenCalled();
    expect(clearAllLayers).toHaveBeenCalled();
    expect(setLayersFromServer).not.toHaveBeenCalled();
    expect(onMapImageChange).toHaveBeenCalledWith(null);
  });
});
