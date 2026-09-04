"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/common/page-header";
import { EmptyState } from "@/components/common/page-header";
import { Button } from "@/components/ui/button";
import { formatRelative } from "@/lib/format";
import { designsService } from "@/services/designs.service";
import type { DesignDocument } from "@/types/design";

export default function SavedDesignsPage() {
  const [items, setItems] = useState<DesignDocument[]>([]);

  function refresh() {
    designsService.listMine().then(setItems);
  }

  useEffect(() => {
    refresh();
  }, []);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <PageHeader
        eyebrow="Library"
        title="Saved designs"
        description="Continue editing, duplicate a layout, or preview artwork before ordering."
      />
      {!items.length ? (
        <div className="mt-10">
          <EmptyState
            title="No designs yet"
            description="Start from a product to create your first print-ready file."
            action={
              <Link href="/products">
                <Button>Browse products</Button>
              </Link>
            }
          />
        </div>
      ) : (
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <article key={item.projectId} className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
              <div className="h-40 bg-slate-100">
                {item.pages[0]?.thumbnailUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.pages[0].thumbnailUrl} alt="" className="h-full w-full object-cover" />
                ) : null}
              </div>
              <div className="p-4">
                <h2 className="font-semibold">{item.name}</h2>
                <p className="text-sm text-slate-500">
                  {item.productName} · {formatRelative(item.updatedAt)}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Link href={`/editor/${item.projectId}`}>
                    <Button size="sm">Edit</Button>
                  </Link>
                  <Link href={`/preview/${item.projectId}`}>
                    <Button size="sm" variant="outline">
                      Preview
                    </Button>
                  </Link>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={async () => {
                      await designsService.duplicate(item.projectId);
                      refresh();
                      toast.success("Duplicated");
                    }}
                  >
                    Duplicate
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={async () => {
                      const name = prompt("Rename design", item.name);
                      if (!name) return;
                      await designsService.save({ ...item, name });
                      refresh();
                    }}
                  >
                    Rename
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={async () => {
                      await designsService.remove(item.projectId);
                      refresh();
                    }}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
