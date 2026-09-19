"use client";

import {
  CloudUpload,
  ImageIcon,
  LayoutTemplate,
  QrCode,
  Settings2,
  Shapes,
  Square,
  Type,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useUiStore, type ToolId } from "@/stores/ui-store";
import { useEditorStore } from "@/features/editor/stores/editor-store";

const tools: { id: ToolId; label: string; icon: typeof Type }[] = [
  { id: "configure", label: "Config", icon: Settings2 },
  { id: "uploads", label: "My Uploads", icon: CloudUpload },
  { id: "images", label: "Premium Images", icon: ImageIcon },
  { id: "text", label: "Text", icon: Type },
  { id: "shapes", label: "Shapes", icon: Shapes },
  { id: "background", label: "Background", icon: Square },
  { id: "qr", label: "QR Code", icon: QrCode },
  { id: "templates", label: "Templates", icon: LayoutTemplate },
];

export function LeftToolDock() {
  const active = useUiStore((s) => s.activeTool);
  const setTool = useUiStore((s) => s.setTool);
  const setMobile = useUiStore((s) => s.setMobileSheet);
  const locked = Boolean(
    useEditorStore((s) => s.document?.productConfiguration.printoeHandoff),
  );
  return (
    <nav className="flex h-16 w-full shrink-0 items-center gap-1 overflow-x-auto border-t border-slate-200 bg-[#f3f4f6] px-1 lg:h-full lg:w-[88px] lg:flex-col lg:border-r lg:border-t-0 lg:py-3">
      {tools
        .filter((tool) => !(locked && tool.id === "configure"))
        .map((tool) => {
        const Icon = tool.icon;
        const on = active === tool.id;
        return (
          <button
            key={tool.id}
            title={tool.label}
            onClick={() => {
              setTool(tool.id);
              setMobile(tool.id);
            }}
            className={cn(
              "flex min-h-[68px] w-[76px] shrink-0 flex-col items-center justify-center gap-1 rounded-md px-1 text-center text-[10px] font-medium leading-tight",
              on ? "bg-[#3d5245] text-white" : "text-slate-600 hover:bg-white",
            )}
          >
            <Icon className="h-5 w-5" />
            {tool.label}
          </button>
        );
      })}
    </nav>
  );
}
