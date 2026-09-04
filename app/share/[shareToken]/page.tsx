"use client";

import { use, useEffect, useState } from "react";
import { designsService } from "@/services/designs.service";
import type { DesignDocument } from "@/types/design";

export default function SharePage({ params }: { params: Promise<{ shareToken: string }> }) {
  const { shareToken } = use(params);
  const [doc, setDoc] = useState<DesignDocument | null>(null);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    designsService.getByShare(shareToken).then((item) => {
      if (!item) setMissing(true);
      else setDoc(item);
    });
  }, [shareToken]);

  if (missing) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-slate-50 px-6 text-center">
        <div>
          <h1 className="text-2xl font-semibold">This share link is unavailable</h1>
          <p className="mt-2 text-slate-500">It may have expired or sharing was turned off.</p>
        </div>
      </div>
    );
  }
  if (!doc) return <div className="p-10">Loading shared preview…</div>;

  return (
    <div className="min-h-dvh bg-slate-100">
      <header className="border-b border-slate-200 bg-white px-6 py-4">
        <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Read-only preview</p>
        <h1 className="text-xl font-semibold">{doc.name}</h1>
      </header>
      <div className="mx-auto max-w-4xl space-y-6 px-6 py-10">
        {doc.pages.map((page) => (
          <div key={page.id} className="rounded-2xl bg-white p-6 shadow-sm">
            <p className="mb-3 text-sm font-medium">{page.name}</p>
            {page.thumbnailUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={page.thumbnailUrl} alt="" className="mx-auto max-h-[80vh]" />
            ) : (
              <p className="text-sm text-slate-500">No proof image yet.</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
