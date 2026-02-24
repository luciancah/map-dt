import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useWorldEditorLayerMutations } from "./useWorldEditorLayerMutations";
import type { Layer } from "@/lib/map-editor/types";

const buildRectLayer = (): Layer => ({
  id: "layer-1",
  name: "Rect",
  x: 10,
  y: 10,
  width: 24,
  height: 24,
  shape: "rect",
  context: "area",
  color: "#f97316",
  visible: true,
  content: "Rect",
});

describe("useWorldEditorLayerMutations", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renames and saves polygon-converted layer", async () => {
    const saveLayer = vi.fn().mockResolvedValue({
      entity: {
        id: 100,
        name: "Rect",
        type: "GRID",
        metadataJson: "{}",
      },
    });
    const renameLayer = vi.fn().mockReturnValue(true);
    const deleteLayer = vi.fn().mockResolvedValue(undefined);
    const setLayersFromServer = vi.fn();
    const setMessage = vi.fn();
    const removeLayer = vi.fn();
    const setWorldImageUrl = vi.fn();

    const mapImage = {
      id: "map",
      fileName: "map.png",
      src: "blob:map",
      width: 100,
      height: 50,
    };

    const form = renderHook(
      () =>
        useWorldEditorLayerMutations({
          selectedLayer: buildRectLayer(),
          selectedMapId: 1,
          mapImage,
          layerContext: "area",
          layers: [buildRectLayer()],
          areaType: "GRID",
          metadataJson: "{}",
          keepoutEnabled: true,
          keepoutReason: "",
          setLayersFromServer,
          setMessage,
          renameLayer,
          removeLayer,
          saveLayer,
          deleteLayer,
          buildWorldImage: vi.fn().mockResolvedValue(new Blob()),
          getDefaultColorByContext: vi.fn().mockReturnValue("#f97316"),
          setWorldImageUrl,
        }),
    );

    const formResult = form.result;

    act(() => {
      const formElement = document.createElement("form");
      const input = document.createElement("input");
      input.name = "layerName";
      input.value = "Updated";
      formElement.appendChild(input);
      formResult.current.onRename({
        preventDefault: vi.fn(),
        currentTarget: formElement,
      } as unknown as React.FormEvent<HTMLFormElement>);
    });

    await waitFor(() => {
      expect(renameLayer).toHaveBeenCalledWith("layer-1", "Updated");
    });

    await act(async () => {
      await formResult.current.saveSelectedLayer();
    });

    expect(saveLayer).toHaveBeenCalledTimes(1);
    expect(saveLayer).toHaveBeenCalledWith(
      1,
      expect.objectContaining({
        id: "layer-1",
        shape: "polygon",
        points: [
          { x: 10, y: 10 },
          { x: 34, y: 10 },
          { x: 34, y: 34 },
          { x: 10, y: 34 },
        ],
      }),
      "area",
      "GRID",
      "{}",
      true,
      "",
      mapImage.height,
    );
  });

  it("updates selected context and deletes existing layer", async () => {
    const selectedLayer = buildRectLayer();
    const layerAfterUpdate = { ...selectedLayer, id: "layer-2", serverId: 77 };
    const getDefaultColorByContext = vi.fn().mockReturnValue("#2563eb");
    const saveLayer = vi.fn();
    const deleteLayer = vi.fn().mockResolvedValue(undefined);
    const removeLayer = vi.fn();
    const setLayersFromServer = vi.fn();
    const setMessage = vi.fn();

    const form = renderHook(() =>
      useWorldEditorLayerMutations({
        selectedLayer: layerAfterUpdate,
        selectedMapId: 1,
        mapImage: {
          id: "map",
          fileName: "map.png",
          src: "blob:map",
          width: 100,
          height: 50,
        },
        layerContext: "area",
        layers: [layerAfterUpdate],
        areaType: "GRID",
        metadataJson: "{}",
        keepoutEnabled: true,
        keepoutReason: "",
        setLayersFromServer,
        setMessage,
        renameLayer: vi.fn(),
        removeLayer,
        saveLayer,
        deleteLayer,
        buildWorldImage: vi.fn().mockResolvedValue(new Blob()),
        getDefaultColorByContext,
        setWorldImageUrl: vi.fn(),
      }),
    );

    act(() => {
      form.result.current.updateSelectedLayerContext("keepout");
    });

    await waitFor(() => {
      expect(getDefaultColorByContext).toHaveBeenCalledWith("keepout");
      expect(setLayersFromServer).toHaveBeenCalled();
    });

    await act(async () => {
      await form.result.current.deleteSelectedLayer();
    });

    expect(deleteLayer).toHaveBeenCalledWith(1, layerAfterUpdate);
    expect(removeLayer).toHaveBeenCalledWith("layer-2");
  });

  it("build world returns image url", async () => {
    const buildWorldImage = vi.fn().mockResolvedValue(new Blob(["test"]));
    const setWorldImageUrl = vi.fn();
    const originalCreateObjectURL = URL.createObjectURL;
    if (typeof originalCreateObjectURL !== "function") {
      Object.defineProperty(URL, "createObjectURL", {
        configurable: true,
        writable: true,
        value: vi.fn() as (blob: Blob) => string,
      });
    }

    const form = renderHook(() =>
      useWorldEditorLayerMutations({
        selectedLayer: buildRectLayer(),
        selectedMapId: 11,
        mapImage: {
          id: "map",
          fileName: "map.png",
          src: "blob:map",
          width: 100,
          height: 50,
        },
        layerContext: "area",
        layers: [buildRectLayer()],
        areaType: "GRID",
        metadataJson: "{}",
        keepoutEnabled: true,
        keepoutReason: "",
        setLayersFromServer: vi.fn(),
        setMessage: vi.fn(),
        renameLayer: vi.fn(),
        removeLayer: vi.fn(),
        saveLayer: vi.fn(),
        deleteLayer: vi.fn(),
        buildWorldImage,
        getDefaultColorByContext: vi.fn().mockReturnValue("#f97316"),
        setWorldImageUrl,
      }),
    );

    const createObjectURL = vi
      .spyOn(URL, "createObjectURL" as keyof typeof URL)
      .mockReturnValue("blob:world");

    await act(async () => {
      await form.result.current.buildWorld();
    });

    expect(buildWorldImage).toHaveBeenCalledWith(11);
    expect(createObjectURL).toHaveBeenCalled();
    expect(setWorldImageUrl).toHaveBeenCalledWith("blob:world");
    if (originalCreateObjectURL) {
      Object.defineProperty(URL, "createObjectURL", {
        configurable: true,
        writable: true,
        value: originalCreateObjectURL,
      });
      return;
    }

    delete (URL as { createObjectURL?: (blob: Blob) => string }).createObjectURL;
  });
});
