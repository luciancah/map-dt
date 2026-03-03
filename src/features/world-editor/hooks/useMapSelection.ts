import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { loadMaps } from "@/features/world-editor/services/world-editor-service";
import type { EditableMap } from "@/features/world-editor/types";

type MapOption = {
  id: number;
  name: string;
};

export type UseMapSelectionResult = {
  maps: EditableMap[];
  mapsError: string;
  mapOptions: MapOption[];
  selectedMapId: number | null;
  selectedMap: EditableMap | undefined;
  onMapSelect: (value: string) => void;
};

export function useMapSelection(): UseMapSelectionResult {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pendingMapIdRef = useRef<number | null>(null);

  const [maps, setMaps] = useState<EditableMap[]>([]);
  const [mapsError, setMapsError] = useState("");

  const mapOptions = useMemo(
    () => maps.map((item) => ({ id: item.id, name: item.name })),
    [maps],
  );
  const queryMapId = useMemo(() => {
    const nextMapId = Number(searchParams.get("mapId") || "");
    return Number.isFinite(nextMapId) && nextMapId > 0 ? nextMapId : null;
  }, [searchParams]);

  const selectedMapId = useMemo(() => {
    if (queryMapId === null) {
      return maps[0]?.id ?? null;
    }

    const hasQueryMap = maps.some((item) => item.id === queryMapId);
    if (!hasQueryMap) {
      return maps[0]?.id ?? null;
    }

    return queryMapId;
  }, [maps, queryMapId]);

  const selectedMap = useMemo(
    () => maps.find((item) => item.id === selectedMapId),
    [maps, selectedMapId],
  );

  useEffect(() => {
    const load = async () => {
      const list = await loadMaps();
      setMaps(list);
      setMapsError("");
    };

    load().catch((caught) => {
      setMapsError(caught instanceof Error ? caught.message : "맵 목록 조회 실패");
    });
  }, []);

  const onMapSelect = (value: string) => {
    const nextMapId = Number(value);
    if (!Number.isFinite(nextMapId) || nextMapId <= 0) {
      return;
    }

    if (queryMapId === nextMapId) return;
    if (pendingMapIdRef.current === nextMapId) return;

    pendingMapIdRef.current = nextMapId;
    router.replace(`/world-editor?mapId=${nextMapId}`);
  };

  useEffect(() => {
    if (queryMapId === null) {
      return;
    }

    if (pendingMapIdRef.current === queryMapId) {
      pendingMapIdRef.current = null;
    }
  }, [queryMapId]);

  return {
    maps,
    mapsError,
    mapOptions,
    selectedMapId,
    selectedMap,
    onMapSelect,
  };
}
