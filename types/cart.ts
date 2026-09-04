export interface CartItem {
  id: string;
  projectId: string;
  productName: string;
  thumbnailUrl?: string;
  quantity: number;
  price: number;
  configurationSummary: string;
}

export interface Order {
  id: string;
  status: "processing" | "printing" | "shipped" | "delivered";
  items: CartItem[];
  total: number;
  createdAt: string;
}
