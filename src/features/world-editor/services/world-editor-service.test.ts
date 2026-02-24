import { beforeEach, describe, expect, it, vi } from "vitest";
import { areaApi, keepoutApi, worldApi } from "@/lib/api/client";
import type { Layer } from "@/lib/map-editor/types";
import {
  buildWorldImage,
  deleteLayer,
  ensurePolygonLayer,
  loadMapLayers,
  saveLayer,
} from "./world-editor-service";

vi.mock("@/lib/api/client", () => ({
  areaApi: {
    list: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
  },
  keepoutApi: {
    list: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
  },
  mapApi: {
    getSensorMapUrl: vi.fn(() => "http://localhost:8080/map/1/sensor-map"),
  },
  worldApi: {
    build: vi.fn(),
    getImage: vi.fn(),
  },
}));

describe("world editor service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("loads area and keepout layers as polygons", async () => {
    vi.mocked(areaApi.list).mockResolvedValue([
      {
        id: 11,
        name: "area-1",
        type: "NORMAL",
        verticesJson: "[[0,0],[100,0],[100,200],[0,200]]",
        metadataJson: "{}",
      },
    ]);
    vi.mocked(keepoutApi.list).mockResolvedValue([
      {
        id: 22,
        name: "keepout-1",
        verticesJson: "[[10,10],[30,10],[30,30]]",
        enabled: true,
        reason: "blocked",
      },
    ]);

    const layers = await loadMapLayers(1, 400);

    const areaLayer = layers.find((layer) => layer.context === "area");
    const keepoutLayer = layers.find((layer) => layer.context === "keepout");

    expect(areaLayer).toMatchObject({
      id: "area-11",
      context: "area",
      shape: "polygon",
      serverId: 11,
      serverType: "NORMAL",
      serverMetadataJson: "{}",
    });
    expect(keepoutLayer).toMatchObject({
      id: "keepout-22",
      context: "keepout",
      shape: "polygon",
      serverEnabled: true,
      serverReason: "blocked",
    });
    expect(areaLayer?.points).toHaveLength(4);
    expect(keepoutLayer?.points).toHaveLength(3);
  });

  it("converts rect layers to polygon", () => {
    const rectLayer: Layer = {
      id: "rect-1",
      name: "rect",
      x: 10,
      y: 20,
      width: 30,
      height: 40,
      shape: "rect",
      context: "area",
      visible: true,
      color: "#f97316",
      content: "rect",
    };

    const polygonLayer = ensurePolygonLayer(rectLayer);

    expect(polygonLayer).not.toBeNull();
    expect(polygonLayer?.shape).toBe("polygon");
    expect(polygonLayer?.points?.length).toBe(4);
    expect(polygonLayer?.points).toEqual([
      { x: 10, y: 20 },
      { x: 40, y: 20 },
      { x: 40, y: 60 },
      { x: 10, y: 60 },
    ]);
  });

  it("saves area and keepout shapes to API", async () => {
    const rectPolygonLayer: Layer = {
      id: "shape-1",
      name: "area-1",
      x: 10,
      y: 10,
      width: 24,
      height: 24,
      shape: "polygon",
      points: [
        { x: 10, y: 10 },
        { x: 20, y: 10 },
        { x: 20, y: 20 },
      ],
      context: "area",
      visible: true,
      color: "#f97316",
      content: "area-1",
    };

    const keepoutPolygonLayer: Layer = {
      id: "shape-2",
      name: "keepout-1",
      x: 40,
      y: 40,
      width: 24,
      height: 24,
      shape: "polygon",
      points: [
        { x: 40, y: 40 },
        { x: 50, y: 40 },
        { x: 50, y: 50 },
      ],
      context: "keepout",
      visible: true,
      color: "#2563eb",
      content: "keepout-1",
    };

    vi.mocked(areaApi.create).mockResolvedValue({
      id: 101,
      name: "area-1",
      type: null,
      metadataJson: "{}",
      verticesJson: "[[0,0],[1,1]]",
    });
    await saveLayer(1, rectPolygonLayer, "area", "NORMAL", "{}", true, "", 100);
    expect(areaApi.create).toHaveBeenCalledWith(1, {
      name: "area-1",
      type: "NORMAL",
      verticesJson: "[[10,90],[20,90],[20,80]]",
      metadataJson: "{}",
    });

    vi.mocked(keepoutApi.create).mockResolvedValue({
      id: 201,
      name: "keepout-1",
      verticesJson: "[[0,0],[1,1]]",
      enabled: true,
      reason: null,
    });
    await saveLayer(1, keepoutPolygonLayer, "keepout", "NORMAL", "{}", false, "door", 100);
    expect(keepoutApi.create).toHaveBeenCalledWith(1, {
      name: "keepout-1",
      verticesJson: "[[40,60],[50,60],[50,50]]",
      enabled: false,
      reason: "door",
    });
  });

  it("deletes server layers by context", async () => {
    const areaLayer: Layer = {
      id: "a-1",
      name: "a",
      x: 0,
      y: 0,
      width: 10,
      height: 10,
      shape: "polygon",
      context: "area",
      serverId: 3,
      visible: true,
      color: "#f97316",
      content: "a",
      points: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: 1 }],
    };
    const keepoutLayer: Layer = {
      id: "k-1",
      name: "k",
      x: 0,
      y: 0,
      width: 10,
      height: 10,
      shape: "polygon",
      context: "keepout",
      serverId: 4,
      visible: true,
      color: "#2563eb",
      content: "k",
      points: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: 1 }],
    };

    vi.mocked(areaApi.remove).mockResolvedValue(undefined);
    vi.mocked(keepoutApi.remove).mockResolvedValue(undefined);

    await deleteLayer(1, areaLayer);
    await deleteLayer(1, keepoutLayer);

    expect(areaApi.remove).toHaveBeenCalledWith(1, 3);
    expect(keepoutApi.remove).toHaveBeenCalledWith(1, 4);
  });

  it("buildWorldImage calls build and image APIs", async () => {
    vi.mocked(worldApi.build).mockResolvedValue({
      widthCells: 2,
      heightCells: 2,
      cellSizePx: 1,
      occupancy: [[0]],
    });
    vi.mocked(worldApi.getImage).mockResolvedValue(
      new Blob(["bin"], { type: "image/png" }),
    );

    const blob = await buildWorldImage(1);

    expect(worldApi.build).toHaveBeenCalledWith(1);
    expect(worldApi.getImage).toHaveBeenCalledWith(1);
    expect(blob.size).toBe(3);
  });
});
