import { Suspense } from "react";
import { EditorApp } from "@/features/editor/components/editor-app";

export default function HomePage() {
  return (
    <Suspense fallback={<div className="flex h-dvh items-center justify-center text-slate-500">Loading editor…</div>}>
      <EditorApp />
    </Suspense>
  );
}
