import type { Product } from "@/types/product";

const paperMaterials = [
  { id: "matte-16pt", name: "16pt Matte", priceDelta: 0, description: "Smooth uncoated look" },
  { id: "gloss-16pt", name: "16pt Gloss", priceDelta: 4, description: "High-shine finish" },
  { id: "soft-touch", name: "Soft-touch", priceDelta: 12, description: "Velvet laminated stock" },
  { id: "linen", name: "Linen uncoated", priceDelta: 8, description: "Textured premium paper" },
];

const flyerMaterials = [
  { id: "100lb-gloss", name: "100lb Gloss text", priceDelta: 0 },
  { id: "100lb-matte", name: "100lb Matte text", priceDelta: 3 },
  { id: "14pt-card", name: "14pt Cardstock", priceDelta: 14 },
];

const finishes = [
  { id: "none", name: "No extra finish", priceDelta: 0 },
  { id: "uv", name: "Spot UV", priceDelta: 18 },
  { id: "foil", name: "Gold foil", priceDelta: 28 },
];

const thicknesses = [
  { id: "standard", name: "Standard", priceDelta: 0 },
  { id: "thick", name: "Heavyweight", priceDelta: 9 },
];

const corners = [
  { id: "square", name: "Square", priceDelta: 0 },
  { id: "round", name: "Rounded", priceDelta: 6 },
];

const turnarounds = [
  { id: "standard", name: "Standard (5 days)", priceDelta: 0 },
  { id: "rush", name: "Rush (2 days)", priceDelta: 22 },
  { id: "next", name: "Next day", priceDelta: 48 },
];

export const products: Product[] = [
  {
    id: "prod_bc",
    slug: "business-cards",
    name: "Business Cards",
    category: "business-cards",
    tagline: "Sharp, professional cards that leave a lasting impression.",
    description:
      "Design front and back business cards with print-accurate bleed, premium stocks, and finishing options. Start from a blank canvas or a ready-made template.",
    startingPrice: 19.99,
    images: [
      "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=1400&q=80",
      "https://images.unsplash.com/photo-1561070791-2526d30994b5?auto=format&fit=crop&w=1400&q=80",
    ],
    specs: ["3.5 × 2 in standard", "Full-color both sides", "16pt stocks", "Optional rounded corners"],
    sizes: [
      { id: "std", label: "Standard 3.5 × 2 in", width: 3.5, height: 2, unit: "in" },
      { id: "square", label: "Square 2.5 × 2.5 in", width: 2.5, height: 2.5, unit: "in" },
      { id: "mini", label: "Mini 2.75 × 1.5 in", width: 2.75, height: 1.5, unit: "in" },
    ],
    materials: paperMaterials,
    finishes,
    thicknesses,
    corners,
    turnarounds,
    quantities: [100, 250, 500, 1000, 2500],
    allowCustomSize: true,
    defaultBleed: 0.125,
    defaultSafeArea: 0.125,
    defaultSides: "double",
  },
  {
    id: "prod_flyer",
    slug: "flyers",
    name: "Flyers",
    category: "flyers",
    tagline: "Promote events and offers with high-impact flyers.",
    description:
      "Single or double-sided flyers in popular sizes. Upload artwork, pick a template, or design from scratch with live print guides.",
    startingPrice: 24.5,
    images: [
      "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1400&q=80",
    ],
    specs: ["4×6 to 11×17", "Gloss or matte", "Optional cardstock"],
    sizes: [
      { id: "46", label: "4 × 6 in", width: 4, height: 6, unit: "in" },
      { id: "57", label: "5 × 7 in", width: 5, height: 7, unit: "in" },
      { id: "8511", label: "8.5 × 11 in", width: 8.5, height: 11, unit: "in" },
    ],
    materials: flyerMaterials,
    finishes: finishes.slice(0, 2),
    thicknesses,
    corners: [corners[0]],
    turnarounds,
    quantities: [50, 100, 250, 500, 1000],
    allowCustomSize: true,
    defaultBleed: 0.125,
    defaultSafeArea: 0.25,
    defaultSides: "single",
  },
  {
    id: "prod_poster",
    slug: "posters",
    name: "Posters",
    category: "posters",
    tagline: "Large-format posters for retail, events, and interiors.",
    description:
      "Create posters with safe-area validation, high-resolution image checks, and a full-screen proof before you order.",
    startingPrice: 18,
    images: [
      "https://images.unsplash.com/photo-1522542550221-31fd19575a2d?auto=format&fit=crop&w=1400&q=80",
    ],
    specs: ["11×17 to 24×36", "Satin or gloss", "Indoor use"],
    sizes: [
      { id: "1117", label: "11 × 17 in", width: 11, height: 17, unit: "in" },
      { id: "1824", label: "18 × 24 in", width: 18, height: 24, unit: "in" },
      { id: "2436", label: "24 × 36 in", width: 24, height: 36, unit: "in" },
    ],
    materials: [
      { id: "satin", name: "Satin poster", priceDelta: 0 },
      { id: "gloss-poster", name: "Gloss poster", priceDelta: 6 },
    ],
    finishes: [{ id: "none", name: "No extra finish", priceDelta: 0 }],
    thicknesses: [{ id: "standard", name: "Standard", priceDelta: 0 }],
    corners: [corners[0]],
    turnarounds,
    quantities: [1, 5, 10, 25, 50],
    allowCustomSize: true,
    defaultBleed: 0.25,
    defaultSafeArea: 0.5,
    defaultSides: "single",
  },
  {
    id: "prod_brochure",
    slug: "brochures",
    name: "Brochures",
    category: "brochures",
    tagline: "Folded brochures for sales kits and leave-behinds.",
    description:
      "Design multi-page brochure artwork with front and back pages, templates, and a product-accurate canvas.",
    startingPrice: 39,
    images: [
      "https://images.unsplash.com/photo-1586281380349-632531db7ed4?auto=format&fit=crop&w=1400&q=80",
    ],
    specs: ["Tri-fold 8.5×11", "Bi-fold 8.5×11", "100lb text"],
    sizes: [
      { id: "8511", label: "8.5 × 11 in", width: 8.5, height: 11, unit: "in" },
      { id: "8514", label: "8.5 × 14 in", width: 8.5, height: 14, unit: "in" },
    ],
    materials: flyerMaterials,
    finishes: finishes.slice(0, 2),
    thicknesses,
    corners: [corners[0]],
    turnarounds,
    quantities: [25, 50, 100, 250, 500],
    allowCustomSize: false,
    defaultBleed: 0.125,
    defaultSafeArea: 0.25,
    defaultSides: "double",
  },
  {
    id: "prod_sticker",
    slug: "stickers",
    name: "Stickers",
    category: "stickers",
    tagline: "Kiss-cut and die-cut stickers for brands on the go.",
    description:
      "Build sticker artwork with custom canvas sizes, QR codes, and rounded clip paths for die-cut styles.",
    startingPrice: 14,
    images: [
      "https://images.unsplash.com/photo-1611532736597-de2d4265fba3?auto=format&fit=crop&w=1400&q=80",
    ],
    specs: ["Kiss-cut sheets", "Waterproof vinyl", "Custom shape ready"],
    sizes: [
      { id: "2sq", label: "2 × 2 in", width: 2, height: 2, unit: "in" },
      { id: "3sq", label: "3 × 3 in", width: 3, height: 3, unit: "in" },
      { id: "4r", label: "4 × 2 in", width: 4, height: 2, unit: "in" },
    ],
    materials: [
      { id: "vinyl", name: "White vinyl", priceDelta: 0 },
      { id: "clear", name: "Clear vinyl", priceDelta: 8 },
    ],
    finishes: [{ id: "none", name: "Gloss laminate", priceDelta: 0 }],
    thicknesses: [{ id: "standard", name: "Standard", priceDelta: 0 }],
    corners,
    turnarounds,
    quantities: [50, 100, 250, 500],
    allowCustomSize: true,
    defaultBleed: 0.0625,
    defaultSafeArea: 0.08,
    defaultSides: "single",
  },
  {
    id: "prod_banner",
    slug: "banners",
    name: "Banners",
    category: "banners",
    tagline: "Indoor and outdoor vinyl banners at production sizes.",
    description:
      "Configure large banners, design with pan and zoom, and catch low-DPI artwork before you send to print.",
    startingPrice: 42,
    images: [
      "https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1400&q=80",
    ],
    specs: ["13oz vinyl", "Grommets optional", "Indoor / outdoor"],
    sizes: [
      { id: "23", label: "2 × 3 ft", width: 24, height: 36, unit: "in" },
      { id: "34", label: "3 × 4 ft", width: 36, height: 48, unit: "in" },
      { id: "36", label: "3 × 6 ft", width: 36, height: 72, unit: "in" },
    ],
    materials: [
      { id: "13oz", name: "13oz vinyl", priceDelta: 0 },
      { id: "mesh", name: "Mesh vinyl", priceDelta: 16 },
    ],
    finishes: [{ id: "none", name: "Hemmed edges", priceDelta: 0 }],
    thicknesses: [{ id: "standard", name: "Standard", priceDelta: 0 }],
    corners: [corners[0]],
    turnarounds,
    quantities: [1, 2, 5, 10],
    allowCustomSize: true,
    defaultBleed: 0.5,
    defaultSafeArea: 1,
    defaultSides: "single",
  },
];

export const categoryLabels: Record<Product["category"], string> = {
  "business-cards": "Business cards",
  flyers: "Flyers",
  posters: "Posters",
  brochures: "Brochures",
  stickers: "Stickers",
  banners: "Banners",
};

export const libraryImages = [
  {
    id: "lib1",
    name: "Studio desk",
    url: "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80",
    category: "Business",
  },
  {
    id: "lib2",
    name: "Abstract paper",
    url: "https://images.unsplash.com/photo-1557683316-973673baf926?auto=format&fit=crop&w=1200&q=80",
    category: "Modern",
  },
  {
    id: "lib3",
    name: "Floral",
    url: "https://images.unsplash.com/photo-1490750967868-88aa4486c946?auto=format&fit=crop&w=1200&q=80",
    category: "Events",
  },
  {
    id: "lib4",
    name: "Food spread",
    url: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1200&q=80",
    category: "Food",
  },
  {
    id: "lib5",
    name: "City skyline",
    url: "https://images.unsplash.com/photo-1467269204594-9661b134dd2b?auto=format&fit=crop&w=1200&q=80",
    category: "Real estate",
  },
  {
    id: "lib6",
    name: "Retail interior",
    url: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1200&q=80",
    category: "Retail",
  },
  {
    id: "lib7",
    name: "Clinic",
    url: "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=1200&q=80",
    category: "Healthcare",
  },
  {
    id: "lib8",
    name: "Minimal texture",
    url: "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&w=1200&q=80",
    category: "Minimal",
  },
];

export const templateMeta = [
  { id: "tpl_modern_navy", name: "Modern Navy", categoryId: "modern", productType: "business-cards" },
  { id: "tpl_minimal_white", name: "Minimal White", categoryId: "minimal", productType: "business-cards" },
  { id: "tpl_event_sunset", name: "Event Sunset", categoryId: "events", productType: "flyers" },
  { id: "tpl_food_bold", name: "Bold Bites", categoryId: "food", productType: "flyers" },
  { id: "tpl_realty", name: "Open House", categoryId: "real-estate", productType: "flyers" },
  { id: "tpl_health", name: "Care Clinic", categoryId: "healthcare", productType: "posters" },
  { id: "tpl_retail", name: "Season Sale", categoryId: "retail", productType: "posters" },
  { id: "tpl_business", name: "Executive", categoryId: "business", productType: "business-cards" },
];
