export type ShapeKind =
  | "line"
  | "diamond"
  | "triangle"
  | "square"
  | "star"
  | "pentagon"
  | "rectangle"
  | "heart"
  | "arrow"
  | "burst"
  | "check"
  | "circle"
  | "cloud"
  | "cloud-outline";

export const SHAPE_PRESETS: { id: ShapeKind; label: string }[] = [
  { id: "line", label: "Line" },
  { id: "diamond", label: "Diamond" },
  { id: "triangle", label: "Triangle" },
  { id: "square", label: "Square" },
  { id: "star", label: "Star" },
  { id: "pentagon", label: "Pentagon" },
  { id: "rectangle", label: "Rectangle" },
  { id: "heart", label: "Heart" },
  { id: "arrow", label: "Arrow" },
  { id: "burst", label: "Burst" },
  { id: "check", label: "Check" },
  { id: "circle", label: "Circle" },
  { id: "cloud", label: "Cloud" },
  { id: "cloud-outline", label: "Cloud outline" },
];

export const FEATURED_COLORS = [
  "#ffffff",
  "#f3f4f6",
  "#d1d5db",
  "#6b7280",
  "#111827",
  "#7f1d1d",
  "#dc2626",
  "#f97316",
  "#f59e0b",
  "#eab308",
  "#84cc16",
  "#22c55e",
  "#14b8a6",
  "#06b6d4",
  "#0ea5e9",
  "#2563eb",
  "#4f46e5",
  "#7c3aed",
  "#c026d3",
  "#db2777",
  "#fce7f3",
  "#ffedd5",
  "#ecfccb",
  "#ccfbf1",
  "#e0f2fe",
  "#ede9fe",
  "#1e3a5f",
  "#3d5245",
  "#7c2d12",
  "#44403c",
];
