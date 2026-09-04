"use client";

import { useEffect, useState } from "react";
import { EngineProvider } from "@/features/editor/engine/engine-context";
import { EditorShell } from "@/features/editor/components/editor-shell";
import { useEditorStore } from "@/features/editor/stores/editor-store";
import { createBlankDocument, designsService } from "@/services/designs.service";
import { defaultConfiguration } from "@/services/products.service";
import { products } from "@/services/mock-data";
import { storageGet } from "@/lib/storage";
import type { DesignDocument } from "@/types/design";

export function EditorApp() {
  const setDocument = useEditorStore((s) => s.setDocument);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let alive = true;

    async function boot() {
      const saved = await designsService.listMine();
      const latest = saved[0];
      const draft = latest ? storageGet<DesignDocument | null>(`draft:${latest.projectId}`, null) : null;
      let doc =
        draft && latest && new Date(draft.updatedAt) >= new Date(latest.updatedAt) ? draft : latest;

      if (!doc) {
        const product = products[0];
        doc = createBlankDocument(product.id, defaultConfiguration(product), "Untitled design");
        await designsService.create(doc);
      }

      if (!alive) return;
      setDocument(doc);
      setReady(true);
    }

    void boot();
    return () => {
      alive = false;
    };
  }, [setDocument]);

  if (!ready) {
    return <div className="flex h-dvh items-center justify-center text-slate-500">Loading editor…</div>;
  }

  return (
    <EngineProvider>
      <EditorShell />
    </EngineProvider>
  );
}
