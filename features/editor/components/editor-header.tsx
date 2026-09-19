"use client";

import { ChevronDown, Cloud, CloudOff, Eye, Save } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { useEngine } from "@/features/editor/engine/engine-context";
import { useEditorStore } from "@/features/editor/stores/editor-store";
import { useHistoryStore } from "@/features/editor/stores/history-store";
import { createBlankDocument, designsService } from "@/services/designs.service";
import { defaultConfiguration } from "@/services/products.service";
import { products } from "@/services/mock-data";
import { saveDesignToPrintoeAccount } from "@/lib/printoe-account";

export function EditorHeader() {
  const doc = useEditorStore((s) => s.document);
  const patch = useEditorStore((s) => s.patchDocument);
  const setDocument = useEditorStore((s) => s.setDocument);
  const status = useEditorStore((s) => s.saveStatus);
  const { engine } = useEngine();
  const canUndo = useHistoryStore((s) => s.canUndo);
  const canRedo = useHistoryStore((s) => s.canRedo);
  const [menu, setMenu] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  if (!doc) return null;

  async function persist() {
    const current = useEditorStore.getState().document;
    if (!current || !engine) return current;
    const pages = current.pages.map((page) =>
      page.id === current.activePageId ? engine.snapshotPage(page) : page,
    );
    const next = { ...current, pages };
    useEditorStore.getState().setDocument(next);
    useEditorStore.getState().setSaveStatus("saving");
    try {
      const saved = await designsService.save(next);
      useEditorStore.getState().setDocument(saved);
      useEditorStore.getState().setSaveStatus("saved");
      useEditorStore.getState().setDirty(false);
      const account = await saveDesignToPrintoeAccount(saved);
      const shop =
        saved.productConfiguration.printoeHandoff?.shopBase || "https://printoe.com";
      const accountUrl = `${shop.replace(/\/$/, "")}/dashboard/saved-designs`;
      if (account.ok) {
        toast.success("Design saved successfully", {
          duration: 15000,
          description: "Go to your account to check Saved Designs.",
          action: {
            label: "Go to account",
            onClick: () => {
              window.location.href = accountUrl;
            },
          },
        });
      } else if (account.reason === "auth" && saved.productConfiguration.printoeHandoff) {
        toast.error("Please log in on Printoe first, then open Design Online again.", {
          duration: 15000,
        });
      }
      return saved;
    } catch {
      useEditorStore.getState().setSaveStatus("error");
      toast.error("Could not save design");
      return current;
    }
  }

  async function newDesign() {
    const current = useEditorStore.getState().document;
    const product = products.find((item) => item.id === current?.productId) ?? products[0];
    const blank = createBlankDocument(product.id, defaultConfiguration(product), "Untitled design");
    await designsService.create(blank);
    setDocument(blank);
    toast.success("New design started");
  }

  return (
    <header className="flex h-14 items-center gap-3 border-b border-slate-800 bg-slate-950 px-3 text-white">
      <span className="hidden font-semibold tracking-tight sm:block">Printo</span>
      <div className="relative">
        <Button variant="ghost" size="sm" className="text-slate-200 hover:bg-white/10" onClick={() => setMenu((v) => !v)}>
          File <ChevronDown className="h-3 w-3" />
        </Button>
        {menu ? (
          <div className="absolute z-30 mt-1 w-48 rounded-xl border border-slate-200 bg-white py-1 text-slate-800 shadow-xl">
            <button
              className="block w-full px-3 py-2 text-left text-sm hover:bg-slate-50"
              onClick={() => {
                setMenu(false);
                void newDesign();
              }}
            >
              New design
            </button>
            <button
              className="block w-full px-3 py-2 text-left text-sm hover:bg-slate-50"
              onClick={() => {
                setMenu(false);
                void persist();
              }}
            >
              Save
            </button>
          </div>
        ) : null}
      </div>
      <Input
        className="h-8 max-w-xs border-slate-700 bg-slate-900 text-white"
        value={doc.name}
        onChange={(e) => patch({ name: e.target.value.slice(0, 80) })}
      />
      <span className="hidden items-center gap-1 text-xs text-slate-400 md:flex">
        {status === "saving" ? <Cloud className="h-3.5 w-3.5" /> : status === "error" ? <CloudOff className="h-3.5 w-3.5" /> : <Cloud className="h-3.5 w-3.5 text-emerald-400" />}
        {status === "saving" ? "Saving…" : status === "saved" ? "All changes saved" : status === "error" ? "Save failed" : "Autosave ready"}
      </span>
      <div className="ml-auto flex items-center gap-1">
        <Button variant="ghost" size="sm" className="text-slate-200 hover:bg-white/10" disabled={!canUndo} onClick={() => engine?.undo()}>
          Undo
        </Button>
        <Button variant="ghost" size="sm" className="text-slate-200 hover:bg-white/10" disabled={!canRedo} onClick={() => engine?.redo()}>
          Redo
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="text-slate-200 hover:bg-white/10"
          onClick={() => setPreview(engine?.exportPng() ?? null)}
        >
          <Eye className="h-4 w-4" /> Preview
        </Button>
        <Button size="sm" variant="subtle" className="bg-white text-slate-900 hover:bg-slate-100" onClick={() => void persist()}>
          <Save className="h-4 w-4" /> Save
        </Button>
      </div>
      <Modal open={Boolean(preview)} title="Preview" onClose={() => setPreview(null)} wide>
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="Design preview" className="mx-auto max-h-[70vh] w-auto rounded-lg" />
        ) : null}
      </Modal>
    </header>
  );
}
