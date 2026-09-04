import { apiClient } from "@/services/api-client";
import { categoryLabels, products } from "@/services/mock-data";
import { quotePrice } from "@/services/pricing.service";
import type { Product, ProductConfiguration } from "@/types/product";

export const productsService = {
  list: (query?: string, category?: string) =>
    apiClient.get(() => {
      const q = query?.trim().toLowerCase();
      return products.filter((product) => {
        const matchesQuery =
          !q ||
          product.name.toLowerCase().includes(q) ||
          product.tagline.toLowerCase().includes(q);
        const matchesCategory = !category || category === "all" || product.category === category;
        return matchesQuery && matchesCategory;
      });
    }),
  getBySlug: (slug: string) =>
    apiClient.get(() => products.find((product) => product.slug === slug) ?? null),
  getById: (id: string) =>
    apiClient.get(() => products.find((product) => product.id === id) ?? null),
  categories: () =>
    apiClient.get(() =>
      Object.entries(categoryLabels).map(([id, label]) => ({ id, label })),
    ),
  price: (product: Product, config: ProductConfiguration) =>
    apiClient.get(() => quotePrice(product, config)),
};

export function defaultConfiguration(product: Product): ProductConfiguration {
  const size = product.sizes[0];
  const landscape = size.width >= size.height;
  const config: ProductConfiguration = {
    productId: product.id,
    width: size.width,
    height: size.height,
    unit: size.unit,
    orientation: landscape ? "landscape" : "portrait",
    sides: product.defaultSides,
    materialId: product.materials[0].id,
    finishId: product.finishes[0]?.id,
    thicknessId: product.thicknesses[0]?.id,
    cornerId: product.corners[0]?.id,
    turnaroundId: product.turnarounds[0]?.id,
    quantity: product.quantities[0],
    price: 0,
    bleed: product.defaultBleed,
    safeArea: product.defaultSafeArea,
  };
  config.price = quotePrice(product, config);
  return config;
}

export function applyOrientation(
  config: ProductConfiguration,
  orientation: ProductConfiguration["orientation"],
): ProductConfiguration {
  const [short, long] = [Math.min(config.width, config.height), Math.max(config.width, config.height)];
  const next =
    orientation === "landscape"
      ? { ...config, orientation, width: long, height: short }
      : { ...config, orientation, width: short, height: long };
  return next;
}
