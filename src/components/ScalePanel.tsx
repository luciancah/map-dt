import { DistanceUnit } from "@/lib/map-editor/types";
import { formatScaleValue } from "@/lib/map-editor/scale";
import type { MapImage } from "@/lib/map-editor/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
  const imagePixelWidth = mapImage ? `${mapImage.width}px` : "-";
  const scaleReadouts = [
    {
      label: "지도 가로 픽셀",
      value: imagePixelWidth,
    },
    {
      label: "1 px =",
      value:
        metersPerPixel == null
          ? "-"
          : `${formatScaleValue(metersPerPixel)} m`,
    },
    {
      label: "1 m =",
      value:
        pixelsPerMeter == null
          ? "-"
          : `${formatScaleValue(pixelsPerMeter)} px`,
    },
    {
      label: "1그리드 =",
      value:
        pixelsPerGrid == null
          ? "-"
          : `${formatScaleValue(pixelsPerGrid)} px`,
    },
    {
      label: "1그리드 =",
      value:
        metersPerGrid == null
          ? "-"
          : `${formatScaleValue(metersPerGrid)} m`,
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Scale</CardTitle>
        <CardDescription>
          지도 실제 가로 길이를 입력하면 픽셀-거리 축척을 계산합니다.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-3">
        <div className="space-y-1.5">
          <Label className="text-stone-600">지도 가로 실제 길이</Label>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              placeholder={unit === "m" ? "1000" : "1"}
              value={realWidthText}
              onChange={(event) => onRealWidthChange(event.target.value)}
            />
            <Select
              value={unit}
              onValueChange={(nextUnit) => onUnitChange(nextUnit as DistanceUnit)}
            >
              <SelectTrigger className="w-20">
                <SelectValue placeholder="단위" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="m">m</SelectItem>
                <SelectItem value="km">km</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <span className="text-xs text-red-600">{error}</span>
        </div>

        <div className="rounded-md border border-stone-200 bg-stone-50 p-2 text-xs text-stone-700">
          <div className="space-y-1.5">
            <Label className="text-stone-600">지도 가로 기준 그리드 개수</Label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min={2}
                step={1}
                value={gridCountText}
                onChange={(event) => onGridCountChange(event.target.value)}
              />
              <span className="whitespace-nowrap text-xs text-stone-500">개</span>
            </div>
            <span className="block text-xs text-red-600">{gridCountError}</span>
          </div>
          {scaleReadouts.map((item, index) => (
            <p key={`${item.label}-${index}`}>
              {item.label} {item.value}
            </p>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
