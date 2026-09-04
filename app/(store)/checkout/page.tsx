"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/common/page-header";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { formatPrice } from "@/lib/format";
import { cartService } from "@/services/cart.service";
import { useCartStore } from "@/stores/cart-store";
import { useAuthStore } from "@/stores/auth-store";

export default function CheckoutPage() {
  const items = useCartStore((s) => s.items);
  const setItems = useCartStore((s) => s.setItems);
  const user = useAuthStore((s) => s.user);
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const total = items.reduce((sum, item) => sum + item.price, 0);

  useEffect(() => {
    cartService.list().then(setItems);
  }, [setItems]);

  if (!items.length) {
    return <div className="mx-auto max-w-xl px-4 py-20 text-center">Your cart is empty.</div>;
  }

  return (
    <div className="mx-auto grid max-w-5xl gap-8 px-4 py-10 lg:grid-cols-2 sm:px-6">
      <div>
        <PageHeader title="Checkout" description="Frontend MVP checkout. Pricing is re-quoted later on NestJS." />
        <form
          className="mt-8 space-y-4"
          onSubmit={async (e) => {
            e.preventDefault();
            if (!user) {
              router.push("/login");
              return;
            }
            setBusy(true);
            const order = await cartService.checkout(items, total);
            setItems([]);
            toast.success("Order placed");
            router.push(`/orders/${order.id}`);
          }}
        >
          <div>
            <Label>Full name</Label>
            <Input required defaultValue={user?.name} />
          </div>
          <div>
            <Label>Email</Label>
            <Input type="email" required defaultValue={user?.email} />
          </div>
          <div>
            <Label>Shipping address</Label>
            <Input required placeholder="Street, city, postal code" />
          </div>
          <Button className="w-full" size="lg" disabled={busy}>
            Place order · {formatPrice(total)}
          </Button>
        </form>
      </div>
      <aside className="rounded-3xl border border-slate-200 bg-white p-6">
        {items.map((item) => (
          <div key={item.id} className="flex justify-between border-b border-slate-100 py-3 text-sm">
            <span>{item.productName}</span>
            <span>{formatPrice(item.price)}</span>
          </div>
        ))}
        <p className="mt-4 text-lg font-semibold">Total {formatPrice(total)}</p>
      </aside>
    </div>
  );
}
