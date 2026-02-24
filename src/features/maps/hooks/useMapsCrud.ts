import { useCallback, useEffect, useState } from "react";
import { mapApi } from "@/lib/api/client";
import type { MapEntity } from "@/lib/api/types";

const MAP_NAME_ERROR = "이름은 1~100자 사이여야 합니다.";

const isValidName = (value: string) => {
  const length = value.trim().length;
  return length >= 1 && length <= 100;
};

type UseMapsCrudResult = {
  maps: MapEntity[];
  loading: boolean;
  listError: string;
  createError: string;
  actionError: string;
  createOpen: boolean;
  createName: string;
  editingId: number | null;
  editingName: string;
  setCreateOpen: (next: boolean) => void;
  setCreateName: (next: string) => void;
  setEditingName: (next: string) => void;
  loadMaps: () => Promise<void>;
  createMap: (event?: React.SyntheticEvent<HTMLFormElement>) => Promise<boolean>;
  beginRename: (map: MapEntity) => void;
  cancelRename: () => void;
  submitRename: (event?: React.SyntheticEvent<HTMLFormElement>) => Promise<boolean>;
  removeMap: (mapId: number) => Promise<boolean>;
  uploadSensorMap: (mapId: number, file: File | null) => Promise<boolean>;
};

export function useMapsCrud(): UseMapsCrudResult {
  const [maps, setMaps] = useState<MapEntity[]>([]);
  const [createName, setCreateName] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [listError, setListError] = useState("");
  const [createError, setCreateError] = useState("");
  const [actionError, setActionError] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState("");

  const loadMaps = useCallback(async () => {
    const mapList = await mapApi.list();
    setMaps(mapList);
    setListError("");
  }, []);

  useEffect(() => {
    loadMaps().catch((error_) => {
      const message = error_ instanceof Error ? error_.message : "지도 목록 조회 실패";
      setListError(message);
    });
  }, [loadMaps]);

  const createMap = useCallback(
    async (event?: React.SyntheticEvent<HTMLFormElement>) => {
      event?.preventDefault();

      const nextName = createName.trim();
      if (!isValidName(nextName)) {
        setCreateError(MAP_NAME_ERROR);
        return false;
      }

      setLoading(true);
      try {
        const created = await mapApi.create(nextName);
        setMaps((prev) => [...prev, created]);
        setCreateName("");
        setCreateError("");
        setCreateOpen(false);
        return true;
      } catch (error_) {
        setCreateError(
          error_ instanceof Error ? error_.message : "맵 생성 실패",
        );
        return false;
      } finally {
        setLoading(false);
      }
    },
    [createName],
  );

  const beginRename = useCallback((map: MapEntity) => {
    setEditingId(map.id);
    setEditingName(map.name);
    setActionError("");
  }, []);

  const cancelRename = useCallback(() => {
    setEditingId(null);
    setEditingName("");
    setActionError("");
  }, []);

  const submitRename = useCallback(
    async (event?: React.SyntheticEvent<HTMLFormElement>) => {
      event?.preventDefault();
      if (!editingId) return false;

      const nextName = editingName.trim();
      if (!isValidName(nextName)) {
        setActionError(MAP_NAME_ERROR);
        return false;
      }

      try {
        const updated = await mapApi.update(editingId, nextName);
        setMaps((prev) =>
          prev.map((map) =>
            map.id === editingId ? { ...map, ...updated } : map,
          ),
        );
        setEditingId(null);
        setActionError("");
        return true;
      } catch {
        setActionError("맵 이름 수정 실패");
        return false;
      }
    },
    [editingId, editingName],
  );

  const removeMap = useCallback(async (mapId: number) => {
    try {
      await mapApi.remove(mapId);
      setMaps((prev) => prev.filter((map) => map.id !== mapId));
      if (editingId === mapId) {
        cancelRename();
      }
      return true;
    } catch {
      setActionError("맵 삭제 실패");
      return false;
    }
  }, [cancelRename, editingId]);

  const uploadSensorMap = useCallback(
    async (mapId: number, file: File | null) => {
      if (!file) return false;

      try {
        const next = await mapApi.uploadSensorMap(mapId, file);
        setMaps((prev) =>
          prev.map((map) => (map.id === mapId ? next : map)),
        );
        return true;
      } catch {
        setActionError("맵 이미지 업로드 실패");
        return false;
      }
    },
    [],
  );

  return {
    maps,
    loading,
    listError,
    createError,
    actionError,
    createOpen,
    createName,
    editingId,
    editingName,
    setCreateOpen,
    setCreateName,
    setEditingName,
    loadMaps,
    createMap,
    beginRename,
    cancelRename,
    submitRename,
    removeMap,
    uploadSensorMap,
  };
}
