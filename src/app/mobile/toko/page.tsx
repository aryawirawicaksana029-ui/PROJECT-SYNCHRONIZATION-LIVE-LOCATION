"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { getStores, getUserProfile } from "@/lib/db";
import { StoreRow } from "@/lib/database.types";

export default function TokoPage() {
  const [stores, setStores] = useState<StoreRow[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "pending" | "verified">("all");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([getStores(), getUserProfile()]).then(([data, profile]) => {
      setStores(data);
      if (profile?.id) setCurrentUserId(profile.id);
    });
  }, []);

  const visibleStores = stores.filter((store) => {
    if (store.verification_status === "verified") return true;
    if (store.created_by && currentUserId) {
      return store.created_by === currentUserId;
    }
    return true;
  });

  const filteredStores = visibleStores.filter((store) => {
    const kode = store.kode_toko || "";
    const matchesSearch =
      store.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      store.pic_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      kode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      store.address.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter =
      filterStatus === "all" || store.verification_status === filterStatus;

    return matchesSearch && matchesFilter;
  });

  return (
    <div className="p-4 space-y-4 max-w-lg mx-auto">
      {/* Header & Add Button */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-navy-900">Daftar Toko</h1>
          <p className="text-xs text-foreground-muted">
            Pilih toko untuk mulai kunjungan & update status
          </p>
        </div>

        <Link
          href="/mobile/toko/baru"
          className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-accent-600 to-accent-700 px-3.5 py-2 text-xs font-bold text-white shadow-md transition-all hover:from-accent-700 hover:to-accent-800 active:scale-95"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="h-4 w-4"
          >
            <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
          </svg>
          <span>Registrasi Baru</span>
        </Link>
      </div>

      {/* Search & Filter Controls */}
      <div className="space-y-2">
        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="h-4 w-4 text-navy-400"
            >
              <path
                fillRule="evenodd"
                d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari kode (FF-001), nama toko, PIC, atau alamat..."
            className="w-full rounded-xl border border-navy-200 bg-white py-2 pl-9 pr-3 text-xs text-navy-900 placeholder:text-navy-400 outline-none transition-all focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex gap-2">
          {(
            [
              { id: "all", label: "Semua Toko" },
              { id: "verified", label: "Terverifikasi" },
              { id: "pending", label: "Pending Admin" },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterStatus(tab.id)}
              className={`rounded-lg px-3 py-1 text-[11px] font-semibold transition-colors ${
                filterStatus === tab.id
                  ? "bg-navy-900 text-white"
                  : "bg-white text-navy-600 border border-navy-100 hover:bg-navy-50"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Stores List */}
      <div className="space-y-3">
        {filteredStores.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-navy-200 bg-white p-8 text-center space-y-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="mx-auto h-10 w-10 text-navy-300"
            >
              <path fillRule="evenodd" d="M10.5 3.75a6.75 6.75 0 100 13.5 6.75 6.75 0 000-13.5zM2.25 10.5a8.25 8.25 0 1114.59 5.28l4.69 4.69a.75.75 0 11-1.06 1.06l-4.69-4.69A8.25 8.25 0 012.25 10.5z" clipRule="evenodd" />
            </svg>
            <p className="text-xs font-semibold text-navy-700">
              Tidak ada toko yang cocok
            </p>
            <p className="text-[11px] text-foreground-muted">
              Coba kata kunci lain atau daftarkan toko baru.
            </p>
          </div>
        ) : (
          filteredStores.map((store) => (
            <div
              key={store.id}
              className="rounded-2xl border border-navy-100 bg-white p-4 shadow-sm space-y-2.5 transition-all hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="rounded-md bg-navy-100 px-1.5 py-0.5 font-mono text-[10px] font-bold text-navy-800">
                      {store.kode_toko || `TK-${store.id}`}
                    </span>
                    {store.kategori && (
                      <span className="rounded-md bg-primary-50 px-1.5 py-0.5 text-[9px] font-bold text-primary-700">
                        {store.kategori}
                      </span>
                    )}
                  </div>
                  <h3 className="text-sm font-bold text-navy-900 leading-snug">
                    {store.name}
                  </h3>
                  <p className="text-xs text-navy-600 font-medium mt-0.5">
                    PIC: {store.pic_name} • {store.phone}
                  </p>
                </div>
                <span
                  className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold ${
                    store.verification_status === "verified"
                      ? "bg-accent-50 text-accent-700 border border-accent-200"
                      : "bg-warning-500/10 text-warning-700 border border-warning-500/30"
                  }`}
                >
                  {store.verification_status === "verified"
                    ? "Terverifikasi"
                    : "Pending Verifikasi"}
                </span>
              </div>

              <p className="text-xs text-foreground-muted line-clamp-2">
                📍 {store.address}
              </p>

              <div className="flex items-center justify-between pt-2.5 border-t border-navy-50 text-[11px]">
                <span
                  className={`font-semibold ${
                    store.current_status === "open"
                      ? "text-accent-600"
                      : "text-navy-400"
                  }`}
                >
                  Status: {store.current_status === "open" ? "🟢 Buka" : "🔴 Tutup"}
                </span>

                <Link
                  href={`/mobile/toko/detail?id=${store.id}`}
                  className="flex items-center gap-1 rounded-xl bg-primary-600 px-3 py-1.5 text-xs font-bold text-white shadow-sm transition-all hover:bg-primary-700 active:scale-95"
                >
                  <span>Mulai Visit</span>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className="h-3.5 w-3.5"
                  >
                    <path
                      fillRule="evenodd"
                      d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z"
                      clipRule="evenodd"
                    />
                  </svg>
                </Link>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
