import { create } from "zustand";
import type { DesignDocument, SaveStatus } from "@/types/design";
import type { PreflightIssue } from "@/types/preflight";

interface EditorState {
  document: DesignDocument | null;
  saveStatus: SaveStatus;
  selectedId: string | null;
  selectedType: string | null;
  dirty: boolean;
  preflight: PreflightIssue[];
  setDocument: (document: DesignDocument | null) => void;
  patchDocument: (patch: Partial<DesignDocument>) => void;
  setSaveStatus: (saveStatus: SaveStatus) => void;
  setSelection: (id: string | null, type: string | null) => void;
  setDirty: (dirty: boolean) => void;
  setPreflight: (preflight: PreflightIssue[]) => void;
}

export const useEditorStore = create<EditorState>((set) => ({
  document: null,
  saveStatus: "idle",
  selectedId: null,
  selectedType: null,
  dirty: false,
  preflight: [],
  setDocument: (document) => set({ document }),
  patchDocument: (patch) =>
    set((state) =>
      state.document ? { document: { ...state.document, ...patch }, dirty: true } : state,
    ),
  setSaveStatus: (saveStatus) => set({ saveStatus }),
  setSelection: (selectedId, selectedType) => set({ selectedId, selectedType }),
  setDirty: (dirty) => set({ dirty }),
  setPreflight: (preflight) => set({ preflight }),
}));
