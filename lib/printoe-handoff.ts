import type { PrintoeHandoff, ProductConfiguration } from "@/types/product";

export type EditorHandoffPayload = PrintoeHandoff & {
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
};

export function parseEditorHandoff(raw: string | null): EditorHandoffPayload | null {
  if (!raw) return null;
  try {
    const data = JSON.parse(raw) as EditorHandoffPayload;
    if (!data?.name || !Array.isArray(data.details)) return null;
    return data;
  } catch {
    return null;
  }
}

function parseSize(label: string): { width: number; height: number } | null {
  const m = label.match(/([\d.]+)\s*(?:["”]|in|inch)?\s*[x×]\s*([\d.]+)/i);
  if (!m) return null;
  const width = Number(m[1]);
  const height = Number(m[2]);
  if (!width || !height) return null;
  return { width, height };
}

export function configurationFromHandoff(handoff: EditorHandoffPayload): ProductConfiguration {
  const sizeDetail = handoff.details.find((d) => /size/i.test(d.label));
  const size = sizeDetail ? parseSize(sizeDetail.value) : null;
  const width = size?.width ?? 3.5;
  const height = size?.height ?? 2;
  const sidesDetail = handoff.details.find((d) => /side|print/i.test(d.label))?.value ?? "";
  const double = /front\s*(and|&)\s*back|both|double/i.test(sidesDetail);
  return {
    productId: `printoe:${handoff.slug}`,
    width,
    height,
    unit: "in",
    orientation: width >= height ? "landscape" : "portrait",
    sides: double ? "double" : "single",
    materialId: "locked",
    quantity: handoff.quantity || 1,
    price: handoff.totalPrice || 0,
    bleed: 0,
    safeArea: 0,
    printoeHandoff: {
      slug: handoff.slug,
      apiBase: handoff.apiBase,
      shopBase: handoff.shopBase,
      accessToken: handoff.accessToken,
      quantityKey: handoff.quantityKey,
      selections: handoff.selections,
      details: handoff.details,
      quantities: handoff.quantities,
    },
  };
}
