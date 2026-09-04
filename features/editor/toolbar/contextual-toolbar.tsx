"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { HexColorPicker } from "react-colorful";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { useEngine } from "@/features/editor/engine/engine-context";
import { useEditorStore } from "@/features/editor/stores/editor-store";

export function ContextualToolbar() {
  const { engine } = useEngine();
  const selectedType = useEditorStore((s) => s.selectedType);
  const selectedId = useEditorStore((s) => s.selectedId);
  if (!selectedId || !engine) {
    return (
      <div className="flex h-12 items-center border-b border-slate-200 bg-white px-4 text-sm text-slate-500">
        Select an object to edit its properties
      </div>
    );
  }

  const isText = selectedType?.toLowerCase().includes("text");
  const isImage = selectedType?.toLowerCase().includes("image");

  return (
    <div className="relative z-40 flex h-12 items-center gap-2 overflow-x-auto overflow-y-visible border-b border-slate-200 bg-white px-3">
      {isText ? <TextControls /> : isImage ? <ImageControls /> : <ShapeControls />}
      <div className="ml-auto flex items-center gap-1">
        <Button size="sm" variant="ghost" onClick={() => engine.duplicateSelected()}>
          Duplicate
        </Button>
        <Button size="sm" variant="ghost" onClick={() => engine.deleteSelected()}>
          Delete
        </Button>
      </div>
    </div>
  );
}

function TextControls() {
  const { engine } = useEngine();
  const obj = engine?.selected();
  if (!obj) return null;
  return (
    <>
      <select
        className="h-8 rounded-md border border-slate-200 px-2 text-xs"
        defaultValue={String(obj.fontFamily ?? "Inter, Geist, Arial, sans-serif")}
        onChange={(e) => engine?.updateActive({ fontFamily: e.target.value })}
      >
        <option value="Inter, Geist, Arial, sans-serif">Inter</option>
        <option value="Georgia, serif">Georgia</option>
        <option value="Arial, sans-serif">Arial</option>
        <option value="Times New Roman, serif">Times</option>
        <option value="Courier New, monospace">Courier</option>
      </select>
      <Input
        className="h-8 w-16"
        type="number"
        defaultValue={Number(obj.fontSize ?? 24)}
        onBlur={(e) => engine?.updateActive({ fontSize: Number(e.target.value) })}
      />
      <MiniColor
        label="Color"
        value={toColorString(obj.fill, "#111827")}
        onChange={(fill) => engine?.updateActive({ fill })}
      />
      <Button size="sm" variant="subtle" onClick={() => engine?.updateActive({ fontWeight: "700" })}>
        B
      </Button>
      <Button size="sm" variant="subtle" onClick={() => engine?.updateActive({ fontStyle: "italic" })}>
        I
      </Button>
      <Button
        size="sm"
        variant="subtle"
        onClick={() => engine?.updateActive({ underline: !obj.underline })}
      >
        U
      </Button>
      <Button size="sm" variant="ghost" onClick={() => engine?.updateActive({ textAlign: "left" })}>
        Left
      </Button>
      <Button size="sm" variant="ghost" onClick={() => engine?.updateActive({ textAlign: "center" })}>
        Center
      </Button>
      <Button size="sm" variant="ghost" onClick={() => engine?.updateActive({ textAlign: "right" })}>
        Right
      </Button>
    </>
  );
}

function ImageControls() {
  const { engine } = useEngine();
  return (
    <>
      <Button size="sm" variant="subtle" onClick={() => engine?.updateActive({ flipX: true })}>
        Flip X
      </Button>
      <Button size="sm" variant="subtle" onClick={() => engine?.updateActive({ flipY: true })}>
        Flip Y
      </Button>
      <Label className="mb-0 text-[11px]">Opacity</Label>
      <input
        type="range"
        min={0.1}
        max={1}
        step={0.05}
        defaultValue={1}
        onChange={(e) => engine?.updateActive({ opacity: Number(e.target.value) })}
      />
    </>
  );
}

function ShapeControls() {
  const { engine } = useEngine();
  const obj = engine?.selected();
  return (
    <>
      <MiniColor
        label="Fill"
        value={toColorString(obj?.fill, "#2563eb")}
        onChange={(fill) => engine?.updateActive({ fill })}
      />
      <MiniColor
        label="Stroke"
        value={toColorString(obj?.stroke, "#111827")}
        onChange={(stroke) => engine?.updateActive({ stroke })}
      />
      <Input
        className="h-8 w-24"
        type="number"
        min={0}
        placeholder="Border"
        defaultValue={Number(obj?.strokeWidth ?? 0)}
        onBlur={(e) => engine?.updateActive({ strokeWidth: Number(e.target.value) })}
      />
    </>
  );
}

function toColorString(value: unknown, fallback: string) {
  return typeof value === "string" && value.startsWith("#") ? value : fallback;
}

function MiniColor({
  value,
  onChange,
  label = "Color",
}: {
  value: string;
  onChange: (color: string) => void;
  label?: string;
}) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [hex, setHex] = useState(value);
  const [pos, setPos] = useState({ top: 0, left: 0 });

  useEffect(() => {
    setHex(value);
  }, [value]);

  useEffect(() => {
    if (!open) return;
    const close = (event: MouseEvent) => {
      const target = event.target as Node;
      if (buttonRef.current?.contains(target) || panelRef.current?.contains(target)) return;
      setOpen(false);
    };
    const timer = window.setTimeout(() => {
      window.addEventListener("mousedown", close);
    }, 50);
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("mousedown", close);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function apply(color: string) {
    setHex(color);
    onChange(color);
  }

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          const rect = event.currentTarget.getBoundingClientRect();
          setPos({
            top: rect.bottom + 8,
            left: Math.min(rect.left, window.innerWidth - 248),
          });
          setOpen((current) => !current);
        }}
        className="flex h-8 shrink-0 cursor-pointer items-center gap-2 rounded-md border border-slate-200 bg-white px-2 text-xs"
      >
        <span className="h-4 w-4 rounded border border-black/10" style={{ background: hex }} />
        {label}
      </button>
      {open
        ? createPortal(
            <div
              ref={panelRef}
              className="fixed z-[200] w-[232px] rounded-xl border border-slate-200 bg-white p-3 shadow-2xl"
              style={{ top: pos.top, left: pos.left }}
              onMouseDown={(event) => event.stopPropagation()}
              onContextMenu={(event) => event.preventDefault()}
            >
              <p className="mb-2 text-xs font-semibold text-slate-600">{label}</p>
              <HexColorPicker color={hex} onChange={apply} style={{ width: 200, height: 200 }} />
              <Input
                className="mt-3 h-8 font-mono text-xs"
                value={hex}
                onChange={(event) => apply(event.target.value)}
              />
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
