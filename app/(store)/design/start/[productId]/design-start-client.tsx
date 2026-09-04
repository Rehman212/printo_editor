"use client";

import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { FileImage, FolderOpen, LayoutTemplate, SquareDashed } from "lucide-react";
import { PageHeader } from "@/components/common/page-header";
import { Button } from "@/components/ui/button";
import { createBlankDocument, designsService } from "@/services/designs.service";
import { defaultConfiguration } from "@/services/products.service";
import { products } from "@/services/mock-data";
import { templatesService } from "@/services/templates.service";
import type { DesignDocument } from "@/types/design";

export default function DesignStartPage() {
  const { productId } = useParams<{ productId: string }>();
  const search = useSearchParams();
  const router = useRouter();
  const product = products.find((item) => item.id === productId);
  const [project, setProject] = useState<DesignDocument | null>(null);
  const [saved, setSaved] = useState<DesignDocument[]>([]);

  useEffect(() => {
    const id = search.get("projectId");
    designsService.listMine().then((items) => {
      setSaved(items.filter((item) => item.productId === productId));
      if (id) {
        const found = items.find((item) => item.projectId === id);
        if (found) setProject(found);
      }
    });
  }, [productId, search]);

  async function ensureProject() {
    if (project) return project;
    if (!product) throw new Error("Missing product");
    const doc = createBlankDocument(product.id, defaultConfiguration(product));
    await designsService.create(doc);
    setProject(doc);
    return doc;
  }

  async function goBlank() {
    const doc = await ensureProject();
    router.push(`/editor/${doc.projectId}`);
  }

  async function applyTemplate(templateId: string, palette: string[]) {
    const doc = await ensureProject();
    router.push(
      `/editor/${doc.projectId}?template=${templateId}&palette=${encodeURIComponent(palette.join(","))}`,
    );
  }

  if (!product) return <div className="p-10">Product not found.</div>;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <PageHeader
        eyebrow={product.name}
        title="How would you like to start?"
        description="Create a blank design, apply a template, upload finished artwork, or continue a saved file."
      />
      <div className="mt-10 grid gap-4 md:grid-cols-2">
        <StartCard
          icon={SquareDashed}
          title="Blank design"
          copy="Open a print-accurate canvas with bleed and safe-area guides."
          action={<Button onClick={() => void goBlank()}>Create blank</Button>}
        />
        <StartCard
          icon={LayoutTemplate}
          title="Browse templates"
          copy="Start from a professional layout, then customize every object."
          action={
            <Link href="#templates" className="text-sm font-medium text-blue-700">
              Jump to templates
            </Link>
          }
        />
        <StartCard
          icon={FileImage}
          title="Upload artwork"
          copy="Drop a PNG, JPG, SVG or PDF preview, then refine in the editor."
          action={
            <Button variant="outline" onClick={() => void goBlank()}>
              Upload in editor
            </Button>
          }
        />
        <StartCard
          icon={FolderOpen}
          title="Continue a saved design"
          copy="Pick up where you left off. Autosave keeps a local draft too."
          action={
            saved[0] ? (
              <Link href={`/editor/${saved[0].projectId}`}>
                <Button variant="outline">Open latest</Button>
              </Link>
            ) : (
              <span className="text-sm text-slate-500">No saved designs yet</span>
            )
          }
        />
      </div>
      <h2 id="templates" className="mt-14 text-xl font-semibold">
        Templates
      </h2>
      <TemplateGrid productType={product.slug} onApply={applyTemplate} />
    </div>
  );
}

function StartCard({
  icon: Icon,
  title,
  copy,
  action,
}: {
  icon: typeof SquareDashed;
  title: string;
  copy: string;
  action: ReactNode;
}) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6">
      <Icon className="h-6 w-6 text-blue-600" />
      <h3 className="mt-4 text-lg font-semibold">{title}</h3>
      <p className="mt-2 text-sm text-slate-600">{copy}</p>
      <div className="mt-5">{action}</div>
    </div>
  );
}

function TemplateGrid({
  productType,
  onApply,
}: {
  productType: string;
  onApply: (id: string, palette: string[]) => void;
}) {
  const [items, setItems] = useState<Awaited<ReturnType<typeof templatesService.list>>>([]);
  useEffect(() => {
    templatesService.list().then((list) =>
      setItems(list.filter((item) => item.productType === productType || item.productType === "business-cards")),
    );
  }, [productType]);
  return (
    <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {items.map((tpl) => (
        <button
          key={tpl.id}
          onClick={() => onApply(tpl.id, tpl.palette)}
          className="overflow-hidden rounded-2xl border border-slate-200 bg-white text-left"
        >
          <div className="flex h-28" style={{ background: tpl.palette[0] }}>
            <div className="w-8" style={{ background: tpl.palette[1] }} />
          </div>
          <div className="p-3">
            <p className="font-medium">{tpl.name}</p>
            <p className="text-xs capitalize text-slate-500">{tpl.categoryId}</p>
          </div>
        </button>
      ))}
    </div>
  );
}
