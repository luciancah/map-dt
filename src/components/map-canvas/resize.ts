import type { ResizeHandle } from "@/lib/map-editor/types";

export const RESIZE_HANDLES: ResizeHandle[] = [
  "nw",
  "n",
  "ne",
  "e",
  "se",
  "s",
  "sw",
  "w",
];

export const RESIZE_HANDLE_CLASS: Record<ResizeHandle, string> = {
  nw: "-left-2 -top-2 cursor-nwse-resize",
  n: "left-1/2 -top-2 -translate-x-1/2 cursor-ns-resize",
  ne: "-top-2 -right-2 cursor-nesw-resize",
  e: "-right-2 top-1/2 -translate-y-1/2 cursor-ew-resize",
  se: "-right-2 -bottom-2 cursor-nwse-resize",
  s: "left-1/2 -bottom-2 -translate-x-1/2 cursor-ns-resize",
  sw: "-left-2 -bottom-2 cursor-nesw-resize",
  w: "-left-2 top-1/2 -translate-y-1/2 cursor-ew-resize",
};

export const RESIZE_CURSOR_BY_HANDLE: Record<ResizeHandle, string> = {
  nw: "cursor-nwse-resize",
  n: "cursor-ns-resize",
  ne: "cursor-nesw-resize",
  e: "cursor-ew-resize",
  se: "cursor-nwse-resize",
  s: "cursor-ns-resize",
  sw: "cursor-nesw-resize",
  w: "cursor-ew-resize",
};
