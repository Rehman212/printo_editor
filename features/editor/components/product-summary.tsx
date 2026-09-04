"use client";

import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/input";
import { formatPrice } from "@/lib/format";
import { formatSize } from "@/lib/units";
import { useEngine } from "@/features/editor/engine/engine-context";
import { useEditorStore } from "@/features/editor/stores/editor-store";
import { designsService } from "@/services/designs.service";
import { products } from "@/services/mock-data";
import { quotePrice } from "@/services/pricing.service";
import { useUiStore } from "@/stores/ui-store";

export function ProductSummary() {
  const doc = useEditorStore((s) => s.document);
  const patch = useEditorStore((s) => s.patchDocument);
  const setPreflight = useEditorStore((s) => s.setPreflight);
  const { engine } = useEngine();
  const setTool = useUiStore((s) => s.setTool);
  if (!doc) return null;
  const currentDoc = doc;
  const product = products.find((item) => item.id === currentDoc.productId);
  const config = currentDoc.productConfiguration;

  function updateQty(quantity: number) {
    if (!product) return;
    const next = { ...config, quantity, price: quotePrice(product, { ...config, quantity }) };
    patch({ productConfiguration: next });
  }

  async function saveDesign() {
    if (!engine) return;
    const pages = currentDoc.pages.map((page) =>
      page.id === currentDoc.activePageId ? engine.snapshotPage(page) : page,
    );
    const next = { ...currentDoc, pages };
    const issues = [
      ...engine.inspectPreflight(pages.find((p) => p.id === next.activePageId)!),
      ...(await designsService.preflight(next)),
    ];
    setPreflight(issues);
    await designsService.save(next);
    toast.success("Design saved");
  }

  return (
    <aside className="hidden h-full w-80 shrink-0 flex-col border-l border-slate-200 bg-white xl:flex">
      <div className="border-b border-slate-100 p-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">Product</p>
        <h2 className="mt-1 text-lg font-semibold">{currentDoc.productName}</h2>
      </div>
      <div className="flex-1 space-y-4 overflow-y-auto p-4 text-sm">
        <Row label="Size" value={formatSize(config.width, config.height, config.unit)} />
        <Row label="Orientation" value={config.orientation} />
        <Row label="Sides" value={config.sides === "double" ? "Front & back" : "Single"} />
        <div>
          <p className="text-xs text-slate-500">Material</p>
          <Select
            value={config.materialId}
            onChange={(e) => {
              if (!product) return;
              const next = {
                ...config,
                materialId: e.target.value,
                price: quotePrice(product, { ...config, materialId: e.target.value }),
              };
              patch({ productConfiguration: next });
            }}
          >
            {product?.materials.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <p className="text-xs text-slate-500">Quantity</p>
          <Select value={String(config.quantity)} onChange={(e) => updateQty(Number(e.target.value))}>
            {product?.quantities.map((qty) => (
              <option key={qty} value={qty}>
                {qty}
              </option>
            ))}
          </Select>
        </div>
        <div className="rounded-2xl bg-slate-50 p-4">
          <p className="text-xs text-slate-500">Live price</p>
          <p className="text-2xl font-semibold">{formatPrice(config.price)}</p>
        </div>
        <Button variant="outline" className="w-full" onClick={() => setTool("configure")}>
          Edit configuration
        </Button>
      </div>
      <div className="border-t border-slate-100 p-4">
        <Button className="w-full" size="lg" onClick={() => void saveDesign()}>
          Save design
        </Button>
      </div>
    </aside>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-slate-500">{label}</span>
      <span className="font-medium capitalize">{value}</span>
    </div>
  );
}
