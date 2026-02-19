import { DistanceUnit } from "@/lib/map-editor/types";
import { formatScaleValue } from "@/lib/map-editor/scale";
import type { MapImage } from "@/lib/map-editor/types";

type ScalePanelProps = {
  mapImage: MapImage | null;
  realWidthText: string;
  unit: DistanceUnit;
  error: string;
  onRealWidthChange: (next: string) => void;
  onUnitChange: (next: DistanceUnit) => void;
  gridCountText: string;
  gridCountError: string;
  onGridCountChange: (next: string) => void;
  pixelsPerMeter: number | null;
  metersPerPixel: number | null;
  pixelsPerGrid: number | null;
  metersPerGrid: number | null;
};

export function ScalePanel({
  mapImage,
  realWidthText,
  unit,
  error,
  onRealWidthChange,
  onUnitChange,
  gridCountText,
  gridCountError,
  onGridCountChange,
  pixelsPerMeter,
  metersPerPixel,
  pixelsPerGrid,
  metersPerGrid,
}: ScalePanelProps) {
  return (
    <section className="rounded-2xl border border-stone-200 bg-white p-4">
      <h2 className="text-sm font-semibold text-stone-900">Scale</h2>
      <p className="mt-1 text-xs text-stone-500">
        지도 실제 가로 길이를 입력하면 픽셀-거리 축척을 계산합니다.
      </p>

      <div className="mt-3 space-y-3">
        <label className="block">
          <span className="mb-1 block text-xs text-stone-600">지도 가로 실제 길이</span>
          <div className="flex items-center gap-2">
            <input
              type="number"
              placeholder={unit === "m" ? "1000" : "1"}
              value={realWidthText}
              onChange={(event) => onRealWidthChange(event.target.value)}
              className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm outline-none focus:border-orange-500"
            />
            <select
              value={unit}
              onChange={(event) => onUnitChange(event.target.value as DistanceUnit)}
              className="rounded-md border border-stone-300 px-2 py-2 text-sm"
            >
              <option value="m">m</option>
              <option value="km">km</option>
            </select>
          </div>
          <span className="mt-1 block text-xs text-red-600">{error}</span>
          </label>

        <div className="rounded-md border border-stone-200 bg-stone-50 p-2 text-xs text-stone-700">
          <label className="mb-2 block">
            <span className="mb-1 block text-xs text-stone-600">
              지도 가로 기준 그리드 개수
            </span>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={2}
                step={1}
                value={gridCountText}
                onChange={(event) => onGridCountChange(event.target.value)}
                className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm outline-none focus:border-orange-500"
              />
              <span className="text-xs text-stone-500">개</span>
            </div>
            <span className="mt-1 block text-xs text-red-600">{gridCountError}</span>
          </label>
          <p>지도 가로 픽셀: {mapImage ? `${mapImage.width}px` : "-"}</p>
          <p>
            1 px = {metersPerPixel == null ? "-" : `${formatScaleValue(metersPerPixel)} m`}
          </p>
          <p>
            1 m = {pixelsPerMeter == null ? "-" : `${formatScaleValue(pixelsPerMeter)} px`}
          </p>
          <p>
            1그리드 = {pixelsPerGrid == null ? "-" : `${formatScaleValue(pixelsPerGrid)} px`}
          </p>
          <p>
            1그리드 = {metersPerGrid == null ? "-" : `${formatScaleValue(metersPerGrid)} m`}
          </p>
        </div>
      </div>
    </section>
  );
}
