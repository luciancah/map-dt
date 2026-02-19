import { describe, expect, it } from "vitest";
import type { Layer, Point } from "@/lib/map-editor/types";
import {
  clamp,
  clampPointToBounds,
  computePolygonBounds,
  isValidPolygon,
  makeUniqueLayerName,
  normalizeLayerName,
  normalizeLayerNameForCompare,
  normalizeRect,
} from "./geometry";

describe("geometry utilities", () => {
  it("clamps values into range", () => {
    expect(clamp(-10, 0, 10)).toBe(0);
    expect(clamp(5, 0, 10)).toBe(5);
    expect(clamp(12, 0, 10)).toBe(10);
  });

  it("normalizes a rectangle regardless of drag direction", () => {
    expect(normalizeRect(20, 30, 5, 10)).toEqual({
      left: 5,
      top: 10,
      width: 15,
      height: 20,
    });
  });

  it("normalizes layer names", () => {
    expect(normalizeLayerName("  Zone A ")).toBe("Zone A");
    expect(normalizeLayerNameForCompare(" Zone A ")).toBe("zone a");
  });

  it("creates unique layer names by adding numeric suffix", () => {
    const layers: Layer[] = [
      { id: "a", name: "Zone", x: 0, y: 0, width: 10, height: 10, shape: "rect", color: "#fff", visible: true, content: "Zone" },
      { id: "b", name: "zone 1", x: 0, y: 0, width: 10, height: 10, shape: "rect", color: "#fff", visible: true, content: "zone 1" },
      { id: "c", name: "ZONE 2", x: 0, y: 0, width: 10, height: 10, shape: "polygon", color: "#fff", visible: true, content: "ZONE 2", points: [] },
    ];

    expect(makeUniqueLayerName(layers, "Zone")).toBe("Zone 3");
    expect(makeUniqueLayerName(layers, "zone 1")).toBe("zone 1 1");
    expect(makeUniqueLayerName(layers, "Zone", "a")).toBe("Zone");
    expect(makeUniqueLayerName(layers, "  ")).toBe("");
  });

  it("validates polygons with distinct consecutive points", () => {
    const valid: Point[] = [
      { x: 0, y: 0 },
      { x: 10, y: 0 },
      { x: 10, y: 10 },
    ];
    const invalid: Point[] = [
      { x: 0, y: 0 },
      { x: 0, y: 0 },
      { x: 10, y: 10 },
    ];
    const samePoints: Point[] = [
      { x: 2, y: 2 },
      { x: 2, y: 2 },
      { x: 2, y: 2 },
    ];
    const tooSmall: Point[] = [{ x: 0, y: 0 }, { x: 10, y: 10 }];

    expect(isValidPolygon(valid)).toBe(true);
    expect(isValidPolygon(tooSmall)).toBe(false);
    expect(isValidPolygon(invalid)).toBe(true);
    expect(isValidPolygon(samePoints)).toBe(false);
  });

  it("computes polygon bounds with minimum shape size", () => {
    const bounds = computePolygonBounds([
      { x: 2, y: 3 },
      { x: 8, y: 4 },
      { x: 6, y: 5 },
    ]);

    expect(bounds).toEqual({
      x: 2,
      y: 3,
      width: 24,
      height: 24,
    });
  });

  it("clamps points to map bounds when bounds are given", () => {
    expect(
      clampPointToBounds({ x: -5, y: 200 }, 100, 120),
    ).toEqual({ x: 0, y: 120 });

    expect(
      clampPointToBounds({ x: 40, y: 60 }, undefined, null),
    ).toEqual({ x: 40, y: 60 });
  });
});
