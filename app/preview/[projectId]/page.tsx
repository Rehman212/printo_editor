"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { designsService } from "@/services/designs.service";
import { formatPrice } from "@/lib/format";
import type { DesignDocument } from "@/types/design";

export default function PreviewPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = use(params);
  const [doc, setDoc] = useState<DesignDocument | null>(null);

  useEffect(() => {
    designsService.get(projectId).then(setDoc);
  }, [projectId]);

  if (!doc) return <div className="p-10">Loading preview…</div>;

  return (
    <div className="min-h-dvh bg-slate-950 text-white">
      <header className="flex items-center justify-between border-b border-white/10 px-6 py-4">
        <div>
          <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Proof</p>
          <h1 className="text-lg font-semibold">{doc.name}</h1>
        </div>
        <div className="flex gap-2">
          <Link href={`/editor/${doc.projectId}`}>
            <Button variant="outline" className="border-white/20 bg-transparent text-white hover:bg-white/10">
              Return to editor
            </Button>
          </Link>
          <Link href="/cart">
            <Button>Save and continue · {formatPrice(doc.productConfiguration.price)}</Button>
          </Link>
        </div>
      </header>
      <div className="mx-auto grid max-w-6xl gap-6 px-6 py-10 lg:grid-cols-[1fr_280px]">
        <div className="space-y-6">
          {doc.pages.map((page) => (
            <div key={page.id} className="overflow-hidden rounded-2xl bg-white p-6">
              <p className="mb-3 text-sm font-medium text-slate-700">{page.name}</p>
              {page.thumbnailUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={page.thumbnailUrl} alt={page.name} className="mx-auto max-h-[70vh] w-auto" />
              ) : (
                <div className="flex h-64 items-center justify-center bg-slate-100 text-slate-500">
                  Open the editor once to generate a proof image.
                </div>
              )}
            </div>
          ))}
        </div>
        <aside className="rounded-2xl bg-white/5 p-5 text-sm">
          <h2 className="font-semibold">{doc.productName}</h2>
          <p className="mt-2 text-slate-300">
            {doc.productConfiguration.width} × {doc.productConfiguration.height} {doc.productConfiguration.unit}
          </p>
          <p className="mt-1 capitalize text-slate-300">{doc.productConfiguration.sides} sided</p>
          <p className="mt-1 text-slate-300">Qty {doc.productConfiguration.quantity}</p>
          <p className="mt-4 text-xl font-semibold">{formatPrice(doc.productConfiguration.price)}</p>
          <p className="mt-6 text-xs text-slate-400">
            High-resolution PNG proofs are generated in the editor. Print-ready PDF export belongs on the backend.
          </p>
        </aside>
      </div>
    </div>
  );
}
