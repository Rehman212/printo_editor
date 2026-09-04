"use client";

import { nanoid } from "nanoid";
import { Copy, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEngine } from "@/features/editor/engine/engine-context";
import { useEditorStore } from "@/features/editor/stores/editor-store";
import { useHistoryStore } from "@/features/editor/stores/history-store";
import { cn } from "@/lib/utils";
import type { DesignPage } from "@/types/design";

export function PageNavigator() {
  const { engine } = useEngine();
  const doc = useEditorStore((s) => s.document);
  const setDocument = useEditorStore((s) => s.setDocument);
  if (!doc || !engine) return null;
  const currentDoc = doc;
  const currentEngine = engine;

  async function activate(page: DesignPage) {
    if (page.id === currentDoc.activePageId) return;
    const current = currentDoc.pages.find((item) => item.id === currentDoc.activePageId);
    const pages = currentDoc.pages.map((item) =>
      current && item.id === current.id ? currentEngine.snapshotPage(item) : item,
    );
    await currentEngine.loadJson(page.designJson, false);
    currentEngine.setPrintGuides(currentDoc.productConfiguration);
    useHistoryStore.getState().reset(JSON.stringify(currentEngine.serialize()));
    setDocument({ ...currentDoc, pages, activePageId: page.id });
  }

  function addPage() {
    const page: DesignPage = {
      id: nanoid(),
      name: `Page ${currentDoc.pages.length + 1}`,
      side: "page",
      order: currentDoc.pages.length,
      width: currentDoc.pages[0].width,
      height: currentDoc.pages[0].height,
      designJson: { version: "6.0.0", objects: [], background: "#ffffff" },
    };
    setDocument({ ...currentDoc, pages: [...currentDoc.pages, page] });
  }

  function duplicate(page: DesignPage) {
    const copy = { ...structuredClone(page), id: nanoid(), name: `${page.name} copy`, order: currentDoc.pages.length };
    setDocument({ ...currentDoc, pages: [...currentDoc.pages, copy] });
  }

  function remove(page: DesignPage) {
    if (currentDoc.pages.length === 1) return;
    const pages = currentDoc.pages.filter((item) => item.id !== page.id);
    const activePageId = currentDoc.activePageId === page.id ? pages[0].id : currentDoc.activePageId;
    setDocument({ ...currentDoc, pages, activePageId });
    if (activePageId !== currentDoc.activePageId) {
      const next = pages.find((item) => item.id === activePageId);
      if (next) void activate(next);
    }
  }

  return (
    <div className="flex items-center gap-2 overflow-x-auto border-t border-slate-200 bg-slate-50 px-3 py-2">
      {doc.pages.map((page) => (
        <div
          key={page.id}
          className={cn(
            "flex min-w-28 cursor-pointer items-center gap-2 rounded-xl border bg-white px-2 py-1.5",
            page.id === doc.activePageId ? "border-blue-500 ring-2 ring-blue-100" : "border-slate-200",
          )}
          onClick={() => void activate(page)}
        >
          <div className="h-10 w-14 overflow-hidden rounded bg-slate-100">
            {page.thumbnailUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={page.thumbnailUrl} alt="" className="h-full w-full object-cover" />
            ) : null}
          </div>
          <div className="pr-1">
            <p className="text-xs font-medium">{page.name}</p>
            <p className="text-[10px] capitalize text-slate-500">{page.side}</p>
          </div>
          <button className="text-slate-400 hover:text-slate-700" onClick={(e) => { e.stopPropagation(); duplicate(page); }}>
            <Copy className="h-3.5 w-3.5" />
          </button>
          <button className="text-slate-400 hover:text-red-600" onClick={(e) => { e.stopPropagation(); remove(page); }}>
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
      <Button size="sm" variant="outline" onClick={addPage}>
        <Plus className="h-4 w-4" /> Page
      </Button>
    </div>
  );
}
