"use client";

import { useEffect, useState, type ReactNode } from "react";
import {
  AlignHorizontalSpaceAround,
  ChevronRight,
  Copy,
  Layers,
  Lock,
  Trash2,
  Unlock,
} from "lucide-react";
import { useEngine } from "@/features/editor/engine/engine-context";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface MenuState {
  x: number;
  y: number;
  locked: boolean;
}

export function CanvasContextMenu() {
  const { engine } = useEngine();
  const [menu, setMenu] = useState<MenuState | null>(null);
  const [openSub, setOpenSub] = useState<"align" | "layer" | null>(null);

  useEffect(() => {
    if (!engine) return;
    engine.contextMenuHandler = (info) => {
      setOpenSub(null);
      setMenu(info);
    };
    return () => {
      engine.contextMenuHandler = null;
    };
  }, [engine]);

  useEffect(() => {
    if (!menu) return;
    const openedAt = Date.now();
    const close = () => {
      if (Date.now() - openedAt < 250) return;
      setMenu(null);
      setOpenSub(null);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("click", close);
    window.addEventListener("scroll", close, true);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("click", close);
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("keydown", onKey);
    };
  }, [menu]);

  if (!menu || !engine) return null;

  function run(action: () => void | Promise<void>) {
    void action();
    setMenu(null);
    setOpenSub(null);
  }

  const left = Math.min(menu.x, window.innerWidth - 240);
  const top = Math.min(menu.y, window.innerHeight - 280);

  return (
    <div
      className="fixed z-[90] w-56 rounded-lg border border-slate-200 bg-white py-1 shadow-xl"
      style={{ left, top }}
      onClick={(e) => e.stopPropagation()}
      onContextMenu={(e) => e.preventDefault()}
    >
      <div onMouseEnter={() => setOpenSub(null)}>
      <Item
        icon={<Trash2 className="h-4 w-4" />}
        label="Delete"
        onClick={() => run(() => engine.deleteSelected())}
      />
      <Item
        icon={<CopySquares />}
        label="Duplicate"
        onClick={() => run(() => engine.duplicateSelected())}
      />
      </div>
      <div className="my-1 h-px bg-slate-200" />
      <SubItem
        icon={<AlignHorizontalSpaceAround className="h-4 w-4" />}
        label="Alignment to page"
        open={openSub === "align"}
        onHover={() => setOpenSub("align")}
      >
        <Item label="Align left" onClick={() => run(() => engine.alignToPage("left"))} />
        <Item label="Align center" onClick={() => run(() => engine.alignToPage("center"))} />
        <Item label="Align right" onClick={() => run(() => engine.alignToPage("right"))} />
        <Item label="Align top" onClick={() => run(() => engine.alignToPage("top"))} />
        <Item label="Align middle" onClick={() => run(() => engine.alignToPage("middle"))} />
        <Item label="Align bottom" onClick={() => run(() => engine.alignToPage("bottom"))} />
      </SubItem>
      <SubItem
        icon={<Layers className="h-4 w-4" />}
        label="Layer"
        open={openSub === "layer"}
        onHover={() => setOpenSub("layer")}
      >
        <Item label="Bring to front" onClick={() => run(() => engine.bringToFront())} />
        <Item label="Bring forward" onClick={() => run(() => engine.moveForward())} />
        <Item label="Send backward" onClick={() => run(() => engine.moveBackward())} />
        <Item label="Send to back" onClick={() => run(() => engine.sendToBack())} />
      </SubItem>
      <div className="my-1 h-px bg-slate-200" />
      <div onMouseEnter={() => setOpenSub(null)}>
      <Item
        icon={<Copy className="h-4 w-4" />}
        label="Copy"
        onClick={() =>
          run(() => {
            engine.copySelected();
            toast.success("Copied. Ctrl+V to paste.");
          })
        }
      />
      <Item
        icon={menu.locked ? <Unlock className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
        label={menu.locked ? "Unlock" : "Lock"}
        onClick={() => run(() => engine.lockSelected(!menu.locked))}
      />
      </div>
    </div>
  );
}

function Item({
  icon,
  label,
  onClick,
}: {
  icon?: ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-100"
    >
      <span className="flex h-4 w-4 items-center justify-center text-slate-500">{icon}</span>
      {label}
    </button>
  );
}

function SubItem({
  icon,
  label,
  open,
  onHover,
  children,
}: {
  icon: ReactNode;
  label: string;
  open: boolean;
  onHover: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="relative" onMouseEnter={onHover}>
      <div
        className={cn(
          "flex w-full items-center gap-3 px-3 py-2 text-sm text-slate-700 hover:bg-slate-100",
          open && "bg-slate-100",
        )}
      >
        <span className="flex h-4 w-4 items-center justify-center text-slate-500">{icon}</span>
        <span className="flex-1">{label}</span>
        <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
      </div>
      {open ? (
        <div className="absolute left-full top-0 ml-1 w-48 rounded-lg border border-slate-200 bg-white py-1 shadow-xl">
          {children}
        </div>
      ) : null}
    </div>
  );
}

function CopySquares() {
  return (
    <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.4">
      <rect x="5" y="5" width="8" height="8" rx="1" />
      <path d="M3 10V3.5A1.5 1.5 0 0 1 4.5 2H11" />
    </svg>
  );
}
