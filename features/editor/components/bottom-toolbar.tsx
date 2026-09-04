"use client";

import { Hand, Minus, Plus, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEngine } from "@/features/editor/engine/engine-context";
import { useCanvasStore } from "@/features/editor/stores/canvas-store";
import { useHistoryStore } from "@/features/editor/stores/history-store";
import { cn } from "@/lib/utils";

export function BottomToolbar() {
  const { engine } = useEngine();
  const zoom = useCanvasStore((s) => s.zoom);
  const mode = useCanvasStore((s) => s.mode);
  const canUndo = useHistoryStore((s) => s.canUndo);
  const canRedo = useHistoryStore((s) => s.canRedo);

  return (
    <div className="flex h-12 items-center justify-center gap-2 border-t border-slate-200 bg-white px-3">
      <Button
        size="icon"
        variant={mode === "pan" ? "secondary" : "ghost"}
        onClick={() => engine?.setMode(mode === "pan" ? "select" : "pan")}
        title="Pan"
      >
        <Hand className="h-4 w-4" />
      </Button>
      <Button size="sm" variant="ghost" disabled={!canUndo} onClick={() => engine?.undo()}>
        Undo
      </Button>
      <Button size="sm" variant="ghost" disabled={!canRedo} onClick={() => engine?.redo()}>
        Redo
      </Button>
      <Button size="icon" variant="ghost" onClick={() => engine?.setZoom(zoom - 0.1)}>
        <Minus className="h-4 w-4" />
      </Button>
      <span className={cn("w-14 text-center text-xs font-medium text-slate-600")}>{Math.round(zoom * 100)}%</span>
      <Button size="icon" variant="ghost" onClick={() => engine?.setZoom(zoom + 0.1)}>
        <Plus className="h-4 w-4" />
      </Button>
      <Button size="sm" variant="ghost" onClick={() => engine?.fitToScreen()}>
        Fit
      </Button>
      <Button size="icon" variant="ghost" onClick={() => engine?.resetView()} title="Reset view">
        <RotateCcw className="h-4 w-4" />
      </Button>
    </div>
  );
}
