import type { AreaEntity, KeepoutEntity, MapEntity } from "@/lib/api/types";

export type EditableMap = MapEntity & { sensorMapImagePath?: string | null };

export type SaveLayerPayload = {
  name: string;
  verticesJson: string;
  type: string | null;
  metadataJson: string;
};

export type SaveKeepoutPayload = {
  name: string;
  verticesJson: string;
  enabled: boolean;
  reason: string | null;
};

export type MapResponseEntity = AreaEntity | KeepoutEntity;
