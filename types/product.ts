import type { LengthUnit } from "@/lib/units";

export type ProductCategory =
  | "business-cards"
  | "flyers"
  | "posters"
  | "brochures"
  | "stickers"
  | "banners";

export interface ProductSize {
  id: string;
  label: string;
  width: number;
  height: number;
  unit: LengthUnit;
}

export interface ProductOption {
  id: string;
  name: string;
  priceDelta: number;
  description?: string;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  category: ProductCategory;
  tagline: string;
  description: string;
  startingPrice: number;
  images: string[];
  specs: string[];
  sizes: ProductSize[];
  materials: ProductOption[];
  finishes: ProductOption[];
  thicknesses: ProductOption[];
  corners: ProductOption[];
  turnarounds: ProductOption[];
  quantities: number[];
  allowCustomSize: boolean;
  defaultBleed: number;
  defaultSafeArea: number;
  defaultSides: "single" | "double";
}

export interface ProductConfiguration {
  productId: string;
  variantId?: string;
  width: number;
  height: number;
  unit: LengthUnit;
  orientation: "portrait" | "landscape";
  sides: "single" | "double";
  materialId: string;
  finishId?: string;
  thicknessId?: string;
  cornerId?: string;
  turnaroundId?: string;
  quantity: number;
  price: number;
  bleed: number;
  safeArea: number;
}
