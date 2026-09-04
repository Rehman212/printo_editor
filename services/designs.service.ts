import { nanoid } from "nanoid";
import { inchesToPx } from "@/lib/units";
import { storageGet, storageSet } from "@/lib/storage";
import { apiClient } from "@/services/api-client";
import { products } from "@/services/mock-data";
import { quotePrice } from "@/services/pricing.service";
import type { DesignDocument, DesignPage } from "@/types/design";
import type { ProductConfiguration } from "@/types/product";
import type { PreflightIssue } from "@/types/preflight";

const KEY = "designs";

function all() {
  return storageGet<DesignDocument[]>(KEY, []);
}

function saveAll(items: DesignDocument[]) {
  storageSet(KEY, items);
}

function emptyPage(config: ProductConfiguration, side: DesignPage["side"], order: number, name: string): DesignPage {
  const width = inchesToPx(config.width, 192);
  const height = inchesToPx(config.height, 192);
  return {
    id: nanoid(),
    name,
    side,
    order,
    width,
    height,
    designJson: { version: "6.0.0", objects: [], background: "#ffffff" },
  };
}

export function createBlankDocument(
  productId: string,
  config: ProductConfiguration,
  name?: string,
): DesignDocument {
  const product = products.find((item) => item.id === productId);
  const pages = [emptyPage(config, "front", 0, "Front")];
  if (config.sides === "double") {
    pages.push(emptyPage(config, "back", 1, "Back"));
  }
  const now = new Date().toISOString();
  return {
    schemaVersion: 1,
    projectId: nanoid(),
    name: name ?? `${product?.name ?? "Design"} — Untitled`,
    productId,
    productName: product?.name ?? "Print product",
    productConfiguration: { ...config, price: quotePrice(product ?? products[0], config) },
    pages,
    activePageId: pages[0].id,
    settings: {
      showBleed: true,
      showSafeArea: true,
      showGrid: false,
      snapEnabled: true,
    },
    createdAt: now,
    updatedAt: now,
  };
}

export const designsService = {
  listMine: () => apiClient.get(() => all().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))),
  get: (id: string) => apiClient.get(() => all().find((item) => item.projectId === id) ?? null),
  getByShare: (token: string) =>
    apiClient.get(() => all().find((item) => item.shareToken === token && item.sharingEnabled) ?? null),
  create: (doc: DesignDocument) =>
    apiClient.mutate(() => {
      const items = all();
      saveAll([doc, ...items]);
      return doc;
    }),
  save: (doc: DesignDocument) =>
    apiClient.mutate(() => {
      const next = { ...doc, updatedAt: new Date().toISOString() };
      const items = all();
      const index = items.findIndex((item) => item.projectId === doc.projectId);
      if (index >= 0) items[index] = next;
      else items.unshift(next);
      saveAll(items);
      return next;
    }),
  duplicate: (id: string) =>
    apiClient.mutate(() => {
      const source = all().find((item) => item.projectId === id);
      if (!source) throw new Error("Design not found");
      const copy: DesignDocument = {
        ...structuredClone(source),
        projectId: nanoid(),
        name: `${source.name} copy`,
        shareToken: undefined,
        sharingEnabled: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      saveAll([copy, ...all()]);
      return copy;
    }),
  remove: (id: string) =>
    apiClient.mutate(() => {
      saveAll(all().filter((item) => item.projectId !== id));
    }),
  share: (id: string, enabled: boolean) =>
    apiClient.mutate(() => {
      const items = all();
      const item = items.find((design) => design.projectId === id);
      if (!item) throw new Error("Design not found");
      item.sharingEnabled = enabled;
      item.shareToken = item.shareToken ?? nanoid(10);
      item.updatedAt = new Date().toISOString();
      saveAll(items);
      return item;
    }),
  preflight: (doc: DesignDocument, extra: PreflightIssue[] = []) =>
    apiClient.get(() => runPreflight(doc, extra)),
};

export function runPreflight(doc: DesignDocument, extra: PreflightIssue[] = []): PreflightIssue[] {
  const issues: PreflightIssue[] = [...extra];
  for (const page of doc.pages) {
    const objects = (page.designJson.objects as unknown[] | undefined) ?? [];
    if (objects.length === 0) {
      issues.push({
        id: nanoid(),
        type: "warning",
        pageId: page.id,
        code: "empty-page",
        message: `${page.name} has no artwork yet.`,
      });
    }
  }
  if (doc.productConfiguration.sides === "double" && doc.pages.length < 2) {
    issues.push({
      id: nanoid(),
      type: "error",
      pageId: doc.pages[0]?.id ?? "",
      code: "missing-back",
      message: "This product requires a back page.",
    });
  }
  return issues;
}
