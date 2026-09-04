"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { PageHeader } from "@/components/common/page-header";
import { EmptyState } from "@/components/common/page-header";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/format";
import { cartService } from "@/services/cart.service";
import { useCartStore } from "@/stores/cart-store";

export default function CartPage() {
  const items = useCartStore((s) => s.items);
  const setItems = useCartStore((s) => s.setItems);
  const total = items.reduce((sum, item) => sum + item.price, 0);
  const router = useRouter();

  useEffect(() => {
    cartService.list().then(setItems);
  }, [setItems]);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <PageHeader title="Cart" description="Configured print jobs ready for checkout." />
      {!items.length ? (
        <div className="mt-10">
          <EmptyState
            title="Your cart is empty"
            description="Save a design from the editor to add a configured product."
            action={
              <Link href="/products">
                <Button>Start a product</Button>
              </Link>
            }
          />
        </div>
      ) : (
        <div className="mt-8 space-y-4">
          {items.map((item) => (
            <div key={item.id} className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4">
              <div className="h-16 w-24 overflow-hidden rounded-lg bg-slate-100">
                {item.thumbnailUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.thumbnailUrl} alt="" className="h-full w-full object-cover" />
                ) : null}
              </div>
              <div className="flex-1">
                <p className="font-medium">{item.productName}</p>
                <p className="text-sm text-slate-500">{item.configurationSummary}</p>
              </div>
              <p className="font-semibold">{formatPrice(item.price)}</p>
              <Button
                variant="ghost"
                onClick={async () => {
                  await cartService.remove(item.id);
                  setItems(await cartService.list());
                }}
              >
                Remove
              </Button>
            </div>
          ))}
          <div className="flex items-center justify-between rounded-2xl bg-slate-950 px-6 py-5 text-white">
            <p className="text-lg font-semibold">Total {formatPrice(total)}</p>
            <Button className="bg-white text-slate-900 hover:bg-slate-100" onClick={() => router.push("/checkout")}>
              Checkout
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
