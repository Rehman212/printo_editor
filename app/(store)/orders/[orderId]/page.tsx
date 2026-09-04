"use client";

import { use, useEffect, useState } from "react";
import { PageHeader } from "@/components/common/page-header";
import { Badge } from "@/components/ui/card";
import { formatDate, formatPrice } from "@/lib/format";
import { cartService } from "@/services/cart.service";
import type { Order } from "@/types/cart";

export default function OrderDetailPage({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = use(params);
  const [order, setOrder] = useState<Order | null>(null);

  useEffect(() => {
    cartService.order(orderId).then(setOrder);
  }, [orderId]);

  if (!order) return <div className="p-10">Order not found.</div>;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <PageHeader title={order.id} description={formatDate(order.createdAt)} />
      <div className="mt-6">
        <Badge tone="blue">{order.status}</Badge>
      </div>
      <div className="mt-6 space-y-3">
        {order.items.map((item) => (
          <div key={item.id} className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="font-medium">{item.productName}</p>
            <p className="text-sm text-slate-500">{item.configurationSummary}</p>
            <p className="mt-2">{formatPrice(item.price)}</p>
          </div>
        ))}
      </div>
      <p className="mt-6 text-xl font-semibold">Total {formatPrice(order.total)}</p>
    </div>
  );
}
