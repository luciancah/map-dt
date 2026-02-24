"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { MainNav } from "@/components/navigation/MainNav";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { mapApi } from "@/lib/api/client";
import type { ChangeEvent, FormEvent } from "react";
import type { MapEntity } from "@/lib/api/types";

const MAP_NAME_ERROR = "이름은 1~100자 사이여야 합니다.";

export default function MapsPage() {
  const [maps, setMaps] = useState<MapEntity[]>([]);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState("");
  const fileInputs = useRef<Record<number, HTMLInputElement | null>>({});

  const loadMaps = async () => {
    const mapList = await mapApi.list();
    setMaps(mapList);
    setError("");
  };

  useEffect(() => {
    loadMaps().catch((caught) => {
      const message =
        caught instanceof Error ? caught.message : "지도 목록 조회 실패";
      setError(message);
    });
  }, []);

  const createMap = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextName = name.trim();
    if (nextName.length < 1 || nextName.length > 100) {
      setError(MAP_NAME_ERROR);
      return;
    }

    setLoading(true);
    try {
      const created = await mapApi.create(nextName);
      setMaps((prev) => [...prev, created]);
      setName("");
      setError("");
    } catch (caught) {
      const message =
        caught instanceof Error ? caught.message : "맵 생성 실패";
      setError(message);
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

  const submitRename = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editingId) return;

    const nextName = editingName.trim();
    if (nextName.length < 1 || nextName.length > 100) {
      setError(MAP_NAME_ERROR);
      return;
    }

    try {
      const updated = await mapApi.update(editingId, nextName);
      setMaps((prev) =>
        prev.map((map) => (map.id === editingId ? { ...map, ...updated } : map)),
      );
      setEditingId(null);
      setError("");
    } catch {
      setError("맵 이름 수정 실패");
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
      setError("맵 삭제 실패");
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
      setError("맵 이미지 업로드 실패");
    } finally {
      event.target.value = "";
    }
  };

  return (
    <main className="min-h-screen bg-stone-100 p-4 text-stone-900 md:p-6">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4">
        <MainNav />

        <Card>
          <CardHeader>
            <CardTitle>Maps</CardTitle>
            <CardDescription>
              지도(맵)를 생성하고 센서맵 이미지를 업로드합니다.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <form onSubmit={createMap} className="flex gap-2">
              <Label htmlFor="new-map-name" className="sr-only">
                맵 이름
              </Label>
              <Input
                id="new-map-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="맵 이름"
                maxLength={100}
              />
              <Button type="submit" disabled={loading}>
                생성
              </Button>
            </form>
            {error ? <p className="text-sm text-red-600">{error}</p> : null}
            <p className="text-xs text-stone-600">
              API: {process.env.NEXT_PUBLIC_TUDUBEM_API_URL ?? "http://localhost:8080"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>맵 목록</CardTitle>
            <CardDescription>맵별로 센서맵 업로드와 월드 빌드 화면으로 이동할 수 있습니다.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {maps.length === 0 ? (
              <p className="rounded-md border border-dashed border-stone-200 bg-white p-3 text-sm text-stone-600">
                등록된 맵이 없습니다.
              </p>
            ) : (
              <div className="space-y-3">
                {maps.map((map) => {
                  const hasImage = Boolean(map.sensorMapImagePath);
                  return (
                    <div
                      key={map.id}
                      className="rounded-md border border-stone-200 bg-white p-3"
                    >
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
                            <p className="text-xs text-stone-500">ID: {map.id}</p>
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
                        <Link href={`/world-editor?mapId=${map.id}`}>
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
                        <div className="mt-3">
                          <img
                            src={mapApi.getSensorMapUrl(map.id)}
                            alt={`${map.name} 센서맵`}
                            className="max-h-36 max-w-full rounded border"
                          />
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
