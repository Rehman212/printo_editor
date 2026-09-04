import type { Product, ProductConfiguration } from "@/types/product";

function optionDelta(options: { id: string; priceDelta: number }[], id?: string) {
  return options.find((item) => item.id === id)?.priceDelta ?? 0;
}

export function quotePrice(product: Product, config: ProductConfiguration) {
  const qtyIndex = Math.max(0, product.quantities.indexOf(config.quantity));
  const qtyMultiplier = 1 + qtyIndex * 0.55;
  const sizeArea = config.width * config.height;
  const sizeFactor = Math.max(1, sizeArea / 7);
  const sidesFactor = config.sides === "double" ? 1.35 : 1;
  const extras =
    optionDelta(product.materials, config.materialId) +
    optionDelta(product.finishes, config.finishId) +
    optionDelta(product.thicknesses, config.thicknessId) +
    optionDelta(product.corners, config.cornerId) +
    optionDelta(product.turnarounds, config.turnaroundId);

  const price = (product.startingPrice * sizeFactor * sidesFactor * qtyMultiplier + extras) ;
  return Math.round(price * 100) / 100;
}
