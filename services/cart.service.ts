import { nanoid } from "nanoid";
import { storageGet, storageSet } from "@/lib/storage";
import { apiClient } from "@/services/api-client";
import type { CartItem, Order } from "@/types/cart";

export const cartService = {
  list: () => apiClient.get(() => storageGet<CartItem[]>("cart", [])),
  add: (item: Omit<CartItem, "id">) =>
    apiClient.mutate(() => {
      const items = storageGet<CartItem[]>("cart", []);
      const next: CartItem = { ...item, id: nanoid() };
      storageSet("cart", [...items, next]);
      return next;
    }),
  remove: (id: string) =>
    apiClient.mutate(() => {
      storageSet(
        "cart",
        storageGet<CartItem[]>("cart", []).filter((item) => item.id !== id),
      );
    }),
  clear: () =>
    apiClient.mutate(() => {
      storageSet("cart", []);
    }),
  checkout: (items: CartItem[], total: number) =>
    apiClient.mutate(() => {
      const orders = storageGet<Order[]>("orders", []);
      const order: Order = {
        id: `ORD-${nanoid(6).toUpperCase()}`,
        status: "processing",
        items,
        total,
        createdAt: new Date().toISOString(),
      };
      storageSet("orders", [order, ...orders]);
      storageSet("cart", []);
      return order;
    }),
  orders: () => apiClient.get(() => storageGet<Order[]>("orders", [])),
  order: (id: string) =>
    apiClient.get(() => storageGet<Order[]>("orders", []).find((item) => item.id === id) ?? null),
};
