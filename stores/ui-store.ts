import { create } from "zustand";

type ToolId =
  | "configure"
  | "templates"
  | "uploads"
  | "images"
  | "text"
  | "shapes"
  | "icons"
  | "background"
  | "qr"
  | "layers";

interface UiState {
  activeTool: ToolId;
  leftPanelOpen: boolean;
  rightPanelOpen: boolean;
  mobileSheet: ToolId | "product" | null;
  fileMenuOpen: boolean;
  shareOpen: boolean;
  previewOpen: boolean;
  setTool: (tool: ToolId) => void;
  toggleLeft: () => void;
  setMobileSheet: (sheet: UiState["mobileSheet"]) => void;
  setShareOpen: (open: boolean) => void;
}

export const useUiStore = create<UiState>((set) => ({
  activeTool: "uploads",
  leftPanelOpen: true,
  rightPanelOpen: true,
  mobileSheet: null,
  fileMenuOpen: false,
  shareOpen: false,
  previewOpen: false,
  setTool: (tool) => set({ activeTool: tool, leftPanelOpen: true }),
  toggleLeft: () => set((state) => ({ leftPanelOpen: !state.leftPanelOpen })),
  setMobileSheet: (sheet) => set({ mobileSheet: sheet }),
  setShareOpen: (open) => set({ shareOpen: open }),
}));

export type { ToolId };
