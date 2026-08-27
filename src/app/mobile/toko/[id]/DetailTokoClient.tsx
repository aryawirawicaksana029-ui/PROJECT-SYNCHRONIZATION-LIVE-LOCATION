"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  getStores,
  updateStore,
  addVisitLog,
  getProducts,
  getUserProfile,
  uploadVisitPhoto,
} from "@/lib/db";
import { trackingService } from "@/lib/trackingService";
import { initialCatalogData, formatRupiah } from "@/lib/catalogData";
import type { ProductRow } from "@/lib/database.types";

// Selected Order Item Interface for multi-item cart
export interface SelectedOrderItem {
  catalog_id: string;
  sku: string;
  name: string;
  unit: string;
  price: number;
  qty: number;
  subtotal: number;
  image_url?: string;
}

// Mock fallback store data
const mockStoresData: Record<
  string,
  {
    id: string;
    store_name: string;
    phone_number: string;
    pic_name: string;
    pic_phone: string;
    full_address: string;
    verification_status: "verified" | "pending";
    current_status: "open" | "closed";
    latitude: number;
    longitude: number;
  }
> = {
  "1": {
    id: "1",
    store_name: "Toko Sembako Berkah Jaya (RS-001)",
    phone_number: "0812-3456-7890",
    pic_name: "Haji Ahmad Santoso",
    pic_phone: "0812-3456-7890",
    full_address: "Jl. Raya Bogor KM 28 No. 45, Ciracas, Jakarta Timur",
    verification_status: "verified",
    current_status: "open",
    latitude: -6.3245,
    longitude: 106.8712,
  },
  "2": {
    id: "2",
    store_name: "Warung Madura Sumber Rejeki (RS-002)",
    phone_number: "0857-1234-5678",
    pic_name: "Cak Mat",
    pic_phone: "0857-1234-5678",
    full_address: "Jl. Tebet Barat Dalam Raya No. 12, Tebet, Jakarta Selatan",
    verification_status: "verified",
    current_status: "open",
    latitude: -6.2389,
    longitude: 106.8523,
  },
};

// Helper: Format number into Indonesian Rupiah without Rp prefix
function formatRupiahNumber(val: string | number): string {
  const digits = val.toString().replace(/\D/g, "");
  if (!digits) return "";
  return new Intl.NumberFormat("id-ID").format(parseInt(digits, 10));
}

// Helper: Parse IDR text back to pure integer number
function parseRupiahRaw(formatted: string): number {
  const clean = formatted.replace(/\D/g, "");
  return clean ? parseInt(clean, 10) : 0;
}

export default function DetailTokoClient({ storeId }: { storeId: string }) {
  const router = useRouter();

  // Get Store detail state
  const [store, setStore] = useState<{
    id: string;
    store_name: string;
    phone_number: string;
    pic_name: string;
    pic_phone: string;
    full_address: string;
    verification_status: "verified" | "pending";
    current_status: "open" | "closed";
    latitude: number;
    longitude: number;
  }>(() => {
    return (
      mockStoresData[storeId] || {
        id: storeId,
        store_name: "Detail Toko Mitra",
        phone_number: "-",
        pic_name: "-",
        pic_phone: "-",
        full_address: "-",
        verification_status: "verified",
        current_status: "open",
        latitude: -6.2088,
        longitude: 106.8456,
      }
    );
  });

  // Fetch fresh store from persistent DB
  useEffect(() => {
    getStores().then((all) => {
      const found = all.find((s) => s.id === storeId);
      if (found) {
        setStore({
          id: found.id,
          store_name: found.kode_toko ? `${found.name} (${found.kode_toko})` : found.name,
          phone_number: found.phone || "-",
          pic_name: found.pic_name || "-",
          pic_phone: found.pic_phone || found.phone || "-",
          full_address: found.address || "-",
          verification_status: found.verification_status,
          current_status: found.current_status,
          latitude: found.latitude,
          longitude: found.longitude,
        });
        setOperationalStatus(found.current_status);
      }
    });
  }, [storeId]);

  // 1. Shareloc Live Tracking State
  const [isTrackingActive, setIsTrackingActive] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [trackingTimer, setTrackingTimer] = useState(0);

  // 2. Operasional Status State (Buka / Tutup)
  const [operationalStatus, setOperationalStatus] = useState<"open" | "closed">(
    store.current_status
  );

  // 3. Order Status State (Order / Tidak Order)
  const [orderStatus, setOrderStatus] = useState<"order" | "no_order">("order");

  // FITUR KATALOG ORDER: State untuk item order bahan baku dari database
  const [catalogProducts, setCatalogProducts] = useState<ProductRow[]>([]);
  const [catalogSearch, setCatalogSearch] = useState<string>("");
  const [orderCart, setOrderCart] = useState<SelectedOrderItem[]>([]);

  // Previous Store Debt State (Sisa Piutang Kunjungan Sebelumnya)
  const [previousDebt] = useState<number>(1500000); // Rp 1.500.000 outstanding previous balance
  const [prevPaymentStatus, setPrevPaymentStatus] = useState<"paid" | "unpaid">("paid");
  const [prevPaymentAmountFormatted, setPrevPaymentAmountFormatted] = useState("1.500.000");

  // Additional Fields
  const [notes, setNotes] = useState("");

  // Foto Bukti Kunjungan State
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const [validationError, setValidationError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedVisitData, setSubmittedVisitData] = useState<Record<string, any> | null>(null);

  // Fetch live products from database catalog on mount
  useEffect(() => {
    getProducts().then((products) => {
      setCatalogProducts(products);
      if (products.length > 0) {
        // Pre-populate with first product
        setOrderCart([
          {
            catalog_id: products[0].id,
            sku: products[0].sku,
            name: products[0].name,
            unit: products[0].unit,
            price: products[0].price,
            qty: 1,
            subtotal: products[0].price * 1,
            image_url: products[0].image_url,
          },
        ]);
      }
    });
  }, []);

  // Calculate total price of new order cart items (Automatic Tagihan Baru)
  const totalCartPrice = orderCart.reduce((sum, item) => sum + item.subtotal, 0);

  // Previous payment amount numeric
  const prevPaymentNumeric = prevPaymentStatus === "paid" ? parseRupiahRaw(prevPaymentAmountFormatted) : 0;

  // Total collected money in this visit
  const totalCollectionAmount = (orderStatus === "order" ? totalCartPrice : 0) + prevPaymentNumeric;

  // Timer effect for Shareloc Live active session
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTrackingActive) {
      interval = setInterval(() => {
        setTrackingTimer((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTrackingActive]);

  // Cleanup photo object URL on unmount
  useEffect(() => {
    return () => {
      if (photoPreview) {
        URL.revokeObjectURL(photoPreview);
      }
    };
  }, [photoPreview]);

  // Format seconds to HH:MM:SS
  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, "0")}:${mins
      .toString()
      .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Subscribe to Tracking Service state changes
  useEffect(() => {
    const unsubscribe = trackingService.subscribe((state) => {
      setIsTrackingActive(state.isActive);
      if (state.sessionId) setSessionId(state.sessionId);
      if (state.startTime) {
        setTrackingTimer(Math.floor((Date.now() - state.startTime) / 1000));
      }
    });
    return () => unsubscribe();
  }, []);

  // Toggle Shareloc Live Session
  const handleToggleTracking = async () => {
    if (!isTrackingActive) {
      const res = await trackingService.startLiveTracking(store.id);
      setSessionId(res.sessionId);
      setIsTrackingActive(true);
      setTrackingTimer(0);
    } else {
      trackingService.stopLiveTracking();
      setIsTrackingActive(false);
    }
  };

  // Add or increment item in Order Cart directly from Visual Card
  const handleAddOrIncrementItem = (product: ProductRow) => {
    const availableStock = product.stock_qty !== undefined ? product.stock_qty : 50;
    if (availableStock <= 0 || product.stock_status === "out_of_stock") {
      setValidationError(`Produk "${product.name}" sedang habis stok.`);
      return;
    }

    const existingIndex = orderCart.findIndex((i) => i.catalog_id === product.id);
    const currentQty = existingIndex >= 0 ? orderCart[existingIndex].qty : 0;

    if (currentQty + 1 > availableStock) {
      setValidationError(`Jumlah total (${currentQty + 1}) melebihi sisa stok (${availableStock}).`);
      return;
    }

    if (existingIndex >= 0) {
      const updated = [...orderCart];
      const newQty = updated[existingIndex].qty + 1;
      updated[existingIndex] = {
        ...updated[existingIndex],
        qty: newQty,
        subtotal: product.price * newQty,
      };
      setOrderCart(updated);
    } else {
      const newItem: SelectedOrderItem = {
        catalog_id: product.id,
        sku: product.sku,
        name: product.name,
        unit: product.unit,
        price: product.price,
        qty: 1,
        subtotal: product.price * 1,
        image_url: product.image_url,
      };
      setOrderCart((prev) => [...prev, newItem]);
    }
    if (validationError) setValidationError(null);
  };

  // Decrement item quantity in Cart
  const handleDecrementItem = (catalogId: string) => {
    setOrderCart((prev) =>
      prev
        .map((item) => {
          if (item.catalog_id === catalogId) {
            const newQty = item.qty - 1;
            if (newQty <= 0) return null;
            return {
              ...item,
              qty: newQty,
              subtotal: item.price * newQty,
            };
          }
          return item;
        })
        .filter(Boolean) as SelectedOrderItem[]
    );
  };

  // Remove Cart Item
  const handleRemoveCartItem = (catalogId: string) => {
    setOrderCart((prev) => prev.filter((item) => item.catalog_id !== catalogId));
  };

  // Handle Previous Bill Payment Amount Change
  const handlePrevPaymentAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value.replace(/\D/g, "");
    if (rawVal === "") {
      setPrevPaymentAmountFormatted("");
    } else {
      setPrevPaymentAmountFormatted(formatRupiahNumber(rawVal));
    }
    if (validationError) setValidationError(null);
  };

  // Quick addition preset for previous debt payment
  const addPrevPresetAmount = (amount: number) => {
    const currentNum = parseRupiahRaw(prevPaymentAmountFormatted);
    const newNum = currentNum + amount;
    setPrevPaymentAmountFormatted(formatRupiahNumber(newNum));
    if (validationError) setValidationError(null);
  };

  // Handle Photo File Selection
  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (photoPreview) {
        URL.revokeObjectURL(photoPreview);
      }
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
      if (validationError) setValidationError(null);
    }
  };

  // Handle Remove Photo
  const handleRemovePhoto = () => {
    if (photoPreview) {
      URL.revokeObjectURL(photoPreview);
    }
    setPhotoFile(null);
    setPhotoPreview(null);
  };

  // Form Submit Handler
  const handleSubmitVisit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (orderStatus === "order" && orderCart.length === 0) {
      setValidationError(
        "Anda memilih status 'Ada Order', mohon pilih minimal 1 item bahan baku dari katalog."
      );
      return;
    }

    if (prevPaymentStatus === "paid") {
      const numericAmount = parseRupiahRaw(prevPaymentAmountFormatted);
      if (numericAmount <= 0) {
        setValidationError(
          "Nominal pelunasan tagihan sebelumnya wajib diisi jika opsi 'Bayar Tagihan Sebelumnya' dipilih."
        );
        return;
      }
    }

    setIsSubmitting(true);

    try {
      let uploadedPhoto = { url: photoPreview, key: null as string | null };
      if (photoFile) {
        uploadedPhoto = await uploadVisitPhoto(photoFile);
      }

      const orderItemsToInsert =
        orderStatus === "order"
          ? orderCart.map((item) => ({
              product_id: item.catalog_id,
              product_name: item.name,
              sku: item.sku,
              unit: item.unit,
              quantity: item.qty,
              unit_price: item.price,
              subtotal: item.subtotal,
            }))
          : [];

      const currentUser = await getUserProfile();
      await addVisitLog(
        {
          user_id: currentUser?.id || "u-2",
          store_id: store.id,
          store_name: store.store_name,
          is_open: operationalStatus === "open",
          is_ordered: orderStatus === "order",
          is_paid: totalCollectionAmount > 0,
          total_amount: totalCollectionAmount,
          prev_bill_collected: prevPaymentNumeric,
          new_order_amount: orderStatus === "order" ? totalCartPrice : 0,
          notes: notes.trim() || "-",
          photo_url: uploadedPhoto.url || undefined,
          photo_key: uploadedPhoto.key || undefined,
          is_live_tracking: isTrackingActive,
          session_id: sessionId || undefined,
          check_in_time: new Date().toISOString(),
        },
        orderItemsToInsert
      );

      // Auto update store status in persistent database
      await updateStore(store.id, {
        current_status: operationalStatus,
        is_tracking_active: isTrackingActive,
        last_ping_at: new Date().toLocaleTimeString("id-ID", {
          hour: "2-digit",
          minute: "2-digit",
        }),
      });

      // Prepare confirmation payload
      const confirmationData = {
        store_name: store.store_name,
        visit_date: new Date().toLocaleDateString("id-ID", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        }),
        visit_time: new Date().toLocaleTimeString("id-ID", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        operational_status: operationalStatus,
        order_status: orderStatus,
        total_order_amount: totalCartPrice,
        order_items: orderCart,
        prev_payment_status: prevPaymentStatus,
        prev_payment_amount: prevPaymentNumeric,
        total_collection_amount: totalCollectionAmount,
        notes: notes.trim() || "-",
        has_photo: !!photoPreview,
        photo_preview: photoPreview,
      };

      setSubmittedVisitData(confirmationData);
    } catch {
      setValidationError("Gagal menyimpan aktivitas kunjungan. Silakan coba kembali.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const displayProducts = (catalogProducts.length > 0 ? catalogProducts : initialCatalogData).filter(
    (p) =>
      p.name.toLowerCase().includes(catalogSearch.toLowerCase()) ||
      p.sku.toLowerCase().includes(catalogSearch.toLowerCase())
  );

  return (
    <div className="space-y-4 pb-12 animate-fade-in max-w-lg mx-auto">
      {/* Top Header Navigation */}
      <div className="flex items-center justify-between">
        <Link
          href="/mobile/toko"
          className="flex items-center gap-1.5 text-xs font-bold text-navy-700 hover:text-navy-900"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="h-4 w-4"
          >
            <path
              fillRule="evenodd"
              d="M17 10a.75.75 0 01-.75.75H5.612l4.158 3.96a.75.75 0 11-1.04 1.08l-5.5-5.25a.75.75 0 010-1.08l5.5-5.25a.75.75 0 111.04 1.08L5.612 9.25H16.25A.75.75 0 0117 10z"
              clipRule="evenodd"
            />
          </svg>
          <span>Daftar Toko</span>
        </Link>
        <span className="rounded-full bg-navy-100 px-2.5 py-0.5 text-[10px] font-bold text-navy-700">
          Form Kunjungan Sales
        </span>
      </div>

      {/* Store Information Card */}
      <div className="rounded-2xl border border-navy-100 bg-white p-4 shadow-sm space-y-2.5">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h1 className="text-base font-bold text-navy-900 leading-snug">
              {store.store_name}
            </h1>
            <p className="text-xs text-navy-600 font-medium mt-0.5">
              PIC: {store.pic_name} ({store.phone_number})
            </p>
          </div>
          <span
            className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold border ${
              operationalStatus === "open"
                ? "bg-accent-50 text-accent-700 border-accent-200"
                : "bg-navy-100 text-navy-600 border-navy-200"
            }`}
          >
            {operationalStatus === "open" ? "🟢 Buka" : "🔴 Tutup"}
          </span>
        </div>
        <p className="text-xs text-foreground-muted">📍 {store.full_address}</p>
      </div>

      {/* LIVE TRACKING BAR */}
      <div
        className={`rounded-2xl border p-4 shadow-sm transition-all ${
          isTrackingActive
            ? "border-primary-300 bg-gradient-to-r from-primary-50 to-blue-50"
            : "border-navy-100 bg-white"
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div
              className={`flex h-9 w-9 items-center justify-center rounded-xl transition-all ${
                isTrackingActive
                  ? "bg-primary-600 text-white shadow-md shadow-primary-600/30"
                  : "bg-navy-100 text-navy-600"
              }`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="h-5 w-5"
              >
                <path
                  fillRule="evenodd"
                  d="m11.54 22.351.07.04.028.016a.76.76 0 0 0 .723 0l.028-.015.071-.041a16.975 16.975 0 0 0 1.144-.742 19.58 19.58 0 0 0 2.683-2.282c1.944-1.99 3.963-4.98 3.963-8.827a8.25 8.25 0 0 0-16.5 0c0 3.846 2.02 6.837 3.963 8.827a19.58 19.58 0 0 0 3.824 3.024Zm.46-12.6a2.25 2.25 0 1 0 0-4.5 2.25 2.25 0 0 0 0 4.5Z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div>
              <p className="text-xs font-bold text-navy-900">
                {isTrackingActive ? "Shareloc Live Aktif" : "Shareloc Live"}
              </p>
              <p className="text-[10px] text-foreground-muted">
                {isTrackingActive
                  ? `Durasi: ${formatTime(trackingTimer)} (Interval 5 menit)`
                  : "Aktifkan GPS tracking selama berada di toko"}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleToggleTracking}
            className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all shadow-sm active:scale-95 ${
              isTrackingActive
                ? "bg-danger-500 text-white hover:bg-danger-600"
                : "bg-primary-600 text-white hover:bg-primary-700"
            }`}
          >
            {isTrackingActive ? "Hentikan Live" : "Mulai Live"}
          </button>
        </div>
      </div>

      {/* Validation Error Alert */}
      {validationError && (
        <div className="rounded-xl border border-danger-200 bg-danger-50 p-3 text-xs font-bold text-danger-700 animate-slide-up flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span>⚠️</span>
            <span>{validationError}</span>
          </div>
          <button
            type="button"
            onClick={() => setValidationError(null)}
            className="text-danger-500 hover:text-danger-700"
          >
            ✕
          </button>
        </div>
      )}

      {/* VISIT FORM */}
      <form onSubmit={handleSubmitVisit} className="space-y-4">
        {/* 1. Status Operasional Toko (Buka / Tutup) */}
        <div className="rounded-2xl border border-navy-100 bg-white p-4 shadow-sm space-y-3">
          <label className="block text-xs font-bold text-navy-900">
            1. Status Operasional Toko <span className="text-danger-500">*</span>
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setOperationalStatus("open")}
              className={`flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold transition-all border ${
                operationalStatus === "open"
                  ? "bg-accent-600 text-white border-accent-600 shadow-md shadow-accent-600/20"
                  : "bg-surface text-navy-600 border-navy-200 hover:bg-navy-50"
              }`}
            >
              <span>🟢 Toko Buka</span>
            </button>

            <button
              type="button"
              onClick={() => setOperationalStatus("closed")}
              className={`flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold transition-all border ${
                operationalStatus === "closed"
                  ? "bg-danger-600 text-white border-danger-600 shadow-md shadow-danger-600/20"
                  : "bg-surface text-navy-600 border-navy-200 hover:bg-navy-50"
              }`}
            >
              <span>🔴 Toko Tutup</span>
            </button>
          </div>
        </div>

        {/* 2. Aktivitas Penjualan & Visual Product Catalog (Ada Order / Tidak Order) */}
        <div className="rounded-2xl border border-navy-100 bg-white p-4 shadow-sm space-y-3">
          <label className="block text-xs font-bold text-navy-900">
            2. Aktivitas Penjualan Bahan Baku <span className="text-danger-500">*</span>
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setOrderStatus("order")}
              className={`flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold transition-all border ${
                orderStatus === "order"
                  ? "bg-primary-600 text-white border-primary-600 shadow-md shadow-primary-600/20"
                  : "bg-surface text-navy-600 border-navy-200 hover:bg-navy-50"
              }`}
            >
              <span>🛍️ Ada Order</span>
            </button>

            <button
              type="button"
              onClick={() => setOrderStatus("no_order")}
              className={`flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold transition-all border ${
                orderStatus === "no_order"
                  ? "bg-navy-700 text-white border-navy-700 shadow-md shadow-navy-700/20"
                  : "bg-surface text-navy-600 border-navy-200 hover:bg-navy-50"
              }`}
            >
              <span>🚫 Tidak Order</span>
            </button>
          </div>

          {/* VISUAL LARGE CARD KATALOG PRODUK */}
          {orderStatus === "order" && (
            <div className="pt-3 border-t border-navy-100 space-y-3 animate-slide-up">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-navy-950">
                    Katalog Bahan Baku Perusahaan
                  </h3>
                  <p className="text-[10px] text-foreground-muted">
                    Pilih produk untuk ditunjukkan langsung ke pelanggan
                  </p>
                </div>
                <span className="rounded-full bg-primary-50 px-2 py-0.5 text-[10px] font-bold text-primary-700 border border-primary-200">
                  {orderCart.length} Item Dipilih
                </span>
              </div>

              {/* Search filter in catalog */}
              <input
                type="text"
                value={catalogSearch}
                onChange={(e) => setCatalogSearch(e.target.value)}
                placeholder="🔍 Cari nama produk / SKU..."
                className="w-full rounded-xl border border-navy-200 bg-surface-dim px-3 py-2 text-xs text-navy-900 outline-none focus:border-primary-500"
              />

              {/* Large Visual Cards Grid */}
              <div className="grid grid-cols-2 gap-2.5 max-h-[380px] overflow-y-auto pr-1">
                {displayProducts.map((item) => {
                  const availableStock = item.stock_qty !== undefined ? item.stock_qty : 50;
                  const isOutOfStock = availableStock <= 0 || item.stock_status === "out_of_stock";
                  const inCartItem = orderCart.find((c) => c.catalog_id === item.id);
                  const isSelected = !!inCartItem;

                  return (
                    <div
                      key={item.id}
                      className={`relative flex flex-col justify-between rounded-2xl border bg-white p-2.5 shadow-sm transition-all ${
                        isSelected
                          ? "border-primary-500 ring-2 ring-primary-500/20 bg-primary-50/10"
                          : "border-navy-100 hover:border-primary-300"
                      } ${isOutOfStock ? "opacity-60 bg-navy-50/60" : ""}`}
                    >
                      {/* Product Thumbnail Image */}
                      <div className="relative h-24 w-full overflow-hidden rounded-xl bg-navy-100 mb-2">
                        {item.image_url ? (
                          <img
                            src={item.image_url}
                            alt={item.name}
                            className="h-full w-full object-cover transition-transform hover:scale-105"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-navy-400 text-xs font-bold">
                            📦 Foto Produk
                          </div>
                        )}

                        {/* Stock Badge Overlay */}
                        <div className="absolute top-1.5 left-1.5">
                          {isOutOfStock ? (
                            <span className="rounded bg-danger-600/90 text-white px-1.5 py-0.5 text-[9px] font-bold shadow">
                              Habis
                            </span>
                          ) : availableStock <= 15 ? (
                            <span className="rounded bg-amber-500/90 text-white px-1.5 py-0.5 text-[9px] font-bold shadow">
                              Sisa {availableStock}
                            </span>
                          ) : (
                            <span className="rounded bg-emerald-600/90 text-white px-1.5 py-0.5 text-[9px] font-bold shadow">
                              Stok {availableStock}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Product Info */}
                      <div className="space-y-0.5 flex-1 min-h-[52px]">
                        <p className="font-bold text-navy-900 text-xs leading-snug line-clamp-2">
                          {item.name}
                        </p>
                        <p className="text-[10px] text-foreground-muted">
                          {item.sku} • {item.unit}
                        </p>
                      </div>

                      {/* Price & Action */}
                      <div className="mt-2 pt-1.5 border-t border-navy-100 flex items-center justify-between gap-1">
                        <span className="font-mono font-extrabold text-xs text-accent-700">
                          {formatRupiah(item.price)}
                        </span>

                        {isOutOfStock ? (
                          <span className="text-[9px] font-bold text-danger-600">
                            Kosong
                          </span>
                        ) : isSelected ? (
                          <div className="flex items-center rounded-lg border border-primary-200 bg-white">
                            <button
                              type="button"
                              onClick={() => handleDecrementItem(item.id)}
                              className="px-1.5 py-0.5 font-bold text-primary-700 hover:bg-primary-50 text-xs"
                            >
                              -
                            </button>
                            <span className="px-1 font-mono font-bold text-navy-950 text-xs">
                              {inCartItem.qty}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleAddOrIncrementItem(item)}
                              className="px-1.5 py-0.5 font-bold text-primary-700 hover:bg-primary-50 text-xs"
                            >
                              +
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleAddOrIncrementItem(item)}
                            className="rounded-lg bg-primary-600 px-2 py-1 text-[10px] font-bold text-white shadow-sm hover:bg-primary-700 active:scale-95"
                          >
                            + Order
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Added Order Cart Summary */}
              <div className="space-y-2 pt-1">
                <span className="block text-[11px] font-bold text-navy-900">
                  Daftar Item Terpilih ({orderCart.length} Jenis)
                </span>

                {orderCart.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-navy-200 p-4 text-center text-xs text-navy-400">
                    Belum ada bahan baku yang dipilih dari katalog di atas.
                  </div>
                ) : (
                  orderCart.map((cartItem) => (
                    <div
                      key={cartItem.catalog_id}
                      className="flex items-center justify-between rounded-xl border border-navy-100 bg-white p-2.5 text-xs shadow-sm"
                    >
                      <div className="flex-1 min-w-0 pr-2">
                        <p className="font-bold text-navy-900 truncate">
                          {cartItem.name}
                        </p>
                        <p className="text-[10px] text-foreground-muted">
                          {cartItem.qty} x {formatRupiah(cartItem.price)} ({cartItem.unit})
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="font-mono font-bold text-accent-700">
                          {formatRupiah(cartItem.subtotal)}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveCartItem(cartItem.catalog_id)}
                          className="text-danger-500 hover:text-danger-700 p-1"
                          title="Hapus"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Auto Total Order Price Indicator */}
              {orderCart.length > 0 && (
                <div className="flex items-center justify-between rounded-xl bg-accent-50 border border-accent-200 px-3.5 py-2.5 text-xs">
                  <span className="font-semibold text-accent-800">
                    Tagihan Baru Order Hari Ini:
                  </span>
                  <span className="font-mono font-extrabold text-sm text-accent-700">
                    {formatRupiah(totalCartPrice)}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 3. REFACTORED: Tagihan Kunjungan Sebelumnya */}
        <div className="rounded-2xl border border-navy-100 bg-white p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-bold text-navy-900">
              3. Tagihan Kunjungan Sebelumnya <span className="text-danger-500">*</span>
            </label>
            <span className="text-[10px] text-foreground-muted">
              Piutang Lama Mitra
            </span>
          </div>

          {/* Sisa Piutang Info Card */}
          <div className="rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 p-3 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-semibold text-amber-800 uppercase tracking-wider block">
                Sisa Piutang / Tagihan Toko Sebelumnya
              </span>
              <span className="font-mono text-sm font-bold text-amber-950">
                {formatRupiah(previousDebt)}
              </span>
            </div>
            <span className="text-[10px] text-amber-800 bg-white px-2 py-1 rounded-lg border border-amber-300 font-bold shadow-xs">
              ⏳ Belum Lunas
            </span>
          </div>

          {/* Toggle Bayar / Belum Bayar Tagihan Sebelumnya */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                setPrevPaymentStatus("paid");
                if (validationError) setValidationError(null);
              }}
              className={`flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold transition-all border ${
                prevPaymentStatus === "paid"
                  ? "bg-accent-600 text-white border-accent-600 shadow-md shadow-accent-600/20"
                  : "bg-surface text-navy-600 border-navy-200 hover:bg-navy-50"
              }`}
            >
              <span>💵 Bayar Tagihan Sebelumnya</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setPrevPaymentStatus("unpaid");
                if (validationError) setValidationError(null);
              }}
              className={`flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold transition-all border ${
                prevPaymentStatus === "unpaid"
                  ? "bg-navy-700 text-white border-navy-700 shadow-md shadow-navy-700/20"
                  : "bg-surface text-navy-600 border-navy-200 hover:bg-navy-50"
              }`}
            >
              <span>❌ Belum Bayar Tagihan Sebelumnya</span>
            </button>
          </div>

          {/* Conditional Input Pelunasan Tagihan Sebelumnya */}
          {prevPaymentStatus === "paid" && (
            <div className="pt-2 border-t border-navy-100 space-y-2 animate-slide-up">
              <label className="block text-xs font-semibold text-navy-900">
                Nominal Pelunasan Tagihan Sebelumnya <span className="text-danger-500">*</span>
              </label>

              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                  <span className="text-sm font-bold text-navy-700">Rp</span>
                </div>
                <input
                  type="text"
                  inputMode="numeric"
                  value={prevPaymentAmountFormatted}
                  onChange={handlePrevPaymentAmountChange}
                  placeholder="0"
                  className="w-full rounded-xl border border-navy-200 bg-surface py-3 pl-10 pr-4 font-mono text-base font-bold text-navy-900 outline-none transition-all focus:border-accent-500 focus:ring-2 focus:ring-accent-500/20"
                />
              </div>

              {/* Quick Add Presets */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                <span className="text-[10px] font-medium text-navy-500 self-center mr-1">
                  Preset:
                </span>
                <button
                  type="button"
                  onClick={() => setPrevPaymentAmountFormatted("1.500.000")}
                  className="rounded-lg bg-accent-50 border border-accent-200 px-2 py-1 text-[10px] font-bold text-accent-800 hover:bg-accent-100 active:scale-95"
                >
                  Lunas Penuh (1.5 Jt)
                </button>
                {[100000, 500000, 1000000].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => addPrevPresetAmount(preset)}
                    className="rounded-lg bg-navy-50 border border-navy-200 px-2 py-1 text-[10px] font-bold text-navy-700 hover:bg-navy-100 active:scale-95"
                  >
                    + {formatRupiahNumber(preset)}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setPrevPaymentAmountFormatted("")}
                  className="rounded-lg bg-danger-50 border border-danger-200 px-2 py-1 text-[10px] font-bold text-danger-700 hover:bg-danger-100 active:scale-95 ml-auto"
                >
                  Reset
                </button>
              </div>
            </div>
          )}

          {/* Breakdown Ringkasan Tagihan & Setoran */}
          <div className="rounded-xl border border-navy-100 bg-surface-dim p-3 space-y-1.5 text-xs">
            <div className="flex justify-between text-navy-600">
              <span>Tagihan Baru (Order Hari Ini):</span>
              <span className="font-mono font-bold text-navy-900">
                {formatRupiah(orderStatus === "order" ? totalCartPrice : 0)}
              </span>
            </div>
            <div className="flex justify-between text-navy-600">
              <span>Pelunasan Tagihan Sebelumnya:</span>
              <span className="font-mono font-bold text-accent-700">
                {formatRupiah(prevPaymentNumeric)}
              </span>
            </div>
            <div className="flex justify-between pt-2 border-t border-navy-200 text-xs font-bold text-navy-950">
              <span>Total Uang Diterima / Disetor:</span>
              <span className="font-mono text-sm text-accent-700 font-extrabold">
                {formatRupiah(totalCollectionAmount)}
              </span>
            </div>
          </div>
        </div>

        {/* Catatan Kunjungan */}
        <div className="rounded-2xl border border-navy-100 bg-white p-4 shadow-sm space-y-1.5">
          <label className="block text-xs font-bold text-navy-900">
            Catatan Kunjungan <span className="text-navy-400 font-normal">(Opsional)</span>
          </label>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Tulis catatan hasil kunjungan toko atau perjanjian tempo..."
            className="w-full rounded-xl border border-navy-200 bg-surface px-3.5 py-2.5 text-xs text-navy-900 outline-none transition-all focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
          />
        </div>

        {/* Bukti Foto Kunjungan Toko */}
        <div className="rounded-2xl border border-navy-100 bg-white p-4 shadow-sm space-y-2.5">
          <label className="block text-xs font-bold text-navy-900">
            Foto Bukti Kunjungan (Depan Toko / Selfie) <span className="text-navy-400 font-normal">(Opsional)</span>
          </label>

          {photoPreview ? (
            <div className="relative overflow-hidden rounded-xl border border-navy-200 bg-navy-900/5 p-2 animate-fade-in">
              <div className="relative h-48 w-full overflow-hidden rounded-lg bg-black">
                <img
                  src={photoPreview}
                  alt="Bukti Kunjungan"
                  className="h-full w-full object-cover"
                />
                <span className="absolute top-2 left-2 rounded-md bg-accent-600/90 backdrop-blur-sm px-2 py-1 text-[10px] font-bold text-white shadow">
                  📷 Foto Terambil
                </span>
              </div>

              <div className="mt-2 flex items-center justify-between gap-2">
                <span className="text-[11px] text-navy-600 font-medium truncate">
                  {photoFile ? photoFile.name : "bukti_kunjungan.jpg"}
                </span>

                <button
                  type="button"
                  onClick={handleRemovePhoto}
                  className="flex items-center gap-1 rounded-lg bg-danger-500/10 border border-danger-500/30 px-2.5 py-1 text-xs font-semibold text-danger-600 hover:bg-danger-500/20 active:scale-95 transition-all"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className="h-3.5 w-3.5"
                  >
                    <path
                      fillRule="evenodd"
                      d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 01.75.75v6a.75.75 0 01-1.5 0v-6a.75.75 0 01.75-.75zm3.34 0a.75.75 0 01.75.75v6a.75.75 0 01-1.5 0v-6a.75.75 0 01.75-.75z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span>Hapus / Ambil Ulang</span>
                </button>
              </div>
            </div>
          ) : (
            <label
              htmlFor="visit-photo-input"
              className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-navy-200 bg-surface-dim p-4 text-center cursor-pointer transition-all hover:bg-navy-50 hover:border-primary-400 active:scale-[0.99]"
            >
              <input
                id="visit-photo-input"
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handlePhotoChange}
                className="hidden"
              />
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-50 text-primary-600 mb-1.5">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="h-5 w-5"
                >
                  <path
                    fillRule="evenodd"
                    d="M1.5 6a2.25 2.25 0 012.25-2.25h16.5A2.25 2.25 0 0122.5 6v12a2.25 2.25 0 01-2.25 2.25H3.75A2.25 2.25 0 011.5 18V6zM3 16.06V18c0 .414.336.75.75.75h16.5A.75.75 0 0021 18v-1.94l-2.69-2.689a1.5 1.5 0 00-2.12 0l-.88.879.97.97a.75.75 0 11-1.06 1.06l-5.16-5.159a1.5 1.5 0 00-2.12 0L3 16.061zm10.125-7.81a1.125 1.125 0 112.25 0 1.125 1.125 0 01-2.25 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <p className="text-xs font-bold text-navy-900">
                Ambil Foto Kamera / Unggah Bukti
              </p>
              <p className="text-[10px] text-foreground-muted mt-0.5">
                Ketuk untuk membuka kamera HP atau pilih gambar dari galeri
              </p>
            </label>
          )}
        </div>

        {/* Submit Aktivitas Kunjungan Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-accent-600 to-accent-700 py-3.5 text-sm font-bold text-white shadow-lg shadow-accent-600/30 transition-all hover:from-accent-700 hover:to-accent-800 active:scale-[0.98] disabled:opacity-70"
        >
          {isSubmitting ? (
            <>
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              <span>Menyimpan Aktivitas...</span>
            </>
          ) : (
            <>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="h-5 w-5"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
                  clipRule="evenodd"
                />
              </svg>
              <span>Submit Aktivitas Kunjungan</span>
            </>
          )}
        </button>
      </form>

      {/* Modal Confirmation after Submit */}
      {submittedVisitData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in overflow-y-auto">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl space-y-4 my-8 animate-slide-up">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-accent-100 text-accent-600">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="h-8 w-8"
              >
                <path
                  fillRule="evenodd"
                  d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25Z"
                  clipRule="evenodd"
                />
              </svg>
            </div>

            <div className="text-center space-y-1">
              <h2 className="text-lg font-bold text-navy-900">
                Aktivitas Berhasil Dicatat!
              </h2>
              <p className="text-xs text-foreground-muted">
                Laporan kunjungan & order bahan baku telah tersimpan ke sistem.
              </p>
            </div>

            {/* Visit Summary Table */}
            <div className="rounded-xl bg-surface-dim p-3.5 space-y-2 text-xs text-navy-900 border border-navy-100">
              <div className="flex justify-between">
                <span className="text-navy-500 font-medium">Toko:</span>
                <span className="font-bold">{submittedVisitData.store_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-navy-500 font-medium">Waktu:</span>
                <span className="font-semibold">
                  {submittedVisitData.visit_date} • {submittedVisitData.visit_time}
                </span>
              </div>

              {/* Order Items Breakdown */}
              {submittedVisitData.order_status === "order" && (
                <div className="pt-2 border-t border-navy-200/60 space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-primary-700">Tagihan Order Baru:</span>
                    <span className="font-mono text-accent-700 font-bold">
                      {formatRupiah(submittedVisitData.total_order_amount)}
                    </span>
                  </div>
                  <div className="space-y-1 bg-white p-2 rounded border border-navy-200 text-[10px]">
                    {submittedVisitData.order_items.map((i: SelectedOrderItem) => (
                      <div key={i.catalog_id} className="flex justify-between text-navy-800">
                        <span>• {i.name} (x{i.qty})</span>
                        <span className="font-mono font-semibold">{formatRupiah(i.subtotal)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Previous Bill Payment */}
              {submittedVisitData.prev_payment_amount > 0 && (
                <div className="flex justify-between items-center pt-1 border-t border-navy-200/60">
                  <span className="text-navy-600 font-medium">Pelunasan Tagihan Sebelumnya:</span>
                  <span className="font-mono font-bold text-accent-700">
                    {formatRupiah(submittedVisitData.prev_payment_amount)}
                  </span>
                </div>
              )}

              {/* Total Collected */}
              <div className="flex justify-between items-center pt-1.5 border-t border-navy-200 text-xs font-bold">
                <span className="text-navy-900">Total Uang Diterima:</span>
                <span className="font-mono font-black text-accent-700 text-sm">
                  {formatRupiah(submittedVisitData.total_collection_amount)}
                </span>
              </div>

              {submittedVisitData.has_photo && submittedVisitData.photo_preview && (
                <div className="pt-2 border-t border-navy-200/60 space-y-1">
                  <span className="text-navy-500 font-medium text-[11px]">Foto Bukti Kunjungan:</span>
                  <div className="h-28 w-full overflow-hidden rounded-lg bg-black">
                    <img
                      src={submittedVisitData.photo_preview}
                      alt="Preview Bukti"
                      className="h-full w-full object-cover"
                    />
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={() => {
                setSubmittedVisitData(null);
                router.push("/mobile/toko");
              }}
              className="w-full rounded-xl bg-navy-900 py-3 text-xs font-bold text-white transition-all hover:bg-navy-800 active:scale-95 shadow-md"
            >
              Selesai & Kembali ke Daftar Toko
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
