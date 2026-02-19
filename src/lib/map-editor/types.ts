export type Tool = "select" | "rect";

export type Layer = {
  id: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  visible: boolean;
  content: string;
};

export type MapImage = {
  id: string;
  fileName: string;
  src: string;
  width: number;
  height: number;
};

export type Point = {
  x: number;
  y: number;
};

export type Interaction =
  | {
      type: "drawing";
      startX: number;
      startY: number;
      currentX: number;
      currentY: number;
    }
  | {
      type: "dragging";
      layerId: string;
      startX: number;
      startY: number;
      originX: number;
      originY: number;
    }
  | {
      type: "resizing";
      layerId: string;
      startX: number;
      startY: number;
      originWidth: number;
      originHeight: number;
      originX: number;
      originY: number;
      handle: ResizeHandle;
    };

export type DraftRect = {
  left: number;
  top: number;
  width: number;
  height: number;
};

export type ResizeHandle =
  | "nw"
  | "n"
  | "ne"
  | "e"
  | "se"
  | "s"
  | "sw"
  | "w";

export type DistanceUnit = "m" | "km";

export type MapScale = {
  pixelWidth: number;
  realWidthMeters: number;
  gridCount: number;
  pixelsPerMeter: number;
  metersPerPixel: number;
  pixelsPerGrid: number;
  metersPerGrid: number;
};
