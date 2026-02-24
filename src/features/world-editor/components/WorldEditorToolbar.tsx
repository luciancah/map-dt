"use client";

import { MousePointer2, Pentagon, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { TOOL_OPTIONS } from "@/features/world-editor/world-editor-constants";
import type { Tool } from "@/lib/map-editor/types";

type WorldEditorToolbarProps = {
  tool: Tool;
  onToolSelect: (tool: Tool) => void;
  className?: string;
};

const TOOL_ICON_BY_ID = {
  select: MousePointer2,
  rect: Square,
  polygon: Pentagon,
} as const;

export function WorldEditorToolbar({
  tool,
  onToolSelect,
  className,
}: WorldEditorToolbarProps) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-1.5 rounded-lg border bg-background/95 p-1 shadow-sm backdrop-blur",
        className,
      )}
    >
      {TOOL_OPTIONS.map((option) => {
        const Icon = TOOL_ICON_BY_ID[option.id];
        return (
          <Button
            key={option.id}
            type="button"
            size="sm"
            variant={tool === option.id ? "default" : "ghost"}
            className="h-8 gap-1.5 px-2.5"
            onClick={() => onToolSelect(option.id)}
          >
            <Icon className="size-3.5" aria-hidden="true" />
            {option.label}
          </Button>
        );
      })}
    </div>
  );
}
