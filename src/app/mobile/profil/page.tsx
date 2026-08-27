"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  getUserProfile,
  updateUserProfile,
  getCurrentUser,
  setCurrentUser,
  getVisitLogs,
  getStores,
  getLocationLogs,
  getDailyTaskByUserId,
  submitDailyDeposit,
  type UserProfile,
} from "@/lib/db";
import { trackingService } from "@/lib/trackingService";
import type { VisitLogRow, SalesDailyTask } from "@/lib/database.types";

export default function ProfilPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [visitLogs, setVisitLogs] = useState<VisitLogRow[]>([]);
  const [storeCount, setStoreCount] = useState(0);
  const [pingCount, setPingCount] = useState(0);
  const [dailyTask, setDailyTask] = useState<SalesDailyTask | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  // Setor Tagihan Modal State
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [depositNotes, setDepositNotes] = useState("");
  const [isSubmittingDeposit, setIsSubmittingDeposit] = useState(false);
  const [depositSuccessData, setDepositSuccessData] = useState<{ amount: number } | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [userProfile, visits, stores, pings] = await Promise.all([
        getUserProfile(),
        getVisitLogs(),
        getStores(),
        getLocationLogs(),
      ]);
      setProfile(userProfile);
      setVisitLogs(visits);
      setStoreCount(stores.length);
      setPingCount(pings.length);
      setEditName(userProfile.name);
      setEditPhone(userProfile.phone || "");

      if (userProfile.id) {
        const task = await getDailyTaskByUserId(userProfile.id);
        setDailyTask(task);
      }
    } catch {
      // fallback
    }
    setIsLoading(false);
  };

  const handleSaveProfile = async () => {
    if (!editName.trim()) return;
    setIsSaving(true);
    try {
      const updated = await updateUserProfile({
        name: editName.trim(),
        phone: editPhone.trim() || undefined,
      });
      setProfile(updated);
      setIsEditing(false);
    } catch {
      // fallback
    }
    setIsSaving(false);
  };

  const handleLogout = () => {
    // Clear user session and tracking data
    setCurrentUser(null);
    if (typeof window !== "undefined") {
      localStorage.removeItem("sll_live_tracking_state");
      localStorage.removeItem("sll_user_role");
      localStorage.removeItem("sll_current_user");
    }
    router.push("/login");
  };

  // Submit Daily Deposit Handler
  const handleConfirmDeposit = async () => {
    if (!profile?.id) return;
    setIsSubmittingDeposit(true);

    try {
      // 1. Stop Shareloc Live tracking session
      trackingService.stopLiveTracking();

      // 2. Submit daily deposit to DB
      const result = await submitDailyDeposit(profile.id, depositNotes.trim() || "Setoran harian sales");
      if (result.success && result.task) {
        setDailyTask(result.task);
        setShowDepositModal(false);
        setDepositSuccessData({ amount: result.task.actual_collection_amount || totalPaidAmount });
      }
    } catch {
      // ignore
    } finally {
      setIsSubmittingDeposit(false);
    }
  };

  const formatRupiah = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const roleLabelMap: Record<string, string> = {
    admin: "ADMIN",
    sales: "SALES (Pekerja Lapangan)",
    petugas_lapangan: "SALES (Pekerja Lapangan)",
    supervisor: "SALES (Pekerja Lapangan)",
  };

  const totalPaidAmount = visitLogs
    .filter((v) => (!v.user_id || v.user_id === profile?.id) && v.is_paid)
    .reduce((sum, v) => sum + (v.total_amount || 0), 0);

  if (isLoading) {
    return (
      <div className="p-4 space-y-4 max-w-lg mx-auto">
        <div className="h-6 w-24 rounded bg-navy-100 animate-pulse" />
        <div className="rounded-2xl border border-navy-100 bg-white p-6 space-y-4">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-navy-100 animate-pulse" />
            <div className="space-y-2">
              <div className="h-4 w-32 rounded bg-navy-100 animate-pulse" />
              <div className="h-3 w-24 rounded bg-navy-50 animate-pulse" />
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 rounded-xl bg-white border border-navy-100 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const isDepositApproved = dailyTask?.deposit_status === "approved";
  const isDepositWaiting = dailyTask?.deposit_status === "waiting_confirmation";

  return (
    <div className="p-4 space-y-4 max-w-lg mx-auto pb-12 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-lg font-bold text-navy-900">Profil Petugas</h1>
        <p className="mt-0.5 text-xs text-foreground-muted">
          Informasi akun, progres target tugas, dan setor tagihan harian
        </p>
      </div>

      {/* Profile Card */}
      <div className="rounded-2xl border border-navy-100 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-4">
          {/* Avatar */}
          <div className="relative">
            <div className="h-16 w-16 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white text-xl font-bold shadow-md">
              {profile?.name?.charAt(0)?.toUpperCase() || "U"}
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full bg-accent-500 border-2 border-white" />
          </div>

          {/* User Info */}
          <div className="flex-1 min-w-0">
            {isEditing ? (
              <div className="space-y-2">
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Nama lengkap"
                  className="w-full rounded-lg border border-navy-200 bg-surface px-3 py-1.5 text-sm text-navy-900 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
                />
                <input
                  type="tel"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  placeholder="Nomor telepon"
                  className="w-full rounded-lg border border-navy-200 bg-surface px-3 py-1.5 text-sm text-navy-900 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleSaveProfile}
                    disabled={isSaving}
                    className="rounded-lg bg-primary-600 px-3 py-1 text-[11px] font-bold text-white transition-all hover:bg-primary-700 disabled:opacity-60"
                  >
                    {isSaving ? "Menyimpan..." : "Simpan"}
                  </button>
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      setEditName(profile?.name || "");
                      setEditPhone(profile?.phone || "");
                    }}
                    className="rounded-lg border border-navy-200 px-3 py-1 text-[11px] font-semibold text-navy-600 hover:bg-navy-50"
                  >
                    Batal
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-bold text-navy-900 truncate">
                    {profile?.name || "Nama Pengguna"}
                  </h2>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="rounded-lg p-1 text-navy-400 hover:bg-navy-50 hover:text-navy-700"
                    title="Edit profil"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                      <path d="m5.433 13.917 1.262-3.155A4 4 0 0 1 7.58 9.42l6.92-6.918a2.121 2.121 0 0 1 3 3l-6.92 6.918c-.383.383-.84.685-1.343.886l-3.154 1.262a.5.5 0 0 1-.65-.65Z" />
                      <path d="M3.5 5.75c0-.69.56-1.25 1.25-1.25H10a.75.75 0 0 0 0-1.5H4.75A2.75 2.75 0 0 0 2 5.75v9.5A2.75 2.75 0 0 0 4.75 18h9.5A2.75 2.75 0 0 0 17 15.25V10a.75.75 0 0 0-1.5 0v5.25c0 .69-.56 1.25-1.25 1.25h-9.5c-.69 0-1.25-.56-1.25-1.25v-9.5Z" />
                    </svg>
                  </button>
                </div>
                <p className="text-xs text-foreground-muted font-mono">{profile?.email || "-"}</p>
                <div className="mt-2 flex items-center gap-2">
                  <span className="rounded-full bg-primary-50 px-2.5 py-0.5 text-[10px] font-bold text-primary-700 border border-primary-200">
                    {roleLabelMap[profile?.role || "sales"] || "SALES"}
                  </span>
                  <span className="text-xs text-navy-400 font-mono">
                    {profile?.phone || "Belum ada telepon"}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stats Summary Grid */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-navy-100 bg-white p-3.5 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <div className="h-8 w-8 rounded-lg bg-primary-50 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 text-primary-600">
                <path d="M10 9a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM6 8a2 2 0 1 1-4 0 2 2 0 0 1 4 0ZM1.49 15.326a.78.78 0 0 1-.358-.442 3 3 0 0 1 4.308-3.516 6.484 6.484 0 0 0-1.905 3.959c-.023.222-.014.442.025.654a4.97 4.97 0 0 1-2.07-.655ZM16.44 15.98a4.97 4.97 0 0 0 2.07-.654.78.78 0 0 0 .357-.442 3 3 0 0 0-4.308-3.517 6.484 6.484 0 0 1 1.907 3.96 2.32 2.32 0 0 1-.026.654ZM18 8a2 2 0 1 1-4 0 2 2 0 0 1 4 0ZM5.304 16.19a.844.844 0 0 1-.277-.71 5 5 0 0 1 9.947 0 .843.843 0 0 1-.277.71A6.975 6.975 0 0 1 10 18a6.974 6.974 0 0 1-4.696-1.81Z" />
              </svg>
            </div>
            <p className="text-[10px] text-navy-500 font-medium">Kunjungan Selesai</p>
          </div>
          <p className="text-xl font-bold text-navy-900">{visitLogs.length}</p>
        </div>

        <div className="rounded-xl border border-navy-100 bg-white p-3.5 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <div className="h-8 w-8 rounded-lg bg-accent-50 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 text-accent-600">
                <path d="M1 4.25a3.733 3.733 0 0 1 2.25-.75h13.5c.844 0 1.623.279 2.25.75A2.25 2.25 0 0 0 16.75 2H3.25A2.25 2.25 0 0 0 1 4.25ZM1 7.25a3.733 3.733 0 0 1 2.25-.75h13.5c.844 0 1.623.279 2.25.75A2.25 2.25 0 0 0 16.75 5H3.25A2.25 2.25 0 0 0 1 7.25ZM7 8a1 1 0 0 0 0 2h6a1 1 0 1 0 0-2H7ZM3.25 8A2.25 2.25 0 0 0 1 10.25v4.5A2.25 2.25 0 0 0 3.25 17h13.5A2.25 2.25 0 0 0 19 14.75v-4.5A2.25 2.25 0 0 0 16.75 8H3.25Z" />
              </svg>
            </div>
            <p className="text-[10px] text-navy-500 font-medium">Toko Mitra</p>
          </div>
          <p className="text-xl font-bold text-navy-900">{storeCount}</p>
        </div>

        <div className="rounded-xl border border-navy-100 bg-white p-3.5 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <div className="h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 text-blue-600">
                <path fillRule="evenodd" d="m9.69 18.933.003.001C9.89 19.02 10 19 10 19s.11.02.308-.066l.002-.001.006-.003.018-.008a5.741 5.741 0 0 0 .281-.14c.186-.096.446-.24.757-.433.62-.384 1.445-.966 2.274-1.765C15.302 14.988 17 12.493 17 9A7 7 0 1 0 3 9c0 3.492 1.698 5.988 3.355 7.584a13.731 13.731 0 0 0 2.273 1.765 11.842 11.842 0 0 0 .976.544l.062.029.018.008.006.003ZM10 11.25a2.25 2.25 0 1 0 0-4.5 2.25 2.25 0 0 0 0 4.5Z" clipRule="evenodd" />
              </svg>
            </div>
            <p className="text-[10px] text-navy-500 font-medium">GPS Heartbeat</p>
          </div>
          <p className="text-xl font-bold text-navy-900">{pingCount}</p>
        </div>

        <div className="rounded-xl border border-navy-100 bg-white p-3.5 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <div className="h-8 w-8 rounded-lg bg-emerald-50 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 text-emerald-600">
                <path d="M10 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM3.465 14.493a1.23 1.23 0 0 0 .41 1.412A9.957 9.957 0 0 0 10 18c2.31 0 4.438-.784 6.131-2.1.43-.333.604-.903.408-1.41a7.002 7.002 0 0 0-13.074.003Z" />
              </svg>
            </div>
            <p className="text-[10px] text-navy-500 font-medium">Tagihan Terkumpul</p>
          </div>
          <p className="text-base font-bold text-navy-900 truncate">
            {formatRupiah(totalPaidAmount)}
          </p>
        </div>
      </div>

      {/* FITUR 3: SECTION SETOR TAGIHAN & AKHIR SESI */}
      <div className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-white p-4 shadow-sm space-y-3">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-sm font-bold text-navy-950">
              Setor Tagihan Harian
            </h2>
            <p className="text-[11px] text-foreground-muted">
              Kirim rekap tagihan terkumpul hari ini ke Admin dan akhiri sesi tracking GPS.
            </p>
          </div>
          <span
            className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold border ${
              isDepositApproved
                ? "bg-accent-50 text-accent-700 border-accent-200"
                : isDepositWaiting
                ? "bg-amber-50 text-amber-800 border-amber-300 animate-pulse"
                : "bg-navy-100 text-navy-700 border-navy-200"
            }`}
          >
            {isDepositApproved
              ? "✓ Disetujui"
              : isDepositWaiting
              ? "⏳ Menunggu Admin"
              : "Belum Setor"}
          </span>
        </div>

        <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-navy-100">
          <span className="text-xs text-navy-600 font-medium">Total Uang Disetor:</span>
          <span className="font-mono font-black text-base text-accent-700">
            {formatRupiah(totalPaidAmount)}
          </span>
        </div>

        {/* Setor Button */}
        {isDepositApproved ? (
          <div className="rounded-xl bg-accent-50 border border-accent-200 p-2.5 text-center text-xs font-bold text-accent-700">
            ✓ Setoran hari ini telah disetujui Admin. Terima kasih!
          </div>
        ) : isDepositWaiting ? (
          <div className="rounded-xl bg-amber-50 border border-amber-200 p-2.5 text-center text-xs font-bold text-amber-800">
            ⏳ Laporan setoran sedang menunggu konfirmasi Administrator di Dashboard.
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setShowDepositModal(true)}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 py-3 text-xs font-bold text-white shadow-md transition-all hover:from-emerald-700 hover:to-teal-800 active:scale-[0.98]"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
              <path d="M10 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM3.465 14.493a1.23 1.23 0 0 0 .41 1.412A9.957 9.957 0 0 0 10 18c2.31 0 4.438-.784 6.131-2.1.43-.333.604-.903.408-1.41a7.002 7.002 0 0 0-13.074.003Z" />
            </svg>
            <span>Setor Tagihan Sekarang</span>
          </button>
        )}
      </div>

      {/* Settings Section */}
      <div>
        <h2 className="mb-2 text-sm font-semibold text-navy-700">
          Pengaturan
        </h2>
        <div className="rounded-2xl border border-navy-100 bg-white shadow-sm divide-y divide-navy-100">
          {/* App Version */}
          <div className="flex items-center justify-between px-4 py-3.5">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-navy-50 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 text-navy-500">
                  <path fillRule="evenodd" d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-7-4a1 1 0 1 1-2 0 1 1 0 0 1 2 0ZM9 9a.75.75 0 0 0 0 1.5h.253a.25.25 0 0 1 .244.304l-.459 2.066A1.75 1.75 0 0 0 10.747 15H11a.75.75 0 0 0 0-1.5h-.253a.25.25 0 0 1-.244-.304l.459-2.066A1.75 1.75 0 0 0 9.253 9H9Z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <p className="text-xs font-semibold text-navy-900">Versi Aplikasi</p>
                <p className="text-[10px] text-navy-400">SLL Mobile v1.0.0</p>
              </div>
            </div>
            <span className="rounded-full bg-accent-50 px-2 py-0.5 text-[10px] font-bold text-accent-700 border border-accent-200">
              Terbaru
            </span>
          </div>

          {/* GPS Tracking Status */}
          <div className="flex items-center justify-between px-4 py-3.5">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-navy-50 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 text-navy-500">
                  <path fillRule="evenodd" d="m9.69 18.933.003.001C9.89 19.02 10 19 10 19s.11.02.308-.066l.002-.001.006-.003.018-.008a5.741 5.741 0 0 0 .281-.14c.186-.096.446-.24.757-.433.62-.384 1.445-.966 2.274-1.765C15.302 14.988 17 12.493 17 9A7 7 0 1 0 3 9c0 3.492 1.698 5.988 3.355 7.584a13.731 13.731 0 0 0 2.273 1.765 11.842 11.842 0 0 0 .976.544l.062.029.018.008.006.003ZM10 11.25a2.25 2.25 0 1 0 0-4.5 2.25 2.25 0 0 0 0 4.5Z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <p className="text-xs font-semibold text-navy-900">GPS Live Tracking</p>
                <p className="text-[10px] text-navy-400">Background 5 Menit</p>
              </div>
            </div>
            <span className="text-[10px] text-accent-600 font-semibold">Aktif</span>
          </div>
        </div>
      </div>

      {/* Logout Button */}
      <button
        onClick={() => setShowLogoutModal(true)}
        className="w-full flex items-center justify-center gap-2 rounded-xl border border-danger-200 bg-danger-50 py-3 text-sm font-bold text-danger-600 shadow-sm transition-all hover:bg-danger-100 active:scale-[0.98]"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
          <path fillRule="evenodd" d="M3 4.25A2.25 2.25 0 0 1 5.25 2h5.5A2.25 2.25 0 0 1 13 4.25v2a.75.75 0 0 1-1.5 0v-2a.75.75 0 0 0-.75-.75h-5.5a.75.75 0 0 0-.75.75v11.5c0 .414.336.75.75.75h5.5a.75.75 0 0 0 .75-.75v-2a.75.75 0 0 1 1.5 0v2A2.25 2.25 0 0 1 10.75 18h-5.5A2.25 2.25 0 0 1 3 15.75V4.25Z" clipRule="evenodd" />
          <path fillRule="evenodd" d="M19 10a.75.75 0 0 0-.75-.75H8.704l1.048-.943a.75.75 0 1 0-1.004-1.114l-2.5 2.25a.75.75 0 0 0 0 1.114l2.5 2.25a.75.75 0 1 0 1.004-1.114l-1.048-.943h9.546A.75.75 0 0 0 19 10Z" clipRule="evenodd" />
        </svg>
        Keluar dari Akun
      </button>

      {/* MODAL KONFIRMASI SETOR TAGIHAN */}
      {showDepositModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl space-y-4 animate-slide-up">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-8 w-8">
                <path d="M12 7.5a2.25 2.25 0 1 0 0 4.5 2.25 2.25 0 0 0 0-4.5Z" />
                <path fillRule="evenodd" d="M1.5 4.875C1.5 3.839 2.34 3 3.375 3h17.25c1.035 0 1.875.84 1.875 1.875v9.75c0 1.036-.84 1.875-1.875 1.875H3.375A1.875 1.875 0 0 1 1.5 14.625v-9.75ZM8.25 9.75a3.75 3.75 0 1 1 7.5 0 3.75 3.75 0 0 1-7.5 0ZM18.75 9a.75.75 0 0 0-.75.75v.008c0 .414.336.75.75.75h.008a.75.75 0 0 0 .75-.75V9.75a.75.75 0 0 0-.75-.75h-.008ZM4.5 9.75A.75.75 0 0 1 5.25 9h.008a.75.75 0 0 1 .75.75v.008a.75.75 0 0 1-.75.75H5.25a.75.75 0 0 1-.75-.75V9.75Z" clipRule="evenodd" />
                <path d="M2.25 18a.75.75 0 0 0 0 1.5c5.4 0 10.63.722 15.6 2.075 1.19.324 2.4-.558 2.4-1.82V18.75a.75.75 0 0 0-.75-.75H2.25Z" />
              </svg>
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-base font-bold text-navy-900">
                Konfirmasi Setor Tagihan Harian
              </h3>
              <p className="text-xs text-foreground-muted">
                Kirimkan laporan total penerimaan tagihan hari ini ke Admin.
              </p>
            </div>

            <div className="rounded-xl border border-navy-100 bg-surface-dim p-3.5 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-navy-600 font-medium">Petugas Sales:</span>
                <span className="font-bold text-navy-900">{profile?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-navy-600 font-medium">Total Uang Terkumpul:</span>
                <span className="font-mono font-bold text-accent-700 text-sm">
                  {formatRupiah(totalPaidAmount)}
                </span>
              </div>
              <div className="pt-2 border-t border-navy-200/60 text-[11px] text-amber-800 bg-amber-50 p-2 rounded-lg">
                ⚠️ <strong>Catatan:</strong> Mengirim setoran akan otomatis <strong>mengakhiri sesi Shareloc Live</strong> hari ini.
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-navy-800">
                Catatan / Keterangan Setoran
              </label>
              <textarea
                rows={2}
                value={depositNotes}
                onChange={(e) => setDepositNotes(e.target.value)}
                placeholder="Contoh: Setoran uang tunai telah diserahkan ke kasir..."
                className="w-full rounded-xl border border-navy-200 bg-surface p-2.5 text-xs text-navy-900 outline-none focus:border-emerald-500"
              />
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <button
                type="button"
                onClick={handleConfirmDeposit}
                disabled={isSubmittingDeposit}
                className="w-full rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 py-3 text-xs font-bold text-white shadow hover:from-emerald-700 hover:to-teal-800 active:scale-95 disabled:opacity-50"
              >
                {isSubmittingDeposit ? "Mengirim Setoran..." : "Kirim & Akhiri Shareloc Live"}
              </button>
              <button
                type="button"
                onClick={() => setShowDepositModal(false)}
                className="w-full rounded-xl border border-navy-200 py-2.5 text-xs font-bold text-navy-700 hover:bg-navy-50 active:scale-95"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* POPUP SUKSES SETORAN */}
      {depositSuccessData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl space-y-4 animate-slide-up text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-accent-100 text-accent-600 text-2xl">
              🎉
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-navy-900">
                Setoran Berhasil Diajukan!
              </h3>
              <p className="text-xs text-foreground-muted">
                Laporan setoran sebesar <strong>{formatRupiah(depositSuccessData.amount)}</strong> telah dikirim ke Dashboard Admin. Sesi Shareloc Live hari ini telah dinonaktifkan.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setDepositSuccessData(null)}
              className="w-full rounded-xl bg-navy-900 py-2.5 text-xs font-bold text-white hover:bg-navy-800 active:scale-95"
            >
              Mengerti & Tutup
            </button>
          </div>
        </div>
      )}

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl space-y-4 animate-slide-up">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-danger-100 text-danger-600">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-7 w-7">
                <path fillRule="evenodd" d="M7.5 3.75A1.5 1.5 0 0 0 6 5.25v13.5a1.5 1.5 0 0 0 1.5 1.5h6a1.5 1.5 0 0 0 1.5-1.5V15a.75.75 0 0 1 1.5 0v3.75a3 3 0 0 1-3 3h-6a3 3 0 0 1-3-3V5.25a3 3 0 0 1 3-3h6a3 3 0 0 1 3 3V9A.75.75 0 0 1 15 9V5.25a1.5 1.5 0 0 0-1.5-1.5h-6Zm10.72 4.72a.75.75 0 0 1 1.06 0l3 3a.75.75 0 0 1 0 1.06l-3 3a.75.75 0 1 1-1.06-1.06l1.72-1.72H9a.75.75 0 0 1 0-1.5h10.94l-1.72-1.72a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
              </svg>
            </div>

            <div className="text-center space-y-1">
              <h2 className="text-lg font-bold text-navy-900">
                Keluar dari Akun?
              </h2>
              <p className="text-xs text-foreground-muted">
                Anda akan dikembalikan ke halaman login. Sesi tracking yang sedang aktif akan otomatis dihentikan.
              </p>
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <button
                onClick={handleLogout}
                className="w-full rounded-xl bg-danger-600 py-2.5 text-xs font-bold text-white transition-all hover:bg-danger-700 active:scale-95"
              >
                Ya, Keluar Sekarang
              </button>
              <button
                onClick={() => setShowLogoutModal(false)}
                className="w-full rounded-xl border border-navy-200 bg-white py-2.5 text-xs font-bold text-navy-700 transition-all hover:bg-navy-50 active:scale-95"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
