import { insforge, isInsForgeConfigured } from "./insforge";
import {
  UserRow,
  UserRole,
  UserStatus,
  StoreRow,
  ProductRow,
  VisitLogRow,
  OrderItemRow,
  LocationLogRow,
  SalesDailyTask,
  TargetProductItem,
} from "./database.types";
import { initialCatalogData } from "./catalogData";

// Helper to generate unique IDs
export function generateUniqueId(prefix: string): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return `${prefix}-${crypto.randomUUID().slice(0, 8)}`;
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

// Helper to generate kode_toko based on kategori
export function generateKodeToko(kategori?: string): string {
  let prefix = "LN";
  if (kategori === "Frozen Food") prefix = "FF";
  else if (kategori === "Agent Bumbu / Baku") prefix = "AB";
  else if (kategori === "Retail / Sembako") prefix = "RS";
  
  const randomNum = Math.floor(100 + Math.random() * 900);
  return `${prefix}-${randomNum}`;
}

// Initial mock fallback stores with kode_toko & kategori
const defaultStores: StoreRow[] = [
  {
    id: "1",
    kode_toko: "RS-001",
    kategori: "Retail / Sembako",
    name: "Toko Sembako Berkah Jaya",
    phone: "081298765432",
    pic_name: "Hj. Maryam",
    pic_phone: "081298765432",
    address: "Jl. Raya Bogor KM 24 No. 12, Kramat Jati, Jakarta Timur",
    latitude: -6.2731,
    longitude: 106.8712,
    verification_status: "verified",
    current_status: "open",
    is_tracking_active: true,
    last_ping_at: "10:45 WIB",
    created_at: "2026-08-10T08:30:00Z",
  },
  {
    id: "2",
    kode_toko: "RS-002",
    kategori: "Retail / Sembako",
    name: "Warung Kelontong Pak Budi",
    phone: "085711223344",
    pic_name: "Budi Santoso",
    pic_phone: "085711223344",
    address: "Jl. Lapangan Bola No. 88, Kebon Jeruk, Jakarta Barat",
    latitude: -6.1923,
    longitude: 106.7641,
    verification_status: "pending",
    current_status: "closed",
    is_tracking_active: false,
    last_ping_at: "Offline",
    created_at: "2026-08-12T09:15:00Z",
  },
  {
    id: "3",
    kode_toko: "AB-001",
    kategori: "Agent Bumbu / Baku",
    name: "Toko Sumber Rejeki Baku",
    phone: "0215551234",
    pic_name: "Asep Saifullah",
    pic_phone: "081388990011",
    address: "Jl. Kebon Sirih No. 15, Menteng, Jakarta Pusat",
    latitude: -6.1832,
    longitude: 106.8302,
    verification_status: "verified",
    current_status: "open",
    is_tracking_active: true,
    last_ping_at: "10:48 WIB",
    created_at: "2026-08-08T07:45:00Z",
  },
  {
    id: "4",
    kode_toko: "FF-001",
    kategori: "Frozen Food",
    name: "Berkah Frozen Food Mart",
    phone: "081377889900",
    pic_name: "Siti Rahmawati",
    pic_phone: "081377889900",
    address: "Jl. Margonda Raya No. 102, Depok",
    latitude: -6.3721,
    longitude: 106.8315,
    verification_status: "verified",
    current_status: "open",
    is_tracking_active: false,
    last_ping_at: "09:30 WIB",
    created_at: "2026-08-14T11:20:00Z",
  },
  {
    id: "5",
    kode_toko: "AB-002",
    kategori: "Agent Bumbu / Baku",
    name: "CV Sari Rasa Bumbu & Rempah",
    phone: "081912345678",
    pic_name: "Hendra Wijaya",
    pic_phone: "081912345678",
    address: "Kawasan Industri Pulo Gadung Blok C-4, Jakarta Timur",
    latitude: -6.1955,
    longitude: 106.9022,
    verification_status: "verified",
    current_status: "open",
    is_tracking_active: true,
    last_ping_at: "11:15 WIB",
    created_at: "2026-08-15T13:00:00Z",
  },
];

// Initial mock products with image_url and stock_qty
const defaultProducts: ProductRow[] = initialCatalogData.map((p) => ({
  id: p.id,
  sku: p.sku,
  name: p.name,
  unit: p.unit,
  price: p.price,
  stock_status: p.stock_status,
  stock_qty: p.stock_qty,
  image_url: p.image_url,
}));

// Initial mock visit logs with invoice linkage
const defaultVisitLogs: VisitLogRow[] = [
  {
    id: "vl-1",
    user_id: "u-2",
    store_id: "1",
    store_name: "Toko Sembako Berkah Jaya (RS-001)",
    is_open: true,
    is_ordered: true,
    is_paid: true,
    total_amount: 1500000,
    notes: "Kunjungan rutin, order tepung & gula pasir",
    is_live_tracking: true,
    session_id: "SES-882194",
    created_at: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: "vl-2",
    user_id: "u-3",
    store_id: "2",
    store_name: "Warung Kelontong Pak Budi (RS-002)",
    is_open: false,
    is_ordered: false,
    is_paid: false,
    total_amount: 0,
    notes: "Toko tutup saat sales berkunjung",
    is_live_tracking: false,
    created_at: new Date(Date.now() - 7200000).toISOString(),
  },
  {
    id: "vl-3",
    user_id: "u-4",
    store_id: "4",
    store_name: "Berkah Frozen Food Mart (FF-001)",
    is_open: true,
    is_ordered: true,
    is_paid: true,
    total_amount: 2850000,
    notes: "Restock minyak goreng & ragi",
    is_live_tracking: false,
    created_at: new Date(Date.now() - 14400000).toISOString(),
  },
];

// Initial mock location logs
const defaultLocationLogs: LocationLogRow[] = [
  {
    id: "loc-1",
    user_id: "u-2",
    store_id: "1",
    latitude: -6.2731,
    longitude: 106.8712,
    accuracy_m: 5,
    battery_level: 95,
    ping_status: "success",
    created_at: new Date(Date.now() - 60000).toISOString(),
  },
  {
    id: "loc-2",
    user_id: "u-3",
    store_id: "2",
    latitude: -6.2650,
    longitude: 106.8480,
    accuracy_m: 8,
    battery_level: 72,
    ping_status: "success",
    created_at: new Date(Date.now() - 120000).toISOString(),
  },
  {
    id: "loc-3",
    user_id: "u-4",
    store_id: "3",
    latitude: -6.2490,
    longitude: 106.8300,
    accuracy_m: 12,
    battery_level: 48,
    ping_status: "success",
    created_at: new Date(Date.now() - 300000).toISOString(),
  },
  {
    id: "loc-4",
    user_id: "u-5",
    latitude: -6.2880,
    longitude: 106.8550,
    accuracy_m: 6,
    battery_level: 85,
    ping_status: "success",
    created_at: new Date(Date.now() - 180000).toISOString(),
  },
];

const defaultUsers: UserRow[] = [
  {
    id: "u-1",
    name: "Admin Utama",
    email: "admin@sll-app.id",
    role: "admin",
    password: "admin123",
    phone: "081299887766",
    status: "active",
    created_at: "2025-01-10T08:00:00Z",
  },
  {
    id: "u-2",
    name: "Ahmad Faisal",
    email: "faisal.sales@sll-app.id",
    role: "sales",
    password: "sales123",
    phone: "081234567890",
    status: "active",
    created_at: "2025-06-15T08:00:00Z",
  },
  {
    id: "u-3",
    name: "Budi Santoso",
    email: "budi.sales@sll-app.id",
    role: "sales",
    password: "sales123",
    phone: "085711223344",
    status: "active",
    created_at: "2025-07-20T09:30:00Z",
  },
  {
    id: "u-4",
    name: "Dede Firmansyah",
    email: "dede.sales@sll-app.id",
    role: "sales",
    password: "sales123",
    phone: "081388990011",
    status: "active",
    created_at: "2025-09-05T10:15:00Z",
  },
  {
    id: "u-5",
    name: "Siti Rahmawati",
    email: "siti.sales@sll-app.id",
    role: "sales",
    password: "sales123",
    phone: "081377889900",
    status: "active",
    created_at: "2025-11-12T14:00:00Z",
  },
  {
    id: "u-6",
    name: "Hendra Wijaya",
    email: "hendra.admin@sll-app.id",
    role: "admin",
    password: "admin123",
    phone: "081912345678",
    status: "active",
    created_at: "2026-02-01T11:00:00Z",
  },
];

// ==========================================
// PERSISTENT STORAGE HELPERS (LocalStorage)
// ==========================================
function getStored<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const item = window.localStorage.getItem(key);
    if (!item) return fallback;
    return JSON.parse(item);
  } catch {
    return fallback;
  }
}

function setStored<T>(key: string, val: T): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(val));
  } catch {
    // ignore
  }
}

// ==========================================
// AUTH & CURRENT SESSION HELPERS
// ==========================================
export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  status?: UserStatus;
  avatar_url?: string;
  joined_at: string;
}

export function getCurrentUser(): UserProfile | null {
  return getStored<UserProfile | null>("sll_current_user", null);
}

export function setCurrentUser(user: UserProfile | null): void {
  setStored("sll_current_user", user);
}

export async function getUserProfile(): Promise<UserProfile> {
  const session = getCurrentUser();
  if (session) return session;

  const users = await getUsers();
  const active = users.find((u) => u.role === "sales") || users[1] || users[0];
  const profile: UserProfile = {
    id: active.id,
    name: active.name,
    email: active.email,
    role: active.role,
    phone: active.phone,
    status: active.status,
    joined_at: active.created_at || "2025-06-15T08:00:00Z",
  };
  setCurrentUser(profile);
  return profile;
}

export async function updateUserProfile(
  updates: Partial<UserProfile>
): Promise<UserProfile> {
  const current = await getUserProfile();
  const updated = { ...current, ...updates };
  setCurrentUser(updated);

  await updateUser(current.id, updates);
  return updated;
}

// ==========================================
// STORE SERVICES
// ==========================================
export async function getStores(): Promise<StoreRow[]> {
  if (isInsForgeConfigured()) {
    try {
      const { data, error } = await insforge.database
        .from("stores")
        .select("*")
        .order("created_at", { ascending: false });
      if (!error && data && data.length > 0) {
        setStored("sll_stores", data);
        return data as StoreRow[];
      }
    } catch {
      // fallback to stored
    }
  }
  return getStored<StoreRow[]>("sll_stores", defaultStores);
}

export async function getStoreById(id: string): Promise<StoreRow | null> {
  const stores = await getStores();
  return stores.find((s) => s.id === id) || null;
}

export async function addStore(
  store: Omit<StoreRow, "id">
): Promise<StoreRow> {
  const newId = generateUniqueId("s");
  const kode_toko = store.kode_toko || generateKodeToko(store.kategori);
  const kategori = store.kategori || "Retail / Sembako";
  const newStore: StoreRow = {
    ...store,
    id: newId,
    kode_toko,
    kategori,
    created_at: store.created_at || new Date().toISOString(),
  };

  const currentStores = await getStores();
  const updatedStores = [newStore, ...currentStores];
  setStored("sll_stores", updatedStores);

  if (isInsForgeConfigured()) {
    try {
      const { data, error } = await insforge.database
        .from("stores")
        .insert([{ ...store, id: newId, kode_toko, kategori }])
        .select("*")
        .single();
      if (!error && data) return data as StoreRow;
    } catch {
      // ignore
    }
  }

  return newStore;
}

export async function updateStore(
  id: string,
  updates: Partial<StoreRow>
): Promise<StoreRow | null> {
  const currentStores = await getStores();
  const idx = currentStores.findIndex((s) => s.id === id);
  if (idx === -1) return null;

  const updated = { ...currentStores[idx], ...updates };
  currentStores[idx] = updated;
  setStored("sll_stores", [...currentStores]);

  if (isInsForgeConfigured()) {
    try {
      await insforge.database.from("stores").update(updates).eq("id", id);
    } catch {
      // ignore
    }
  }

  return updated;
}

export async function deleteStore(id: string): Promise<boolean> {
  const currentStores = await getStores();
  const filtered = currentStores.filter((s) => s.id !== id);
  setStored("sll_stores", filtered);

  if (isInsForgeConfigured()) {
    try {
      const { error } = await insforge.database.from("stores").delete().eq("id", id);
      return !error;
    } catch {
      return false;
    }
  }
  return true;
}

// ==========================================
// PRODUCT CATALOG SERVICES
// ==========================================
export async function getProducts(): Promise<ProductRow[]> {
  if (isInsForgeConfigured()) {
    try {
      const { data, error } = await insforge.database
        .from("products")
        .select("*")
        .order("created_at", { ascending: false });
      if (!error && data && data.length > 0) {
        setStored("sll_products", data);
        return data as ProductRow[];
      }
    } catch {
      // fallback
    }
  }
  return getStored<ProductRow[]>("sll_products", defaultProducts);
}

export async function addProduct(
  product: Omit<ProductRow, "id">
): Promise<ProductRow> {
  const newId = generateUniqueId("prod");
  const newProduct: ProductRow = {
    ...product,
    id: newId,
    created_at: new Date().toISOString(),
  };

  const current = await getProducts();
  const updated = [newProduct, ...current];
  setStored("sll_products", updated);

  if (isInsForgeConfigured()) {
    try {
      const { data, error } = await insforge.database
        .from("products")
        .insert([{ ...product, id: newId }])
        .select("*")
        .single();
      if (!error && data) return data as ProductRow;
    } catch {
      // ignore
    }
  }

  return newProduct;
}

export async function updateProduct(
  id: string,
  updates: Partial<ProductRow>
): Promise<ProductRow | null> {
  const current = await getProducts();
  const idx = current.findIndex((p) => p.id === id);
  if (idx === -1) return null;

  const updated = { ...current[idx], ...updates };
  current[idx] = updated;
  setStored("sll_products", [...current]);

  if (isInsForgeConfigured()) {
    try {
      await insforge.database.from("products").update(updates).eq("id", id);
    } catch {
      // ignore
    }
  }

  return updated;
}

export async function deleteProduct(id: string): Promise<boolean> {
  const current = await getProducts();
  const filtered = current.filter((p) => p.id !== id);
  setStored("sll_products", filtered);

  if (isInsForgeConfigured()) {
    try {
      const { error } = await insforge.database.from("products").delete().eq("id", id);
      return !error;
    } catch {
      return false;
    }
  }
  return true;
}

// Storage upload for photos
export async function uploadVisitPhoto(
  file: File
): Promise<{ url: string; key: string }> {
  if (isInsForgeConfigured()) {
    try {
      const key = `visits/${Date.now()}-${file.name.replace(/\s+/g, "_")}`;
      const { data, error } = await insforge.storage
        .from("visit-photos")
        .upload(key, file);
      if (!error && data) {
        return { url: data.url, key: data.key };
      }
    } catch {
      // fallback
    }
  }

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      resolve({
        url: reader.result as string,
        key: `local-key-${Date.now()}`,
      });
    };
    reader.readAsDataURL(file);
  });
}

// ==========================================
// VISIT LOG & ORDER ITEM SERVICES
// ==========================================
export async function addVisitLog(
  log: Omit<VisitLogRow, "id">,
  orderItems?: Omit<OrderItemRow, "id" | "visit_log_id">[]
): Promise<VisitLogRow> {
  const newId = generateUniqueId("vl");
  const newLog: VisitLogRow = {
    ...log,
    id: newId,
    created_at: log.created_at || new Date().toISOString(),
  };

  const current = await getVisitLogs();
  const updated = [newLog, ...current];
  setStored("sll_visits", updated);

  if (isInsForgeConfigured()) {
    try {
      const { data, error } = await insforge.database
        .from("visit_logs")
        .insert([{ ...log, id: newId }])
        .select("*")
        .single();

      if (!error && data) {
        const createdVisit = data as VisitLogRow;
        if (orderItems && orderItems.length > 0) {
          const itemsToInsert = orderItems.map((item) => ({
            ...item,
            visit_log_id: createdVisit.id,
          }));
          await insforge.database.from("order_items").insert(itemsToInsert);
        }
        return createdVisit;
      }
    } catch {
      // ignore
    }
  }

  return newLog;
}

export async function getVisitLogs(): Promise<VisitLogRow[]> {
  if (isInsForgeConfigured()) {
    try {
      const { data, error } = await insforge.database
        .from("visit_logs")
        .select("*")
        .order("created_at", { ascending: false });
      if (!error && data && data.length > 0) {
        setStored("sll_visits", data);
        return data as VisitLogRow[];
      }
    } catch {
      // fallback
    }
  }
  return getStored<VisitLogRow[]>("sll_visits", defaultVisitLogs);
}

// ==========================================
// LOCATION LOG SERVICES
// ==========================================
export async function addLocationLog(
  location: Omit<LocationLogRow, "id">
): Promise<LocationLogRow> {
  const newId = generateUniqueId("loc");
  const newLoc: LocationLogRow = {
    ...location,
    id: newId,
    created_at: location.created_at || new Date().toISOString(),
  };

  const current = await getLocationLogs();
  const updated = [newLoc, ...current];
  setStored("sll_locations", updated);

  if (isInsForgeConfigured()) {
    try {
      const { data, error } = await insforge.database
        .from("location_logs")
        .insert([{ ...location, id: newId }])
        .select("*")
        .single();
      if (!error && data) return data as LocationLogRow;
    } catch {
      // ignore
    }
  }

  return newLoc;
}

export async function getLocationLogs(): Promise<LocationLogRow[]> {
  if (isInsForgeConfigured()) {
    try {
      const { data, error } = await insforge.database
        .from("location_logs")
        .select("*")
        .order("created_at", { ascending: false });
      if (!error && data && data.length > 0) {
        setStored("sll_locations", data);
        return data as LocationLogRow[];
      }
    } catch {
      // fallback
    }
  }
  return getStored<LocationLogRow[]>("sll_locations", defaultLocationLogs);
}

export interface ActiveSalesPosition {
  id: string;
  user_id: string;
  sales_name: string;
  latitude: number;
  longitude: number;
  accuracy_m: number;
  battery_level: number;
  last_ping: string;
  ping_status: string;
}

export async function getActiveSalesPositions(): Promise<ActiveSalesPosition[]> {
  const logs = await getLocationLogs();
  const users = await getUsers();

  const activeSalesUsers = users.filter(
    (u) => (u.status || "active") === "active" && u.role === "sales"
  );
  const activeSalesUserIds = new Set(activeSalesUsers.map((u) => u.id));

  const latestByUser = new Map<string, LocationLogRow>();
  for (const log of logs) {
    if (!log.user_id) continue;
    if (!latestByUser.has(log.user_id)) {
      latestByUser.set(log.user_id, log);
    }
  }

  const positions: ActiveSalesPosition[] = [];
  latestByUser.forEach((log, userId) => {
    if (!activeSalesUserIds.has(userId)) return;
    const user = activeSalesUsers.find((u) => u.id === userId);
    if (!user) return;

    positions.push({
      id: log.id,
      user_id: userId,
      sales_name: user.name,
      latitude: log.latitude,
      longitude: log.longitude,
      accuracy_m: log.accuracy_m || 5,
      battery_level: log.battery_level || 85,
      last_ping: log.created_at || new Date().toISOString(),
      ping_status: log.ping_status || "success",
    });
  });

  return positions;
}

// ==========================================
// USER SERVICES & MANAGEMENT
// ==========================================
export async function getUsers(): Promise<UserRow[]> {
  if (isInsForgeConfigured()) {
    try {
      const { data, error } = await insforge.database
        .from("users")
        .select("*")
        .order("created_at", { ascending: false });
      if (!error && data && data.length > 0) {
        setStored("sll_users", data);
        return data as UserRow[];
      }
    } catch {
      // fallback
    }
  }
  return getStored<UserRow[]>("sll_users", defaultUsers);
}

export async function addUser(
  user: Omit<UserRow, "id">
): Promise<UserRow> {
  const newId = generateUniqueId("u");
  const newUser: UserRow = {
    ...user,
    id: newId,
    password: user.password || "sales123",
    status: user.status || "active",
    created_at: user.created_at || new Date().toISOString(),
  };

  const current = await getUsers();
  const updated = [newUser, ...current];
  setStored("sll_users", updated);

  if (isInsForgeConfigured()) {
    try {
      const { data, error } = await insforge.database
        .from("users")
        .insert([{ ...newUser, id: newId }])
        .select("*")
        .single();
      if (!error && data) return data as UserRow;
    } catch {
      // ignore
    }
  }

  return newUser;
}

export async function updateUser(
  id: string,
  updates: Partial<UserRow>
): Promise<UserRow | null> {
  const current = await getUsers();
  const idx = current.findIndex((u) => u.id === id);
  if (idx === -1) return null;

  const updated = { ...current[idx], ...updates };
  current[idx] = updated;
  setStored("sll_users", [...current]);

  // If updating current logged in user session, keep it in sync
  const session = getCurrentUser();
  if (session && session.id === id) {
    setCurrentUser({
      ...session,
      name: updated.name || session.name,
      email: updated.email || session.email,
      role: updated.role || session.role,
      phone: updated.phone || session.phone,
      status: updated.status || session.status,
    });
  }

  if (isInsForgeConfigured()) {
    try {
      await insforge.database.from("users").update(updates).eq("id", id);
    } catch {
      // ignore
    }
  }

  return updated;
}

export async function deleteUser(id: string): Promise<boolean> {
  const current = await getUsers();
  const filtered = current.filter((u) => u.id !== id);
  setStored("sll_users", filtered);

  if (isInsForgeConfigured()) {
    try {
      const { error } = await insforge.database.from("users").delete().eq("id", id);
      return !error;
    } catch {
      return false;
    }
  }
  return true;
}

// ==========================================
// DASHBOARD STATS HELPER
// ==========================================
export interface DashboardStats {
  totalStores: number;
  totalVisitsToday: number;
  activeTracking: number;
  totalPaidAmount: number;
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const [stores, visits] = await Promise.all([getStores(), getVisitLogs()]);

  const activeTracking = stores.filter((s) => s.is_tracking_active).length;
  const totalPaidAmount = visits.reduce(
    (sum, v) => sum + (v.is_paid ? v.total_amount || 0 : 0),
    0
  );

  return {
    totalStores: stores.length,
    totalVisitsToday: visits.length,
    activeTracking,
    totalPaidAmount,
  };
}

// ==========================================
// SALES DAILY TASKS & DEPOSIT MANAGEMENT
// ==========================================
const defaultDailyTasks: SalesDailyTask[] = [
  {
    id: "dt-1",
    user_id: "u-2", // Ahmad Faisal
    date: new Date().toISOString().split("T")[0],
    target_products: [
      { product_id: "cat-1", product_name: "Tepung Terigu Cakra Kembar Premium", target_qty: 20, sold_qty: 6 },
      { product_id: "cat-2", product_name: "Gula Pasir Kristal Industri", target_qty: 10, sold_qty: 3 },
      { product_id: "cat-3", product_name: "Minyak Goreng Sawit Industri", target_qty: 5, sold_qty: 1 },
    ],
    target_collection_amount: 5000000,
    actual_collection_amount: 1270000,
    deposit_status: "pending",
  },
  {
    id: "dt-2",
    user_id: "u-3", // Dede Kurniawan
    date: new Date().toISOString().split("T")[0],
    target_products: [
      { product_id: "cat-1", product_name: "Tepung Terigu Cakra Kembar Premium", target_qty: 15, sold_qty: 4 },
      { product_id: "cat-4", product_name: "Ragi Instan Mauripan Industri", target_qty: 8, sold_qty: 2 },
    ],
    target_collection_amount: 3500000,
    actual_collection_amount: 0,
    deposit_status: "pending",
  },
];

export async function getDailyTasks(): Promise<SalesDailyTask[]> {
  return getStored<SalesDailyTask[]>("sll_daily_tasks", defaultDailyTasks);
}

export async function getDailyTaskByUserId(
  userId: string,
  date?: string
): Promise<SalesDailyTask | null> {
  const targetDate = date || new Date().toISOString().split("T")[0];
  const all = await getDailyTasks();
  let found = all.find((t) => t.user_id === userId && t.date === targetDate);
  if (!found) {
    const lastUserTask = all.find((t) => t.user_id === userId);
    if (lastUserTask) {
      found = {
        ...lastUserTask,
        id: generateUniqueId("dt"),
        date: targetDate,
        actual_collection_amount: 0,
        deposit_status: "pending",
      };
      await saveDailyTask(found);
    } else {
      found = {
        id: generateUniqueId("dt"),
        user_id: userId,
        date: targetDate,
        target_products: [
          { product_id: "cat-1", product_name: "Tepung Terigu Cakra Kembar Premium", target_qty: 20, sold_qty: 0 },
          { product_id: "cat-2", product_name: "Gula Pasir Kristal Industri", target_qty: 10, sold_qty: 0 },
        ],
        target_collection_amount: 5000000,
        actual_collection_amount: 0,
        deposit_status: "pending",
      };
      await saveDailyTask(found);
    }
  }
  return found;
}

export async function saveDailyTask(
  task: Partial<SalesDailyTask> & { user_id: string }
): Promise<SalesDailyTask> {
  const all = await getDailyTasks();
  const targetDate = task.date || new Date().toISOString().split("T")[0];
  const idx = all.findIndex((t) =>
    task.id ? t.id === task.id : t.user_id === task.user_id && t.date === targetDate
  );

  let savedTask: SalesDailyTask;
  if (idx >= 0) {
    savedTask = { ...all[idx], ...task, updated_at: new Date().toISOString() };
    all[idx] = savedTask;
  } else {
    savedTask = {
      id: task.id || generateUniqueId("dt"),
      date: targetDate,
      target_products: task.target_products || [],
      target_collection_amount: task.target_collection_amount || 5000000,
      actual_collection_amount: task.actual_collection_amount || 0,
      deposit_status: task.deposit_status || "pending",
      created_at: new Date().toISOString(),
      ...task,
      user_id: task.user_id,
    };
    all.unshift(savedTask);
  }
  setStored("sll_daily_tasks", all);
  return savedTask;
}

export async function submitDailyDeposit(
  userId: string,
  notes?: string
): Promise<{ success: boolean; task: SalesDailyTask | null }> {
  const task = await getDailyTaskByUserId(userId);
  if (!task) return { success: false, task: null };

  const visits = await getVisitLogs();
  const userVisitsToday = visits.filter((v) => v.user_id === userId && v.is_paid);
  const totalCollected = userVisitsToday.reduce((sum, v) => sum + (v.total_amount || 0), 0);

  const updated = await saveDailyTask({
    ...task,
    actual_collection_amount: totalCollected || task.actual_collection_amount || 0,
    deposit_status: "waiting_confirmation",
    deposit_notes: notes || "Setoran harian sales telah diajukan",
    deposit_submitted_at: new Date().toISOString(),
  });

  return { success: true, task: updated };
}

export async function confirmDailyDeposit(
  taskId: string,
  status: "approved" | "rejected"
): Promise<SalesDailyTask | null> {
  const all = await getDailyTasks();
  const idx = all.findIndex((t) => t.id === taskId);
  if (idx === -1) return null;

  const updated: SalesDailyTask = {
    ...all[idx],
    deposit_status: status,
    deposit_confirmed_at: new Date().toISOString(),
  };
  all[idx] = updated;
  setStored("sll_daily_tasks", all);
  return updated;
}

