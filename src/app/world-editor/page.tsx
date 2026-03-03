import { Suspense } from "react";
import { WorldEditorPageClient } from "./world-editor-page-client";

export default function WorldEditorPage() {
  return (
    <Suspense
      fallback={<div className="flex min-h-[100vh] items-center justify-center">로딩 중...</div>}
    >
      <WorldEditorPageClient />
    </Suspense>
  );
}
