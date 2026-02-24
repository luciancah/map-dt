export type MapEntity = {
  id: number;
  name: string;
  sensorMapImagePath?: string | null;
};

export type MapWithImage = MapEntity;

export type ActorEntity = {
  id: number;
  name: string;
  enabled: boolean;
};

export type RobotEntity = {
  id: number;
  name: string;
};

export type AreaEntity = {
  id: number;
  name: string;
  type: string | null;
  verticesJson: string;
  metadataJson: string | null;
  map?: unknown;
};

export type KeepoutEntity = {
  id: number;
  name: string;
  verticesJson: string;
  enabled: boolean;
  reason: string | null;
  map?: unknown;
};

export type GridMapPayload = {
  widthCells: number;
  heightCells: number;
  cellSizePx: number;
  occupancy: number[][];
};

export type HttpErrorPayload = {
  status: number;
  message: string;
};
