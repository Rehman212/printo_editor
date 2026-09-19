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
import { saveDesignToPrintoeAccount } from "@/lib/printoe-account";

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
  const handoff = config.printoeHandoff;
  const locked = Boolean(handoff);

  async function updateQty(quantity: number, value?: string) {
    if (handoff) {
      const choice = handoff.quantities.find((q) => q.value === value || q.qty === quantity);
      const qty = choice?.qty ?? quantity;
      const nextSelections = {
        ...handoff.selections,
        [handoff.quantityKey]: choice?.value ?? String(qty),
      };
      let price = config.price;
      if (choice?.total != null) price = choice.total;
      else if (choice?.unitPrice != null) price = choice.unitPrice * qty;
      else {
        try {
          const res = await fetch(
            `${handoff.apiBase.replace(/\/$/, "")}/products/${encodeURIComponent(handoff.slug)}/price`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ selections: nextSelections }),
            },
          );
          const json = (await res.json()) as {
            data?: { price?: number; unitPrice?: number; quantity?: number };
          };
          if (typeof json.data?.price === "number") price = json.data.price;
          else price = (config.price / Math.max(config.quantity, 1)) * qty;
        } catch {
          price = (config.price / Math.max(config.quantity, 1)) * qty;
        }
      }
      patch({
        productConfiguration: {
          ...config,
          quantity: qty,
          price,
          printoeHandoff: { ...handoff, selections: nextSelections },
        },
      });
      return;
    }
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
    if (!handoff) setPreflight(issues);
    await designsService.save(next);
    const account = await saveDesignToPrintoeAccount(next);
    const shop =
      next.productConfiguration.printoeHandoff?.shopBase || "https://printoe.com";
    const accountUrl = `${shop.replace(/\/$/, "")}/dashboard/saved-designs`;
    if (account.ok) {
      toast.success("Design saved successfully", {
        duration: 15000,
        description: "Go to your account to check Saved Designs.",
        action: {
          label: "Go to account",
          onClick: () => {
            window.location.href = accountUrl;
          },
        },
      });
    } else if (account.reason === "auth") {
      toast.error("Please log in on Printoe first, then open Design Online again.", {
        duration: 15000,
      });
    } else if (handoff) {
      toast.error("Could not save to your Printoe account. Try again.", {
        duration: 15000,
      });
    } else {
      toast.success("Design saved", { duration: 15000 });
    }
  }

  const qtyChoices = handoff?.quantities?.length
    ? handoff.quantities
    : product?.quantities.map((qty) => ({
        value: String(qty),
        label: String(qty),
        qty,
      }));

  return (
    <aside className="hidden h-full w-80 shrink-0 flex-col border-l border-slate-200 bg-white xl:flex">
      <div className="border-b border-slate-100 p-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">Product</p>
        <h2 className="mt-1 text-lg font-semibold">{currentDoc.productName}</h2>
      </div>
      <div className="flex-1 space-y-4 overflow-y-auto p-4 text-sm">
        {locked && handoff ? (
          handoff.details.map((row) => <Row key={row.label} label={row.label} value={row.value} />)
        ) : (
          <>
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
          </>
        )}
        <div>
          <p className="text-xs text-slate-500">Quantity</p>
          <Select
            value={
              qtyChoices?.find((q) => q.qty === config.quantity)?.value ?? String(config.quantity)
            }
            onChange={(e) => {
              const choice = qtyChoices?.find((q) => q.value === e.target.value);
              void updateQty(choice?.qty ?? Number(e.target.value), e.target.value);
            }}
          >
            {qtyChoices?.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </Select>
        </div>
        <div className="rounded-2xl bg-slate-50 p-4">
          <p className="text-xs text-slate-500">Live price</p>
          <p className="text-2xl font-semibold">{formatPrice(config.price)}</p>
        </div>
        {locked ? null : (
          <Button variant="outline" className="w-full" onClick={() => setTool("configure")}>
            Edit configuration
          </Button>
        )}
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
    <div className="flex items-center justify-between gap-3">
      <span className="text-slate-500">{label}</span>
      <span className="text-right font-medium capitalize">{value}</span>
    </div>
  );
}
