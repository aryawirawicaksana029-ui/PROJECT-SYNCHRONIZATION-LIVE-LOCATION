"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const sidebarItems = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
        <path d="M11.47 3.841a.75.75 0 0 1 1.06 0l8.69 8.69a.75.75 0 1 0 1.06-1.061l-8.689-8.69a2.25 2.25 0 0 0-3.182 0l-8.69 8.69a.75.75 0 1 0 1.061 1.06l8.69-8.689Z" />
        <path d="m12 5.432 8.159 8.159c.03.03.06.058.091.086v6.198c0 1.035-.84 1.875-1.875 1.875H15a.75.75 0 0 1-.75-.75v-4.5a.75.75 0 0 0-.75-.75h-3a.75.75 0 0 0-.75.75V21a.75.75 0 0 1-.75.75H5.625a1.875 1.875 0 0 1-1.875-1.875v-6.198a2.29 2.29 0 0 0 .091-.086L12 5.432Z" />
      </svg>
    ),
  },
  {
    href: "/dashboard/peta",
    label: "Peta Live",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
        <path fillRule="evenodd" d="M8.161 2.58a1.875 1.875 0 0 1 1.678 0l4.993 2.498c.106.052.23.052.336 0l3.869-1.935A1.875 1.875 0 0 1 21.75 4.82v12.485c0 .71-.401 1.36-1.037 1.677l-4.875 2.437a1.875 1.875 0 0 1-1.676 0l-4.994-2.497a.375.375 0 0 0-.336 0l-3.868 1.935A1.875 1.875 0 0 1 2.25 19.18V6.695c0-.71.401-1.36 1.036-1.677l4.875-2.437ZM9 6a.75.75 0 0 1 .75.75V15a.75.75 0 0 1-1.5 0V6.75A.75.75 0 0 1 9 6Zm6.75 3a.75.75 0 0 0-1.5 0v8.25a.75.75 0 0 0 1.5 0V9Z" clipRule="evenodd" />
      </svg>
    ),
  },
  {
    href: "/dashboard/presensi",
    label: "Log Presensi",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
        <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25ZM12.75 6a.75.75 0 0 0-1.5 0v6c0 .414.336.75.75.75h4.5a.75.75 0 0 0 0-1.5h-3.75V6Z" clipRule="evenodd" />
      </svg>
    ),
  },
  {
    href: "/dashboard/laporan",
    label: "Laporan Tagihan",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
        <path fillRule="evenodd" d="M2.25 13.5a8.25 8.25 0 0 1 8.25-8.25.75.75 0 0 1 .75.75v6.75H18a.75.75 0 0 1 .75.75 8.25 8.25 0 0 1-16.5 0Z" clipRule="evenodd" />
        <path fillRule="evenodd" d="M12.75 3a.75.75 0 0 1 .75-.75 8.25 8.25 0 0 1 8.25 8.25.75.75 0 0 1-.75.75h-7.5a.75.75 0 0 1-.75-.75V3Z" clipRule="evenodd" />
      </svg>
    ),
  },
  {
    href: "/dashboard/katalog",
    label: "Katalog Bahan Baku",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
        <path d="M12 3.75a.75.75 0 0 1 .75.75v6.75h6.75a.75.75 0 0 1 0 1.5h-6.75v6.75a.75.75 0 0 1-1.5 0v-6.75H4.5a.75.75 0 0 1 0-1.5h6.75V4.5a.75.75 0 0 1 .75-.75Z" />
        <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm13.36-1.814a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z" clipRule="evenodd" />
      </svg>
    ),
  },
  {
    href: "/dashboard/toko",
    label: "Manajemen Toko",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
        <path d="M5.223 2.25a.75.75 0 0 1 .67.415L7.5 5.25h9l1.607-2.585A.75.75 0 0 1 18.777 2.25h.778a.75.75 0 0 1 .72.54l1.5 5.25A.75.75 0 0 1 21.055 8.79L21 9v.002A3.75 3.75 0 0 1 18 12.75a3.73 3.73 0 0 1-2.25-.758A3.73 3.73 0 0 1 13.5 12.75a3.73 3.73 0 0 1-2.25-.758A3.73 3.73 0 0 1 9 12.75a3.73 3.73 0 0 1-2.25-.758A3.73 3.73 0 0 1 4.5 12.75 3.75 3.75 0 0 1 1.5 9.002V9l-.054-.21a.75.75 0 0 1 .72-.54h.778a.75.75 0 0 1 .67.415L5.22 11.25" />
        <path fillRule="evenodd" d="M3 13.5v7.125A1.875 1.875 0 0 0 4.875 22.5h14.25A1.875 1.875 0 0 0 21 20.625V13.5" clipRule="evenodd" />
      </svg>
    ),
  },
  {
    href: "/dashboard/users",
    label: "Users",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
        <path d="M4.5 6.375a4.125 4.125 0 1 1 8.25 0 4.125 4.125 0 0 1-8.25 0ZM14.25 8.625a3.375 3.375 0 1 1 6.75 0 3.375 3.375 0 0 1-6.75 0ZM1.5 19.125a7.125 7.125 0 0 1 14.25 0v.003l-.001.119a.75.75 0 0 1-.363.63 13.067 13.067 0 0 1-6.761 1.873c-2.472 0-4.786-.684-6.76-1.873a.75.75 0 0 1-.364-.63l-.001-.122ZM17.25 19.128l-.001.144a2.25 2.25 0 0 1-.233.96 10.088 10.088 0 0 0 5.06-1.01.75.75 0 0 0 .42-.643 4.875 4.875 0 0 0-6.957-4.611 8.586 8.586 0 0 1 1.71 5.157v.003Z" />
      </svg>
    ),
  },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  return (
    <div className="flex flex-1 min-h-full bg-surface-dim">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden animate-fade-in"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-sidebar flex-col bg-navy-950 text-white transition-transform duration-300 lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Sidebar Header */}
        <div className="flex h-header items-center gap-3 border-b border-white/10 px-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-accent-400 shadow-lg">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="h-5 w-5 text-white"
            >
              <path
                fillRule="evenodd"
                d="m11.54 22.351.07.04.028.016a.76.76 0 0 0 .723 0l.028-.015.071-.041a16.975 16.975 0 0 0 1.144-.742 19.58 19.58 0 0 0 2.683-2.282c1.944-1.99 3.963-4.98 3.963-8.827a8.25 8.25 0 0 0-16.5 0c0 3.846 2.02 6.837 3.963 8.827a19.58 19.58 0 0 0 3.824 3.024Zm.46-12.6a2.25 2.25 0 1 0 0-4.5 2.25 2.25 0 0 0 0 4.5Z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div>
            <h2 className="text-sm font-bold tracking-tight">SLL Dashboard</h2>
            <p className="text-[10px] text-white/50">Admin Panel</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {sidebarItems.map((item, i) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`group flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? "bg-white/10 text-white shadow-sm"
                    : "text-white/60 hover:bg-white/5 hover:text-white/90"
                }`}
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <span
                  className={`transition-colors ${
                    isActive ? "text-accent-400" : "text-white/40 group-hover:text-white/70"
                  }`}
                >
                  {item.icon}
                </span>
                {item.label}
                {isActive && (
                  <span className="ml-auto h-1.5 w-1.5 rounded-full bg-accent-400" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="border-t border-white/10 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-sm font-semibold">
              A
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">Admin</p>
              <p className="text-[10px] text-white/40 truncate">admin@perusahaan.com</p>
            </div>
            <Link
              href="/login"
              className="rounded-lg p-1.5 text-white/40 hover:bg-white/10 hover:text-white/70 transition-colors"
              title="Logout"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4.5 w-4.5">
                <path fillRule="evenodd" d="M3 4.25A2.25 2.25 0 0 1 5.25 2h5.5A2.25 2.25 0 0 1 13 4.25v2a.75.75 0 0 1-1.5 0v-2a.75.75 0 0 0-.75-.75h-5.5a.75.75 0 0 0-.75.75v11.5c0 .414.336.75.75.75h5.5a.75.75 0 0 0 .75-.75v-2a.75.75 0 0 1 1.5 0v2A2.25 2.25 0 0 1 10.75 18h-5.5A2.25 2.25 0 0 1 3 15.75V4.25Z" clipRule="evenodd" />
                <path fillRule="evenodd" d="M19 10a.75.75 0 0 0-.75-.75H8.704l1.048-.943a.75.75 0 1 0-1.004-1.114l-2.5 2.25a.75.75 0 0 0 0 1.114l2.5 2.25a.75.75 0 1 0 1.004-1.114l-1.048-.943h9.546A.75.75 0 0 0 19 10Z" clipRule="evenodd" />
              </svg>
            </Link>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col lg:ml-sidebar">
        {/* Top Bar */}
        <header className="sticky top-0 z-30 flex h-header items-center justify-between border-b border-navy-100 bg-white/80 backdrop-blur-lg px-4 lg:px-6">
          {/* Hamburger (mobile) */}
          <button
            id="sidebar-toggle"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="rounded-lg p-2 text-navy-500 hover:bg-navy-50 hover:text-navy-700 transition-colors lg:hidden"
            aria-label="Toggle sidebar"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5.5 w-5.5">
              <path fillRule="evenodd" d="M3 6.75A.75.75 0 0 1 3.75 6h16.5a.75.75 0 0 1 0 1.5H3.75A.75.75 0 0 1 3 6.75ZM3 12a.75.75 0 0 1 .75-.75h16.5a.75.75 0 0 1 0 1.5H3.75A.75.75 0 0 1 3 12Zm0 5.25a.75.75 0 0 1 .75-.75h16.5a.75.75 0 0 1 0 1.5H3.75a.75.75 0 0 1-.75-.75Z" clipRule="evenodd" />
            </svg>
          </button>

          {/* Breadcrumb */}
          <div className="hidden lg:flex items-center gap-2 text-sm text-navy-400">
            <span className="text-navy-700 font-medium">
              {sidebarItems.find(
                (item) =>
                  pathname === item.href ||
                  (item.href !== "/dashboard" && pathname.startsWith(item.href))
              )?.label ?? "Dashboard"}
            </span>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            {/* Live indicator */}
            <div className="flex items-center gap-1.5 rounded-full bg-accent-50 px-3 py-1.5 text-xs font-medium text-accent-700">
              <span className="h-1.5 w-1.5 rounded-full bg-accent-500 animate-pulse-soft" />
              Live
            </div>

            {/* Notification bell with interactive dropdown */}
            <div className="relative">
              <button
                id="notifications-btn"
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className={`relative rounded-xl p-2 transition-all active:scale-95 ${
                  notificationsOpen
                    ? "bg-primary-50 text-primary-600 shadow-sm"
                    : "text-navy-400 hover:bg-navy-50 hover:text-navy-600"
                }`}
                aria-label="Notifications"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
                  <path fillRule="evenodd" d="M5.25 9a6.75 6.75 0 0 1 13.5 0v.75c0 2.123.8 4.057 2.118 5.52a.75.75 0 0 1-.297 1.206c-1.544.57-3.16.99-4.831 1.243a3.75 3.75 0 1 1-7.48 0 24.585 24.585 0 0 1-4.831-1.244.75.75 0 0 1-.298-1.205A8.217 8.217 0 0 0 5.25 9.75V9Zm4.502 8.9a2.25 2.25 0 1 0 4.496 0 25.057 25.057 0 0 1-4.496 0Z" clipRule="evenodd" />
                </svg>
                <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-danger-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-danger-500 ring-2 ring-white"></span>
                </span>
              </button>

              {/* Notification Popover Dropdown */}
              {notificationsOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setNotificationsOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl border border-navy-100 bg-white shadow-2xl z-50 overflow-hidden animate-slide-up">
                    <div className="flex items-center justify-between border-b border-navy-100 bg-gradient-to-r from-navy-950 to-navy-900 px-4 py-3 text-white">
                      <div className="flex items-center gap-2">
                        <span className="text-base">🔔</span>
                        <h3 className="text-xs font-bold uppercase tracking-wider">
                          Pemberitahuan Sistem
                        </h3>
                      </div>
                      <span className="rounded-full bg-accent-500/20 text-accent-300 px-2 py-0.5 text-[10px] font-bold border border-accent-400/30">
                        3 Baru
                      </span>
                    </div>

                    <div className="max-h-80 overflow-y-auto divide-y divide-navy-50">
                      {/* Notification 1: Pending Store Verification */}
                      <Link
                        href="/dashboard/toko"
                        onClick={() => setNotificationsOpen(false)}
                        className="flex items-start gap-3 p-3.5 hover:bg-navy-50/80 transition-colors"
                      >
                        <div className="h-8 w-8 rounded-xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center shrink-0 font-bold text-xs">
                          🏪
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-navy-900">
                            Toko Baru Menunggu Verifikasi
                          </p>
                          <p className="text-[11px] text-foreground-muted mt-0.5">
                            Terdapat registrasi toko baru dari Sales yang membutuhkan persetujuan Admin.
                          </p>
                          <span className="text-[10px] text-primary-600 font-semibold mt-1 inline-block">
                            Buka Manajemen Toko →
                          </span>
                        </div>
                      </Link>

                      {/* Notification 2: Live GPS Presensi */}
                      <Link
                        href="/dashboard/presensi"
                        onClick={() => setNotificationsOpen(false)}
                        className="flex items-start gap-3 p-3.5 hover:bg-navy-50/80 transition-colors"
                      >
                        <div className="h-8 w-8 rounded-xl bg-accent-50 text-accent-600 border border-accent-200 flex items-center justify-center shrink-0 font-bold text-xs">
                          📡
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-navy-900">
                            Sesi Live GPS Sales Aktif
                          </p>
                          <p className="text-[11px] text-foreground-muted mt-0.5">
                            Petugas lapangan sedang membagikan koordinat GPS & heartbeat baterai.
                          </p>
                          <span className="text-[10px] text-accent-700 font-semibold mt-1 inline-block">
                            Lihat Log Presensi →
                          </span>
                        </div>
                      </Link>

                      {/* Notification 3: Laporan Tagihan Masuk */}
                      <Link
                        href="/dashboard/laporan"
                        onClick={() => setNotificationsOpen(false)}
                        className="flex items-start gap-3 p-3.5 hover:bg-navy-50/80 transition-colors"
                      >
                        <div className="h-8 w-8 rounded-xl bg-primary-50 text-primary-600 border border-primary-200 flex items-center justify-center shrink-0 font-bold text-xs">
                          💵
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-navy-900">
                            Penerimaan Tagihan Terupdate
                          </p>
                          <p className="text-[11px] text-foreground-muted mt-0.5">
                            Kunjungan toko dan pembayaran faktur berhasil dicatat di sistem.
                          </p>
                          <span className="text-[10px] text-primary-600 font-semibold mt-1 inline-block">
                            Cek Laporan Tagihan →
                          </span>
                        </div>
                      </Link>
                    </div>

                    <div className="border-t border-navy-100 bg-surface-dim p-2.5 text-center">
                      <button
                        onClick={() => setNotificationsOpen(false)}
                        className="text-[11px] font-bold text-navy-600 hover:text-navy-900"
                      >
                        Tutup Panel
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6 animate-fade-in">
          {children}
        </main>
      </div>
    </div>
  );
}
