import type { ProductConfiguration } from "@/types/product";

export interface DesignPage {
  id: string;
  name: string;
  side: "front" | "back" | "page";
  order: number;
  width: number;
  height: number;
  designJson: Record<string, unknown>;
  thumbnailUrl?: string;
}

export interface DesignSettings {
  showBleed: boolean;
  showSafeArea: boolean;
  showGrid: boolean;
  snapEnabled: boolean;
}

export interface DesignDocument {
  schemaVersion: number;
  projectId: string;
  name: string;
  productId: string;
  productName: string;
  productConfiguration: ProductConfiguration;
  pages: DesignPage[];
  activePageId: string;
  settings: DesignSettings;
  shareToken?: string;
  sharingEnabled?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DesignTemplate {
  id: string;
  name: string;
  categoryId: string;
  productType: string;
  width: number;
  height: number;
  thumbnailUrl: string;
  palette: string[];
  designJson: Record<string, unknown>;
}

export interface UploadedAsset {
  id: string;
  name: string;
  url: string;
  type: "image" | "svg" | "pdf";
  width: number;
  height: number;
  size: number;
  createdAt: string;
}

export type SaveStatus = "idle" | "saving" | "saved" | "error";
