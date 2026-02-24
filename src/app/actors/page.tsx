"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { actorApi } from "@/lib/api/client";
import type { ActorEntity } from "@/lib/api/types";

export default function ActorsPage() {
  const [items, setItems] = useState<ActorEntity[]>([]);
  const [listError, setListError] = useState("");
  const [createError, setCreateError] = useState("");
  const [actionError, setActionError] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [enabled, setEnabled] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState("");
  const [editingEnabled, setEditingEnabled] = useState(true);

  const load = async () => {
    const list = await actorApi.list();
    setItems(list);
    setListError("");
  };

  useEffect(() => {
    const loadActors = async () => {
      try {
        await load();
      } catch (error_) {
        setListError(error_ instanceof Error ? error_.message : "Actor 조회 실패");
      }
    };

    loadActors();
  }, []);

  const createItem = async (event: React.SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextName = name.trim();
    if (!nextName) {
      setCreateError("Actor 이름은 비어 있을 수 없습니다.");
      return;
    }

    setCreating(true);
    try {
      const created = await actorApi.create(nextName, enabled);
      setItems((prev) => [...prev, created]);
      setName("");
      setEnabled(true);
      setCreateError("");
      setCreateOpen(false);
    } catch {
      setCreateError("Actor 생성 실패");
    } finally {
      setCreating(false);
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

  const saveEdit = async (event: React.SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editingId) return;
    const nextName = editingName.trim();
    if (!nextName) {
      setActionError("Actor 이름은 비어 있을 수 없습니다.");
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
      setActionError("");
    } catch {
      setActionError("Actor 수정 실패");
    }
  };

  const remove = async (id: number) => {
    try {
      await actorApi.remove(id);
      setItems((prev) => prev.filter((item) => item.id !== id));
    } catch {
      setActionError("Actor 삭제 실패");
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold">Actors</h2>
          <p className="text-xs text-muted-foreground">
            Actor 엔티티를 생성/수정/삭제합니다.
          </p>
        </div>
        <Button size="sm" onClick={() => setCreateOpen(true)}>
          새 Actor 생성
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Actor 목록</CardTitle>
          <CardDescription>등록된 Actor를 관리합니다.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {listError ? <p className="text-sm text-destructive">{listError}</p> : null}
          {actionError ? <p className="text-sm text-destructive">{actionError}</p> : null}
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

      <Dialog
        open={createOpen}
        onOpenChange={(open) => {
          setCreateOpen(open);
          if (!open) {
            setCreateError("");
          }
        }}
        title="새 Actor 생성"
        description="Actor의 이름과 기본 활성 상태를 입력합니다."
      >
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
            <Button type="submit" disabled={creating}>
              {creating ? "생성 중..." : "생성"}
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
