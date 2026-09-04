"use client";

import { useEffect, useRef } from "react";
import { mountEngine, type EditorEngine } from "@/features/editor/engine/canvas-manager";
import { useEngine } from "@/features/editor/engine/engine-context";
import { useEditorStore } from "@/features/editor/stores/editor-store";

export function CanvasViewport() {
  const viewportRef = useRef<HTMLDivElement>(null);
  const hostRef = useRef<HTMLDivElement>(null);
  const { engine, setEngine } = useEngine();
  const projectId = useEditorStore((s) => s.document?.projectId);

  useEffect(() => {
    const host = hostRef.current;
    const viewport = viewportRef.current;
    const doc = useEditorStore.getState().document;
    if (!host || !viewport || !doc) return;

    let cancelled = false;
    let instance: EditorEngine | null = null;

    const canvasEl = document.createElement("canvas");
    canvasEl.style.display = "block";
    host.replaceChildren(canvasEl);

    void mountEngine(canvasEl, doc)
      .then(async (engine) => {
        if (cancelled) {
          await engine.dispose();
          return;
        }
        instance = engine;
        engine.bindViewport(viewport);
        setEngine(engine);
      })
      .catch((error) => {
        console.error("Failed to start canvas", error);
      });

    return () => {
      cancelled = true;
      const current = instance;
      instance = null;
      setEngine((live) => (live === current ? null : live));
      if (current) void current.dispose();
    };
  }, [projectId, setEngine]);

  return (
    <div
      ref={viewportRef}
      data-canvas-viewport
      className="absolute inset-0 overflow-hidden"
      onContextMenuCapture={(event) => {
        event.preventDefault();
        engine?.onContextMenu({ e: event.nativeEvent });
      }}
      style={{
        backgroundColor: "#9aa3b2",
        backgroundImage: "radial-gradient(rgba(255,255,255,0.45) 1.1px, transparent 1.1px)",
        backgroundSize: "20px 20px",
      }}
    >
      <div ref={hostRef} className="relative h-full w-full" />
    </div>
  );
}
