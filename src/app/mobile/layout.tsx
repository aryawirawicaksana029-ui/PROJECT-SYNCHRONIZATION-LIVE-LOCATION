"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

const navItems = [
  {
    href: "/mobile",
    label: "Beranda",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5.5 w-5.5">
        <path d="M11.47 3.841a.75.75 0 0 1 1.06 0l8.69 8.69a.75.75 0 1 0 1.06-1.061l-8.689-8.69a2.25 2.25 0 0 0-3.182 0l-8.69 8.69a.75.75 0 1 0 1.061 1.06l8.69-8.689Z" />
        <path d="m12 5.432 8.159 8.159c.03.03.06.058.091.086v6.198c0 1.035-.84 1.875-1.875 1.875H15a.75.75 0 0 1-.75-.75v-4.5a.75.75 0 0 0-.75-.75h-3a.75.75 0 0 0-.75.75V21a.75.75 0 0 1-.75.75H5.625a1.875 1.875 0 0 1-1.875-1.875v-6.198a2.29 2.29 0 0 0 .091-.086L12 5.432Z" />
      </svg>
    ),
  },
  {
    href: "/mobile/toko",
    label: "Toko",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5.5 w-5.5">
        <path d="M5.223 2.25a.75.75 0 0 1 .67.415L7.5 5.25h9l1.607-2.585A.75.75 0 0 1 18.777 2.25h.778a.75.75 0 0 1 .72.54l1.5 5.25A.75.75 0 0 1 21.055 8.79L21 9v.002A3.75 3.75 0 0 1 18 12.75a3.73 3.73 0 0 1-2.25-.758A3.73 3.73 0 0 1 13.5 12.75a3.73 3.73 0 0 1-2.25-.758A3.73 3.73 0 0 1 9 12.75a3.73 3.73 0 0 1-2.25-.758A3.73 3.73 0 0 1 4.5 12.75 3.75 3.75 0 0 1 1.5 9.002V9l-.054-.21a.75.75 0 0 1 .72-.54h.778a.75.75 0 0 1 .67.415L5.22 11.25" />
        <path fillRule="evenodd" d="M3 13.5v7.125A1.875 1.875 0 0 0 4.875 22.5h14.25A1.875 1.875 0 0 0 21 20.625V13.5" clipRule="evenodd" />
      </svg>
    ),
  },
  {
    href: "/mobile/lokasi",
    label: "Lokasi",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5.5 w-5.5">
        <path fillRule="evenodd" d="m11.54 22.351.07.04.028.016a.76.76 0 0 0 .723 0l.028-.015.071-.041a16.975 16.975 0 0 0 1.144-.742 19.58 19.58 0 0 0 2.683-2.282c1.944-1.99 3.963-4.98 3.963-8.827a8.25 8.25 0 0 0-16.5 0c0 3.846 2.02 6.837 3.963 8.827a19.58 19.58 0 0 0 3.824 3.024Zm.46-12.6a2.25 2.25 0 1 0 0-4.5 2.25 2.25 0 0 0 0 4.5Z" clipRule="evenodd" />
      </svg>
    ),
  },
  {
    href: "/mobile/profil",
    label: "Profil",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5.5 w-5.5">
        <path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0ZM3.751 20.105a8.25 8.25 0 0 1 16.498 0 .75.75 0 0 1-.437.695A18.683 18.683 0 0 1 12 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 0 1-.437-.695Z" clipRule="evenodd" />
      </svg>
    ),
  },
];

export default function MobileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshToast, setRefreshToast] = useState(false);

  const handleManualRefresh = () => {
    setIsRefreshing(true);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("sll:refresh"));
    }
    router.refresh();
    setTimeout(() => {
      setIsRefreshing(false);
      setRefreshToast(true);
      setTimeout(() => setRefreshToast(false), 2500);
    }, 800);
  };

  return (
    <div className="flex flex-1 flex-col bg-surface-dim relative">
      {/* Header */}
      <header className="sticky top-0 z-40 flex h-header items-center justify-between border-b border-navy-100 bg-white/85 backdrop-blur-lg px-4 shadow-xs">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary-600 to-accent-500 shadow-md">
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
          <span className="text-base font-bold tracking-tight text-navy-900">
            SLL
          </span>
        </div>

        {/* Right side: Status badge & Refresh button */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleManualRefresh}
            title="Segarkan Data"
            aria-label="Refresh data"
            className="flex h-8 w-8 items-center justify-center rounded-xl bg-navy-50 text-navy-600 hover:bg-navy-100 hover:text-navy-900 active:scale-95 transition-all"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className={`h-4 w-4 ${isRefreshing ? "animate-spin text-primary-600" : ""}`}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99"
              />
            </svg>
          </button>

          <div className="flex items-center gap-1.5 rounded-full bg-accent-50 px-2.5 py-1 text-[11px] font-semibold text-accent-700 border border-accent-200">
            <span className="h-1.5 w-1.5 rounded-full bg-accent-500 animate-pulse-soft" />
            Online
          </div>
        </div>
      </header>

      {/* Floating Refresh Toast */}
      {refreshToast && (
        <div className="fixed top-14 left-1/2 -translate-x-1/2 z-50 rounded-full bg-navy-900/90 backdrop-blur-md px-4 py-1.5 text-xs font-bold text-white shadow-xl flex items-center gap-2 animate-slide-up border border-white/20">
          <span className="text-accent-400">⚡</span>
          <span>Data Berhasil Disinkronkan!</span>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pb-bottom-nav animate-fade-in">
        {children}
      </main>

      {/* Floating Action Refresh Button for quick access */}
      <button
        onClick={handleManualRefresh}
        aria-label="Floating refresh button"
        className="fixed bottom-20 right-4 z-30 flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-tr from-primary-600 to-accent-600 text-white shadow-lg hover:shadow-xl active:scale-95 transition-all border-2 border-white"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2.5}
          stroke="currentColor"
          className={`h-5 w-5 ${isRefreshing ? "animate-spin" : ""}`}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99"
          />
        </svg>
      </button>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 flex h-bottom-nav items-start justify-around border-t border-navy-100 bg-white/90 backdrop-blur-lg pt-2 pb-safe">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/mobile" && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-all duration-200 ${
                isActive
                  ? "text-primary-600"
                  : "text-navy-400 hover:text-navy-600"
              }`}
            >
              <span
                className={`transition-transform duration-200 ${
                  isActive ? "scale-110" : ""
                }`}
              >
                {item.icon}
              </span>
              <span
                className={`text-[10px] font-medium ${
                  isActive ? "font-semibold" : ""
                }`}
              >
                {item.label}
              </span>
              {isActive && (
                <span className="mt-0.5 h-0.5 w-4 rounded-full bg-primary-500" />
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
