import { useCallback, useEffect, useRef, useState } from "react";
import type { MapImage, Layer } from "@/lib/map-editor/types";
import type { EditableMap } from "@/features/world-editor/types";
import {
  loadMapAsset,
  loadMapLayers,
} from "@/features/world-editor/services/world-editor-service";

type UseWorldEditorMapLoaderOptions = {
  selectedMap: EditableMap | undefined;
  selectedMapId: number | null;
  clearAllLayers: () => void;
  setLayersFromServer: (nextLayers: Layer[]) => void;
  onMessage: (message: string) => void;
  onMapImageChange?: (mapImage: MapImage | null) => void;
};

type UseWorldEditorMapLoaderResult = {
  mapImage: MapImage | null;
  loading: boolean;
  reloadMap: () => void;
};

export function useWorldEditorMapLoader({
  selectedMap,
  selectedMapId,
  clearAllLayers,
  setLayersFromServer,
  onMessage,
  onMapImageChange,
}: UseWorldEditorMapLoaderOptions): UseWorldEditorMapLoaderResult {
  const [mapImage, setMapImage] = useState<MapImage | null>(null);
  const [loading, setLoading] = useState(false);
  const [reloadToken, setReloadToken] = useState(0);
  const objectUrlRef = useRef<string | null>(null);
  const latestLoadTokenRef = useRef(0);

  const reloadMap = useCallback(() => {
    setReloadToken((prev) => prev + 1);
  }, []);

  const safeRevokeObjectURL = useCallback((objectUrl: string | null) => {
    if (objectUrl && typeof URL.revokeObjectURL === "function") {
      URL.revokeObjectURL(objectUrl);
    }
  }, []);

  useEffect(() => {
    if (!selectedMapId) {
      const sync = async () => {
        if (objectUrlRef.current) {
          safeRevokeObjectURL(objectUrlRef.current);
          objectUrlRef.current = null;
        }

        setMapImage(null);
        onMapImageChange?.(null);
        clearAllLayers();
        setLoading(false);
        onMessage("");
      };

      void sync();
      return;
    }

    if (!selectedMap) {
      const sync = async () => {
        if (objectUrlRef.current) {
          safeRevokeObjectURL(objectUrlRef.current);
          objectUrlRef.current = null;
        }

        setMapImage(null);
        onMapImageChange?.(null);
        clearAllLayers();
        setLoading(false);
        onMessage("선택한 맵을 찾을 수 없습니다.");
      };

      void sync();
      return;
    }

    if (!selectedMap.sensorMapImagePath) {
      const sync = async () => {
        if (objectUrlRef.current) {
          safeRevokeObjectURL(objectUrlRef.current);
          objectUrlRef.current = null;
        }

        setMapImage(null);
        onMapImageChange?.(null);
        clearAllLayers();
        setLoading(false);
        onMessage("센서맵이 없습니다.");
      };

      void sync();
      return;
    }

    const loadToken = ++latestLoadTokenRef.current;
    let disposed = false;

    const load = async () => {
      setLoading(true);
      onMessage("");
      clearAllLayers();
      setMapImage(null);

      const loadedMap = await loadMapAsset(selectedMap);
      if (disposed || latestLoadTokenRef.current !== loadToken) {
        safeRevokeObjectURL(loadedMap.src);
        return;
      }

      if (objectUrlRef.current) {
        safeRevokeObjectURL(objectUrlRef.current);
      }
      objectUrlRef.current = loadedMap.src;
      setMapImage(loadedMap);
      onMapImageChange?.(loadedMap);

      const layers = await loadMapLayers(selectedMap.id, loadedMap.height);
      if (!disposed && latestLoadTokenRef.current === loadToken) {
        setLayersFromServer(layers);
      }
    };

    void load()
      .catch((caught) => {
        if (disposed || latestLoadTokenRef.current !== loadToken) {
          return;
        }

        onMessage(caught instanceof Error ? caught.message : "맵 로딩 실패");
        setMapImage(null);
        onMapImageChange?.(null);
        setLayersFromServer([]);
      })
      .finally(() => {
        if (!disposed && latestLoadTokenRef.current === loadToken) {
          setLoading(false);
        }
      });

    return () => {
      disposed = true;
      if (loadToken === latestLoadTokenRef.current) {
        setLoading(false);
      }
    };
  }, [
    clearAllLayers,
    safeRevokeObjectURL,
    onMessage,
    onMapImageChange,
    reloadToken,
    selectedMapId,
    selectedMap,
    setLayersFromServer,
  ]);

  useEffect(() => {
    return () => {
      if (objectUrlRef.current) {
        safeRevokeObjectURL(objectUrlRef.current);
      }
      latestLoadTokenRef.current += 1;
    };
  }, [safeRevokeObjectURL]);

  useEffect(() => {
    if (!selectedMapId) return;

    if (!selectedMap) {
      onMessage("선택한 맵을 찾을 수 없습니다.");
      return;
    }

    if (!selectedMap.sensorMapImagePath) {
      onMessage("센서맵이 없습니다.");
      return;
    }

    onMessage("");
  }, [onMessage, selectedMap, selectedMapId]);

  return {
    mapImage,
    loading,
    reloadMap,
  };
}
