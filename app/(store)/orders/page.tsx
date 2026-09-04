"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/common/page-header";
import { EmptyState } from "@/components/common/page-header";
import { Badge } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatDate, formatPrice } from "@/lib/format";
import { cartService } from "@/services/cart.service";
import type { Order } from "@/types/cart";

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  useEffect(() => {
    cartService.orders().then(setOrders);
  }, []);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <PageHeader title="Orders" description="Track print jobs placed from this browser." />
      {!orders.length ? (
        <div className="mt-10">
          <EmptyState
            title="No orders yet"
            description="Complete checkout after saving a design."
            action={
              <Link href="/products">
                <Button>Shop products</Button>
              </Link>
            }
          />
        </div>
      ) : (
        <div className="mt-8 space-y-3">
          {orders.map((order) => (
            <Link
              key={order.id}
              href={`/orders/${order.id}`}
              className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-5"
            >
              <div>
                <p className="font-semibold">{order.id}</p>
                <p className="text-sm text-slate-500">{formatDate(order.createdAt)}</p>
              </div>
              <div className="flex items-center gap-3">
                <Badge tone="blue">{order.status}</Badge>
                <p className="font-medium">{formatPrice(order.total)}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
