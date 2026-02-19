import { useMemo, useState } from "react";
import { calculateScaleByWidth } from "@/lib/map-editor/scale";
import type { DistanceUnit, MapScale } from "@/lib/map-editor/types";
import { EDITOR_RULES } from "@/lib/map-editor/rules";

type UseMapScale = {
  realWidthText: string;
  unit: DistanceUnit;
  realWidthError: string;
  gridCountText: string;
  gridCountError: string;
  gridStepPx: number | null;
  scale: MapScale | null;
  setRealWidthText: (next: string) => void;
  setUnit: (next: DistanceUnit) => void;
  setGridCountText: (next: string) => void;
};

export function useMapScale(pixelWidth: number | null): UseMapScale {
  const [realWidthText, setRealWidthText] = useState(
    String(EDITOR_RULES.defaultRealWidthMeters),
  );
  const [unit, setUnit] = useState<DistanceUnit>("m");
  const [gridCountText, setGridCountText] = useState(String(EDITOR_RULES.defaultGridCount));

  const gridCount = useMemo(() => {
    const parsed = Number(gridCountText);
    if (!Number.isFinite(parsed) || parsed <= 1 || !Number.isInteger(parsed)) return 0;
    return parsed;
  }, [gridCountText]);

  const realWidthMeters = useMemo(() => {
    const parsed = Number(realWidthText);
    if (!Number.isFinite(parsed) || parsed <= 0) return 0;
    return unit === "km" ? parsed * 1000 : parsed;
  }, [realWidthText, unit]);

  const scale = useMemo(() => {
    if (!pixelWidth || !realWidthMeters || !gridCount) return null;
    return calculateScaleByWidth({
      pixelWidth,
      realWidthMeters,
      gridCount,
    });
  }, [pixelWidth, realWidthMeters, gridCount]);

  const gridStepPx = useMemo(() => {
    if (!pixelWidth || !gridCount) return null;
    return pixelWidth / gridCount;
  }, [gridCount, pixelWidth]);

  const realWidthError = useMemo(() => {
    if (!realWidthText.trim()) return "";
    if (realWidthMeters <= 0) return "0보다 큰 수를 입력하세요.";
    return "";
  }, [realWidthText, realWidthMeters]);

  const gridCountError = useMemo(() => {
    if (!gridCountText.trim()) return "";
    if (gridCount <= 1) return "1보다 큰 정수를 입력하세요.";
    return "";
  }, [gridCount, gridCountText]);

  return {
    realWidthText,
    unit,
    realWidthError,
    gridCountText,
    gridCountError,
    scale,
    gridStepPx,
    setRealWidthText,
    setUnit,
    setGridCountText,
  };
}
