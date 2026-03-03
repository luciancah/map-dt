"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import type { ActorEntity, ActorMoveResponse, ActorStatus, MapEntity } from "@/lib/api/types";
import { actorApi, actorSimApi, mapApi } from "@/lib/api/client";

export default function SimulationPage() {
  const [maps, setMaps] = useState<MapEntity[]>([]);
  const [actors, setActors] = useState<ActorEntity[]>([]);
  const [mapId, setMapId] = useState("");
  const [actorId, setActorId] = useState("");
  const [targetX, setTargetX] = useState("0");
  const [targetY, setTargetY] = useState("0");
  const [moveResponse, setMoveResponse] = useState<ActorMoveResponse | null>(null);
  const [statusEvents, setStatusEvents] = useState<ActorStatus[]>([]);
  const [loading, setLoading] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const [selectedActorName, setSelectedActorName] = useState("");
  const [error, setError] = useState("");
  const unsubscribeRef = useRef<null | (() => void)>(null);

  const canMove = useMemo(() => {
    return Boolean(mapId && actorId && Number.isInteger(Number(targetX)) && Number.isInteger(Number(targetY)));
  }, [mapId, actorId, targetX, targetY]);

  const loadData = useCallback(async () => {
    const [mapList, actorList] = await Promise.all([mapApi.list(), actorApi.list()]);
    setMaps(mapList);
    setActors(actorList);

    if (!mapId && mapList[0]) {
      setMapId(String(mapList[0].id));
    }

    if (!actorId && actorList[0]) {
      setActorId(String(actorList[0].id));
      setSelectedActorName(actorList[0].name);
    }
  }, [actorId, mapId]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  useEffect(() => {
    const id = Number(actorId);
    const actor = actors.find((next) => next.id === id);
    setSelectedActorName(actor?.name ?? "");
  }, [actorId, actors]);

  const stopStream = useCallback(() => {
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }
    setStreaming(false);
  }, []);

  useEffect(() => {
    return () => {
      stopStream();
    };
  }, [stopStream]);

  const onMove = useCallback(async () => {
    if (!canMove || !mapId || !actorId) {
      return;
    }

    setLoading(true);
    setError("");
    setMoveResponse(null);

    try {
      const response = await actorSimApi.move(Number(mapId), {
        actorId: Number(actorId),
        x: Number(targetX),
        y: Number(targetY),
      });
      setMoveResponse(response);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "이동 요청 실패");
    } finally {
      setLoading(false);
    }
  }, [actorId, canMove, mapId, targetX, targetY]);

  const onToggleStream = useCallback(() => {
    if (streaming) {
      stopStream();
      return;
    }

    setError("");
    stopStream();
    unsubscribeRef.current = actorSimApi.subscribeStatusStream((next) => {
      setStatusEvents((prev) => [...prev.slice(-32), next]);
    }, (caught) => {
      setError(caught instanceof Error ? caught.message : "상태 스트림 연결 실패");
    });
    setStreaming(true);
  }, [streaming, stopStream]);

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader>
          <CardTitle>Actor 시뮬레이션</CardTitle>
          <CardDescription>Actor 이동 시뮬레이션과 상태 스트림을 테스트합니다.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-1">
              <Label htmlFor="sim-map-id">맵</Label>
              <select
                id="sim-map-id"
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
              <Label htmlFor="sim-actor-id">Actor</Label>
              <select
                id="sim-actor-id"
                value={actorId}
                onChange={(event) => setActorId(event.target.value)}
                className="h-9 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                disabled={loading}
              >
                <option value="">Actor 선택</option>
                {actors.map((item) => (
                  <option key={item.id} value={String(item.id)}>
                    {item.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <Label htmlFor="sim-target-x">목표 X</Label>
              <Input
                id="sim-target-x"
                type="number"
                value={targetX}
                onChange={(event) => setTargetX(event.target.value)}
                disabled={loading}
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="sim-target-y">목표 Y</Label>
              <Input
                id="sim-target-y"
                type="number"
                value={targetY}
                onChange={(event) => setTargetY(event.target.value)}
                disabled={loading}
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button onClick={onMove} disabled={loading || !canMove}>
              {loading ? "이동 요청 중" : "이동 실행"}
            </Button>
            <Button type="button" variant="outline" onClick={onToggleStream}>
              {streaming ? "스트림 중단" : "상태 스트림 시작"}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={loadData}
            >
              목록 갱신
            </Button>
          </div>

          {error ? <p className="text-sm text-destructive">{error}</p> : null}

          {selectedActorName ? <p className="text-sm text-muted-foreground">선택 actor: {selectedActorName}</p> : null}

          {moveResponse ? (
            <div className="rounded-md border border-dashed border-stone-300 bg-stone-50 p-3 text-sm">
              <p className="font-medium">이동 응답</p>
              <p>찾음: {moveResponse.found ? "true" : "false"}</p>
              <p>이유: {moveResponse.reason}</p>
              <p>경로 길이: {moveResponse.path.length}</p>
              {moveResponse.path.length ? (
                <p>마지막 좌표: ({moveResponse.path.at(-1)?.x}, {moveResponse.path.at(-1)?.y})</p>
              ) : null}
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Actor 상태 스트림</CardTitle>
          <CardDescription>actor-status SSE 이벤트 로그입니다.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            {statusEvents.length === 0 ? (
              <p className="text-muted-foreground">수신 이벤트가 없습니다.</p>
            ) : null}
            <ul className="space-y-2">
              {statusEvents.map((status, index) => (
                <li key={`${status.actorId}-${index}`} className="rounded-md border p-2">
                  <p>ID: {status.actorId}</p>
                  <p>위치: ({status.x}, {status.y})</p>
                  <p>크기: {status.size}</p>
                  {status.speech ? <p>메시지: {status.speech}</p> : null}
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
