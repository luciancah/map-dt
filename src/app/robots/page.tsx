"use client";

import { type FormEvent, useEffect, useState } from "react";
import { MainNav } from "@/components/navigation/MainNav";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { robotApi } from "@/lib/api/client";
import type { RobotEntity } from "@/lib/api/types";

export default function RobotsPage() {
  const [items, setItems] = useState<RobotEntity[]>([]);
  const [error, setError] = useState("");
  const [name, setName] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState("");

  const load = async () => {
    const list = await robotApi.list();
    setItems(list);
    setError("");
  };

  useEffect(() => {
    const loadRobots = async () => {
      try {
        await load();
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : "Robot 조회 실패");
      }
    };

    loadRobots();
  }, []);

  const createItem = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextName = name.trim();
    if (!nextName) {
      setError("Robot 이름은 비어 있을 수 없습니다.");
      return;
    }

    try {
      const created = await robotApi.create(nextName);
      setItems((prev) => [...prev, created]);
      setName("");
      setError("");
    } catch {
      setError("Robot 생성 실패");
    }
  };

  const beginEdit = (item: RobotEntity) => {
    setEditingId(item.id);
    setEditingName(item.name);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingName("");
  };

  const saveEdit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editingId) return;

    const nextName = editingName.trim();
    if (!nextName) {
      setError("Robot 이름은 비어 있을 수 없습니다.");
      return;
    }

    try {
      const updated = await robotApi.update(editingId, nextName);
      setItems((prev) =>
        prev.map((item) =>
          item.id === editingId ? { ...item, ...updated } : item,
        ),
      );
      cancelEdit();
      setError("");
    } catch {
      setError("Robot 수정 실패");
    }
  };

  const remove = async (id: number) => {
    try {
      await robotApi.remove(id);
      setItems((prev) => prev.filter((item) => item.id !== id));
    } catch {
      setError("Robot 삭제 실패");
    }
  };

  return (
    <main className="min-h-screen bg-stone-100 p-4 text-stone-900 md:p-6">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-4">
        <MainNav />

        <Card>
          <CardHeader>
            <CardTitle>Robots</CardTitle>
            <CardDescription>Robot을 생성/수정/삭제합니다.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <form onSubmit={createItem} className="flex gap-2">
              <div className="flex-1 space-y-1">
                <Label htmlFor="new-robot-name">이름</Label>
                <Input
                  id="new-robot-name"
                  value={name}
                  maxLength={100}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Robot 이름"
                />
              </div>
              <Button type="submit">추가</Button>
            </form>
            {error ? <p className="text-sm text-red-600">{error}</p> : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Robot 목록</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {items.length === 0 ? (
              <p className="rounded-md border border-dashed border-stone-200 bg-white p-3 text-sm text-stone-600">
                등록된 Robot이 없습니다.
              </p>
            ) : null}
            {items.map((item) => (
              <div
                key={item.id}
                className="flex flex-wrap items-center gap-2 rounded-md border border-stone-200 bg-white p-2"
              >
                {editingId === item.id ? (
                  <form onSubmit={saveEdit} className="flex gap-2">
                    <div className="flex-1 space-y-1">
                      <Label htmlFor={`robot-name-${item.id}`}>이름</Label>
                      <Input
                        id={`robot-name-${item.id}`}
                        value={editingName}
                        onChange={(event) => setEditingName(event.target.value)}
                      />
                    </div>
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
                    <Button size="sm" variant="outline" onClick={() => beginEdit(item)}>
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
