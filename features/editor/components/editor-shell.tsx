"use client";

import { useEffect } from "react";
import { useDebouncedCallback } from "use-debounce";
import { BottomToolbar } from "@/features/editor/components/bottom-toolbar";
import { CanvasContextMenu } from "@/features/editor/components/canvas-context-menu";
import { CanvasViewport } from "@/features/editor/components/canvas-viewport";
import { DynamicSidePanel } from "@/features/editor/components/dynamic-side-panel";
import { EditorHeader } from "@/features/editor/components/editor-header";
import { LeftToolDock } from "@/features/editor/components/left-tool-dock";
import { PageNavigator } from "@/features/editor/components/page-navigator";
import { PreflightIndicator } from "@/features/editor/components/preflight-indicator";
import { ProductSummary } from "@/features/editor/components/product-summary";
import { useEngine } from "@/features/editor/engine/engine-context";
import { ContextualToolbar } from "@/features/editor/toolbar/contextual-toolbar";
import { useEditorStore } from "@/features/editor/stores/editor-store";
import { designsService } from "@/services/designs.service";
import { storageSet } from "@/lib/storage";
import {
  BackgroundPanel,
  ConfigurationPanel,
  IconsPanel,
  ImagesPanel,
  LayersPanel,
  QrPanel,
  ShapesPanel,
  TemplatesPanel,
  TextPanel,
  UploadsPanel,
} from "@/features/editor/panels";
import { useUiStore } from "@/stores/ui-store";

export function EditorShell() {
  const { engine } = useEngine();
  const dirty = useEditorStore((s) => s.dirty);
  const sheet = useUiStore((s) => s.mobileSheet);
  const setSheet = useUiStore((s) => s.setMobileSheet);

  const autosave = useDebouncedCallback(async () => {
    const doc = useEditorStore.getState().document;
    if (!doc || !engine) return;
    const pages = doc.pages.map((page) =>
      page.id === doc.activePageId ? engine.snapshotPage(page) : page,
    );
    const next = { ...doc, pages };
    storageSet(`draft:${doc.projectId}`, next);
    useEditorStore.getState().setSaveStatus("saving");
    try {
      const saved = await designsService.save(next);
      useEditorStore.getState().setDocument(saved);
      useEditorStore.getState().setSaveStatus("saved");
      useEditorStore.getState().setDirty(false);
    } catch {
      useEditorStore.getState().setSaveStatus("error");
    }
  }, 1400);

  useEffect(() => {
    if (dirty) void autosave();
  }, [dirty, autosave]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const meta = e.metaKey || e.ctrlKey;
      const editing = Boolean(
        (engine?.canvas.getActiveObject() as { isEditing?: boolean } | undefined)?.isEditing,
      );
      if (meta && e.code === "KeyZ") {
        if (editing) return;
        e.preventDefault();
        if (e.shiftKey) void engine?.redo();
        else void engine?.undo();
        return;
      }
      if (meta && e.code === "KeyY") {
        if (editing) return;
        e.preventDefault();
        void engine?.redo();
        return;
      }
      if (meta && e.key.toLowerCase() === "c") {
        const tag = (e.target as HTMLElement).tagName;
        if (tag === "INPUT" || tag === "TEXTAREA") return;
        if ((engine?.canvas.getActiveObject() as { isEditing?: boolean } | undefined)?.isEditing) return;
        e.preventDefault();
        engine?.copySelected();
      }
      if (meta && e.key.toLowerCase() === "v") {
        const tag = (e.target as HTMLElement).tagName;
        if (tag === "INPUT" || tag === "TEXTAREA") return;
        if ((engine?.canvas.getActiveObject() as { isEditing?: boolean } | undefined)?.isEditing) return;
        e.preventDefault();
        void engine?.pasteClipboard();
      }
      if (meta && e.key.toLowerCase() === "d") {
        e.preventDefault();
        void engine?.duplicateSelected();
      }
      if (e.key === "Delete" || e.key === "Backspace") {
        const tag = (e.target as HTMLElement).tagName;
        if (tag === "INPUT" || tag === "TEXTAREA") return;
        engine?.deleteSelected();
      }
      if (e.key === "ArrowUp" || e.key === "ArrowDown" || e.key === "ArrowLeft" || e.key === "ArrowRight") {
        const tag = (e.target as HTMLElement).tagName;
        if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || (e.target as HTMLElement).isContentEditable) return;
        if ((engine?.canvas.getActiveObject() as { isEditing?: boolean } | undefined)?.isEditing) return;
        e.preventDefault();
        const step = e.shiftKey ? 10 : 1;
        const dx = e.key === "ArrowLeft" ? -step : e.key === "ArrowRight" ? step : 0;
        const dy = e.key === "ArrowUp" ? -step : e.key === "ArrowDown" ? step : 0;
        engine?.nudgeSelected(dx, dy);
      }
    };
    const leave = (e: BeforeUnloadEvent) => {
      if (useEditorStore.getState().dirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("keydown", onKey, true);
    window.addEventListener("beforeunload", leave);
    return () => {
      window.removeEventListener("keydown", onKey, true);
      window.removeEventListener("beforeunload", leave);
    };
  }, [engine]);

  return (
    <div className="flex h-dvh flex-col bg-slate-100">
      <EditorHeader />
      <div className="flex min-h-0 flex-1">
        <div className="hidden lg:flex">
          <LeftToolDock />
        </div>
        <DynamicSidePanel />
        <div className="flex min-w-0 flex-1 flex-col">
          <ContextualToolbar />
          <div className="relative min-h-0 flex-1">
            <PreflightIndicator />
            <CanvasViewport />
            <CanvasContextMenu />
          </div>
          <PageNavigator />
          <BottomToolbar />
        </div>
        <ProductSummary />
      </div>
      <div className="lg:hidden">
        <LeftToolDock />
      </div>
      {sheet && sheet !== "product" ? (
        <div className="fixed inset-x-0 bottom-14 z-40 max-h-[70vh] overflow-y-auto rounded-t-3xl border border-slate-200 bg-white p-4 shadow-2xl lg:hidden">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-semibold capitalize">{sheet}</p>
            <button onClick={() => setSheet(null)}>Close</button>
          </div>
          {sheet === "configure" && <ConfigurationPanel />}
          {sheet === "templates" && <TemplatesPanel />}
          {sheet === "uploads" && <UploadsPanel />}
          {sheet === "images" && <ImagesPanel />}
          {sheet === "text" && <TextPanel />}
          {sheet === "shapes" && <ShapesPanel />}
          {sheet === "icons" && <IconsPanel />}
          {sheet === "background" && <BackgroundPanel />}
          {sheet === "qr" && <QrPanel />}
          {sheet === "layers" && <LayersPanel />}
        </div>
      ) : null}
    </div>
  );
}
