export type LengthUnit = "in" | "mm";

export const SCREEN_PPI = 192;

export function toInches(value: number, unit: LengthUnit) {
  return unit === "in" ? value : value / 25.4;
}

export function fromInches(value: number, unit: LengthUnit) {
  return unit === "in" ? value : value * 25.4;
}

export function inchesToPx(inches: number, ppi = SCREEN_PPI) {
  return Math.round(inches * ppi);
}

export function pxToInches(px: number, ppi = SCREEN_PPI) {
  return px / ppi;
}

export function formatSize(width: number, height: number, unit: LengthUnit) {
  const decimals = unit === "in" ? 2 : 0;
  return `${width.toFixed(decimals)} × ${height.toFixed(decimals)} ${unit}`;
}
