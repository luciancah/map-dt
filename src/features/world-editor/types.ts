import type { ChangeEvent, FormEvent } from "react";
import type { AreaEntity, KeepoutEntity, MapEntity } from "@/lib/api/types";
import type { LayerContext, Layer } from "@/lib/map-editor/types";

export type EditableMap = MapEntity & { sensorMapImagePath?: string | null };

export type EditorFormState = {
  areaType: string;
  metadataJson: string;
  keepoutEnabled: boolean;
  keepoutReason: string;
  layerContext: LayerContext;
};

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

export type LoadMapImageResult = {
  id: string;
  fileName: string;
  src: string;
  width: number;
  height: number;
};

export type LayerWithServerState = Layer & {
  serverId?: number;
};

export type MapResponseEntity = AreaEntity | KeepoutEntity;

export type EntityListErrorState = string;

export type FormSubmitEvent = FormEvent<HTMLFormElement>;
export type FileInputChangeEvent = ChangeEvent<HTMLInputElement>;

export type WorldBuilderActions = {
  setSelectedMapId: (id: number | null) => void;
  selectMapByValue: (value: string) => void;
  setToolWithMapGuard: (tool: "select" | "rect" | "polygon") => void;
  saveSelectedLayer: () => Promise<void>;
  deleteSelectedLayer: () => Promise<void>;
  buildWorld: () => Promise<void>;
  setLayerContext: (context: LayerContext) => void;
};
