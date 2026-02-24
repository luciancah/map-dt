"use client";

import { type FormEvent, useEffect, useState } from "react";
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
    <div className="space-y-4">
      <div>
        <h2 className="text-sm font-semibold">Actors</h2>
        <p className="text-xs text-muted-foreground">
          Actor 엔티티를 생성/수정/삭제합니다.
        </p>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Actor 생성</CardTitle>
            <CardDescription>Actor 기본 정보를 입력합니다.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <form onSubmit={createItem} className="space-y-3">
              <div>
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
              <div>
                <Button type="submit">추가</Button>
              </div>
            </form>
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Actor 목록</CardTitle>
            <CardDescription>등록된 Actor를 관리합니다.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {items.length === 0 ? (
              <p className="rounded-md border border-dashed border-stone-200 bg-stone-50 p-3 text-sm text-stone-600">
                등록된 Actor가 없습니다.
              </p>
            ) : null}
            {items.map((item) => (
              <div
                key={item.id}
                className="rounded-md border border-stone-200 p-2"
              >
                {editingId === item.id ? (
                  <form onSubmit={saveEdit} className="space-y-2">
                    <div>
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
                    <div className="flex gap-2">
                      <Button size="sm" type="submit">
                        저장
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        type="button"
                        onClick={cancelEdit}
                      >
                        취소
                      </Button>
                    </div>
                  </form>
                ) : (
                  <div className="space-y-2">
                    <div className="min-w-0">
                      <p className="font-medium">{item.name}</p>
                      <p className="text-xs text-muted-foreground">
                        ID: {item.id} / 상태: {item.enabled ? "ON" : "OFF"}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => beginEdit(item)}
                      >
                        수정
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => remove(item.id)}
                      >
                        삭제
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
