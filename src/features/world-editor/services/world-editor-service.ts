import { areaApi, keepoutApi, mapApi, worldApi } from "@/lib/api/client";
import type { AreaEntity, KeepoutEntity } from "@/lib/api/types";
import { toApiVertices } from "@/lib/map-editor/coords";
import type { MapImage } from "@/lib/map-editor/types";
import type { Layer, LayerContext } from "@/lib/map-editor/types";
import { mapServerShapeToLayer } from "@/lib/map-editor/sync";
import type {
  EditableMap,
  MapResponseEntity,
  SaveKeepoutPayload,
  SaveLayerPayload,
} from "@/features/world-editor/types";

const readImageSize = (src: string): Promise<{ width: number; height: number }> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      resolve({ width: image.naturalWidth, height: image.naturalHeight });
    };
    image.onerror = () => {
      reject(new Error("센서맵 이미지 크기 확인 실패"));
    };
    image.src = src;
  });

export const loadMaps = () => mapApi.list();

export const loadMapLayers = async (mapId: number, mapHeightPx: number) => {
  const [areaList, keepoutList] = await Promise.all([
    areaApi.list(mapId).catch((): AreaEntity[] => []),
    keepoutApi.list(mapId).catch((): KeepoutEntity[] => []),
  ]);

  const areas = areaList.map((area, index) =>
    mapServerShapeToLayer(area, "area", index, mapHeightPx),
  );
  const keepouts = keepoutList.map((keepout, index) =>
    mapServerShapeToLayer(keepout, "keepout", index, mapHeightPx),
  );

  return [...areas, ...keepouts];
};

export const loadMapAsset = async (map: EditableMap): Promise<MapImage> => {
  const response = await fetch(mapApi.getSensorMapUrl(map.id));
  if (!response.ok) {
    throw new Error("센서맵을 불러올 수 없습니다.");
  }

  const blob = await response.blob();
  const src = URL.createObjectURL(blob);
  const { width, height } = await readImageSize(src);

  return {
    id: String(map.id),
    fileName: map.name,
    src,
    width,
    height,
  } satisfies MapImage;
};

export const ensurePolygonLayer = (layer: Layer): Layer | null => {
  if (layer.shape === "polygon" && layer.points && layer.points.length >= 3) {
    return layer;
  }

  if (layer.shape !== "rect") {
    return null;
  }

  return {
    ...layer,
    shape: "polygon",
    points: [
      { x: layer.x, y: layer.y },
      { x: layer.x + layer.width, y: layer.y },
      { x: layer.x + layer.width, y: layer.y + layer.height },
      { x: layer.x, y: layer.y + layer.height },
    ],
  };
};

export const buildAreaPayload = (
  layer: Layer,
  mapHeight: number,
  areaType: string,
  metadataJson: string,
): SaveLayerPayload => {
  return {
    name: layer.name.trim(),
    type: areaType || null,
    metadataJson,
    verticesJson: toApiVertices(layer, mapHeight),
  };
};

export const buildKeepoutPayload = (
  layer: Layer,
  mapHeight: number,
  keepoutEnabled: boolean,
  keepoutReason: string,
): SaveKeepoutPayload => {
  return {
    name: layer.name.trim(),
    enabled: keepoutEnabled,
    reason: keepoutReason || null,
    verticesJson: toApiVertices(layer, mapHeight),
  };
};

export const toServerState = (
  context: LayerContext,
  entity: MapResponseEntity,
) => {
  if (context === "area") {
    const areaEntity = entity as AreaEntity;
    return {
      serverId: areaEntity.id,
      serverType: areaEntity.type,
      serverMetadataJson: areaEntity.metadataJson,
      serverEnabled: true,
      serverReason: null,
    } as const;
  }

  const keepoutEntity = entity as KeepoutEntity;
  return {
    serverId: keepoutEntity.id,
    serverType: null,
    serverMetadataJson: null,
    serverEnabled: keepoutEntity.enabled,
    serverReason: keepoutEntity.reason,
  } as const;
};

export const saveLayer = async (
  mapId: number,
  layer: Layer,
  context: LayerContext,
  areaType: string,
  metadataJson: string,
  keepoutEnabled: boolean,
  keepoutReason: string,
  mapHeight: number,
) => {
  if (context === "area") {
    const payload = buildAreaPayload(layer, mapHeight, areaType, metadataJson);
    if (!layer.serverId) {
      const created = await areaApi.create(mapId, payload);
      return { kind: "created", payload, entity: created } as const;
    }

    const updated = await areaApi.update(mapId, layer.serverId, payload);
    return { kind: "updated", payload, entity: updated } as const;
  }

  const payload = buildKeepoutPayload(layer, mapHeight, keepoutEnabled, keepoutReason);
  if (!layer.serverId) {
    const created = await keepoutApi.create(mapId, payload);
    return { kind: "created", payload, entity: created } as const;
  }

  const updated = await keepoutApi.update(mapId, layer.serverId, payload);
  return { kind: "updated", payload, entity: updated } as const;
};

export const deleteLayer = async (mapId: number, layer: Layer) => {
  if (!layer.serverId) {
    return;
  }

  if (layer.context === "keepout") {
    await keepoutApi.remove(mapId, layer.serverId);
    return;
  }

  await areaApi.remove(mapId, layer.serverId);
};

export const buildWorldImage = async (mapId: number) => {
  await worldApi.build(mapId);
  return worldApi.getImage(mapId);
};
