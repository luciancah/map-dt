"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { mapApi } from "@/lib/api/client";
import type { ChangeEvent } from "react";
import type { MapEntity } from "@/lib/api/types";

const MAP_NAME_ERROR = "이름은 1~100자 사이여야 합니다.";

export default function MapsPage() {
  const [maps, setMaps] = useState<MapEntity[]>([]);
  const [name, setName] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [listError, setListError] = useState("");
  const [createError, setCreateError] = useState("");
  const [actionError, setActionError] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState("");
  const fileInputs = useRef<Record<number, HTMLInputElement | null>>({});

  const loadMaps = async () => {
    const mapList = await mapApi.list();
    setMaps(mapList);
    setListError("");
  };

  useEffect(() => {
    loadMaps().catch((error_) => {
      const message =
        error_ instanceof Error ? error_.message : "지도 목록 조회 실패";
      setListError(message);
    });
  }, []);

  const createMap = async (event: React.SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextName = name.trim();
    if (nextName.length < 1 || nextName.length > 100) {
      setCreateError(MAP_NAME_ERROR);
      return;
    }

    setLoading(true);
    try {
      const created = await mapApi.create(nextName);
      setMaps((prev) => [...prev, created]);
      setName("");
      setCreateError("");
      setCreateOpen(false);
    } catch (error_) {
      const message =
        error_ instanceof Error ? error_.message : "맵 생성 실패";
      setCreateError(message);
    } finally {
      setLoading(false);
    }
  };

  const beginRename = (map: MapEntity) => {
    setEditingId(map.id);
    setEditingName(map.name);
  };

  const cancelRename = () => {
    setEditingId(null);
    setEditingName("");
  };

  const submitRename = async (event: React.SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editingId) return;

    const nextName = editingName.trim();
    if (nextName.length < 1 || nextName.length > 100) {
      setActionError(MAP_NAME_ERROR);
      return;
    }

    try {
      const updated = await mapApi.update(editingId, nextName);
      setMaps((prev) =>
        prev.map((map) => (map.id === editingId ? { ...map, ...updated } : map)),
      );
      setEditingId(null);
      setActionError("");
    } catch {
      setActionError("맵 이름 수정 실패");
    }
  };

  const removeMap = async (mapId: number) => {
    try {
      await mapApi.remove(mapId);
      setMaps((prev) => prev.filter((map) => map.id !== mapId));
      if (editingId === mapId) {
        cancelRename();
      }
    } catch {
      setActionError("맵 삭제 실패");
    }
  };

  const uploadSensorMap = async (
    event: ChangeEvent<HTMLInputElement>,
    mapId: number,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const next = await mapApi.uploadSensorMap(mapId, file);
      setMaps((prev) => prev.map((map) => (map.id === mapId ? next : map)));
    } catch {
      setActionError("맵 이미지 업로드 실패");
    } finally {
      event.target.value = "";
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold">Maps</h2>
          <p className="text-xs text-muted-foreground">
            지도(맵)를 생성하고 센서맵 이미지를 업로드합니다.
          </p>
        </div>
        <Button size="sm" onClick={() => setCreateOpen(true)}>
          새 지도 생성
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>맵 목록</CardTitle>
          <CardDescription>
            센서맵 업로드 및 월드 빌드 화면 이동을 관리합니다.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {listError ? <p className="text-sm text-destructive">{listError}</p> : null}
          {actionError ? <p className="text-sm text-destructive">{actionError}</p> : null}
          {maps.length === 0 ? (
            <p className="rounded-md border border-dashed border-stone-200 bg-stone-50 px-3 py-4 text-sm text-stone-600">
              등록된 맵이 없습니다.
            </p>
          ) : (
            <div className="space-y-2">
              {maps.map((map) => {
                const hasImage = Boolean(map.sensorMapImagePath);
                return (
                  <div key={map.id} className="rounded-md border p-2">
                    <div className="flex flex-wrap items-center gap-2">
                      {editingId === map.id ? (
                        <form
                          onSubmit={submitRename}
                          className="flex flex-1 items-center gap-2"
                        >
                          <Input
                            value={editingName}
                            onChange={(event) =>
                              setEditingName(event.target.value)
                            }
                            maxLength={100}
                            className="max-w-sm"
                          />
                          <Button size="sm" type="submit">
                            저장
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            type="button"
                            onClick={cancelRename}
                          >
                            취소
                          </Button>
                        </form>
                      ) : (
                        <div className="min-w-0 flex-1">
                          <p className="font-medium">{map.name}</p>
                          <p className="text-xs text-muted-foreground">ID: {map.id}</p>
                        </div>
                      )}

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => beginRename(map)}
                      >
                        이름 수정
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => fileInputs.current[map.id]?.click()}
                      >
                        센서맵 업로드
                      </Button>
                      <Link href={`/world-editor?mapId=${map.id}`} className="contents">
                        <Button size="sm" variant="secondary">
                          월드 편집
                        </Button>
                      </Link>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => removeMap(map.id)}
                      >
                        삭제
                      </Button>

                      <input
                        ref={(element) => {
                          fileInputs.current[map.id] = element;
                        }}
                        type="file"
                        accept="image/*"
                        onChange={(event) => uploadSensorMap(event, map.id)}
                        className="hidden"
                      />
                    </div>

                    {hasImage ? (
                      <div className="mt-2">
                        <img
                          src={mapApi.getSensorMapUrl(map.id)}
                          alt={`${map.name} 센서맵`}
                          className="max-h-28 max-w-full rounded border"
                        />
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          )}
          <p className="text-xs text-muted-foreground">
            API: {process.env.NEXT_PUBLIC_TUDUBEM_API_URL ?? "http://localhost:8080"}
          </p>
        </CardContent>
      </Card>

      <Dialog
        open={createOpen}
        onOpenChange={(open) => {
          setCreateOpen(open);
          if (!open) {
            setCreateError("");
          }
        }}
        title="새 지도 생성"
        description="새 지도 이름을 입력하고 생성합니다."
      >
        <form onSubmit={createMap} className="space-y-3">
          <Label htmlFor="new-map-name">맵 이름</Label>
          <Input
            id="new-map-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="맵 이름"
            maxLength={100}
          />
          {createError ? <p className="text-sm text-destructive">{createError}</p> : null}
          <div className="flex justify-end gap-2 pt-1">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setCreateOpen(false);
                setCreateError("");
              }}
            >
              취소
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "생성 중..." : "생성"}
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
