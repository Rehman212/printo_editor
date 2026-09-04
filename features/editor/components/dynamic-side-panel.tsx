"use client";

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

export function DynamicSidePanel() {
  const open = useUiStore((s) => s.leftPanelOpen);
  const tool = useUiStore((s) => s.activeTool);
  if (!open) return null;
  return (
    <aside className="hidden h-full w-[340px] shrink-0 overflow-y-auto border-r border-slate-200 bg-white lg:block">
      <div className="p-4">
        {tool === "configure" && <ConfigurationPanel />}
        {tool === "templates" && <TemplatesPanel />}
        {tool === "uploads" && <UploadsPanel />}
        {tool === "images" && <ImagesPanel />}
        {tool === "text" && <TextPanel />}
        {tool === "shapes" && <ShapesPanel />}
        {tool === "icons" && <IconsPanel />}
        {tool === "background" && <BackgroundPanel />}
        {tool === "qr" && <QrPanel />}
        {tool === "layers" && <LayersPanel />}
      </div>
    </aside>
  );
}
