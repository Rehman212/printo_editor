"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { EngineProvider } from "@/features/editor/engine/engine-context";
import { EditorShell } from "@/features/editor/components/editor-shell";
import { useEditorStore } from "@/features/editor/stores/editor-store";
import { createBlankDocument, designsService } from "@/services/designs.service";
import { defaultConfiguration } from "@/services/products.service";
import { products } from "@/services/mock-data";
import { storageGet } from "@/lib/storage";
import { configurationFromHandoff, parseEditorHandoff } from "@/lib/printoe-handoff";
import { fetchPrintoeSavedDesign } from "@/lib/printoe-account";
import { requirePrintoeSession } from "@/lib/printoe-session";
import type { DesignDocument } from "@/types/design";

export function EditorApp() {
  const setDocument = useEditorStore((s) => s.setDocument);
  const search = useSearchParams();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let alive = true;

    async function boot() {
      const handoff = parseEditorHandoff(search.get("handoff"));
      const token = search.get("pt") || window.sessionStorage.getItem("printoe_pt");
      const api = search.get("api") || window.sessionStorage.getItem("printoe_api");
      const printoeDesignId = search.get("printoeDesign");
      const projectId = search.get("projectId");
      if (token) window.sessionStorage.setItem("printoe_pt", token);
      if (api) window.sessionStorage.setItem("printoe_api", api);
      const ok = await requirePrintoeSession(token, api);
      if (!ok || !alive) return;
      let doc: DesignDocument | null = null;

      if (printoeDesignId && token) {
        const remote = await fetchPrintoeSavedDesign(printoeDesignId);
        if (remote?.canvasJson) {
          try {
            doc = JSON.parse(remote.canvasJson) as DesignDocument;
          } catch {
            doc = null;
          }
        }
      }

      if (!doc && projectId) {
        doc = await designsService.get(projectId);
      }

      if (!doc && handoff) {
        if (token) handoff.accessToken = token;
        const config = configurationFromHandoff(handoff);
        doc = createBlankDocument(
          config.productId,
          config,
          `${handoff.name} — Untitled`,
          handoff.name,
        );
        await designsService.create(doc);
      } else if (!doc) {
        const saved = await designsService.listMine();
        const latest = saved[0];
        const draft = latest
          ? storageGet<DesignDocument | null>(`draft:${latest.projectId}`, null)
          : null;
        doc =
          draft && latest && new Date(draft.updatedAt) >= new Date(latest.updatedAt)
            ? draft
            : latest;

        if (!doc) {
          const product = products[0];
          doc = createBlankDocument(product.id, defaultConfiguration(product), "Untitled design");
          await designsService.create(doc);
        }
      }

      if (!alive || !doc) return;
      if (token && doc.productConfiguration.printoeHandoff) {
        doc.productConfiguration.printoeHandoff.accessToken = token;
      }
      await designsService.save(doc);
      setDocument(doc);
      setReady(true);
    }

    void boot();
    return () => {
      alive = false;
    };
  }, [setDocument, search]);

  if (!ready) {
    return <div className="flex h-dvh items-center justify-center text-slate-500">Loading editor…</div>;
  }

  return (
    <EngineProvider>
      <EditorShell />
    </EngineProvider>
  );
}
