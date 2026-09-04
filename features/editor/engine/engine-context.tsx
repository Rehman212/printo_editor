"use client";

import { createContext, useContext, useState, type Dispatch, type ReactNode, type SetStateAction } from "react";
import type { EditorEngine } from "@/features/editor/engine/canvas-manager";

interface EngineContextValue {
  engine: EditorEngine | null;
  setEngine: Dispatch<SetStateAction<EditorEngine | null>>;
}

const EngineContext = createContext<EngineContextValue | null>(null);

export function EngineProvider({ children }: { children: ReactNode }) {
  const [engine, setEngine] = useState<EditorEngine | null>(null);
  return <EngineContext.Provider value={{ engine, setEngine }}>{children}</EngineContext.Provider>;
}

export function useEngine() {
  const ctx = useContext(EngineContext);
  if (!ctx) throw new Error("useEngine must be used inside EngineProvider");
  return ctx;
}
