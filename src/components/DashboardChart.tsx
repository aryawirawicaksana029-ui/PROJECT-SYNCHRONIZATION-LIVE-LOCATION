"use client";

import { useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

// Sample monthly cash flow data
const monthlyData = [
  { bulan: "Jan", pemasukan: 12500000, tagihan: 9800000, kunjungan: 45 },
  { bulan: "Feb", pemasukan: 15200000, tagihan: 11400000, kunjungan: 52 },
  { bulan: "Mar", pemasukan: 18700000, tagihan: 14200000, kunjungan: 68 },
  { bulan: "Apr", pemasukan: 16400000, tagihan: 12800000, kunjungan: 58 },
  { bulan: "Mei", pemasukan: 21300000, tagihan: 17500000, kunjungan: 74 },
  { bulan: "Jun", pemasukan: 24800000, tagihan: 19200000, kunjungan: 82 },
  { bulan: "Jul", pemasukan: 22100000, tagihan: 18600000, kunjungan: 76 },
  { bulan: "Agt", pemasukan: 28500000, tagihan: 22000000, kunjungan: 91 },
];

const formatRupiahShort = (value: number) => {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}Jt`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)}Rb`;
  return String(value);
};

interface DashboardChartProps {
  totalBillAmount?: number;
}

export default function DashboardChart({ totalBillAmount = 0 }: DashboardChartProps) {
  const [activeTab, setActiveTab] = useState<"cashflow" | "kunjungan">("cashflow");

  // Calculate summary from data
  const totalPemasukan = monthlyData.reduce((s, d) => s + d.pemasukan, 0);
  const totalTagihan = monthlyData.reduce((s, d) => s + d.tagihan, 0);
  const totalKunjungan = monthlyData.reduce((s, d) => s + d.kunjungan, 0);

  return (
    <div className="rounded-2xl border border-navy-100 bg-white shadow-sm overflow-hidden">
      {/* Header with KPI summary */}
      <div className="border-b border-navy-100 bg-gradient-to-r from-navy-950 to-navy-900 px-5 py-4 text-white">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-white/80">
            Ringkasan Keuangan Bulanan
          </h3>
          <div className="flex gap-1">
            <button
              onClick={() => setActiveTab("cashflow")}
              className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-all ${
                activeTab === "cashflow"
                  ? "bg-white/20 text-white"
                  : "text-white/60 hover:text-white/80"
              }`}
            >
              💰 Cash Flow
            </button>
            <button
              onClick={() => setActiveTab("kunjungan")}
              className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-all ${
                activeTab === "kunjungan"
                  ? "bg-white/20 text-white"
                  : "text-white/60 hover:text-white/80"
              }`}
            >
              📊 Kunjungan
            </button>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-[10px] text-white/60 font-medium uppercase">Total Pemasukan</p>
            <p className="text-lg font-black tracking-tight text-accent-400">
              Rp {formatRupiahShort(totalPemasukan)}
            </p>
          </div>
          <div>
            <p className="text-[10px] text-white/60 font-medium uppercase">Tagihan Terbayar</p>
            <p className="text-lg font-black tracking-tight text-primary-300">
              Rp {formatRupiahShort(totalTagihan)}
            </p>
          </div>
          <div>
            <p className="text-[10px] text-white/60 font-medium uppercase">
              {activeTab === "cashflow" ? "Margin" : "Total Kunjungan"}
            </p>
            <p className="text-lg font-black tracking-tight text-emerald-400">
              {activeTab === "cashflow"
                ? `Rp ${formatRupiahShort(totalPemasukan - totalTagihan)}`
                : `${totalKunjungan} Visit`}
            </p>
          </div>
        </div>
      </div>

      {/* Chart Area */}
      <div className="p-4">
        <ResponsiveContainer width="100%" height={280}>
          {activeTab === "cashflow" ? (
            <AreaChart data={monthlyData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="gradPemasukan" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#10b981" stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="gradTagihan" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#1b6cf5" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#1b6cf5" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis
                dataKey="bulan"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fontWeight: 600, fill: "#64748b" }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tickFormatter={formatRupiahShort}
                tick={{ fontSize: 10, fill: "#94a3b8" }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#0f172a",
                  border: "none",
                  borderRadius: "12px",
                  padding: "10px 14px",
                  fontSize: "11px",
                  color: "#ffffff",
                  boxShadow: "0 10px 30px rgba(0,0,0,0.3)",
                }}
                formatter={(value: unknown, name: unknown) => [
                  `Rp ${Number(value || 0).toLocaleString("id-ID")}`,
                  String(name) === "pemasukan" ? "💰 Pemasukan" : "📋 Tagihan",
                ]}
                labelStyle={{ fontWeight: "bold", marginBottom: "4px" }}
              />
              <Legend
                verticalAlign="top"
                height={36}
                iconType="circle"
                iconSize={8}
                formatter={(value: string) =>
                  value === "pemasukan" ? "💰 Total Pemasukan" : "📋 Tagihan Terbayar"
                }
                wrapperStyle={{ fontSize: "11px", fontWeight: 600 }}
              />
              <Area
                type="monotone"
                dataKey="pemasukan"
                stroke="#10b981"
                strokeWidth={2.5}
                fill="url(#gradPemasukan)"
                dot={{ r: 4, fill: "#10b981", stroke: "#ffffff", strokeWidth: 2 }}
                activeDot={{ r: 6 }}
              />
              <Area
                type="monotone"
                dataKey="tagihan"
                stroke="#1b6cf5"
                strokeWidth={2.5}
                fill="url(#gradTagihan)"
                dot={{ r: 4, fill: "#1b6cf5", stroke: "#ffffff", strokeWidth: 2 }}
                activeDot={{ r: 6 }}
              />
            </AreaChart>
          ) : (
            <AreaChart data={monthlyData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="gradKunjungan" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#f59e0b" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis
                dataKey="bulan"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fontWeight: 600, fill: "#64748b" }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: "#94a3b8" }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#0f172a",
                  border: "none",
                  borderRadius: "12px",
                  padding: "10px 14px",
                  fontSize: "11px",
                  color: "#ffffff",
                  boxShadow: "0 10px 30px rgba(0,0,0,0.3)",
                }}
                formatter={(value: unknown) => [`${Number(value || 0)} Kunjungan`, "📊 Total Visit"]}
                labelStyle={{ fontWeight: "bold", marginBottom: "4px" }}
              />
              <Area
                type="monotone"
                dataKey="kunjungan"
                stroke="#f59e0b"
                strokeWidth={2.5}
                fill="url(#gradKunjungan)"
                dot={{ r: 4, fill: "#f59e0b", stroke: "#ffffff", strokeWidth: 2 }}
                activeDot={{ r: 6 }}
              />
            </AreaChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
}
