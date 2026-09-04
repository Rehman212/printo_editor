import { nanoid } from "nanoid";
import { storageGet, storageSet } from "@/lib/storage";
import { apiClient } from "@/services/api-client";
import { libraryImages, templateMeta } from "@/services/mock-data";
import type { DesignTemplate } from "@/types/design";

function templates(): DesignTemplate[] {
  return templateMeta.map((item) => ({
    ...item,
    width: item.productType === "posters" ? 11 : item.productType === "flyers" ? 5 : 3.5,
    height: item.productType === "posters" ? 17 : item.productType === "flyers" ? 7 : 2,
    thumbnailUrl: libraryImages[Math.abs(item.id.length) % libraryImages.length].url,
    palette: palettes[item.categoryId] ?? ["#111827", "#2563eb", "#f8fafc"],
    designJson: { kind: "preset", presetId: item.id },
  }));
}

const palettes: Record<string, string[]> = {
  modern: ["#0f172a", "#38bdf8", "#f8fafc"],
  minimal: ["#ffffff", "#111111", "#e5e7eb"],
  events: ["#7c2d12", "#fb923c", "#fff7ed"],
  food: ["#7f1d1d", "#f97316", "#fffbeb"],
  "real-estate": ["#1e3a5f", "#c4a574", "#f8fafc"],
  healthcare: ["#0f766e", "#99f6e4", "#f0fdfa"],
  retail: ["#831843", "#fb7185", "#fff1f2"],
  business: ["#111827", "#d4af37", "#f5f5f4"],
};

export const templatesService = {
  list: (query?: string, categoryId?: string) =>
    apiClient.get(() => {
      const q = query?.trim().toLowerCase();
      return templates().filter((tpl) => {
        const matchesQuery = !q || tpl.name.toLowerCase().includes(q);
        const matchesCat = !categoryId || categoryId === "all" || tpl.categoryId === categoryId;
        return matchesQuery && matchesCat;
      });
    }),
  get: (id: string) => apiClient.get(() => templates().find((tpl) => tpl.id === id) ?? null),
};

export const uploadsService = {
  list: () => apiClient.get(() => storageGet("uploads", [] as import("@/types/design").UploadedAsset[])),
  complete: (asset: import("@/types/design").UploadedAsset) =>
    apiClient.mutate(() => {
      const items = storageGet("uploads", [] as import("@/types/design").UploadedAsset[]);
      const next = [asset, ...items];
      storageSet("uploads", next);
      return asset;
    }),
  remove: (id: string) =>
    apiClient.mutate(() => {
      const items = storageGet("uploads", [] as import("@/types/design").UploadedAsset[]);
      storageSet(
        "uploads",
        items.filter((item) => item.id !== id),
      );
    }),
  createLocalAsset: async (file: File) => {
    const url = URL.createObjectURL(file);
    const isSvg = file.type.includes("svg");
    const isPdf = file.type.includes("pdf");
    let width = 1200;
    let height = 800;
    if (!isPdf) {
      const dims = await readImageSize(url);
      width = dims.width;
      height = dims.height;
    }
    return {
      id: nanoid(),
      name: file.name,
      url,
      type: isPdf ? "pdf" : isSvg ? "svg" : "image",
      width,
      height,
      size: file.size,
      createdAt: new Date().toISOString(),
    } as import("@/types/design").UploadedAsset;
  },
};

function readImageSize(url: string) {
  return new Promise<{ width: number; height: number }>((resolve) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = () => resolve({ width: 800, height: 600 });
    img.src = url;
  });
}
