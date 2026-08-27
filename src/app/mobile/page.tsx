"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import {
  getStores,
  getVisitLogs,
  getDashboardStats,
  getUserProfile,
  getDailyTaskByUserId,
} from "@/lib/db";
import { trackingService, LiveTrackingState } from "@/lib/trackingService";
import type { StoreRow, VisitLogRow, SalesDailyTask } from "@/lib/database.types";
import type { DashboardStats } from "@/lib/db";

export default function MobileHomePage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentVisits, setRecentVisits] = useState<VisitLogRow[]>([]);
  const [trackingState, setTrackingState] = useState<LiveTrackingState | null>(null);
  const [userName, setUserName] = useState<string>("Petugas Lapangan");
  const [selectedVisit, setSelectedVisit] = useState<VisitLogRow | null>(null);
  const [dailyTask, setDailyTask] = useState<SalesDailyTask | null>(null);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const [statsData, visits, profile] = await Promise.all([
          getDashboardStats(),
          getVisitLogs(),
          getUserProfile(),
        ]);
        setStats(statsData);

        // Filter personal activities strictly for the logged-in user
        const personalVisits = profile?.id
          ? visits.filter((v) => !v.user_id || v.user_id === profile.id)
          : visits;

        setRecentVisits(personalVisits.slice(0, 5));
        if (profile?.name) {
          setUserName(profile.name);
        }

        // Fetch Daily Task
        if (profile?.id) {
          const task = await getDailyTaskByUserId(profile.id);
          setDailyTask(task);
        }
      } catch {
        // fallback
      }
      setIsLoading(false);
    };
    loadData();
  }, []);

  // Subscribe to tracking service
  useEffect(() => {
    const unsub = trackingService.subscribe((state) => {
      setTrackingState(state);
    });
    return () => unsub();
  }, []);

  const formatRupiah = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const timeAgo = (dateStr?: string) => {
    if (!dateStr) return "-";
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Baru saja";
    if (mins < 60) return `${mins} menit lalu`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours} jam lalu`;
    return `${Math.floor(hours / 24)} hari lalu`;
  };

  const actualCollectedAmount = recentVisits
    .filter((v) => v.is_paid)
    .reduce((sum, v) => sum + (v.total_amount || 0), 0);

  const targetCollection = dailyTask?.target_collection_amount || 5000000;
  const collectionPercentage = Math.min(
    100,
    Math.round((actualCollectedAmount / Math.max(1, targetCollection)) * 100)
  );

  return (
    <div className="p-4 space-y-4 max-w-lg mx-auto">
      {/* Welcome Card with Target Progress */}
      <div className="rounded-2xl bg-gradient-to-br from-primary-600 to-primary-800 p-5 text-white shadow-lg space-y-3">
        <div>
          <p className="text-sm text-white/70">Selamat datang,</p>
          <h1 className="text-xl font-bold mt-0.5">{userName || "Petugas Lapangan"}</h1>
        </div>

        {/* Daily Collection Progress Bar */}
        <div className="rounded-xl bg-white/10 backdrop-blur-sm p-3 space-y-1.5 border border-white/15">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-white/90">🎯 Target Setoran Harian</span>
            <span className="font-mono font-bold text-accent-300">
              {collectionPercentage}%
            </span>
          </div>
          <div className="h-2 w-full rounded-full bg-black/20 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-accent-400 to-emerald-400 transition-all duration-500"
              style={{ width: `${collectionPercentage}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[10px] text-white/80">
            <span>Terkumpul: {formatRupiah(actualCollectedAmount)}</span>
            <span>Target: {formatRupiah(targetCollection)}</span>
          </div>
        </div>

        {/* Live Stats Row */}
        {stats && (
          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-xl bg-white/15 backdrop-blur-sm p-2.5 text-center">
              <p className="text-lg font-bold">{stats.totalStores}</p>
              <p className="text-[10px] text-white/70">Total Toko</p>
            </div>
            <div className="rounded-xl bg-white/15 backdrop-blur-sm p-2.5 text-center">
              <p className="text-lg font-bold">{recentVisits.length}</p>
              <p className="text-[10px] text-white/70">Visit Anda</p>
            </div>
            <div className="rounded-xl bg-white/15 backdrop-blur-sm p-2.5 text-center">
              <p className="text-base font-bold truncate">
                {formatRupiah(actualCollectedAmount)}
              </p>
              <p className="text-[10px] text-white/70">Tagihan Masuk</p>
            </div>
          </div>
        )}
      </div>

      {/* Live Tracking Status Banner */}
      {trackingState?.isActive && (
        <div className="rounded-2xl border border-blue-200 bg-gradient-to-r from-blue-50 to-primary-50 p-4 shadow-sm animate-pulse-soft">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="h-3 w-3 rounded-full bg-blue-500 animate-ping" />
                <div className="absolute inset-0 h-3 w-3 rounded-full bg-blue-600" />
              </div>
              <div>
                <p className="text-xs font-bold text-navy-900">
                  Shareloc Live Sedang Aktif
                </p>
                <p className="text-[10px] text-foreground-muted">
                  Lokasi Anda dibagikan ke Dashboard Admin (Interval 5 menit)
                </p>
              </div>
            </div>
            <Link
              href="/mobile/lokasi"
              className="rounded-lg bg-blue-600 px-2.5 py-1 text-[10px] font-bold text-white shadow-sm hover:bg-blue-700 active:scale-95"
            >
              Lihat Peta
            </Link>
          </div>
        </div>
      )}

      {/* Quick Actions Grid */}
      <div className="grid grid-cols-2 gap-3">
        {/* ACTION 1: TUGAS HARI INI (REPLACING DAFTAR TOKO BARU) */}
        <button
          type="button"
          onClick={() => setIsTaskModalOpen(true)}
          className="flex flex-col justify-between rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 p-4 text-white shadow-md transition-all active:scale-[0.98] hover:shadow-lg text-left"
        >
          <div className="flex items-center justify-between">
            <div className="rounded-xl bg-white/20 p-2.5">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6">
                <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75Zm13.36-1.814a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z" clipRule="evenodd" />
              </svg>
            </div>
            <span className="rounded bg-white/30 px-1.5 py-0.5 text-[9px] font-extrabold uppercase">
              Target
            </span>
          </div>
          <div className="mt-3">
            <p className="text-sm font-bold">Tugas Hari Ini</p>
            <p className="text-[10px] text-white/80 truncate">
              {dailyTask ? `Target: ${formatRupiah(targetCollection)}` : "Lihat target harian"}
            </p>
          </div>
        </button>

        {/* ACTION 2: SHARELOC LIVE */}
        <Link
          href="/mobile/lokasi"
          className={`flex flex-col justify-between rounded-2xl bg-gradient-to-br p-4 text-white shadow-md transition-all active:scale-[0.98] hover:shadow-lg ${
            trackingState?.isActive
              ? "from-blue-500 to-blue-600 ring-2 ring-blue-400"
              : "from-primary-500 to-primary-600"
          }`}
        >
          <div className="rounded-xl bg-white/20 p-2.5 self-start">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6">
              <path fillRule="evenodd" d="m11.54 22.351.07.04.028.016a.76.76 0 0 0 .723 0l.028-.015.071-.041a16.975 16.975 0 0 0 1.144-.742 19.58 19.58 0 0 0 2.683-2.282c1.944-1.99 3.963-4.98 3.963-8.827a8.25 8.25 0 0 0-16.5 0c0 3.846 2.02 6.837 3.963 8.827a19.58 19.58 0 0 0 3.824 3.024Zm.46-12.6a2.25 2.25 0 1 0 0-4.5 2.25 2.25 0 0 0 0 4.5Z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="mt-3">
            <p className="text-sm font-bold">Shareloc Live</p>
            <p className="text-[10px] text-white/80">
              {trackingState?.isActive ? "Sedang aktif (Live)" : "Mulai tracking GPS"}
            </p>
          </div>
        </Link>

        {/* ACTION 3: SEMUA TOKO */}
        <Link
          href="/mobile/toko"
          className="flex flex-col justify-between rounded-2xl bg-gradient-to-br from-navy-700 to-navy-800 p-4 text-white shadow-md transition-all active:scale-[0.98] hover:shadow-lg"
        >
          <div className="rounded-xl bg-white/20 p-2.5 self-start">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6">
              <path d="M5.223 2.25a.75.75 0 0 1 .67.415L7.5 5.25h9l1.607-2.585A.75.75 0 0 1 18.777 2.25h.778a.75.75 0 0 1 .72.54l1.5 5.25A.75.75 0 0 1 21.055 8.79L21 9v.002A3.75 3.75 0 0 1 18 12.75a3.73 3.73 0 0 1-2.25-.758A3.73 3.73 0 0 1 13.5 12.75a3.73 3.73 0 0 1-2.25-.758A3.73 3.73 0 0 1 9 12.75a3.73 3.73 0 0 1-2.25-.758A3.73 3.73 0 0 1 4.5 12.75 3.75 3.75 0 0 1 1.5 9.002V9l-.054-.21a.75.75 0 0 1 .72-.54h.778a.75.75 0 0 1 .67.415L5.22 11.25" />
              <path fillRule="evenodd" d="M3 13.5v7.125A1.875 1.875 0 0 0 4.875 22.5h14.25A1.875 1.875 0 0 0 21 20.625V13.5" clipRule="evenodd" />
            </svg>
          </div>
          <div className="mt-3">
            <p className="text-sm font-bold">Semua Toko</p>
            <p className="text-[10px] text-white/80">{stats?.totalStores || 0} toko mitra</p>
          </div>
        </Link>

        {/* ACTION 4: TAGIHAN & SETORAN */}
        <Link
          href="/mobile/profil"
          className="flex flex-col justify-between rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 p-4 text-white shadow-md transition-all active:scale-[0.98] hover:shadow-lg"
        >
          <div className="rounded-xl bg-white/20 p-2.5 self-start">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6">
              <path d="M12 7.5a2.25 2.25 0 1 0 0 4.5 2.25 2.25 0 0 0 0-4.5Z" />
              <path fillRule="evenodd" d="M1.5 4.875C1.5 3.839 2.34 3 3.375 3h17.25c1.035 0 1.875.84 1.875 1.875v9.75c0 1.036-.84 1.875-1.875 1.875H3.375A1.875 1.875 0 0 1 1.5 14.625v-9.75ZM8.25 9.75a3.75 3.75 0 1 1 7.5 0 3.75 3.75 0 0 1-7.5 0ZM18.75 9a.75.75 0 0 0-.75.75v.008c0 .414.336.75.75.75h.008a.75.75 0 0 0 .75-.75V9.75a.75.75 0 0 0-.75-.75h-.008ZM4.5 9.75A.75.75 0 0 1 5.25 9h.008a.75.75 0 0 1 .75.75v.008a.75.75 0 0 1-.75.75H5.25a.75.75 0 0 1-.75-.75V9.75Z" clipRule="evenodd" />
              <path d="M2.25 18a.75.75 0 0 0 0 1.5c5.4 0 10.63.722 15.6 2.075 1.19.324 2.4-.558 2.4-1.82V18.75a.75.75 0 0 0-.75-.75H2.25Z" />
            </svg>
          </div>
          <div className="mt-3">
            <p className="text-sm font-bold">Setor Tagihan</p>
            <p className="text-[10px] text-white/80">{formatRupiah(actualCollectedAmount)}</p>
          </div>
        </Link>
      </div>

      {/* Recent Activity - Personal Live Data */}
      <div>
        <h2 className="mb-3 text-sm font-semibold text-navy-700">
          Aktivitas Terakhir
        </h2>

        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="flex items-center justify-between rounded-xl border border-navy-100 bg-white p-3.5 shadow-sm"
              >
                <div className="space-y-1.5">
                  <div className="h-3 w-36 rounded bg-navy-100 animate-pulse" />
                  <div className="h-2 w-20 rounded bg-navy-50 animate-pulse" />
                </div>
                <div className="h-5 w-16 rounded-full bg-navy-50 animate-pulse" />
              </div>
            ))}
          </div>
        ) : recentVisits.length === 0 ? (
          <div className="rounded-xl border border-dashed border-navy-200 bg-white p-6 text-center">
            <p className="text-xs text-navy-400">Belum ada aktivitas kunjungan hari ini.</p>
            <Link
              href="/mobile/toko"
              className="mt-2 inline-block text-xs font-semibold text-primary-600 hover:underline"
            >
              Mulai kunjungan pertama →
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {recentVisits.map((visit) => (
              <div
                key={visit.id}
                onClick={() => setSelectedVisit(visit)}
                className="flex items-center justify-between rounded-xl border border-navy-100 bg-white p-3.5 shadow-sm text-xs cursor-pointer hover:border-primary-300 hover:shadow-md transition-all active:scale-[0.99]"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <p className="font-bold text-navy-900 truncate">
                      {visit.store_name || `Toko #${visit.store_id}`}
                    </p>
                    <span className="text-[10px] text-primary-600 font-semibold shrink-0">
                      Detail →
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-1 text-[10px] text-foreground-muted">
                    <span>🕒 {timeAgo(visit.created_at)}</span>
                    {visit.is_ordered && (
                      <span className="rounded bg-accent-50 px-1.5 py-0.5 text-accent-700 font-semibold border border-accent-200">
                        🛍️ Order
                      </span>
                    )}
                    {visit.is_paid && (
                      <span className="rounded bg-blue-50 px-1.5 py-0.5 text-blue-700 font-semibold border border-blue-200">
                        💰 Lunas
                      </span>
                    )}
                  </div>
                </div>
                <span
                  className={`shrink-0 ml-2 rounded-full px-2.5 py-1 text-[10px] font-bold ${
                    visit.is_open
                      ? "bg-accent-50 text-accent-700 border border-accent-200"
                      : "bg-navy-100 text-navy-600 border border-navy-200"
                  }`}
                >
                  {visit.is_open ? "🟢 Buka" : "🔴 Tutup"}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* DETAIL TUGAS HARI INI MODAL */}
      {isTaskModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl space-y-4 animate-slide-up max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-navy-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-navy-900">
                  🎯 Target Tugas Harian Sales
                </h3>
                <p className="text-[10px] text-foreground-muted">
                  Tanggal: {new Date().toLocaleDateString("id-ID", { dateStyle: "full" })}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsTaskModalOpen(false)}
                className="rounded-lg p-1.5 text-navy-400 hover:bg-navy-50 hover:text-navy-700"
              >
                ✕
              </button>
            </div>

            {/* Target Setoran Rp Card */}
            <div className="rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 p-3.5 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-amber-900">Target Tagihan / Setoran</span>
                <span className="font-mono font-bold text-amber-800">
                  {formatRupiah(targetCollection)}
                </span>
              </div>

              <div className="h-2 w-full rounded-full bg-amber-200 overflow-hidden">
                <div
                  className="h-full rounded-full bg-amber-600 transition-all duration-500"
                  style={{ width: `${collectionPercentage}%` }}
                />
              </div>

              <div className="flex justify-between items-center text-[10px] text-amber-900">
                <span>Terkumpul: <strong>{formatRupiah(actualCollectedAmount)}</strong></span>
                <span>Progress: <strong>{collectionPercentage}%</strong></span>
              </div>
            </div>

            {/* Target Bahan Baku List */}
            <div className="space-y-2">
              <span className="block text-xs font-bold text-navy-900">
                Target Jualan Bahan Baku Hari Ini
              </span>

              {dailyTask?.target_products && dailyTask.target_products.length > 0 ? (
                <div className="space-y-2">
                  {dailyTask.target_products.map((item) => {
                    const itemPct = Math.min(
                      100,
                      Math.round(((item.sold_qty || 0) / Math.max(1, item.target_qty)) * 100)
                    );
                    return (
                      <div
                        key={item.product_id}
                        className="rounded-xl border border-navy-100 p-3 bg-surface-dim space-y-1.5"
                      >
                        <div className="flex justify-between text-xs font-semibold text-navy-900">
                          <span className="truncate pr-2">{item.product_name}</span>
                          <span className="font-mono text-accent-700 shrink-0">
                            {item.sold_qty || 0} / {item.target_qty}
                          </span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-navy-200 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-accent-600"
                            style={{ width: `${itemPct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-navy-400 italic">
                  Belum ada target khusus bahan baku dari Admin hari ini.
                </p>
              )}
            </div>

            {/* Status Setoran Harian */}
            <div className="rounded-xl border border-navy-100 p-3 bg-white space-y-1 text-xs">
              <span className="text-[10px] text-foreground-muted block">Status Setoran Hari Ini:</span>
              <div className="flex items-center justify-between">
                <span
                  className={`inline-block rounded-full px-2.5 py-1 text-[11px] font-bold ${
                    dailyTask?.deposit_status === "approved"
                      ? "bg-accent-50 text-accent-700 border border-accent-200"
                      : dailyTask?.deposit_status === "waiting_confirmation"
                      ? "bg-amber-50 text-amber-800 border border-amber-300"
                      : "bg-navy-100 text-navy-700 border border-navy-200"
                  }`}
                >
                  {dailyTask?.deposit_status === "approved"
                    ? "✓ Setoran Telah Disetujui Admin"
                    : dailyTask?.deposit_status === "waiting_confirmation"
                    ? "⏳ Menunggu Konfirmasi Admin"
                    : "Belum Disetorkan"}
                </span>

                <Link
                  href="/mobile/profil"
                  onClick={() => setIsTaskModalOpen(false)}
                  className="rounded-lg bg-primary-600 px-3 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-primary-700 active:scale-95"
                >
                  Setor Tagihan →
                </Link>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsTaskModalOpen(false)}
              className="w-full rounded-xl bg-navy-900 py-2.5 text-xs font-bold text-white hover:bg-navy-800 active:scale-95"
            >
              Tutup
            </button>
          </div>
        </div>
      )}

      {/* DETAIL RIWAYAT KUNJUNGAN MODAL */}
      {selectedVisit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl space-y-4 animate-slide-up max-h-[85vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-navy-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-navy-900">
                  Detail Riwayat Kunjungan
                </h3>
                <p className="text-[10px] text-foreground-muted">
                  ID Kunjungan: {selectedVisit.id}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedVisit(null)}
                className="rounded-lg p-1.5 text-navy-400 hover:bg-navy-50 hover:text-navy-700"
              >
                ✕
              </button>
            </div>

            {/* Store Name & Time */}
            <div className="rounded-xl bg-surface-dim p-3 border border-navy-100 space-y-1.5">
              <p className="text-xs font-bold text-navy-950">
                🏪 {selectedVisit.store_name || `Toko #${selectedVisit.store_id}`}
              </p>
              <p className="text-[11px] text-foreground-muted">
                Waktu Kunjungan:{" "}
                <span className="font-semibold text-navy-800">
                  {selectedVisit.created_at
                    ? new Date(selectedVisit.created_at).toLocaleString("id-ID")
                    : "-"}
                </span>
              </p>
            </div>

            {/* Status Badges Grid */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="rounded-xl border border-navy-100 p-2.5 bg-white space-y-1">
                <span className="text-[10px] text-foreground-muted block">Status Toko:</span>
                <span
                  className={`inline-block rounded-full px-2 py-0.5 text-[11px] font-bold ${
                    selectedVisit.is_open
                      ? "bg-accent-50 text-accent-700 border border-accent-200"
                      : "bg-danger-50 text-danger-700 border border-danger-200"
                  }`}
                >
                  {selectedVisit.is_open ? "🟢 Toko Buka" : "🔴 Toko Tutup"}
                </span>
              </div>

              <div className="rounded-xl border border-navy-100 p-2.5 bg-white space-y-1">
                <span className="text-[10px] text-foreground-muted block">Aktivitas Penjualan:</span>
                <span
                  className={`inline-block rounded-full px-2 py-0.5 text-[11px] font-bold ${
                    selectedVisit.is_ordered
                      ? "bg-primary-50 text-primary-700 border border-primary-200"
                      : "bg-navy-50 text-navy-600 border border-navy-200"
                  }`}
                >
                  {selectedVisit.is_ordered ? "🛍️ Ada Order" : "🚫 Tidak Order"}
                </span>
              </div>
            </div>

            {/* Financial Details */}
            <div className="rounded-xl border border-navy-100 p-3 bg-white space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-navy-600 font-medium">Status Pembayaran:</span>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                    selectedVisit.is_paid
                      ? "bg-accent-50 text-accent-700 border border-accent-200"
                      : "bg-warning-50 text-warning-700 border border-warning-200"
                  }`}
                >
                  {selectedVisit.is_paid ? "✓ Lunas / Terbayar" : "⏳ Belum Lunas"}
                </span>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-navy-50">
                <span className="text-navy-600 font-medium">Nominal Tagihan:</span>
                <span className="font-mono font-bold text-sm text-navy-950">
                  {formatRupiah(selectedVisit.total_amount || 0)}
                </span>
              </div>
            </div>

            {/* Notes */}
            <div className="rounded-xl border border-navy-100 p-3 bg-surface-dim space-y-1 text-xs">
              <span className="text-[10px] font-bold text-navy-700 block">Catatan Kunjungan:</span>
              <p className="text-navy-800 italic text-[11px]">
                "{selectedVisit.notes || "Kunjungan rutin harian"}"
              </p>
            </div>

            {/* Close Button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setSelectedVisit(null)}
                className="w-full rounded-xl bg-navy-900 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-navy-800 active:scale-95 transition-all"
              >
                Tutup Detail
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
