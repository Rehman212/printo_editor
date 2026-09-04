import { create } from "zustand";

export type CanvasMode = "select" | "pan";

interface CanvasUiState {
  zoom: number;
  mode: CanvasMode;
  layerVersion: number;
  bumpLayers: () => void;
  setZoom: (zoom: number) => void;
  setMode: (mode: CanvasMode) => void;
}

export const useCanvasStore = create<CanvasUiState>((set) => ({
  zoom: 1,
  mode: "select",
  layerVersion: 0,
  bumpLayers: () => set((state) => ({ layerVersion: state.layerVersion + 1 })),
  setZoom: (zoom) => set({ zoom }),
  setMode: (mode) => set({ mode }),
}));
