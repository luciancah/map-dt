"use client";

import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

type BuildResultDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  worldImageUrl: string;
};

export function BuildResultDialog({
  open,
  onOpenChange,
  worldImageUrl,
}: Readonly<BuildResultDialogProps>) {
  return (
    <Dialog
      open={open && Boolean(worldImageUrl)}
      onOpenChange={onOpenChange}
      title="Build 결과"
      description="월드 빌드 결과 이미지를 확인하세요."
    >
      <div className="space-y-3">
        {worldImageUrl ? (
          <img
            src={worldImageUrl}
            alt="Built world map"
            className="max-h-[70vh] w-full rounded-md border object-contain"
          />
        ) : (
          <p className="rounded-md border border-dashed bg-muted/40 px-4 py-6 text-sm text-muted-foreground">
            Build를 실행하면 결과가 표시됩니다.
          </p>
        )}
        <div className="flex justify-end gap-2">
          <Button size="sm" variant="outline" onClick={() => onOpenChange(false)}>
            닫기
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
