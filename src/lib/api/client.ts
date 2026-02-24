import {
  ActorEntity,
  AreaEntity,
  GridMapPayload,
  KeepoutEntity,
  MapEntity,
  MapWithImage,
  RobotEntity,
} from "@/lib/api/types";

const API_BASE_URL = process.env.NEXT_PUBLIC_TUDUBEM_API_URL ?? "http://localhost:8080";

export class ApiResponseError extends Error {
  status: number;
  statusText: string;

  constructor(status: number, statusText: string, message: string) {
    super(message);
    this.name = "ApiResponseError";
    this.status = status;
    this.statusText = statusText;
  }
}

const ensureOk = async (response: Response) => {
  if (response.ok) {
    return response;
  }

  const responseText = await response.text();
  throw new ApiResponseError(
    response.status,
    response.statusText,
    responseText || response.statusText,
  );
};

const parseJson = async <T>(response: Response): Promise<T> => {
  if (response.status === 204) {
    return null as T;
  }

  if (response.headers.get("content-length") === "0") {
    return null as T;
  }

  return (await response.json()) as T;
};

const request = async <T>(path: string, init?: RequestInit): Promise<T> => {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      ...(init?.headers ?? {}),
    },
    credentials: "include",
  });
  await ensureOk(response);
  return parseJson<T>(response);
};

const requestNoContent = async (path: string, init?: RequestInit): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      ...(init?.headers ?? {}),
    },
    credentials: "include",
  });
  await ensureOk(response);
};

const requestBlob = async (path: string): Promise<Blob> => {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    credentials: "include",
  });
  await ensureOk(response);
  return response.blob();
};

export const mapApi = {
  async list(): Promise<MapEntity[]> {
    return request<MapEntity[]>("/map");
  },

  async getById(id: number): Promise<MapEntity> {
    return request<MapEntity>(`/map/${id}`);
  },

  async create(name: string): Promise<MapWithImage> {
    return request<MapWithImage>("/map", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({ name }),
    });
  },

  async update(id: number, name: string): Promise<MapEntity> {
    return request<MapEntity>(`/map/${id}`, {
      method: "PUT",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({ name }),
    });
  },

  async remove(id: number): Promise<void> {
    await requestNoContent(`/map/${id}`, { method: "DELETE" });
  },

  async uploadSensorMap(id: number, file: File): Promise<MapWithImage> {
    const formData = new FormData();
    formData.append("file", file);
    return request<MapWithImage>(`/map/${id}/sensor-map`, {
      method: "POST",
      body: formData,
    });
  },

  getSensorMapUrl(id: number): string {
    return `${API_BASE_URL}/map/${id}/sensor-map`;
  },
};

export const actorApi = {
  async list(): Promise<ActorEntity[]> {
    return request<ActorEntity[]>("/actor");
  },

  async create(name: string, enabled = true): Promise<ActorEntity> {
    return request<ActorEntity>("/actor", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name, enabled }),
    });
  },

  async update(id: number, name: string, enabled: boolean): Promise<ActorEntity> {
    return request<ActorEntity>(`/actor/${id}`, {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name, enabled }),
    });
  },

  async remove(id: number): Promise<void> {
    await requestNoContent(`/actor/${id}`, { method: "DELETE" });
  },
};

export const robotApi = {
  async list(): Promise<RobotEntity[]> {
    return request<RobotEntity[]>("/robot");
  },

  async create(name: string): Promise<RobotEntity> {
    return request<RobotEntity>("/robot", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name }),
    });
  },

  async update(id: number, name: string): Promise<RobotEntity> {
    return request<RobotEntity>(`/robot/${id}`, {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name }),
    });
  },

  async remove(id: number): Promise<void> {
    await requestNoContent(`/robot/${id}`, { method: "DELETE" });
  },
};

export const areaApi = {
  async list(mapId: number): Promise<AreaEntity[]> {
    return request<AreaEntity[]>(`/map/${mapId}/areas`);
  },

  async create(
    mapId: number,
    payload: Pick<AreaEntity, "name" | "type" | "verticesJson" | "metadataJson">,
  ): Promise<AreaEntity> {
    return request<AreaEntity>(`/map/${mapId}/areas`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
  },

  async update(
    mapId: number,
    id: number,
    payload: Pick<AreaEntity, "name" | "type" | "verticesJson" | "metadataJson">,
  ): Promise<AreaEntity> {
    return request<AreaEntity>(`/map/${mapId}/areas/${id}`, {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
  },

  async remove(mapId: number, id: number): Promise<void> {
    await requestNoContent(`/map/${mapId}/areas/${id}`, { method: "DELETE" });
  },
};

export const keepoutApi = {
  async list(mapId: number): Promise<KeepoutEntity[]> {
    return request<KeepoutEntity[]>(`/map/${mapId}/keepout-zones`);
  },

  async create(
    mapId: number,
    payload: Pick<KeepoutEntity, "name" | "verticesJson" | "enabled" | "reason">,
  ): Promise<KeepoutEntity> {
    return request<KeepoutEntity>(`/map/${mapId}/keepout-zones`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
  },

  async update(
    mapId: number,
    id: number,
    payload: Pick<KeepoutEntity, "name" | "verticesJson" | "enabled" | "reason">,
  ): Promise<KeepoutEntity> {
    return request<KeepoutEntity>(`/map/${mapId}/keepout-zones/${id}`, {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
  },

  async remove(mapId: number, id: number): Promise<void> {
    await requestNoContent(`/map/${mapId}/keepout-zones/${id}`, {
      method: "DELETE",
    });
  },
};

export const worldApi = {
  async build(mapId: number): Promise<GridMapPayload> {
    return request<GridMapPayload>(`/world/${mapId}/build`, {
      method: "POST",
    });
  },

  async getImage(mapId: number): Promise<Blob> {
    return requestBlob(`/world/${mapId}/image`);
  },
};
