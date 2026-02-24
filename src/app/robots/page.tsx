"use client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { robotApi } from "@/lib/api/client";
import type { RobotEntity } from "@/lib/api/types";
import { useNamedEntityCrud } from "@/features/entity-management/hooks/useNamedEntityCrud";

export default function RobotsPage() {
  const {
    items,
    listError,
    createError,
    actionError,
    createOpen,
    creating,
    createName,
    editingId,
    editingName,
    setCreateName,
    setEditingName,
    setCreateOpen,
    beginEdit,
    cancelEdit,
    create,
    saveEdit,
    remove,
  } = useNamedEntityCrud<RobotEntity>({
    fetchEntities: robotApi.list,
    createEntity: robotApi.create,
    updateEntity: robotApi.update,
    deleteEntity: robotApi.remove,
    validateName: (name) => (name ? "" : "Robot 이름은 비어 있을 수 없습니다."),
  });

  const submitCreate = async (event: React.SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    await create();
  };

  const submitEdit = async (event: React.SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    await saveEdit();
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold">Robots</h2>
          <p className="text-xs text-muted-foreground">
            Robot 엔티티를 생성/수정/삭제합니다.
          </p>
        </div>
        <Button size="sm" onClick={() => setCreateOpen(true)}>
          새 Robot 생성
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Robot 목록</CardTitle>
          <CardDescription>등록된 Robot 목록을 관리합니다.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {listError ? <p className="text-sm text-destructive">{listError}</p> : null}
          {actionError ? <p className="text-sm text-destructive">{actionError}</p> : null}
          {items.length === 0 ? (
            <p className="rounded-md border border-dashed border-stone-200 bg-stone-50 p-3 text-sm text-stone-600">
              등록된 Robot이 없습니다.
            </p>
          ) : null}
          {items.map((item) => (
            <div
              key={item.id}
              className="rounded-md border border-stone-200 p-2"
            >
              {editingId === item.id ? (
                <form onSubmit={submitEdit} className="space-y-2">
                  <div className="space-y-1">
                    <Label htmlFor={`robot-name-${item.id}`}>이름</Label>
                    <Input
                      id={`robot-name-${item.id}`}
                      value={editingName}
                      onChange={(event) => setEditingName(event.target.value)}
                    />
                  </div>
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
                    <p className="text-xs text-muted-foreground">ID: {item.id}</p>
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
            setCreateName("");
          }
        }}
        title="새 Robot 생성"
        description="Robot 이름을 입력해 목록에 추가합니다."
      >
        <form onSubmit={submitCreate} className="space-y-3">
          <div className="space-y-1">
            <Label htmlFor="new-robot-name">이름</Label>
            <Input
              id="new-robot-name"
              value={createName}
              maxLength={100}
              onChange={(event) => setCreateName(event.target.value)}
              placeholder="Robot 이름"
            />
          </div>
          {createError ? <p className="text-sm text-destructive">{createError}</p> : null}
          <div className="flex justify-end gap-2 pt-1">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setCreateOpen(false);
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
