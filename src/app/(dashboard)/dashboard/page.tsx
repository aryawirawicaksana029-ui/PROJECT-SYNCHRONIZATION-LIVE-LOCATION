"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { getStores, getVisitLogs, getUsers } from "@/lib/db";
import { formatRupiah } from "@/lib/catalogData";

// Dynamically import Recharts to avoid SSR issues
const RechartsChart = dynamic(() => import("@/components/DashboardChart"), {
  ssr: false,
  loading: () => (
    <div className="flex h-72 w-full flex-col items-center justify-center rounded-2xl border border-navy-100 bg-navy-50 text-navy-400">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary-600 border-t-transparent mb-2" />
      <span className="text-xs font-medium">Memuat Grafik...</span>
    </div>
  ),
});

export default function DashboardHomePage() {
  const [totalVisitedCount, setTotalVisitedCount] = useState(0);
  const [totalStoreCount, setTotalStoreCount] = useState(0);
  const [totalBillAmount, setTotalBillAmount] = useState(0);
  const [unvisitedCount, setUnvisitedCount] = useState(0);
  const [liveTrackingCount, setLiveTrackingCount] = useState(0);
  const [recentVisits, setRecentVisits] = useState<any[]>([]);

  useEffect(() => {
    Promise.all([getStores(), getVisitLogs(), getUsers()]).then(
      ([storesData, visitsData, usersData]) => {
        setTotalStoreCount(storesData.length);

        const trackingActive = storesData.filter((s) => s.is_tracking_active).length;
        setLiveTrackingCount(trackingActive);

        const visitedStoreIds = new Set(visitsData.map((v) => v.store_id));
        const uniqueVisited = storesData.filter((s) => visitedStoreIds.has(s.id)).length;
        setTotalVisitedCount(uniqueVisited);

        const totalAmountSum = visitsData.reduce(
          (sum, v) => sum + (v.total_amount || 0),
          0
        );
        setTotalBillAmount(totalAmountSum);

        const unvisited = storesData.filter((s) => !visitedStoreIds.has(s.id) || s.current_status === "closed").length;
        setUnvisitedCount(unvisited);

        const salesUsers = usersData.filter((u) => u.role === "sales");
        const defaultSalesName = salesUsers[0]?.name || "Ahmad Faisal";

        const recentMapped = visitsData.slice(0, 5).map((v, i) => {
          const matchedUser = usersData.find((u) => u.id === v.user_id);
          const salesName = matchedUser
            ? matchedUser.name
            : salesUsers[i % Math.max(1, salesUsers.length)]?.name || defaultSalesName;

          return {
            id: v.id || `v-${i}`,
            store_name: v.store_name || "Toko Sembako Berkah Jaya",
            petugas: salesName,
            time: v.created_at
              ? new Date(v.created_at).toLocaleTimeString("id-ID", {
                  hour: "2-digit",
                  minute: "2-digit",
                }) + " WIB"
              : "10:45 WIB",
            status_toko: v.is_open ? "open" : "closed",
            order: v.is_ordered ? "order" : "no_order",
            payment: v.is_paid ? "paid" : "unpaid",
            amount: formatRupiah(v.total_amount || 0),
          };
        });
        setRecentVisits(recentMapped);
      }
    );
  }, []);

  const stats = [
    {
      label: "Total Toko",
      value: `${totalStoreCount} Toko`,
      subtext: `${totalVisitedCount} / ${totalStoreCount} toko telah dikunjungi`,
      color: "text-primary-600 bg-primary-50 border-primary-200 group-hover:bg-primary-600 group-hover:text-white",
      href: "/dashboard/toko",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6 transition-colors">
          <path d="M5.223 2.25a.75.75 0 0 1 .67.415L7.5 5.25h9l1.607-2.585A.75.75 0 0 1 18.777 2.25h.778a.75.75 0 0 1 .72.54l1.5 5.25A.75.75 0 0 1 21.055 8.79L21 9v.002A3.75 3.75 0 0 1 18 12.75a3.73 3.73 0 0 1-2.25-.758A3.73 3.73 0 0 1 13.5 12.75a3.73 3.73 0 0 1-2.25-.758A3.73 3.73 0 0 1 9 12.75a3.73 3.73 0 0 1-2.25-.758A3.73 3.73 0 0 1 4.5 12.75 3.75 3.75 0 0 1 1.5 9.002V9l-.054-.21a.75.75 0 0 1 .72-.54h.778a.75.75 0 0 1 .67.415L5.22 11.25" />
          <path fillRule="evenodd" d="M3 13.5v7.125A1.875 1.875 0 0 0 4.875 22.5h14.25A1.875 1.875 0 0 0 21 20.625V13.5" clipRule="evenodd" />
        </svg>
      ),
    },
    {
      label: "Total Tagihan Masuk (Rp)",
      value: formatRupiah(totalBillAmount),
      subtext: "Total penerimaan tagihan",
      color: "text-accent-700 bg-accent-50 border-accent-200 group-hover:bg-accent-600 group-hover:text-white",
      href: "/dashboard/laporan",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6 transition-colors">
          <path d="M12 7.5a2.25 2.25 0 1 0 0 4.5 2.25 2.25 0 0 0 0-4.5Z" />
          <path fillRule="evenodd" d="M1.5 4.875C1.5 3.839 2.34 3 3.375 3h17.25c1.035 0 1.875.84 1.875 1.875v9.75c0 1.036-.84 1.875-1.875 1.875H3.375A1.875 1.875 0 0 1 1.5 14.625v-9.75ZM8.25 9.75a3.75 3.75 0 1 1 7.5 0 3.75 3.75 0 0 1-7.5 0ZM18.75 9a.75.75 0 0 0-.75.75v.008c0 .414.336.75.75.75h.008a.75.75 0 0 0 .75-.75V9.75a.75.75 0 0 0-.75-.75h-.008ZM4.5 9.75A.75.75 0 0 1 5.25 9h.008a.75.75 0 0 1 .75.75v.008a.75.75 0 0 1-.75.75H5.25a.75.75 0 0 1-.75-.75V9.75Z" clipRule="evenodd" />
          <path d="M2.25 18a.75.75 0 0 0 0 1.5c5.4 0 10.63.722 15.6 2.075 1.19.324 2.4-.558 2.4-1.82V18.75a.75.75 0 0 0-.75-.75H2.25Z" />
        </svg>
      ),
    },
    {
      label: "Toko Tutup",
      value: `${unvisitedCount} Toko`,
      subtext: unvisitedCount === 0 ? "Semua toko buka/beroperasi" : "Toko tutup / belum dikunjungi",
      color: "text-danger-600 bg-danger-50 border-danger-200 group-hover:bg-danger-600 group-hover:text-white",
      href: "/dashboard/peta",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6 transition-colors">
          <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12ZM12 8.25a.75.75 0 0 1 .75.75v3.75a.75.75 0 0 1-1.5 0V9a.75.75 0 0 1 .75-.75Zm0 8.25a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Z" clipRule="evenodd" />
        </svg>
      ),
    },
    {
      label: "Toko yang Sedang Dikunjungi",
      value: `${liveTrackingCount} Toko`,
      subtext: "Tracking lokasi real-time",
      color: "text-primary-700 bg-primary-50 border-primary-200 group-hover:bg-primary-700 group-hover:text-white",
      href: "/dashboard/peta",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6 transition-colors">
          <path fillRule="evenodd" d="m11.54 22.351.07.04.028.016a.76.76 0 0 0 .723 0l.028-.015.071-.041a16.975 16.975 0 0 0 1.144-.742 19.58 19.58 0 0 0 2.683-2.282c1.944-1.99 3.963-4.98 3.963-8.827a8.25 8.25 0 0 0-16.5 0c0 3.846 2.02 6.837 3.963 8.827a19.58 19.58 0 0 0 3.824 3.024Zm.46-12.6a2.25 2.25 0 1 0 0-4.5 2.25 2.25 0 0 0 0 4.5Z" clipRule="evenodd" />
        </svg>
      ),
    },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-navy-900">
            Dashboard Monitoring
          </h1>
          <p className="mt-0.5 text-xs text-foreground-muted">
            Monitoring posisi live petugas lapangan, status operasional toko, dan arus kas tagihan
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/dashboard/peta"
            className="flex items-center gap-1.5 rounded-xl bg-navy-900 px-3.5 py-2 text-xs font-bold text-white shadow-md hover:bg-navy-800 transition-all active:scale-95"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="h-4 w-4 text-accent-400"
            >
              <path
                fillRule="evenodd"
                d="M8.161 2.58a1.875 1.875 0 011.678 0l4.993 2.498c.106.052.23.052.336 0l3.869-1.935A1.875 1.875 0 0121.75 4.82v12.485c0 .71-.401 1.36-1.037 1.677l-4.875 2.437a1.875 1.875 0 01-1.676 0l-4.994-2.497a.375.375 0 00-.336 0l-3.868 1.935A1.875 1.875 0 012.25 19.18V6.695c0-.71.401-1.36 1.036-1.677l4.875-2.437ZM9 6a.75.75 0 01.75.75V15a.75.75 0 01-1.5 0V6.75A.75.75 0 019 6Zm6.75 3a.75.75 0 00-1.5 0v8.25a.75.75 0 001.5 0V9Z"
                clipRule="evenodd"
              />
            </svg>
            <span>Peta Fullscreen</span>
          </Link>
        </div>
      </div>

      {/* Widget Card Ringkasan - Interactive & Clickable */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat, i) => (
          <Link
            key={stat.label}
            href={stat.href}
            className="group block rounded-2xl border border-navy-100 bg-white p-5 shadow-sm transition-all hover:shadow-lg hover:border-primary-300 hover:-translate-y-0.5 active:scale-[0.98] animate-slide-up"
            style={{ animationDelay: `${i * 70}ms` }}
          >
            <div className="flex items-center justify-between">
              <span className={`rounded-xl p-3 border transition-all ${stat.color}`}>
                {stat.icon}
              </span>
              <span className="text-xs font-semibold text-navy-400 group-hover:text-primary-600 transition-colors">
                Buka →
              </span>
            </div>
            <div className="mt-4">
              <p className="text-2xl font-black text-navy-900 tracking-tight group-hover:text-primary-700 transition-colors">
                {stat.value}
              </p>
              <p className="mt-0.5 text-xs font-semibold text-navy-700">
                {stat.label}
              </p>
              <p className="mt-1 text-[11px] text-foreground-muted">
                {stat.subtext}
              </p>
            </div>
          </Link>
        ))}
      </div>

      {/* Grafik Cash Flow + Recent Visits (replacing map area) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left 2 Cols: Cash Flow Area Chart */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-navy-900">
              Grafik Arus Kas & Tagihan Bulanan
            </h2>
            <Link
              href="/dashboard/laporan"
              className="text-xs font-bold text-primary-600 hover:text-primary-700"
            >
              Lihat Detail →
            </Link>
          </div>

          <RechartsChart totalBillAmount={totalBillAmount} />
        </div>

        {/* Right Col: Feed Kunjungan & Tagihan Terbaru */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-navy-900">
              Aktivitas Kunjungan Terbaru
            </h2>
            <Link
              href="/dashboard/laporan"
              className="text-xs font-bold text-primary-600 hover:text-primary-700"
            >
              Lihat Laporan →
            </Link>
          </div>

          <div className="rounded-2xl border border-navy-100 bg-white p-4 shadow-sm space-y-3">
            {recentVisits.length === 0 ? (
              <div className="p-6 text-center text-xs text-navy-400">
                Belum ada aktivitas kunjungan tercatat.
              </div>
            ) : (
              recentVisits.map((visit) => (
                <div
                  key={visit.id}
                  className="flex flex-col gap-1.5 rounded-xl border border-navy-50 bg-surface-dim p-3 text-xs transition-all hover:bg-navy-50"
                >
                  <div className="flex items-start justify-between gap-1">
                    <h4 className="font-bold text-navy-900 leading-snug">
                      {visit.store_name}
                    </h4>
                    <span className="text-[10px] font-mono text-navy-400">
                      {visit.time}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-navy-600 font-medium">
                    <span>👤 {visit.petugas}</span>
                    <span className="font-mono font-bold text-accent-700">
                      {visit.amount}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 pt-1 border-t border-navy-100/60 text-[10px]">
                    <span
                      className={`rounded px-1.5 py-0.5 font-semibold ${
                        visit.status_toko === "open"
                          ? "bg-accent-50 text-accent-700"
                          : "bg-navy-200 text-navy-700"
                      }`}
                    >
                      {visit.status_toko === "open" ? "🟢 Buka" : "🔴 Tutup"}
                    </span>

                    <span className="rounded bg-primary-50 text-primary-700 px-1.5 py-0.5 font-semibold">
                      {visit.order === "order" ? "🛍️ Order" : "🚫 No Order"}
                    </span>

                    <span className="rounded bg-blue-50 text-blue-700 px-1.5 py-0.5 font-semibold ml-auto">
                      {visit.payment === "paid" ? "💰 Lunas" : "⏳ Unpaid"}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
