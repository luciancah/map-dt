import { describe, expect, it } from "vitest";
import { calculateScaleByWidth, formatScaleValue } from "./scale";

describe("map scale calculations", () => {
  it("calculates scale by map width and grid count", () => {
    const scale = calculateScaleByWidth({
      pixelWidth: 1200,
      realWidthMeters: 1200,
      gridCount: 64,
    });

    expect(scale).toEqual({
      pixelWidth: 1200,
      realWidthMeters: 1200,
      gridCount: 64,
      metersPerPixel: 1,
      pixelsPerMeter: 1,
      pixelsPerGrid: 18.75,
      metersPerGrid: 18.75,
    });
  });

  it("throws for invalid grid count", () => {
    expect(() =>
      calculateScaleByWidth({
        pixelWidth: 1200,
        realWidthMeters: 1000,
        gridCount: 0,
      }),
    ).toThrow("gridCount must be greater than 0");
  });

  it("formats scale strings with fixed locale style", () => {
    expect(formatScaleValue(18.75)).toBe("18.75");
  });
});
