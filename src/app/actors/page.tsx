"use client";

import { type FormEvent, useEffect, useState } from "react";
import { MainNav } from "@/components/navigation/MainNav";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { actorApi } from "@/lib/api/client";
import type { ActorEntity } from "@/lib/api/types";

export default function ActorsPage() {
  const [items, setItems] = useState<ActorEntity[]>([]);
  const [error, setError] = useState("");
  const [name, setName] = useState("");
  const [enabled, setEnabled] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState("");
  const [editingEnabled, setEditingEnabled] = useState(true);

  const load = async () => {
    const list = await actorApi.list();
    setItems(list);
    setError("");
  };

  useEffect(() => {
    const loadActors = async () => {
      try {
        await load();
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : "Actor 조회 실패");
      }
    };

    loadActors();
  }, []);

  const createItem = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextName = name.trim();
    if (!nextName) {
      setError("Actor 이름은 비어 있을 수 없습니다.");
      return;
    }

    try {
      const created = await actorApi.create(nextName, enabled);
      setItems((prev) => [...prev, created]);
      setName("");
      setEnabled(true);
      setError("");
    } catch {
      setError("Actor 생성 실패");
    }
  };

  const beginEdit = (item: ActorEntity) => {
    setEditingId(item.id);
    setEditingName(item.name);
    setEditingEnabled(item.enabled);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingName("");
    setEditingEnabled(true);
  };

  const saveEdit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editingId) return;
    const nextName = editingName.trim();
    if (!nextName) {
      setError("Actor 이름은 비어 있을 수 없습니다.");
      return;
    }

    try {
      const updated = await actorApi.update(editingId, nextName, editingEnabled);
      setItems((prev) =>
        prev.map((item) =>
          item.id === editingId ? { ...item, ...updated } : item,
        ),
      );
      cancelEdit();
      setError("");
    } catch {
      setError("Actor 수정 실패");
    }
  };

  const remove = async (id: number) => {
    try {
      await actorApi.remove(id);
      setItems((prev) => prev.filter((item) => item.id !== id));
    } catch {
      setError("Actor 삭제 실패");
    }
  };

  return (
    <main className="min-h-screen bg-stone-100 p-4 text-stone-900 md:p-6">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-4">
        <MainNav />

        <Card>
          <CardHeader>
            <CardTitle>Actors</CardTitle>
            <CardDescription>Actor를 생성/수정/삭제합니다.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <form onSubmit={createItem} className="flex flex-wrap items-end gap-2">
              <div className="space-y-1">
                <Label htmlFor="new-actor-name">이름</Label>
                <Input
                  id="new-actor-name"
                  value={name}
                  maxLength={100}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Actor 이름"
                />
              </div>
              <label className="flex items-center gap-2 text-sm">
                <Input
                  type="checkbox"
                  checked={enabled}
                  onChange={(event) => setEnabled(event.target.checked)}
                  className="h-4 w-4"
                />
                활성화
              </label>
              <Button type="submit">추가</Button>
            </form>
            {error ? <p className="text-sm text-red-600">{error}</p> : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Actor 목록</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {items.length === 0 ? (
              <p className="rounded-md border border-dashed border-stone-200 bg-white p-3 text-sm text-stone-600">
                등록된 Actor가 없습니다.
              </p>
            ) : null}
            {items.map((item) => (
              <div
                key={item.id}
                className="flex flex-wrap items-center gap-2 rounded-md border border-stone-200 bg-white p-2"
              >
                {editingId === item.id ? (
                  <form
                    onSubmit={saveEdit}
                    className="flex flex-wrap items-end gap-2"
                  >
                    <div className="space-y-1">
                      <Label htmlFor={`actor-name-${item.id}`}>이름</Label>
                      <Input
                        id={`actor-name-${item.id}`}
                        value={editingName}
                        onChange={(event) => setEditingName(event.target.value)}
                      />
                    </div>
                    <label className="flex items-center gap-2 text-sm">
                      <Input
                        type="checkbox"
                        checked={editingEnabled}
                        onChange={(event) => setEditingEnabled(event.target.checked)}
                        className="h-4 w-4"
                      />
                      활성화
                    </label>
                    <Button size="sm" type="submit">
                      저장
                    </Button>
                    <Button size="sm" variant="outline" type="button" onClick={cancelEdit}>
                      취소
                    </Button>
                  </form>
                ) : (
                  <>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium">{item.name}</p>
                      <p className="text-xs text-stone-500">ID: {item.id}</p>
                    </div>
                    <p className="text-xs">
                      상태: <span>{item.enabled ? "ON" : "OFF"}</span>
                    </p>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => beginEdit(item)}
                    >
                      수정
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => remove(item.id)}>
                      삭제
                    </Button>
                  </>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
