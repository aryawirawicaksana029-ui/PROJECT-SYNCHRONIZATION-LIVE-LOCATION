export type UserRole = "admin" | "sales" | "petugas_lapangan" | "supervisor";
export type UserStatus = "active" | "inactive";
export type VerificationStatus = "verified" | "pending";
export type StoreStatus = "open" | "closed";
export type StockStatus = "ready" | "limited" | "out_of_stock";
export type DepositStatus = "pending" | "waiting_confirmation" | "approved" | "rejected";

export interface UserRow {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  password?: string;
  phone?: string;
  status?: UserStatus;
  avatar_url?: string;
  created_at?: string;
}

export interface StoreRow {
  id: string;
  kode_toko?: string; // Format e.g. FF-001, AB-002, RS-003
  kategori?: "Frozen Food" | "Agent Bumbu / Baku" | "Retail / Sembako" | "Lainnya" | string;
  name: string;
  phone: string;
  pic_name: string;
  pic_phone?: string;
  address: string;
  latitude: number;
  longitude: number;
  verification_status: VerificationStatus;
  current_status: StoreStatus;
  is_tracking_active?: boolean;
  last_ping_at?: string;
  created_by?: string;
  created_at?: string;
}

export interface ProductRow {
  id: string;
  sku: string;
  name: string;
  unit: string;
  price: number;
  stock_status: StockStatus;
  stock_qty?: number;
  image_url?: string;
  created_at?: string;
  updated_at?: string;
}

export interface VisitLogRow {
  id: string;
  user_id?: string;
  store_id: string;
  store_name?: string;
  check_in_time?: string;
  check_out_time?: string;
  is_open: boolean;
  is_ordered: boolean;
  is_paid: boolean;
  total_amount?: number;
  prev_bill_collected?: number;
  new_order_amount?: number;
  notes?: string;
  photo_url?: string;
  photo_key?: string;
  is_live_tracking: boolean;
  session_id?: string;
  created_at?: string;
}

export interface OrderItemRow {
  id: string;
  visit_log_id: string;
  product_id?: string;
  product_name?: string;
  sku?: string;
  unit?: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  created_at?: string;
}

export interface LocationLogRow {
  id: string;
  user_id?: string;
  store_id?: string;
  latitude: number;
  longitude: number;
  accuracy_m?: number;
  battery_level?: number;
  ping_status?: "success" | "gps_denied" | "failed";
  created_at?: string;
}

export interface TargetProductItem {
  product_id: string;
  product_name: string;
  target_qty: number;
  sold_qty: number;
}

export interface SalesDailyTask {
  id: string;
  user_id: string;
  date: string; // YYYY-MM-DD
  target_products: TargetProductItem[];
  target_collection_amount: number; // e.g. 5000000
  actual_collection_amount?: number;
  deposit_status: DepositStatus;
  deposit_notes?: string;
  deposit_submitted_at?: string;
  deposit_confirmed_at?: string;
  created_at?: string;
  updated_at?: string;
}
