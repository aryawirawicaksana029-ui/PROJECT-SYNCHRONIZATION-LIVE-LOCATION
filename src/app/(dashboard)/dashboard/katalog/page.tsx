"use client";

import { useState, useEffect } from "react";
import { formatRupiah } from "@/lib/catalogData";
import { getProducts, addProduct, updateProduct, deleteProduct, uploadVisitPhoto } from "@/lib/db";
import { ProductRow } from "@/lib/database.types";

export default function ManajemenKatalogPage() {
  const [catalog, setCatalog] = useState<ProductRow[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [stockFilter, setStockFilter] = useState<
    "all" | "ready" | "limited" | "out_of_stock"
  >("all");
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");

  // Fetch Products on Mount
  useEffect(() => {
    getProducts().then((data) => setCatalog(data));
  }, []);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ProductRow | null>(null);

  // Form State
  const [sku, setSku] = useState("");
  const [name, setName] = useState("");
  const [unit, setUnit] = useState("Sak (25kg)");
  const [price, setPrice] = useState("");
  const [stockQty, setStockQty] = useState("50");
  const [stockStatus, setStockStatus] = useState<
    "ready" | "limited" | "out_of_stock"
  >("ready");
  const [imageUrl, setImageUrl] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Filtered Items
  const filteredItems = catalog.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStock =
      stockFilter === "all" || item.stock_status === stockFilter;

    return matchesSearch && matchesStock;
  });

  // Open Modal for Create or Edit
  const handleOpenModal = (item?: ProductRow) => {
    setErrors({});
    if (item) {
      setEditingItem(item);
      setSku(item.sku);
      setName(item.name);
      setUnit(item.unit);
      setPrice(item.price.toString());
      setStockQty(item.stock_qty !== undefined ? item.stock_qty.toString() : "50");
      setStockStatus(item.stock_status);
      setImageUrl(item.image_url || "");
      setImagePreview(item.image_url || null);
    } else {
      setEditingItem(null);
      setSku("SKU-" + Math.floor(100 + Math.random() * 900));
      setName("");
      setUnit("Sak (25kg)");
      setPrice("");
      setStockQty("50");
      setStockStatus("ready");
      setImageUrl("");
      setImagePreview(null);
    }
    setIsModalOpen(true);
  };

  // Handle local file selection and preview
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Local preview immediately
    const localUrl = URL.createObjectURL(file);
    setImagePreview(localUrl);

    // Upload to InsForge / Mock Storage
    setIsUploading(true);
    try {
      const res = await uploadVisitPhoto(file);
      if (res.url) {
        setImageUrl(res.url);
      }
    } catch {
      // Keep local preview as fallback
      setImageUrl(localUrl);
    }
    setIsUploading(false);
  };

  // Delete Handler
  const handleDelete = async (id: string) => {
    if (confirm("Apakah Anda yakin ingin menghapus item bahan baku ini?")) {
      const ok = await deleteProduct(id);
      if (ok) {
        setCatalog((prev) => prev.filter((item) => item.id !== id));
      }
    }
  };

  // Submit Handler for Add / Edit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!sku.trim()) newErrors.sku = "Kode/SKU wajib diisi.";
    if (!name.trim()) newErrors.name = "Nama Bahan Baku wajib diisi.";
    if (!unit.trim()) newErrors.unit = "Satuan wajib diisi.";
    const numericPrice = parseInt(price.replace(/\D/g, ""), 10);
    if (isNaN(numericPrice) || numericPrice <= 0) {
      newErrors.price = "Harga Satuan wajib lebih dari Rp 0.";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const numericStockQty = parseInt(stockQty.replace(/\D/g, ""), 10) || 0;
    const computedStatus =
      numericStockQty <= 0
        ? "out_of_stock"
        : numericStockQty <= 10 && stockStatus === "ready"
        ? "limited"
        : stockStatus;

    if (editingItem) {
      // Update DB
      const updated = await updateProduct(editingItem.id, {
        sku: sku.trim(),
        name: name.trim(),
        unit: unit.trim(),
        price: numericPrice,
        stock_status: computedStatus,
        stock_qty: numericStockQty,
        image_url: imageUrl.trim() || undefined,
      });

      if (updated) {
        setCatalog((prev) =>
          prev.map((item) => (item.id === editingItem.id ? updated : item))
        );
      }
    } else {
      // Add DB
      const added = await addProduct({
        sku: sku.trim(),
        name: name.trim(),
        unit: unit.trim(),
        price: numericPrice,
        stock_status: computedStatus,
        stock_qty: numericStockQty,
        image_url: imageUrl.trim() || undefined,
      });

      setCatalog((prev) => [added, ...prev]);
    }

    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-navy-900">
            Manajemen Katalog Bahan Baku
          </h1>
          <p className="mt-0.5 text-xs text-foreground-muted">
            Kelola daftar produk & bahan baku industri lengkap dengan foto sampel yang dapat di-order oleh sales di lapangan
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* View Mode Toggle */}
          <div className="flex rounded-xl border border-navy-200 bg-white p-1 shadow-sm">
            <button
              onClick={() => setViewMode("table")}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                viewMode === "table"
                  ? "bg-navy-900 text-white shadow-sm"
                  : "text-navy-600 hover:bg-navy-50"
              }`}
              title="Tampilan Tabel"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                <path fillRule="evenodd" d="M2 4.75A.75.75 0 012.75 4h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 4.75zm0 5.25a.75.75 0 01.75-.75h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 10zm0 5.25a.75.75 0 01.75-.75h14.5a.75.75 0 010 1.5H2.75a.75.75 0 01-.75-.75z" clipRule="evenodd" />
              </svg>
              <span>Tabel</span>
            </button>
            <button
              onClick={() => setViewMode("grid")}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                viewMode === "grid"
                  ? "bg-navy-900 text-white shadow-sm"
                  : "text-navy-600 hover:bg-navy-50"
              }`}
              title="Tampilan Kartu / Galeri"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                <path fillRule="evenodd" d="M4.25 2A2.25 2.25 0 002 4.25v2.5A2.25 2.25 0 004.25 9h2.5A2.25 2.25 0 009 6.75v-2.5A2.25 2.25 0 006.75 2h-2.5zm0 9A2.25 2.25 0 002 13.25v2.5A2.25 2.25 0 004.25 18h2.5A2.25 2.25 0 009 15.75v-2.5A2.25 2.25 0 006.75 11h-2.5zm9-9A2.25 2.25 0 0011 4.25v2.5A2.25 2.25 0 0013.25 9h2.5A2.25 2.25 0 0018 6.75v-2.5A2.25 2.25 0 0015.75 2h-2.5zm0 9A2.25 2.25 0 0011 13.25v2.5A2.25 2.25 0 0013.25 18h2.5A2.25 2.25 0 0018 15.75v-2.5A2.25 2.25 0 0015.75 11h-2.5z" clipRule="evenodd" />
              </svg>
              <span>Galeri</span>
            </button>
          </div>

          <button
            onClick={() => handleOpenModal()}
            className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-accent-600 to-accent-700 px-4 py-2.5 text-xs font-bold text-white shadow-md hover:from-accent-700 hover:to-accent-800 active:scale-95 transition-all self-start sm:self-auto"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="h-4 w-4"
            >
              <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
            </svg>
            <span>Tambah Bahan Baku</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="rounded-2xl border border-navy-100 bg-white p-4 shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari kode SKU atau nama bahan baku..."
            className="w-full rounded-xl border border-navy-200 bg-surface-dim px-3 py-2 text-xs text-navy-900 outline-none focus:border-primary-500"
          />

          <div className="flex flex-wrap gap-2 sm:col-span-2">
            {(
              [
                { id: "all", label: "Semua Stok" },
                { id: "ready", label: "🟢 Ready Stock" },
                { id: "limited", label: "🟡 Stok Terbatas" },
                { id: "out_of_stock", label: "🔴 Stok Habis" },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                onClick={() => setStockFilter(tab.id)}
                className={`rounded-lg px-3 py-1 text-xs font-semibold transition-colors ${
                  stockFilter === tab.id
                    ? "bg-navy-900 text-white shadow-sm"
                    : "bg-surface-dim text-navy-600 border border-navy-100 hover:bg-navy-50"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* View Mode: TABLE */}
      {viewMode === "table" ? (
        <div className="rounded-2xl border border-navy-100 bg-white shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-navy-900">
              <thead className="bg-navy-950 text-white font-semibold">
                <tr>
                  <th className="px-4 py-3.5 w-16 text-center">Foto</th>
                  <th className="px-4 py-3.5">Kode / SKU</th>
                  <th className="px-4 py-3.5">Nama Bahan Baku</th>
                  <th className="px-4 py-3.5">Satuan</th>
                  <th className="px-4 py-3.5 text-right">Harga Satuan (Rp)</th>
                  <th className="px-4 py-3.5 text-center">Jumlah Stok</th>
                  <th className="px-4 py-3.5 text-center">Status Stok</th>
                  <th className="px-4 py-3.5 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy-100">
                {filteredItems.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-navy-400">
                      Tidak ada bahan baku yang cocok dengan filter.
                    </td>
                  </tr>
                ) : (
                  filteredItems.map((item) => (
                    <tr key={item.id} className="hover:bg-navy-50/80 transition-colors">
                      {/* Photo Thumbnail */}
                      <td className="px-4 py-3 text-center">
                        <div className="h-11 w-11 mx-auto rounded-xl overflow-hidden bg-navy-100 border border-navy-200 flex items-center justify-center shadow-xs">
                          {item.image_url ? (
                            <img
                              src={item.image_url}
                              alt={item.name}
                              className="h-full w-full object-cover transition-transform hover:scale-110"
                              onError={(e) => {
                                (e.target as HTMLElement).style.display = "none";
                              }}
                            />
                          ) : (
                            <span className="text-lg">📦</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 font-mono font-bold text-primary-700">
                        {item.sku}
                      </td>
                      <td className="px-4 py-3 font-bold text-navy-900">
                        {item.name}
                      </td>
                      <td className="px-4 py-3 font-medium text-navy-700">
                        {item.unit}
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-navy-900">
                        {formatRupiah(item.price)}
                      </td>
                      <td className="px-4 py-3 text-center font-mono font-bold">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-lg text-xs ${
                            (item.stock_qty ?? 50) <= 0
                              ? "bg-danger-500/10 text-danger-600 font-bold"
                              : (item.stock_qty ?? 50) <= 10
                              ? "bg-warning-500/10 text-warning-700 font-bold"
                              : "bg-surface-dim text-navy-900"
                          }`}
                        >
                          {(item.stock_qty ?? 50) <= 0 ? "0 (Habis)" : `${item.stock_qty ?? 50}`}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                            item.stock_status === "ready"
                              ? "bg-accent-50 text-accent-700 border border-accent-200"
                              : item.stock_status === "limited"
                              ? "bg-warning-500/10 text-warning-700 border border-warning-500/30"
                              : "bg-danger-500/10 text-danger-700 border border-danger-500/30"
                          }`}
                        >
                          {item.stock_status === "ready"
                            ? "🟢 Ready"
                            : item.stock_status === "limited"
                            ? "🟡 Stok Terbatas"
                            : "🔴 Out of Stock"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleOpenModal(item)}
                            className="rounded-lg bg-navy-100 p-1.5 text-navy-700 hover:bg-navy-200 transition-colors"
                            title="Edit"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
                              <path d="M5.433 13.917l1.262-3.155A4 4 0 017.58 9.42l6.92-6.918a2.121 2.121 0 013 3l-6.92 6.918c-.383.383-.84.685-1.343.886l-3.154 1.262a.5.5 0 01-.65-.65z" />
                              <path d="M3.5 5.75c0-.69.56-1.25 1.25-1.25H10a.75.75 0 000-1.5H4.75A2.75 2.75 0 002 5.75v9.5A2.75 2.75 0 004.75 18h9.5A2.75 2.75 0 0017 15.25V10a.75.75 0 00-1.5 0v5.25c0 .69-.56 1.25-1.25 1.25h-9.5c-.69 0-1.25-.56-1.25-1.25v-9.5z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="rounded-lg bg-danger-500/10 p-1.5 text-danger-600 hover:bg-danger-500/20 transition-colors"
                            title="Hapus"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
                              <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 01.75.75v6a.75.75 0 01-1.5 0v-6a.75.75 0 01.75-.75zm3.34 0a.75.75 0 01.75.75v6a.75.75 0 01-1.5 0v-6a.75.75 0 01.75-.75z" clipRule="evenodd" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* View Mode: GRID GALLERY */
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredItems.length === 0 ? (
            <div className="col-span-full rounded-2xl border border-dashed border-navy-200 bg-white p-12 text-center text-navy-400">
              Tidak ada bahan baku yang cocok dengan filter.
            </div>
          ) : (
            filteredItems.map((item) => (
              <div
                key={item.id}
                className="group rounded-2xl border border-navy-100 bg-white shadow-sm overflow-hidden flex flex-col hover:shadow-md transition-all"
              >
                {/* Image Box */}
                <div className="relative h-44 w-full bg-navy-100 overflow-hidden">
                  {item.image_url ? (
                    <img
                      src={item.image_url}
                      alt={item.name}
                      className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-navy-300">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
                      </svg>
                    </div>
                  )}

                  {/* Stock Status Badge */}
                  <span
                    className={`absolute top-2.5 right-2.5 rounded-full px-2.5 py-1 text-[10px] font-bold shadow-md backdrop-blur-md ${
                      item.stock_status === "ready"
                        ? "bg-emerald-500/90 text-white"
                        : item.stock_status === "limited"
                        ? "bg-amber-500/90 text-white"
                        : "bg-rose-500/90 text-white"
                    }`}
                  >
                    {item.stock_status === "ready"
                      ? "Ready"
                      : item.stock_status === "limited"
                      ? "Terbatas"
                      : "Habis"}
                  </span>

                  {/* SKU Tag */}
                  <span className="absolute bottom-2.5 left-2.5 rounded-lg bg-navy-900/80 backdrop-blur-md px-2 py-0.5 font-mono text-[10px] font-bold text-white">
                    {item.sku}
                  </span>
                </div>

                {/* Content */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <h3 className="font-bold text-navy-900 text-sm leading-snug line-clamp-2">
                      {item.name}
                    </h3>
                    <p className="text-xs text-navy-500 mt-1 font-medium">
                      Satuan: {item.unit}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-navy-100 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] text-foreground-muted">Harga Satuan</p>
                      <p className="font-mono font-bold text-sm text-navy-950">
                        {formatRupiah(item.price)}
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleOpenModal(item)}
                        className="rounded-lg bg-navy-100 p-2 text-navy-700 hover:bg-navy-200 transition-colors"
                        title="Edit"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
                          <path d="M5.433 13.917l1.262-3.155A4 4 0 017.58 9.42l6.92-6.918a2.121 2.121 0 013 3l-6.92 6.918c-.383.383-.84.685-1.343.886l-3.154 1.262a.5.5 0 01-.65-.65z" />
                          <path d="M3.5 5.75c0-.69.56-1.25 1.25-1.25H10a.75.75 0 000-1.5H4.75A2.75 2.75 0 002 5.75v9.5A2.75 2.75 0 004.75 18h9.5A2.75 2.75 0 0017 15.25V10a.75.75 0 00-1.5 0v5.25c0 .69-.56 1.25-1.25 1.25h-9.5c-.69 0-1.25-.56-1.25-1.25v-9.5z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="rounded-lg bg-danger-500/10 p-2 text-danger-600 hover:bg-danger-500/20 transition-colors"
                        title="Hapus"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
                          <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 01.75.75v6a.75.75 0 01-1.5 0v-6a.75.75 0 01.75-.75zm3.34 0a.75.75 0 01.75.75v6a.75.75 0 01-1.5 0v-6a.75.75 0 01.75-.75z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Modal Form Tambah / Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl space-y-4 animate-slide-up max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-navy-100 pb-3">
              <h2 className="text-base font-bold text-navy-900">
                {editingItem ? "Edit Bahan Baku" : "Tambah Bahan Baku Baru"}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="rounded-xl p-1.5 text-navy-400 hover:bg-navy-50 hover:text-navy-700"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              {/* Foto Produk Section */}
              <div className="rounded-xl border border-navy-100 bg-surface-dim p-3.5 space-y-2.5">
                <label className="block font-semibold text-navy-900">
                  Foto Sampel Produk / Bahan Baku
                </label>

                <div className="flex items-center gap-4">
                  {/* Thumbnail Preview */}
                  <div className="relative h-20 w-20 shrink-0 rounded-xl border-2 border-dashed border-navy-300 bg-white overflow-hidden flex items-center justify-center shadow-xs">
                    {imagePreview ? (
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="text-center p-1">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 mx-auto text-navy-400">
                          <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
                        </svg>
                        <span className="text-[9px] text-navy-400 font-medium">No Image</span>
                      </div>
                    )}
                  </div>

                  {/* Upload Actions & URL Input */}
                  <div className="flex-1 space-y-2">
                    <div>
                      <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-navy-900 px-3 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-navy-800 active:scale-95 transition-all">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
                          <path d="M9.25 13.25a.75.75 0 001.5 0V4.636l2.955 3.129a.75.75 0 001.09-1.03l-4.25-4.5a.75.75 0 00-1.09 0l-4.25 4.5a.75.75 0 101.09 1.03L9.25 4.636v8.614z" />
                          <path d="M3.5 12.75a.75.75 0 00-1.5 0v2.5A2.75 2.75 0 004.75 18h10.5A2.75 2.75 0 0018 15.25v-2.5a.75.75 0 00-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5z" />
                        </svg>
                        <span>{isUploading ? "Mengunggah..." : "Unggah File Foto"}</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleFileChange}
                          className="hidden"
                        />
                      </label>
                      {imagePreview && (
                        <button
                          type="button"
                          onClick={() => {
                            setImageUrl("");
                            setImagePreview(null);
                          }}
                          className="ml-2 text-[11px] text-danger-600 hover:underline font-semibold"
                        >
                          Hapus Foto
                        </button>
                      )}
                    </div>

                    <div>
                      <span className="text-[10px] text-foreground-muted block mb-0.5">
                        atau Masukkan URL Gambar:
                      </span>
                      <input
                        type="url"
                        value={imageUrl}
                        onChange={(e) => {
                          setImageUrl(e.target.value);
                          setImagePreview(e.target.value || null);
                        }}
                        placeholder="https://example.com/foto-barang.jpg"
                        className="w-full rounded-lg border border-navy-200 bg-white px-2.5 py-1.5 text-xs text-navy-900 outline-none focus:border-primary-500 font-mono"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-navy-900 mb-1">
                  Kode / SKU <span className="text-danger-500">*</span>
                </label>
                <input
                  type="text"
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                  placeholder="Contoh: SKU-TER-01"
                  className="w-full rounded-xl border border-navy-200 bg-surface px-3 py-2 text-xs text-navy-900 outline-none focus:border-primary-500 font-mono"
                />
                {errors.sku && <p className="text-[10px] text-danger-500 font-medium mt-0.5">{errors.sku}</p>}
              </div>

              <div>
                <label className="block font-semibold text-navy-900 mb-1">
                  Nama Bahan Baku <span className="text-danger-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Contoh: Gula Pasir Kristal Industri"
                  className="w-full rounded-xl border border-navy-200 bg-surface px-3 py-2 text-xs text-navy-900 outline-none focus:border-primary-500"
                />
                {errors.name && <p className="text-[10px] text-danger-500 font-medium mt-0.5">{errors.name}</p>}
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-navy-900 mb-1">
                    Satuan <span className="text-danger-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    placeholder="Sak (25kg), etc"
                    className="w-full rounded-xl border border-navy-200 bg-surface px-3 py-2 text-xs text-navy-900 outline-none focus:border-primary-500"
                  />
                  {errors.unit && <p className="text-[10px] text-danger-500 font-medium mt-0.5">{errors.unit}</p>}
                </div>

                <div>
                  <label className="block font-semibold text-navy-900 mb-1">
                    Harga (Rp) <span className="text-danger-500">*</span>
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="250000"
                    className="w-full rounded-xl border border-navy-200 bg-surface px-3 py-2 text-xs font-mono text-navy-900 outline-none focus:border-primary-500"
                  />
                  {errors.price && <p className="text-[10px] text-danger-500 font-medium mt-0.5">{errors.price}</p>}
                </div>

                <div>
                  <label className="block font-semibold text-navy-900 mb-1">
                    Jumlah Stok <span className="text-danger-500">*</span>
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={stockQty}
                    onChange={(e) => {
                      const val = e.target.value;
                      setStockQty(val);
                      const num = parseInt(val, 10) || 0;
                      if (num <= 0) setStockStatus("out_of_stock");
                      else if (num <= 10) setStockStatus("limited");
                      else setStockStatus("ready");
                    }}
                    placeholder="50"
                    className="w-full rounded-xl border border-navy-200 bg-surface px-3 py-2 text-xs font-mono font-bold text-navy-900 outline-none focus:border-primary-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-navy-900 mb-1">
                  Status Stok
                </label>
                <select
                  value={stockStatus}
                  onChange={(e) => setStockStatus(e.target.value as any)}
                  className="w-full rounded-xl border border-navy-200 bg-surface px-3 py-2 text-xs font-semibold text-navy-900 outline-none focus:border-primary-500"
                >
                  <option value="ready">🟢 Ready Stock</option>
                  <option value="limited">🟡 Stok Terbatas</option>
                  <option value="out_of_stock">🔴 Out of Stock</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-navy-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl border border-navy-200 bg-white px-4 py-2 text-xs font-bold text-navy-700 hover:bg-navy-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isUploading}
                  className="rounded-xl bg-accent-600 px-5 py-2 text-xs font-bold text-white shadow-md hover:bg-accent-700 disabled:opacity-60"
                >
                  {editingItem ? "Simpan Perubahan" : "+ Tambah Item"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
