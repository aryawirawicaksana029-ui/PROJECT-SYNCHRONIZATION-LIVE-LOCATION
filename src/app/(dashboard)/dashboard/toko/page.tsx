"use client";

import { useState, useEffect } from "react";
import { getStores, getVisitLogs, updateStore, deleteStore } from "@/lib/db";
import { StoreRow, VisitLogRow } from "@/lib/database.types";

function formatRupiah(num: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(num);
}

export default function ManajemenTokoPage() {
  const [stores, setStores] = useState<StoreRow[]>([]);
  const [visitLogs, setVisitLogs] = useState<VisitLogRow[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "verified">("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"kode_asc" | "kode_desc" | "name_asc" | "date_desc">("kode_asc");

  // Selected Store for Invoice/Faktur Modal
  const [selectedStore, setSelectedStore] = useState<StoreRow | null>(null);
  // Store to delete modal state
  const [storeToDelete, setStoreToDelete] = useState<StoreRow | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Fetch Stores & Visit Logs on mount
  useEffect(() => {
    Promise.all([getStores(), getVisitLogs()]).then(([storeData, logs]) => {
      setStores(storeData);
      setVisitLogs(logs);
    });
  }, []);

  const handleVerify = async (id: string, newStatus: "verified" | "pending") => {
    const updated = await updateStore(id, { verification_status: newStatus });
    if (updated) {
      setStores((prev) =>
        prev.map((s) => (s.id === id ? { ...s, verification_status: newStatus } : s))
      );
      if (selectedStore && selectedStore.id === id) {
        setSelectedStore((prev) => (prev ? { ...prev, verification_status: newStatus } : null));
      }
    }
  };

  const handleConfirmDelete = async () => {
    if (!storeToDelete) return;
    setIsDeleting(true);
    const success = await deleteStore(storeToDelete.id);
    if (success) {
      setStores((prev) => prev.filter((s) => s.id !== storeToDelete.id));
      setToastMessage(`Toko "${storeToDelete.name}" berhasil dihapus.`);
      setTimeout(() => setToastMessage(null), 3000);
      setStoreToDelete(null);
    }
    setIsDeleting(false);
  };

  // Filter & Sort Logic
  const filtered = stores
    .filter((s) => {
      const kode = s.kode_toko || "";
      const matchSearch =
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.pic_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        kode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.address.toLowerCase().includes(searchTerm.toLowerCase());

      const matchStatus =
        statusFilter === "all" || s.verification_status === statusFilter;

      const matchCategory =
        categoryFilter === "all" ||
        (s.kategori && s.kategori.toLowerCase() === categoryFilter.toLowerCase());

      return matchSearch && matchStatus && matchCategory;
    })
    .sort((a, b) => {
      if (sortBy === "kode_asc") {
        return (a.kode_toko || "").localeCompare(b.kode_toko || "");
      }
      if (sortBy === "kode_desc") {
        return (b.kode_toko || "").localeCompare(a.kode_toko || "");
      }
      if (sortBy === "name_asc") {
        return a.name.localeCompare(b.name);
      }
      if (sortBy === "date_desc") {
        return (
          new Date(b.created_at || "").getTime() -
          new Date(a.created_at || "").getTime()
        );
      }
      return 0;
    });

  // Calculate Invoices / Faktur per store
  const getStoreInvoices = (storeId: string) => {
    return visitLogs.filter((v) => v.store_id === storeId);
  };

  const getCategoryBadgeClass = (kategori?: string) => {
    if (kategori === "Frozen Food") {
      return "bg-cyan-50 text-cyan-700 border-cyan-200";
    }
    if (kategori === "Agent Bumbu / Baku") {
      return "bg-amber-50 text-amber-700 border-amber-200";
    }
    if (kategori === "Retail / Sembako") {
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    }
    return "bg-navy-50 text-navy-700 border-navy-200";
  };

  const getKodeBadgeColor = (kode?: string) => {
    if (!kode) return "bg-navy-100 text-navy-800 border-navy-200";
    if (kode.startsWith("FF-")) return "bg-cyan-100 text-cyan-900 border-cyan-300";
    if (kode.startsWith("AB-")) return "bg-amber-100 text-amber-900 border-amber-300";
    if (kode.startsWith("RS-")) return "bg-emerald-100 text-emerald-900 border-emerald-300";
    return "bg-primary-100 text-primary-900 border-primary-300";
  };

  // Stats calculation
  const totalFF = stores.filter((s) => s.kategori === "Frozen Food").length;
  const totalAB = stores.filter((s) => s.kategori === "Agent Bumbu / Baku").length;
  const totalRS = stores.filter((s) => s.kategori === "Retail / Sembako").length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-navy-900">
            Manajemen, Pengelompokan & Faktur Toko
          </h1>
          <p className="mt-0.5 text-xs text-foreground-muted">
            Kelola kode toko, kelompok kategori usaha (Frozen Food, Agent Bahan Baku, Retail), serta riwayat faktur tagihan
          </p>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-2xl border border-navy-100 bg-white p-4 shadow-sm">
          <p className="text-xs text-navy-500 font-medium">Total Semua Toko</p>
          <p className="text-2xl font-bold text-navy-950 mt-1">{stores.length}</p>
          <p className="text-[11px] text-navy-400 mt-0.5">Mitra terdaftar</p>
        </div>
        <div className="rounded-2xl border border-cyan-100 bg-cyan-50/50 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs text-cyan-800 font-semibold">❄️ Frozen Food (FF)</p>
            <span className="rounded-md bg-cyan-200/60 px-1.5 py-0.5 text-[10px] font-mono font-bold text-cyan-900">FF-XXX</span>
          </div>
          <p className="text-2xl font-bold text-cyan-950 mt-1">{totalFF}</p>
          <p className="text-[11px] text-cyan-700/80 mt-0.5">Outlet Makanan Beku</p>
        </div>
        <div className="rounded-2xl border border-amber-100 bg-amber-50/50 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs text-amber-800 font-semibold">🧂 Agent Baku (AB)</p>
            <span className="rounded-md bg-amber-200/60 px-1.5 py-0.5 text-[10px] font-mono font-bold text-amber-900">AB-XXX</span>
          </div>
          <p className="text-2xl font-bold text-amber-950 mt-1">{totalAB}</p>
          <p className="text-[11px] text-amber-700/80 mt-0.5">Penyedia Bahan Baku</p>
        </div>
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs text-emerald-800 font-semibold">🏪 Retail Sembako (RS)</p>
            <span className="rounded-md bg-emerald-200/60 px-1.5 py-0.5 text-[10px] font-mono font-bold text-emerald-900">RS-XXX</span>
          </div>
          <p className="text-2xl font-bold text-emerald-950 mt-1">{totalRS}</p>
          <p className="text-[11px] text-emerald-700/80 mt-0.5">Warung & Toko Retail</p>
        </div>
      </div>

      {/* Filter & Sort Controls */}
      <div className="rounded-2xl border border-navy-100 bg-white p-4 shadow-sm space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {/* Search Box */}
          <div className="md:col-span-2">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari Kode Toko (FF-001), Nama Toko, PIC, atau Alamat..."
              className="w-full rounded-xl border border-navy-200 bg-surface-dim px-3 py-2 text-xs text-navy-900 outline-none focus:border-primary-500"
            />
          </div>

          {/* Kategori Filter Dropdown */}
          <div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full rounded-xl border border-navy-200 bg-surface-dim px-3 py-2 text-xs font-semibold text-navy-900 outline-none focus:border-primary-500"
            >
              <option value="all">🏢 Semua Kategori Toko</option>
              <option value="Frozen Food">❄️ Frozen Food (FF)</option>
              <option value="Agent Bumbu / Baku">🧂 Agent Bumbu / Baku (AB)</option>
              <option value="Retail / Sembako">🏪 Retail / Sembako (RS)</option>
              <option value="Lainnya">📦 Lainnya (LN)</option>
            </select>
          </div>

          {/* Sort Option */}
          <div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full rounded-xl border border-navy-200 bg-surface-dim px-3 py-2 text-xs font-semibold text-navy-900 outline-none focus:border-primary-500"
            >
              <option value="kode_asc">🔢 Urutkan: Kode Toko (A - Z)</option>
              <option value="kode_desc">🔢 Urutkan: Kode Toko (Z - A)</option>
              <option value="name_asc">🔤 Urutkan: Nama Toko (A - Z)</option>
              <option value="date_desc">📅 Urutkan: Terdaftar Terbaru</option>
            </select>
          </div>
        </div>

        {/* Verification Status Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-navy-100 text-xs">
          <span className="text-navy-500 font-semibold text-[11px] mr-1">Status Verifikasi:</span>
          {(
            [
              { id: "all", label: `Semua Status (${stores.length})` },
              { id: "verified", label: `🟢 Terverifikasi (${stores.filter((s) => s.verification_status === "verified").length})` },
              { id: "pending", label: `🟡 Pending Admin (${stores.filter((s) => s.verification_status === "pending").length})` },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`rounded-lg px-3 py-1 text-xs font-semibold transition-all ${
                statusFilter === tab.id
                  ? "bg-navy-900 text-white shadow-sm"
                  : "bg-surface-dim text-navy-600 border border-navy-100 hover:bg-navy-50"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Stores Table */}
      <div className="rounded-2xl border border-navy-100 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-navy-900">
            <thead className="bg-navy-950 text-white font-semibold">
              <tr>
                <th className="px-4 py-3.5">Kode Toko</th>
                <th className="px-4 py-3.5">Kategori Usaha</th>
                <th className="px-4 py-3.5">Nama Toko</th>
                <th className="px-4 py-3.5">PIC & Kontak</th>
                <th className="px-4 py-3.5">Alamat Lengkap</th>
                <th className="px-4 py-3.5 text-center">Faktur / Kunjungan</th>
                <th className="px-4 py-3.5 text-center">Status Verifikasi</th>
                <th className="px-4 py-3.5 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-navy-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-navy-400">
                    Tidak ada data toko yang cocok dengan filter atau pencarian.
                  </td>
                </tr>
              ) : (
                filtered.map((store) => {
                  const invoices = getStoreInvoices(store.id);
                  const totalTagihan = invoices.reduce(
                    (sum, inv) => sum + (inv.total_amount || 0),
                    0
                  );

                  return (
                    <tr
                      key={store.id}
                      className="hover:bg-navy-50/80 transition-colors"
                    >
                      {/* Kode Toko */}
                      <td className="px-4 py-3 font-mono font-bold">
                        <span
                          className={`inline-block rounded-lg px-2.5 py-1 text-xs font-mono font-bold border shadow-2xs ${getKodeBadgeColor(
                            store.kode_toko
                          )}`}
                        >
                          {store.kode_toko || `TK-${store.id}`}
                        </span>
                      </td>

                      {/* Kategori Usaha */}
                      <td className="px-4 py-3 font-medium">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold border ${getCategoryBadgeClass(
                            store.kategori
                          )}`}
                        >
                          {store.kategori || "Retail / Sembako"}
                        </span>
                      </td>

                      {/* Nama Toko */}
                      <td className="px-4 py-3 font-bold text-navy-900">
                        {store.name}
                      </td>

                      {/* PIC & Phone */}
                      <td className="px-4 py-3 font-medium text-navy-700">
                        <p className="font-semibold text-navy-900">{store.pic_name}</p>
                        <p className="text-[11px] text-navy-500 font-mono">{store.phone}</p>
                      </td>

                      {/* Alamat */}
                      <td className="px-4 py-3 text-[11px] text-foreground-muted max-w-xs truncate">
                        📍 {store.address}
                      </td>

                      {/* Faktur / Invoices count */}
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => setSelectedStore(store)}
                          className="inline-flex items-center gap-1 rounded-lg bg-primary-50 px-2.5 py-1 text-[11px] font-bold text-primary-700 border border-primary-200 hover:bg-primary-100 transition-colors"
                          title="Klik untuk melihat daftar faktur"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
                            <path fillRule="evenodd" d="M4.5 2A1.5 1.5 0 003 3.5v13A1.5 1.5 0 004.5 18h11a1.5 1.5 0 001.5-1.5V7.621a1.5 1.5 0 00-.44-1.06l-4.12-4.122A1.5 1.5 0 0011.378 2H4.5zm2.25 8.5a.75.75 0 000 1.5h6.5a.75.75 0 000-1.5h-6.5zm0 3a.75.75 0 000 1.5h6.5a.75.75 0 000-1.5h-6.5z" clipRule="evenodd" />
                          </svg>
                          <span>{invoices.length} Faktur</span>
                        </button>
                        {totalTagihan > 0 && (
                          <p className="text-[10px] font-mono font-bold text-accent-700 mt-0.5">
                            {formatRupiah(totalTagihan)}
                          </p>
                        )}
                      </td>

                      {/* Status Verifikasi */}
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                            store.verification_status === "verified"
                              ? "bg-accent-50 text-accent-700 border border-accent-200"
                              : "bg-warning-500/10 text-warning-700 border border-warning-500/30"
                          }`}
                        >
                          {store.verification_status === "verified"
                            ? "🟢 Terverifikasi"
                            : "🟡 Pending"}
                        </span>
                      </td>

                      {/* Action */}
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {store.verification_status === "pending" ? (
                            <button
                              onClick={() => handleVerify(store.id, "verified")}
                              className="rounded-xl bg-accent-600 px-3 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-accent-700 active:scale-95 transition-all"
                            >
                              ✓ Setujui
                            </button>
                          ) : (
                            <button
                              onClick={() => handleVerify(store.id, "pending")}
                              className="rounded-xl border border-navy-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-navy-600 hover:bg-navy-50"
                            >
                              Batalkan
                            </button>
                          )}
                          <button
                            onClick={() => setSelectedStore(store)}
                            className="rounded-lg bg-navy-100 p-1.5 text-navy-700 hover:bg-navy-200 transition-colors"
                            title="Detail & Faktur"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
                              <path d="M10 12.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" />
                              <path fillRule="evenodd" d="M.664 10.59a1.651 1.651 0 010-1.186A10.004 10.004 0 0110 3c4.257 0 7.893 2.66 9.336 6.41.147.381.146.804 0 1.186A10.004 10.004 0 0110 17c-4.257 0-7.893-2.66-9.336-6.41zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                            </svg>
                          </button>

                          {/* Delete Store Button */}
                          <button
                            onClick={() => setStoreToDelete(store)}
                            className="rounded-lg bg-danger-500/10 p-1.5 text-danger-600 hover:bg-danger-500/20 hover:text-danger-700 transition-colors"
                            title="Hapus Toko"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
                              <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z" clipRule="evenodd" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* DETAIL & FAKTUR MODAL */}
      {selectedStore && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl space-y-4 animate-slide-up max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-navy-100 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span
                    className={`rounded-lg px-2 py-0.5 font-mono text-xs font-bold border ${getKodeBadgeColor(
                      selectedStore.kode_toko
                    )}`}
                  >
                    {selectedStore.kode_toko || `TK-${selectedStore.id}`}
                  </span>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold border ${getCategoryBadgeClass(
                      selectedStore.kategori
                    )}`}
                  >
                    {selectedStore.kategori || "Retail / Sembako"}
                  </span>
                </div>
                <h2 className="text-lg font-bold text-navy-900 mt-1">
                  {selectedStore.name}
                </h2>
                <p className="text-xs text-foreground-muted">
                  PIC: {selectedStore.pic_name} • {selectedStore.phone}
                </p>
              </div>

              <button
                onClick={() => setSelectedStore(null)}
                className="rounded-xl p-1.5 text-navy-400 hover:bg-navy-50 hover:text-navy-700"
              >
                ✕
              </button>
            </div>

            {/* Store Details Card */}
            <div className="rounded-xl bg-surface-dim p-4 text-xs space-y-2 border border-navy-100">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-navy-500 font-medium">Alamat:</span>
                  <p className="font-semibold text-navy-900">{selectedStore.address}</p>
                </div>
                <div>
                  <span className="text-navy-500 font-medium">Koordinat GPS:</span>
                  <p className="font-mono font-semibold text-navy-900">
                    {selectedStore.latitude}, {selectedStore.longitude}
                  </p>
                </div>
              </div>
            </div>

            {/* Faktur / Invoices List */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-navy-900">
                  Daftar Faktur Tagihan & Kunjungan
                </h3>
                <span className="text-[11px] text-navy-500 font-medium">
                  {getStoreInvoices(selectedStore.id).length} Faktur Tercatat
                </span>
              </div>

              {getStoreInvoices(selectedStore.id).length === 0 ? (
                <div className="rounded-xl border border-dashed border-navy-200 bg-white p-6 text-center text-navy-400 text-xs">
                  Belum ada faktur kunjungan atau transaksi untuk toko ini.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {getStoreInvoices(selectedStore.id).map((inv, idx) => {
                    const invoiceNumber = `FAK-${selectedStore.kode_toko || "SLL"}-${(
                      idx + 1
                    )
                      .toString()
                      .padStart(3, "0")}`;

                    return (
                      <div
                        key={inv.id}
                        className="rounded-xl border border-navy-100 bg-white p-3.5 shadow-2xs space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-xs text-primary-700">
                              {invoiceNumber}
                            </span>
                            <span className="text-[11px] text-navy-500">
                              {inv.created_at
                                ? new Date(inv.created_at).toLocaleDateString("id-ID", {
                                    day: "numeric",
                                    month: "short",
                                    year: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })
                                : "-"}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <span
                              className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                inv.is_paid
                                  ? "bg-accent-50 text-accent-700 border border-accent-200"
                                  : "bg-danger-500/10 text-danger-700 border border-danger-500/20"
                              }`}
                            >
                              {inv.is_paid ? "Lunas" : "Belum Bayar"}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-xs pt-1 border-t border-navy-50">
                          <div>
                            <span className="text-navy-500">Catatan: </span>
                            <span className="font-medium text-navy-800">
                              {inv.notes || "Kunjungan rutin"}
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="text-navy-500">Nominal: </span>
                            <span className="font-mono font-bold text-sm text-navy-950">
                              {formatRupiah(inv.total_amount || 0)}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end pt-3 border-t border-navy-100">
              <button
                type="button"
                onClick={() => setSelectedStore(null)}
                className="rounded-xl bg-navy-900 px-5 py-2 text-xs font-bold text-white shadow-sm hover:bg-navy-800"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE STORE CONFIRMATION MODAL */}
      {storeToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl space-y-4 animate-slide-up">
            <div className="flex items-center gap-3 text-danger-600">
              <div className="h-10 w-10 rounded-full bg-danger-50 flex items-center justify-center shrink-0 border border-danger-200">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-5 w-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-bold text-navy-900">Konfirmasi Hapus Toko</h3>
                <p className="text-xs text-foreground-muted">Tindakan ini tidak dapat dibatalkan</p>
              </div>
            </div>

            <p className="text-xs text-navy-700 leading-relaxed bg-surface-dim p-3 rounded-xl border border-navy-100">
              Apakah Anda yakin ingin menghapus data toko <span className="font-bold text-navy-950">"{storeToDelete.name}"</span> ({storeToDelete.kode_toko || "No Kode"})? Seluruh data terkait toko ini akan dihapus dari sistem.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setStoreToDelete(null)}
                disabled={isDeleting}
                className="rounded-xl border border-navy-200 bg-white px-4 py-2 text-xs font-semibold text-navy-700 hover:bg-navy-50"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="rounded-xl bg-danger-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-danger-700 active:scale-95 transition-all disabled:opacity-50"
              >
                {isDeleting ? "Menghapus..." : "Ya, Hapus Toko"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 rounded-2xl bg-navy-900 px-4 py-3 text-xs font-bold text-white shadow-2xl flex items-center gap-2 animate-slide-up border border-white/20">
          <span className="text-accent-400">✓</span>
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
