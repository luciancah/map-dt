import React from "react";
import { withOpacity } from "@/lib/map-editor/colors";

type DraftRect = {
  left: number;
  top: number;
  width: number;
  height: number;
};

type DraftPolygon = {
  points: Array<{ x: number; y: number }>;
  currentX: number;
  currentY: number;
};

type DraftShapesProps = {
  draftRect: DraftRect | null;
  draftPolygon: DraftPolygon | null;
  displayScale: number;
};

export function DraftShapes({
  draftRect,
  draftPolygon,
  displayScale,
}: DraftShapesProps) {
  const renderDraftRect = () => {
    if (!draftRect) return null;
    return (
      <div
        className="pointer-events-none absolute border-2 border-dashed border-orange-600 bg-orange-300/30"
        style={{
          left: `${draftRect.left * displayScale}px`,
          top: `${draftRect.top * displayScale}px`,
          width: `${draftRect.width * displayScale}px`,
          height: `${draftRect.height * displayScale}px`,
        }}
      />
    );
  };

  const renderDraftPolygon = () => {
    if (!draftPolygon) return null;

    const hasClosedShape = draftPolygon.points.length >= 3;
    const draftPolygonPoints = draftPolygon.points
      .map((point) => `${point.x * displayScale},${point.y * displayScale}`)
      .join(" ");
    const draftNodePoints =
      draftPolygon.points.length >= 2
        ? draftPolygon.points.slice(0, -1)
        : [];

    return (
      <svg className="pointer-events-none absolute inset-0 h-full w-full">
        <polyline
          points={draftPolygonPoints}
          fill="none"
          stroke="rgba(249, 115, 22, 0.9)"
          strokeWidth={1}
          strokeDasharray="8 6"
        />
        {hasClosedShape ? (
          <polygon
            points={draftPolygonPoints}
            fill={withOpacity("#f97316", 0.18)}
            stroke={withOpacity("#f97316", 0.9)}
            strokeWidth={1}
          />
        ) : null}
        {draftNodePoints.length > 0
          ? draftNodePoints.map((point, index) => (
              <circle
                key={`${point.x}-${point.y}-${index}`}
                cx={point.x * displayScale}
                cy={point.y * displayScale}
                r={3.5}
                fill="#fb923c"
                stroke="rgba(255, 255, 255, 0.95)"
                strokeWidth={1.5}
              />
            ))
          : null}
        {draftPolygon.points.length === 1 ? (
          <circle
            cx={draftPolygon.points[0]!.x * displayScale}
            cy={draftPolygon.points[0]!.y * displayScale}
            r={3.5}
            fill="#fb923c"
            stroke="rgba(255, 255, 255, 0.95)"
            strokeWidth={1.5}
          />
        ) : null}
      </svg>
    );
  };

  return (
    <>
      {renderDraftRect()}
      {renderDraftPolygon()}
    </>
  );
}
