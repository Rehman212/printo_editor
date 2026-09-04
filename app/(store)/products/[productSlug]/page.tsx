"use client";

import { notFound, useParams, useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/common/page-header";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";
import { formatPrice } from "@/lib/format";
import { formatSize } from "@/lib/units";
import { createBlankDocument, designsService } from "@/services/designs.service";
import { applyOrientation, defaultConfiguration } from "@/services/products.service";
import { products } from "@/services/mock-data";
import { quotePrice } from "@/services/pricing.service";
import type { ProductConfiguration } from "@/types/product";

export default function ProductDetailPage() {
  const { productSlug } = useParams<{ productSlug: string }>();
  const router = useRouter();
  const product = products.find((item) => item.slug === productSlug);
  const [config, setConfig] = useState<ProductConfiguration | null>(null);

  const current = useMemo(() => {
    if (!product) return null;
    return config ?? defaultConfiguration(product);
  }, [product, config]);

  if (!product || !current) {
    if (productSlug && !product) notFound();
    return null;
  }

  const selectedProduct = product;
  const selectedConfig = current;

  function update(next: ProductConfiguration) {
    next.price = quotePrice(selectedProduct, next);
    setConfig(next);
  }

  async function startDesigning() {
    const doc = createBlankDocument(selectedProduct.id, selectedConfig);
    await designsService.create(doc);
    router.push(`/design/start/${selectedProduct.id}?projectId=${doc.projectId}`);
  }

  return (
    <div className="mx-auto grid max-w-7xl gap-10 px-4 py-10 lg:grid-cols-[1.1fr_0.9fr] sm:px-6">
      <div>
        <PageHeader eyebrow={product.category.replace("-", " ")} title={product.name} description={product.description} />
        <div className="mt-8 overflow-hidden rounded-3xl bg-slate-100">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={product.images[0]} alt="" className="h-[420px] w-full object-cover" />
        </div>
        <ul className="mt-6 grid gap-2 text-sm text-slate-600 sm:grid-cols-2">
          {product.specs.map((spec) => (
            <li key={spec} className="rounded-xl bg-white px-4 py-3 ring-1 ring-slate-200">
              {spec}
            </li>
          ))}
        </ul>
      </div>
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm text-slate-500">Starting at</p>
        <p className="text-3xl font-semibold">{formatPrice(current.price)}</p>
        <div className="mt-6 space-y-4">
          <Field label="Size">
            <Select
              value={`${current.width}:${current.height}`}
              onChange={(e) => {
                const size = product.sizes.find((item) => `${item.width}:${item.height}` === e.target.value);
                if (size) update({ ...current, width: size.width, height: size.height, unit: size.unit });
              }}
            >
              {product.sizes.map((size) => (
                <option key={size.id} value={`${size.width}:${size.height}`}>
                  {size.label}
                </option>
              ))}
            </Select>
          </Field>
          {product.allowCustomSize ? (
            <div className="grid grid-cols-2 gap-3">
              <Field label={`Width (${current.unit})`}>
                <Input
                  type="number"
                  step="0.01"
                  value={current.width}
                  onChange={(e) => update({ ...current, width: Number(e.target.value) })}
                />
              </Field>
              <Field label={`Height (${current.unit})`}>
                <Input
                  type="number"
                  step="0.01"
                  value={current.height}
                  onChange={(e) => update({ ...current, height: Number(e.target.value) })}
                />
              </Field>
            </div>
          ) : null}
          <div className="grid grid-cols-2 gap-2">
            {(["landscape", "portrait"] as const).map((orientation) => (
              <Button
                key={orientation}
                variant={current.orientation === orientation ? "primary" : "outline"}
                onClick={() => update(applyOrientation(current, orientation))}
              >
                {orientation}
              </Button>
            ))}
          </div>
          <Field label="Printing sides">
            <Select
              value={current.sides}
              onChange={(e) => update({ ...current, sides: e.target.value as ProductConfiguration["sides"] })}
            >
              <option value="single">Single sided</option>
              <option value="double">Front and back</option>
            </Select>
          </Field>
          <Field label="Material">
            <Select value={current.materialId} onChange={(e) => update({ ...current, materialId: e.target.value })}>
              {product.materials.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Finish">
            <Select value={current.finishId} onChange={(e) => update({ ...current, finishId: e.target.value })}>
              {product.finishes.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Quantity">
            <Select value={String(current.quantity)} onChange={(e) => update({ ...current, quantity: Number(e.target.value) })}>
              {product.quantities.map((qty) => (
                <option key={qty} value={qty}>
                  {qty}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Turnaround">
            <Select
              value={current.turnaroundId}
              onChange={(e) => update({ ...current, turnaroundId: e.target.value })}
            >
              {product.turnarounds.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </Select>
          </Field>
          <p className="text-xs text-slate-500">
            Canvas {formatSize(current.width, current.height, current.unit)} · bleed {current.bleed}
            {current.unit} · safe {current.safeArea}
            {current.unit}
          </p>
          <Button className="w-full" size="lg" onClick={() => void startDesigning()}>
            Start designing
          </Button>
          <Button
            className="w-full"
            variant="outline"
            onClick={() => {
              toast.message("Price is quoted on the frontend MVP. Checkout still uses this quote.");
            }}
          >
            Price includes selected options
          </Button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <Label>{label}</Label>
      {children}
    </div>
  );
}
