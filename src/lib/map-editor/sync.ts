import type { Layer, LayerContext } from "@/lib/map-editor/types";
import { makeUniqueLayerName } from "@/lib/map-editor/geometry";
import { fromApiVertices, toApiVertices } from "@/lib/map-editor/coords";
import type { AreaEntity, KeepoutEntity } from "@/lib/api/types";
import { getDefaultLayerColorByContext } from "@/lib/map-editor/layer-colors";

type PayloadByContext = "area" | "keepout";

type ServerShape = Pick<AreaEntity, "id" | "name" | "verticesJson"> &
  Partial<Pick<AreaEntity, "type" | "metadataJson"> & Pick<KeepoutEntity, "enabled" | "reason">>;

export const mapServerShapeToLayer = (
  shape: ServerShape,
  context: PayloadByContext,
  index: number,
  mapHeight: number,
) => {
  const parsed = fromApiVertices(shape.verticesJson, mapHeight);
  const fallbackName = `${context === "area" ? "Area" : "Keepout"} ${index + 1}`;
  const displayName =
    shape.name?.trim() ? shape.name.trim() : fallbackName;

  return {
    id: `${context}-${shape.id}`,
    name: displayName,
    x: parsed.length > 0 ? Math.min(...parsed.map((point) => point.x)) : 0,
    y: parsed.length > 0 ? Math.min(...parsed.map((point) => point.y)) : 0,
    width:
      parsed.length > 1
        ? Math.max(...parsed.map((point) => point.x)) -
          Math.min(...parsed.map((point) => point.x))
        : 0,
    height:
      parsed.length > 1
        ? Math.max(...parsed.map((point) => point.y)) -
          Math.min(...parsed.map((point) => point.y))
        : 0,
    shape: "polygon",
    points: parsed,
    context,
    visible: true,
    color: getDefaultLayerColorByContext(context),
    content: displayName,
    serverId: shape.id,
    serverType: "type" in shape ? shape.type : null,
    serverMetadataJson: "metadataJson" in shape ? shape.metadataJson : null,
    serverEnabled: "enabled" in shape ? shape.enabled : true,
    serverReason: "reason" in shape ? shape.reason : null,
  } satisfies Layer;
};

export const toDefaultLayerName = (context: LayerContext, existing: Layer[]) =>
  makeUniqueLayerName(existing, context === "area" ? "Area" : "Keepout");

export const layerAsPayloadVertices = (
  layer: Layer,
  mapHeight: number,
): string => {
  return toApiVertices(
    { points: layer.points ?? [], shape: layer.shape },
    mapHeight,
  );
};
