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

export type GenerateRequest = {
  message: string;
  conversationId?: string | null;
};

export type GenerateResponse = {
  conversationId: string;
  generation: string;
  reason?: string | null;
};

export type GenerateStreamResponse = {
  conversationId: string;
  index: number;
  delta: string;
  done: boolean;
};

export type GridPoint = {
  x: number;
  y: number;
};

export type ActorMovePayload = {
  actorId: number;
  x: number;
  y: number;
};

export type ActorMoveResponse = {
  found: boolean;
  path: GridPoint[];
  reason: string;
};

export type ActorStatus = {
  actorId: number;
  size: number;
  x: number;
  y: number;
  speech?: string;
  [key: string]: unknown;
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
