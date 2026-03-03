"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { MapEntity } from "@/lib/api/types";
import { mapApi, monitorApi } from "@/lib/api/client";

export default function MonitorPage() {
  const [maps, setMaps] = useState<MapEntity[]>([]);
  const [mapId, setMapId] = useState("");
  const [actorId, setActorId] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const objectUrlRef = useRef<string>("");

  useEffect(() => {
    const load = async () => {
      const mapList = await mapApi.list();
      setMaps(mapList);
      if (!mapId && mapList[0]) {
        setMapId(String(mapList[0].id));
      }
    };

    void load();
  }, [mapId]);

  useEffect(() => {
    return () => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
      }
    };
  }, []);

  const fetchImage = useCallback(async () => {
    if (!mapId) return;

    setLoading(true);
    setError("");

    try {
      const blob = await monitorApi.getTrajectoryImage(Number(mapId), actorId ? Number(actorId) : undefined);
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
      }
      const nextUrl = URL.createObjectURL(blob);
      objectUrlRef.current = nextUrl;
      setImageUrl(nextUrl);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "궤적 조회 실패");
    } finally {
      setLoading(false);
    }
  }, [actorId, mapId]);

  useEffect(() => {
    if (mapId) {
      void fetchImage();
    }
  }, [fetchImage, mapId]);

  const onSubmit = useCallback(
    (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      void fetchImage();
    },
    [fetchImage],
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>트래젝토리 모니터</CardTitle>
        <CardDescription>Actor 궤적 이미지를 조회합니다.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={onSubmit} className="space-y-3">
          <div className="space-y-1">
            <Label htmlFor="monitor-map-id">맵</Label>
            <select
              id="monitor-map-id"
              value={mapId}
              onChange={(event) => setMapId(event.target.value)}
              className="h-9 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              disabled={loading}
            >
              <option value="">맵 선택</option>
              {maps.map((item) => (
                <option key={item.id} value={String(item.id)}>
                  {item.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <Label htmlFor="monitor-actor-id">Actor ID (선택)</Label>
            <Input
              id="monitor-actor-id"
              value={actorId}
              onChange={(event) => setActorId(event.target.value)}
              placeholder="비워두면 기본 값 사용"
              type="number"
              disabled={loading}
            />
          </div>

          <Button type="submit" disabled={!mapId || loading}>
            {loading ? "조회 중..." : "조회"}
          </Button>
        </form>

        {error ? <p className="text-sm text-destructive">{error}</p> : null}

        {imageUrl ? (
          <img
            src={imageUrl}
            alt="actor trajectory"
            className="max-h-[70vh] max-w-full rounded-md border object-contain"
          />
        ) : null}
      </CardContent>
    </Card>
  );
}
