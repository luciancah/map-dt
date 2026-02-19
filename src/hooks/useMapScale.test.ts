import { describe, expect, it } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useMapScale } from "./useMapScale";

describe("useMapScale", () => {
  it("computes initial scale and grid step from defaults", () => {
    const { result } = renderHook(() => useMapScale(1200));

    expect(result.current.realWidthText).toBe("1200");
    expect(result.current.unit).toBe("m");
    expect(result.current.gridCountText).toBe("64");
    expect(result.current.realWidthError).toBe("");
    expect(result.current.gridCountError).toBe("");
    expect(result.current.scale).not.toBeNull();
    expect(result.current.scale).toMatchObject({
      pixelWidth: 1200,
      realWidthMeters: 1200,
      gridCount: 64,
      pixelsPerGrid: 18.75,
    });
    expect(result.current.gridStepPx).toBe(18.75);
  });

  it("returns null scale when pixel width is not provided", () => {
    const { result } = renderHook(() => useMapScale(null));
    expect(result.current.scale).toBeNull();
    expect(result.current.gridStepPx).toBeNull();
  });

  it("keeps invalid real width as error and disables scale", async () => {
    const { result } = renderHook(() => useMapScale(1200));
    result.current.setRealWidthText("0");

    await waitFor(() => {
      expect(result.current.realWidthError).toBe("0보다 큰 수를 입력하세요.");
      expect(result.current.scale).toBeNull();
      expect(result.current.gridStepPx).toBe(18.75);
    });
  });

  it("validates grid count and disables scale", async () => {
    const { result } = renderHook(() => useMapScale(1200));
    result.current.setGridCountText("1");

    await waitFor(() => {
      expect(result.current.gridCountError).toBe("1보다 큰 정수를 입력하세요.");
      expect(result.current.scale).toBeNull();
      expect(result.current.gridStepPx).toBeNull();
    });
  });

  it("converts real width to meters when unit is kilometer", async () => {
    const { result } = renderHook(() => useMapScale(1200));
    result.current.setUnit("km");

    await waitFor(() => {
      expect(result.current.unit).toBe("km");
      expect(result.current.scale).toEqual(
        expect.objectContaining({
          realWidthMeters: 1200000,
          pixelsPerGrid: 18.75,
        }),
      );
    });
  });
});
