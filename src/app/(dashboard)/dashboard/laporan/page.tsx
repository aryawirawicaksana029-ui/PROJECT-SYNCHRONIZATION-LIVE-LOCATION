"use client";

import { useState, useEffect } from "react";
import { getVisitLogs, getUsers } from "@/lib/db";

// Helper for formatting IDR numbers
function formatRupiah(num: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(num);
}

export default function LaporanTagihanPage() {
  const [billsData, setBillsData] = useState<any[]>([]);
  const [dateFrom, setDateFrom] = useState<string>(() => {
    return new Date().toISOString().split("T")[0];
  });
  const [dateTo, setDateTo] = useState<string>(() => {
    return new Date().toISOString().split("T")[0];
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [paymentFilter, setPaymentFilter] = useState<"all" | "paid" | "unpaid">("all");

  useEffect(() => {
    Promise.all([getVisitLogs(), getUsers()]).then(([logs, users]) => {
      const salesUsers = users.filter((u) => u.role === "sales");
      const defaultSalesName = salesUsers[0]?.name || "Ahmad Faisal";

      const mapped = logs.map((v, i) => {
        const matchedUser = users.find((u) => u.id === v.user_id);
        const salesName = matchedUser
          ? matchedUser.name
          : salesUsers[i % Math.max(1, salesUsers.length)]?.name || defaultSalesName;

        return {
          id: v.id || `b${i}`,
          visit_date: v.created_at ? v.created_at.split("T")[0] : "2026-08-13",
          store_name: v.store_name || "Toko Sembako Berkah Jaya (RS-001)",
          user_name: salesName,
          operational_status: v.is_open ? "open" : "closed",
          order_status: v.is_ordered ? "order" : "no_order",
          payment_status: v.is_paid ? "paid" : "unpaid",
          bill_amount: v.total_amount || 0,
          notes: v.notes || "-",
        };
      });
      setBillsData(mapped);
    });
  }, []);

  const filteredBills = billsData.filter((b) => {
    const matchesSearch =
      b.store_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.user_name.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesPayment =
      paymentFilter === "all" || b.payment_status === paymentFilter;

    const matchesDate =
      (!dateFrom || b.visit_date >= dateFrom) &&
      (!dateTo || b.visit_date <= dateTo);

    return matchesSearch && matchesPayment && matchesDate;
  });

  // Aggregate summary calculation
  const totalNominalTerbayar = filteredBills.reduce(
    (sum, b) => sum + (b.bill_amount || 0),
    0
  );
  const totalTransaksiBayar = filteredBills.filter(
    (b) => b.payment_status === "paid"
  ).length;
  const totalAdaOrder = filteredBills.filter(
    (b) => b.order_status === "order"
  ).length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page Title & Export */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-navy-900">
            Laporan Tagihan & Kunjungan
          </h1>
          <p className="mt-0.5 text-xs text-foreground-muted">
            Rekapitulasi total penerimaan tagihan harian dari petugas lapangan
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
          <span>Cetak / PDF Laporan</span>
        </button>
      </div>

      {/* Aggregate Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-accent-200 bg-gradient-to-br from-accent-500 to-accent-700 p-5 text-white shadow-lg shadow-accent-600/20">
          <p className="text-xs text-white/80 font-medium">
            Total Tagihan Terbayar
          </p>
          <p className="text-2xl font-black mt-1 font-mono tracking-tight">
            {formatRupiah(totalNominalTerbayar)}
          </p>
          <p className="text-[11px] text-white/70 mt-1">
            Dari {totalTransaksiBayar} transaksi terbayar
          </p>
        </div>

        <div className="rounded-2xl border border-navy-100 bg-white p-5 shadow-sm">
          <p className="text-xs text-navy-500 font-medium">Total Kunjungan Toko</p>
          <p className="text-2xl font-bold text-navy-900 mt-1">
            {filteredBills.length} Visit
          </p>
          <p className="text-[11px] text-foreground-muted mt-1">
            Terbuka & Tercatat
          </p>
        </div>

        <div className="rounded-2xl border border-navy-100 bg-white p-5 shadow-sm">
          <p className="text-xs text-navy-500 font-medium">Kunjungan dengan Order</p>
          <p className="text-2xl font-bold text-primary-600 mt-1">
            {totalAdaOrder} Toko
          </p>
          <p className="text-[11px] text-foreground-muted mt-1">
            Status Order Aktif
          </p>
        </div>
      </div>

      {/* Date Range & Filters */}
      <div className="rounded-2xl border border-navy-100 bg-white p-4 shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-[11px] font-semibold text-navy-700">
                Dari Tanggal
              </label>
              {(dateFrom || dateTo) && (
                <button
                  type="button"
                  onClick={() => {
                    setDateFrom("");
                    setDateTo("");
                  }}
                  className="text-[10px] text-primary-600 font-semibold hover:underline"
                >
                  Semua
                </button>
              )}
            </div>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full rounded-xl border border-navy-200 bg-surface-dim px-3 py-2 text-xs font-semibold text-navy-900 outline-none focus:border-primary-500"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-[11px] font-semibold text-navy-700">
                Sampai Tanggal
              </label>
              {(!dateFrom && !dateTo) && (
                <button
                  type="button"
                  onClick={() => {
                    const today = new Date().toISOString().split("T")[0];
                    setDateFrom(today);
                    setDateTo(today);
                  }}
                  className="text-[10px] text-primary-600 font-semibold hover:underline"
                >
                  Hari Ini
                </button>
              )}
            </div>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full rounded-xl border border-navy-200 bg-surface-dim px-3 py-2 text-xs font-semibold text-navy-900 outline-none focus:border-primary-500"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-navy-700 mb-1">
              Status Pembayaran
            </label>
            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value as any)}
              className="w-full rounded-xl border border-navy-200 bg-surface-dim px-3 py-2 text-xs font-semibold text-navy-900 outline-none focus:border-primary-500"
            >
              <option value="all">Semua Tagihan</option>
              <option value="paid">💵 Bayar (Paid)</option>
              <option value="unpaid">❌ Tidak Bayar (Unpaid)</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-navy-700 mb-1">
              Cari Toko / Sales
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari toko / sales..."
              className="w-full rounded-xl border border-navy-200 bg-surface-dim px-3 py-2 text-xs text-navy-900 outline-none focus:border-primary-500"
            />
          </div>
        </div>
      </div>

      {/* Laporan Table */}
      <div className="rounded-2xl border border-navy-100 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-navy-900">
            <thead className="bg-navy-950 text-white font-semibold">
              <tr>
                <th className="px-4 py-3.5">Tanggal Visit</th>
                <th className="px-4 py-3.5">Nama Toko</th>
                <th className="px-4 py-3.5">Petugas Lapangan</th>
                <th className="px-4 py-3.5">Status Toko</th>
                <th className="px-4 py-3.5">Status Order</th>
                <th className="px-4 py-3.5">Status Pembayaran</th>
                <th className="px-4 py-3.5 text-right">Nominal Tagihan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-navy-100">
              {filteredBills.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-navy-400">
                    Tidak ada laporan transaksi yang sesuai filter.
                  </td>
                </tr>
              ) : (
                filteredBills.map((bill) => (
                  <tr key={bill.id} className="hover:bg-navy-50/80 transition-colors">
                    <td className="px-4 py-3 font-mono text-navy-700 font-medium">
                      {bill.visit_date}
                    </td>
                    <td className="px-4 py-3 font-bold text-navy-900">
                      {bill.store_name}
                      {bill.notes && (
                        <p className="text-[10px] text-foreground-muted font-normal">
                          💬 {bill.notes}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3 font-medium text-navy-700">
                      👤 {bill.user_name}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block rounded px-2 py-0.5 text-[10px] font-bold ${
                          bill.operational_status === "open"
                            ? "bg-accent-50 text-accent-700"
                            : "bg-navy-200 text-navy-700"
                        }`}
                      >
                        {bill.operational_status === "open" ? "🟢 Buka" : "🔴 Tutup"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block rounded px-2 py-0.5 text-[10px] font-bold ${
                          bill.order_status === "order"
                            ? "bg-primary-50 text-primary-700"
                            : "bg-navy-100 text-navy-500"
                        }`}
                      >
                        {bill.order_status === "order" ? "🛍️ Ada Order" : "🚫 No Order"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block rounded px-2.5 py-0.5 text-[10px] font-bold ${
                          bill.payment_status === "paid"
                            ? "bg-accent-50 text-accent-700 border border-accent-200"
                            : "bg-navy-100 text-navy-500"
                        }`}
                      >
                        {bill.payment_status === "paid" ? "💵 Terbayar" : "❌ Tidak Bayar"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-sm text-navy-900">
                      {bill.payment_status === "paid"
                        ? formatRupiah(bill.bill_amount)
                        : "Rp 0"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>

            {/* Total Agregat Row Footer */}
            <tfoot className="bg-navy-900 text-white font-bold border-t-2 border-accent-500">
              <tr>
                <td colSpan={6} className="px-4 py-3.5 text-right text-xs uppercase tracking-wider">
                  Total Agregat Nominal Tagihan Terbayar:
                </td>
                <td className="px-4 py-3.5 text-right font-mono text-base text-accent-300 font-extrabold">
                  {formatRupiah(totalNominalTerbayar)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}
