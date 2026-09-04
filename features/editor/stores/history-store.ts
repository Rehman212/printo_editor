import { create } from "zustand";

const MAX = 50;

interface HistoryState {
  past: string[];
  future: string[];
  canUndo: boolean;
  canRedo: boolean;
  markPending: () => void;
  push: (snapshot: string) => void;
  undo: () => string | null;
  redo: (current: string) => string | null;
  reset: (snapshot: string) => void;
}

export const useHistoryStore = create<HistoryState>((set, get) => ({
  past: [],
  future: [],
  canUndo: false,
  canRedo: false,
  markPending: () => set({ canUndo: true }),
  push: (snapshot) => {
    const { past } = get();
    const last = past[past.length - 1];
    if (last === snapshot) {
      set({ canUndo: past.length > 1, canRedo: get().future.length > 0 });
      return;
    }
    const next = [...past, snapshot].slice(-MAX);
    set({ past: next, future: [], canUndo: next.length > 1, canRedo: false });
  },
  undo: () => {
    const { past } = get();
    if (past.length < 2) return past[0] ?? null;
    const current = past[past.length - 1];
    const previous = past[past.length - 2];
    const nextPast = past.slice(0, -1);
    set((state) => ({
      past: nextPast,
      future: [current, ...state.future],
      canUndo: nextPast.length > 1,
      canRedo: true,
    }));
    return previous;
  },
  redo: (current) => {
    const { future } = get();
    if (!future.length) return null;
    const [next, ...rest] = future;
    set((state) => ({
      past: [...state.past, current],
      future: rest,
      canUndo: true,
      canRedo: rest.length > 0,
    }));
    return next;
  },
  reset: (snapshot) => set({ past: [snapshot], future: [], canUndo: false, canRedo: false }),
}));
