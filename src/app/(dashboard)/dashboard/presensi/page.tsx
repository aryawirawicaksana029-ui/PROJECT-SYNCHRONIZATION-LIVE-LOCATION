"use client";

import { useState, useEffect } from "react";
import { getLocationLogs, getStores, getUsers } from "@/lib/db";

export default function LogPresensiPage() {
  const [presensiPings, setPresensiPings] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    return new Date().toISOString().split("T")[0];
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "success" | "gps_denied" | "failed">("all");

  useEffect(() => {
    Promise.all([getLocationLogs(), getStores(), getUsers()]).then(
      ([logs, stores, users]) => {
        const salesUsers = users.filter((u) => u.role === "sales");
        const defaultSalesName = salesUsers[0]?.name || "Ahmad Faisal";

        const mapped = logs.map((l, i) => {
          const matchedStore = stores.find((s) => s.id === l.store_id);
          const matchedUser = users.find((u) => u.id === l.user_id);

          const formattedStoreName = matchedStore
            ? matchedStore.kode_toko
              ? `${matchedStore.name} (${matchedStore.kode_toko})`
              : matchedStore.name
            : "Toko Sembako Berkah Jaya (RS-001)";

          const salesName = matchedUser
            ? matchedUser.name
            : salesUsers[i % Math.max(1, salesUsers.length)]?.name || defaultSalesName;

          const dateObj = l.created_at ? new Date(l.created_at) : new Date();
          const pingDate = dateObj.toISOString().split("T")[0];
          const pingTimestamp = dateObj.toLocaleString("id-ID", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          });

          return {
            id: l.id || `p${i}`,
            ping_date: pingDate,
            ping_timestamp: pingTimestamp,
            store_name: formattedStoreName,
            user_name: salesName,
            latitude: l.latitude,
            longitude: l.longitude,
            battery_level: l.battery_level || 90,
            ping_status: l.ping_status || "success",
          };
        });
        setPresensiPings(mapped);
      }
    );
  }, []);

  const filteredPings = presensiPings.filter((ping) => {
    const matchesSearch =
      ping.store_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ping.user_name.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || ping.ping_status === statusFilter;

    const matchesDate = !selectedDate || ping.ping_date === selectedDate;

    return matchesSearch && matchesStatus && matchesDate;
  });

  const totalSuccess = presensiPings.filter((p) => p.ping_status === "success").length;
  const totalGpsDenied = presensiPings.filter((p) => p.ping_status === "gps_denied").length;
  const totalFailed = presensiPings.filter((p) => p.ping_status === "failed").length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-navy-900">Log Presensi Ping</h1>
          <p className="mt-0.5 text-xs text-foreground-muted">
            Riwayat presensi otomatis (heartbeat 5 menit) per toko & petugas lapangan
          </p>
        </div>

        <button
          onClick={() => window.print()}
          className="flex items-center gap-1.5 rounded-xl border border-navy-200 bg-white px-3.5 py-2 text-xs font-bold text-navy-700 shadow-sm hover:bg-navy-50 active:scale-95 self-start sm:self-auto"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="h-4 w-4 text-navy-500"
          >
            <path
              fillRule="evenodd"
              d="M5 2.75C5 1.784 5.784 1 6.75 1h6.5c.966 0 1.75.784 1.75 1.75v3.5A1.75 1.75 0 0113.25 8H6.75A1.75 1.75 0 015 6.25v-3.5zm1.75-.25a.25.25 0 00-.25.25v3.5c0 .138.112.25.25.25h6.5a.25.25 0 00.25-.25v-3.5a.25.25 0 00-.25-.25h-6.5z"
              clipRule="evenodd"
            />
            <path
              fillRule="evenodd"
              d="M3 8.75A2.75 2.75 0 015.75 6h8.5A2.75 2.75 0 0117 8.75v3.5A2.75 2.75 0 0114.25 15H13v2.25A1.75 1.75 0 0111.25 19h-2.5A1.75 1.75 0 017 17.25V15H5.75A2.75 2.75 0 013 12.25v-3.5zM8.5 15v2.25c0 .138.112.25.25.25h2.5a.25.25 0 00.25-.25V15h-3z"
              clipRule="evenodd"
            />
          </svg>
          <span>Cetak / Ekspor Log</span>
        </button>
      </div>

      {/* Summary Stat Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-2xl border border-navy-100 bg-white p-4 shadow-sm">
          <p className="text-[11px] font-semibold text-navy-500">Total Ping Hari Ini</p>
          <p className="text-xl font-bold text-navy-900 mt-1">{presensiPings.length}</p>
        </div>
        <div className="rounded-2xl border border-accent-200 bg-accent-50/60 p-4 shadow-sm">
          <p className="text-[11px] font-semibold text-accent-700">🟢 Ping Sukses</p>
          <p className="text-xl font-bold text-accent-800 mt-1">{totalSuccess}</p>
        </div>
        <div className="rounded-2xl border border-warning-500/30 bg-warning-500/10 p-4 shadow-sm">
          <p className="text-[11px] font-semibold text-warning-700">🟡 GPS Ditolak / Off</p>
          <p className="text-xl font-bold text-warning-800 mt-1">{totalGpsDenied}</p>
        </div>
        <div className="rounded-2xl border border-danger-500/30 bg-danger-500/10 p-4 shadow-sm">
          <p className="text-[11px] font-semibold text-danger-700">🔴 Gagal / Sinyal Hilang</p>
          <p className="text-xl font-bold text-danger-800 mt-1">{totalFailed}</p>
        </div>
      </div>

      {/* Controls & Filter */}
      <div className="rounded-2xl border border-navy-100 bg-white p-4 shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Date Filter */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-[11px] font-semibold text-navy-700">
                Filter Tanggal
              </label>
              {selectedDate ? (
                <button
                  type="button"
                  onClick={() => setSelectedDate("")}
                  className="text-[10px] text-primary-600 font-semibold hover:underline"
                >
                  Semua Tanggal
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setSelectedDate(new Date().toISOString().split("T")[0])}
                  className="text-[10px] text-primary-600 font-semibold hover:underline"
                >
                  Hari Ini
                </button>
              )}
            </div>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full rounded-xl border border-navy-200 bg-surface-dim px-3 py-2 text-xs font-semibold text-navy-900 outline-none focus:border-primary-500"
            />
          </div>

          {/* Store / Petugas Search Filter */}
          <div>
            <label className="block text-[11px] font-semibold text-navy-700 mb-1">
              Cari Nama Toko / Petugas
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Contoh: Berkah Jaya / Ahmad..."
              className="w-full rounded-xl border border-navy-200 bg-surface-dim px-3 py-2 text-xs text-navy-900 outline-none focus:border-primary-500"
            />
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-[11px] font-semibold text-navy-700 mb-1">
              Status Ping
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full rounded-xl border border-navy-200 bg-surface-dim px-3 py-2 text-xs font-semibold text-navy-900 outline-none focus:border-primary-500"
            >
              <option value="all">Semua Status</option>
              <option value="success">🟢 Sukses</option>
              <option value="gps_denied">🟡 GPS Ditolak</option>
              <option value="failed">🔴 Gagal / Timeout</option>
            </select>
          </div>
        </div>
      </div>

      {/* Responsive Presensi Table */}
      <div className="rounded-2xl border border-navy-100 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-navy-900">
            <thead className="bg-navy-950 text-white font-semibold">
              <tr>
                <th className="px-4 py-3.5">Waktu Ping</th>
                <th className="px-4 py-3.5">Nama Toko</th>
                <th className="px-4 py-3.5">Petugas Lapangan</th>
                <th className="px-4 py-3.5">Koordinat GPS</th>
                <th className="px-4 py-3.5">Baterai HP</th>
                <th className="px-4 py-3.5 text-center">Status Ping</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-navy-100">
              {filteredPings.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-navy-400">
                    Tidak ada log presensi yang sesuai filter.
                  </td>
                </tr>
              ) : (
                filteredPings.map((ping) => (
                  <tr key={ping.id} className="hover:bg-navy-50/80 transition-colors">
                    <td className="px-4 py-3 font-mono text-navy-700 font-medium">
                      {ping.ping_timestamp}
                    </td>
                    <td className="px-4 py-3 font-bold text-navy-900">
                      {ping.store_name}
                    </td>
                    <td className="px-4 py-3 font-medium text-navy-700">
                      👤 {ping.user_name}
                    </td>
                    <td className="px-4 py-3 font-mono text-[11px] text-navy-600">
                      {ping.latitude !== null && ping.longitude !== null ? (
                        <span className="text-primary-700 font-semibold">
                          📍 {ping.latitude}, {ping.longitude}
                        </span>
                      ) : (
                        <span className="text-navy-400 italic">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <div className="w-12 bg-navy-100 rounded-full h-2 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              ping.battery_level > 50
                                ? "bg-accent-500"
                                : ping.battery_level > 20
                                ? "bg-warning-500"
                                : "bg-danger-500"
                            }`}
                            style={{ width: `${ping.battery_level}%` }}
                          />
                        </div>
                        <span className="font-mono text-[10px] font-bold text-navy-700">
                          {ping.battery_level}%
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                          ping.ping_status === "success"
                            ? "bg-accent-50 text-accent-700 border border-accent-200"
                            : ping.ping_status === "gps_denied"
                            ? "bg-warning-500/10 text-warning-700 border border-warning-500/30"
                            : "bg-danger-500/10 text-danger-700 border border-danger-500/30"
                        }`}
                      >
                        {ping.ping_status === "success"
                          ? "🟢 Sukses"
                          : ping.ping_status === "gps_denied"
                          ? "🟡 GPS Off"
                          : "🔴 Gagal"}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
