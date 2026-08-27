export interface CatalogItem {
  id: string;
  sku: string;
  name: string;
  unit: string;
  price: number;
  stock_status: "ready" | "limited" | "out_of_stock";
  stock_qty: number;
  image_url?: string;
}

export const initialCatalogData: CatalogItem[] = [
  {
    id: "cat-1",
    sku: "SKU-TER-01",
    name: "Tepung Terigu Cakra Kembar Premium",
    unit: "Sak (25kg)",
    price: 245000,
    stock_status: "ready",
    stock_qty: 150,
    image_url: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&auto=format&fit=crop&q=80",
  },
  {
    id: "cat-2",
    sku: "SKU-GUL-02",
    name: "Gula Pasir Kristal Industri",
    unit: "Sak (50kg)",
    price: 780000,
    stock_status: "ready",
    stock_qty: 80,
    image_url: "https://images.unsplash.com/photo-1587735243615-c03f25aaff15?w=400&auto=format&fit=crop&q=80",
  },
  {
    id: "cat-3",
    sku: "SKU-MYK-03",
    name: "Minyak Goreng Sawit Industri",
    unit: "Drum (200L)",
    price: 3450000,
    stock_status: "limited",
    stock_qty: 12,
    image_url: "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400&auto=format&fit=crop&q=80",
  },
  {
    id: "cat-4",
    sku: "SKU-RGI-04",
    name: "Ragi Instan Mauripan Industri",
    unit: "Karton (20 pack)",
    price: 420000,
    stock_status: "ready",
    stock_qty: 45,
    image_url: "https://images.unsplash.com/photo-1549931319-a545dcf3bc73?w=400&auto=format&fit=crop&q=80",
  },
  {
    id: "cat-5",
    sku: "SKU-CKL-05",
    name: "Cokelat Bubuk Pure Cocoa 100%",
    unit: "Karton (5kg)",
    price: 350000,
    stock_status: "out_of_stock",
    stock_qty: 0,
    image_url: "https://images.unsplash.com/photo-1548812328-a05a8404b90e?w=400&auto=format&fit=crop&q=80",
  },
];

export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);
}
