"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { AdminStoreMarker, MapFocusTarget } from "@/components/AdminLiveMap";
import AdminAddStoreModal from "@/components/AdminAddStoreModal";
import { getStores, getActiveSalesPositions } from "@/lib/db";
import type { ActiveSalesPosition } from "@/lib/db";

// Dynamically import AdminLiveMap to avoid SSR window errors
const AdminLiveMap = dynamic(() => import("@/components/AdminLiveMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[600px] w-full flex-col items-center justify-center rounded-2xl border border-navy-100 bg-navy-50 text-navy-400">
      <div className="h-8 w-8 animate-spin rounded-full border-3 border-primary-600 border-t-transparent mb-2" />
      <span className="text-xs font-medium">Memuat Peta Live Monitoring...</span>
    </div>
  ),
});

export default function PetaLivePage() {
  const [stores, setStores] = useState<AdminStoreMarker[]>([]);
  const [salesPositions, setSalesPositions] = useState<ActiveSalesPosition[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [focusedTarget, setFocusedTarget] = useState<MapFocusTarget | null>(null);

  // Load stores + sales positions
  useEffect(() => {
    getStores().then((data) => {
      const mapped: AdminStoreMarker[] = data.map((s) => ({
        id: s.id,
        store_name: s.name,
        pic_name: s.pic_name,
        phone_number: s.phone,
        full_address: s.address,
        latitude: s.latitude,
        longitude: s.longitude,
        verification_status: s.verification_status,
        current_status: s.current_status,
        is_tracking_active: s.is_tracking_active || false,
        last_ping_at: s.last_ping_at || "Offline",
      }));
      setStores(mapped);
    });

    getActiveSalesPositions().then(setSalesPositions);
  }, []);

  // Refresh sales positions every 10 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      getActiveSalesPositions().then(setSalesPositions);
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  const filteredStores = stores.filter(
    (s) =>
      s.store_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.pic_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.full_address.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddStore = (newStore: AdminStoreMarker) => {
    setStores((prev) => [newStore, ...prev]);
    setSuccessToast(`Toko "${newStore.store_name}" berhasil ditambahkan ke sistem!`);
    setTimeout(() => setSuccessToast(null), 4000);
  };

  const formatTimeAgo = (dateStr: string) => {
    const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
    if (diff < 60) return `${diff}s lalu`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m lalu`;
    return `${Math.floor(diff / 3600)}h lalu`;
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      {/* Header & Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-navy-900">Peta Live Monitoring</h1>
          <p className="mt-0.5 text-xs text-foreground-muted">
            Visualisasi lokasi real-time toko, sesi Shareloc Live, dan posisi semua petugas lapangan
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
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
          <span>Tambah Toko Manual</span>
        </button>
      </div>

      {/* Success Notification Banner */}
      {successToast && (
        <div className="rounded-xl bg-accent-500 text-white px-4 py-2.5 text-xs font-bold shadow-md flex items-center justify-between animate-fade-in">
          <div className="flex items-center gap-2">
            <span>🎉 {successToast}</span>
          </div>
          <button onClick={() => setSuccessToast(null)} className="text-white/80 hover:text-white">
            ✕
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Left Side: Store List + Sales List */}
        <div className="lg:col-span-1 rounded-2xl border border-navy-100 bg-white p-4 shadow-sm space-y-3 flex flex-col h-[600px]">
          <div>
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold text-navy-900">
                Daftar Toko ({filteredStores.length})
              </h2>
              <span className="text-[10px] text-primary-600 font-semibold">
                Klik untuk fokus
              </span>
            </div>
            <p className="text-[10px] text-foreground-muted mt-0.5">
              Klik nama toko/sales untuk zoom kamera peta
            </p>
          </div>

          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari toko / PIC..."
            className="w-full rounded-xl border border-navy-200 bg-surface-dim px-3 py-2 text-xs text-navy-900 outline-none focus:border-primary-500"
          />

          {/* Active Sales Tracking Panel - Clickable */}
          {salesPositions.length > 0 && (
            <div className="space-y-1.5 border-b border-navy-100 pb-2">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-bold text-primary-700 uppercase tracking-wider">
                  🏃 Sales Aktif ({salesPositions.length})
                </p>
                <span className="text-[9px] text-primary-600 font-semibold animate-pulse">
                  ● Live
                </span>
              </div>
              {salesPositions.map((sp) => {
                const isSelected = focusedTarget?.id === `sales-${sp.id}`;
                return (
                  <div
                    key={sp.id}
                    onClick={() =>
                      setFocusedTarget({
                        lat: sp.latitude,
                        lng: sp.longitude,
                        zoom: 17,
                        id: `sales-${sp.id}`,
                        type: "sales",
                      })
                    }
                    className={`rounded-xl border p-2.5 text-xs space-y-1 cursor-pointer transition-all active:scale-[0.98] ${
                      isSelected
                        ? "border-primary-500 bg-primary-100/70 shadow-sm ring-2 ring-primary-500/20"
                        : "border-primary-100 bg-primary-50/50 hover:bg-primary-100/50 hover:border-primary-300"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-navy-900 text-xs">
                        👤 {sp.sales_name}
                      </span>
                      <span className="text-[10px] font-bold text-primary-700 bg-white px-1.5 py-0.5 rounded border border-primary-200">
                        Fokus Peta 🎯
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-navy-600">
                      <span>🔋 {sp.battery_level}% • 📡 ±{sp.accuracy_m}m</span>
                      <span className="font-mono font-semibold">{formatTimeAgo(sp.last_ping)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Store List - Clickable */}
          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            {filteredStores.map((s) => {
              const isSelected = focusedTarget?.id === s.id;
              return (
                <div
                  key={s.id}
                  onClick={() =>
                    setFocusedTarget({
                      lat: s.latitude,
                      lng: s.longitude,
                      zoom: 17,
                      id: s.id,
                      type: "store",
                    })
                  }
                  className={`rounded-xl border p-2.5 text-xs transition-all cursor-pointer space-y-1 active:scale-[0.98] ${
                    isSelected
                      ? "border-primary-500 bg-primary-50/80 shadow-sm ring-2 ring-primary-500/20"
                      : "border-navy-100 bg-surface-dim hover:bg-navy-50 hover:border-primary-300"
                  }`}
                >
                  <div className="flex items-start justify-between gap-1">
                    <h4 className="font-bold text-navy-900 leading-snug">
                      {s.store_name}
                    </h4>
                    <span
                      className={`shrink-0 rounded px-1.5 py-0.5 text-[9px] font-bold ${
                        s.is_tracking_active
                          ? "bg-primary-50 text-primary-700 border border-primary-200"
                          : s.current_status === "open"
                          ? "bg-accent-50 text-accent-700"
                          : "bg-navy-200 text-navy-700"
                      }`}
                    >
                      {s.is_tracking_active
                        ? "🔵 Live"
                        : s.current_status === "open"
                        ? "🟢 Buka"
                        : "⚪ Tutup"}
                    </span>
                  </div>
                  <p className="text-[11px] text-navy-600 font-medium">
                    PIC: {s.pic_name} ({s.phone_number})
                  </p>
                  <p className="text-[10px] text-foreground-muted truncate">
                    📍 {s.full_address}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Side: Full Interactive Map */}
        <div className="lg:col-span-3">
          <AdminLiveMap
            stores={stores}
            salesPositions={salesPositions}
            focusedTarget={focusedTarget}
            height="600px"
          />
        </div>
      </div>

      {/* Modal Popup for Admin Add Store */}
      <AdminAddStoreModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddStore={handleAddStore}
      />
    </div>
  );
}
