"use client";

import { useState } from "react";
import { AlertTriangle, ChevronDown, X } from "lucide-react";
import { useEngine } from "@/features/editor/engine/engine-context";
import { useEditorStore } from "@/features/editor/stores/editor-store";

export function PreflightIndicator() {
  const issues = useEditorStore((s) => s.preflight);
  const { engine } = useEngine();
  const [open, setOpen] = useState(false);
  const [hidden, setHidden] = useState(false);
  if (!issues.length || hidden) return null;
  const errors = issues.filter((item) => item.type === "error").length;

  return (
    <div className="absolute left-4 top-4 z-20 max-w-sm">
      {open ? (
        <div className="rounded-2xl border border-amber-200 bg-white p-3 shadow-lg">
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-amber-800">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span className="flex-1">
              Print check · {errors} errors · {issues.length - errors} warnings
            </span>
            <button type="button" className="rounded p-1 text-slate-400 hover:bg-slate-100" onClick={() => setOpen(false)}>
              <ChevronDown className="h-4 w-4 rotate-180" />
            </button>
            <button type="button" className="rounded p-1 text-slate-400 hover:bg-slate-100" onClick={() => setHidden(true)}>
              <X className="h-4 w-4" />
            </button>
          </div>
          <ul className="space-y-1 text-xs text-slate-600">
            {issues.slice(0, 5).map((issue) => (
              <li key={issue.id}>
                <button
                  className="text-left hover:text-blue-700"
                  onClick={() => issue.objectId && engine?.selectById(issue.objectId)}
                >
                  {issue.message}
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 rounded-full border border-amber-200 bg-white px-3 py-1.5 text-xs font-semibold text-amber-800 shadow"
        >
          <AlertTriangle className="h-3.5 w-3.5" />
          Print check · {issues.length}
        </button>
      )}
    </div>
  );
}
