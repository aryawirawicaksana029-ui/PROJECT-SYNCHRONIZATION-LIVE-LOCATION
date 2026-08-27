"use client";

import { useState, useEffect } from "react";
import {
  getUsers,
  addUser,
  updateUser,
  deleteUser,
  getDailyTasks,
  saveDailyTask,
  confirmDailyDeposit,
  getProducts,
} from "@/lib/db";
import { formatRupiah } from "@/lib/catalogData";
import {
  UserRow,
  UserRole,
  UserStatus,
  SalesDailyTask,
  TargetProductItem,
  ProductRow,
} from "@/lib/database.types";

export default function UsersPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [dailyTasks, setDailyTasks] = useState<SalesDailyTask[]>([]);
  const [catalogProducts, setCatalogProducts] = useState<ProductRow[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(true);

  // User CRUD Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserRow | null>(null);
  const [deleteTargetUser, setDeleteTargetUser] = useState<UserRow | null>(null);

  // Daily Task Modal State
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [taskTargetUser, setTaskTargetUser] = useState<UserRow | null>(null);
  const [currentTask, setCurrentTask] = useState<SalesDailyTask | null>(null);
  const [taskTargetAmount, setTaskTargetAmount] = useState<string>("5000000");
  const [taskProductItems, setTaskProductItems] = useState<TargetProductItem[]>([]);
  const [selectedAddProductId, setSelectedAddProductId] = useState<string>("");
  const [selectedAddProductQty, setSelectedAddProductQty] = useState<number>(10);
  const [isSavingTask, setIsSavingTask] = useState(false);
  const [taskActionToast, setTaskActionToast] = useState<string | null>(null);

  // Credentials Share Modal
  const [credentialsModalData, setCredentialsModalData] = useState<{
    name: string;
    email: string;
    password: string;
    role: string;
    isNew: boolean;
  } | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);

  // User Form State
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<UserRole>("sales");
  const [status, setStatus] = useState<UserStatus>("active");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch Users & Tasks
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [usersData, tasksData, productsData] = await Promise.all([
        getUsers(),
        getDailyTasks(),
        getProducts(),
      ]);
      setUsers(usersData);
      setDailyTasks(tasksData);
      setCatalogProducts(productsData);
      if (productsData.length > 0) {
        setSelectedAddProductId(productsData[0].id);
      }
    } catch {
      // fallback
    }
    setIsLoading(false);
  };

  // Helper to generate strong initial password
  const generateRandomPassword = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
    let res = "";
    for (let i = 0; i < 8; i++) {
      res += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setPassword(res);
  };

  // Open Modal for Create or Edit User
  const handleOpenModal = (user?: UserRow) => {
    setErrors({});
    setShowPassword(false);
    if (user) {
      setEditingUser(user);
      setName(user.name);
      setEmail(user.email);
      setPhone(user.phone || "");
      setPassword(user.password || "");
      setRole((user.role === "admin" ? "admin" : "sales") as UserRole);
      setStatus((user.status || "active") as UserStatus);
    } else {
      setEditingUser(null);
      setName("");
      setEmail("");
      setPhone("");
      generateRandomPassword();
      setRole("sales");
      setStatus("active");
    }
    setIsModalOpen(true);
  };

  // Open Daily Task Modal
  const handleOpenTaskModal = (user: UserRow) => {
    setTaskTargetUser(user);
    const existing = dailyTasks.find((t) => t.user_id === user.id);
    if (existing) {
      setCurrentTask(existing);
      setTaskTargetAmount(existing.target_collection_amount.toString());
      setTaskProductItems(existing.target_products || []);
    } else {
      const defaultProductsList: TargetProductItem[] = catalogProducts.slice(0, 3).map((p) => ({
        product_id: p.id,
        product_name: p.name,
        target_qty: 10,
        sold_qty: 0,
      }));
      setCurrentTask(null);
      setTaskTargetAmount("5000000");
      setTaskProductItems(defaultProductsList);
    }
    setTaskModalOpen(true);
  };

  // Add Product to Daily Task Target
  const handleAddProductToTask = () => {
    const prod = catalogProducts.find((p) => p.id === selectedAddProductId);
    if (!prod) return;

    if (taskProductItems.some((item) => item.product_id === prod.id)) {
      setTaskProductItems((prev) =>
        prev.map((item) =>
          item.product_id === prod.id
            ? { ...item, target_qty: item.target_qty + selectedAddProductQty }
            : item
        )
      );
    } else {
      setTaskProductItems((prev) => [
        ...prev,
        {
          product_id: prod.id,
          product_name: prod.name,
          target_qty: selectedAddProductQty,
          sold_qty: 0,
        },
      ]);
    }
  };

  // Remove Product from Daily Task Target
  const handleRemoveProductFromTask = (productId: string) => {
    setTaskProductItems((prev) => prev.filter((p) => p.product_id !== productId));
  };

  // Save Daily Task
  const handleSaveDailyTask = async () => {
    if (!taskTargetUser) return;
    setIsSavingTask(true);
    try {
      const saved = await saveDailyTask({
        id: currentTask?.id,
        user_id: taskTargetUser.id,
        target_collection_amount: parseInt(taskTargetAmount.replace(/\D/g, ""), 10) || 5000000,
        target_products: taskProductItems,
      });
      setDailyTasks((prev) => {
        const idx = prev.findIndex((t) => t.id === saved.id);
        if (idx >= 0) {
          const updated = [...prev];
          updated[idx] = saved;
          return updated;
        }
        return [saved, ...prev];
      });
      setCurrentTask(saved);
      setTaskActionToast(`Tugas harian untuk "${taskTargetUser.name}" berhasil diperbarui!`);
      setTimeout(() => setTaskActionToast(null), 3500);
      setTaskModalOpen(false);
    } catch {
      // ignore
    }
    setIsSavingTask(false);
  };

  // Confirm / Reject Deposit Action
  const handleConfirmDepositAction = async (taskId: string, status: "approved" | "rejected") => {
    const updated = await confirmDailyDeposit(taskId, status);
    if (updated) {
      setDailyTasks((prev) => prev.map((t) => (t.id === taskId ? updated : t)));
      setCurrentTask(updated);
      setTaskActionToast(
        status === "approved"
          ? "✅ Setoran harian berhasil dikonfirmasi dan disetujui!"
          : "❌ Setoran harian ditolak."
      );
      setTimeout(() => setTaskActionToast(null), 4000);
    }
  };

  // Quick Reset Password Action
  const handleQuickResetPassword = async (user: UserRow) => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
    let newPass = "";
    for (let i = 0; i < 8; i++) {
      newPass += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    const updated = await updateUser(user.id, { password: newPass });
    if (updated) {
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, password: newPass } : u))
      );
      setCredentialsModalData({
        name: user.name,
        email: user.email,
        password: newPass,
        role: user.role === "admin" ? "ADMIN" : "SALES (Pekerja Lapangan)",
        isNew: false,
      });
    }
  };

  // Quick Toggle Status (Active / Inactive)
  const handleToggleStatus = async (user: UserRow) => {
    const newStatus: UserStatus = user.status === "inactive" ? "active" : "inactive";
    const updated = await updateUser(user.id, { status: newStatus });
    if (updated) {
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, status: newStatus } : u))
      );
    }
  };

  // Delete Handler
  const handleConfirmDelete = async () => {
    if (!deleteTargetUser) return;
    const ok = await deleteUser(deleteTargetUser.id);
    if (ok) {
      setUsers((prev) => prev.filter((u) => u.id !== deleteTargetUser.id));
      setDeleteTargetUser(null);
    }
  };

  // Form Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!name.trim() || name.trim().length < 3) {
      newErrors.name = "Nama lengkap wajib diisi (minimal 3 karakter).";
    }

    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      newErrors.email = "Format alamat email tidak valid.";
    }

    if (!password.trim() || password.trim().length < 6) {
      newErrors.password = "Password minimal 6 karakter.";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingUser) {
        const updated = await updateUser(editingUser.id, {
          name: name.trim(),
          email: email.trim().toLowerCase(),
          phone: phone.trim() || undefined,
          password: password.trim(),
          role: role,
          status: status,
        });

        if (updated) {
          setUsers((prev) =>
            prev.map((u) => (u.id === editingUser.id ? updated : u))
          );
        }
        setIsModalOpen(false);
      } else {
        const created = await addUser({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          phone: phone.trim() || undefined,
          password: password.trim(),
          role: role,
          status: status,
        });

        setUsers((prev) => [created, ...prev]);
        setIsModalOpen(false);

        // Show credentials modal
        setCredentialsModalData({
          name: created.name,
          email: created.email,
          password: password.trim(),
          role: created.role === "admin" ? "ADMIN" : "SALES (Pekerja Lapangan)",
          isNew: true,
        });
      }
    } catch {
      setErrors({ form: "Terjadi kesalahan saat menyimpan data." });
    }
    setIsSubmitting(false);
  };

  const handleCopyCredentials = () => {
    if (!credentialsModalData) return;
    const text = `KREDENSIAL AKSES APLIKASI SLL:\nNama: ${credentialsModalData.name}\nEmail: ${credentialsModalData.email}\nPassword: ${credentialsModalData.password}\nRole: ${credentialsModalData.role}\nLogin: https://app.sll.co.id/login`;
    navigator.clipboard.writeText(text);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2500);
  };

  const filteredUsers = users.filter((u) => {
    const matchSearch =
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.phone && u.phone.includes(searchTerm));

    const matchRole =
      roleFilter === "all" ||
      (roleFilter === "admin" && u.role === "admin") ||
      (roleFilter === "sales" && u.role !== "admin");

    const matchStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && (u.status || "active") === "active") ||
      (statusFilter === "inactive" && u.status === "inactive");

    return matchSearch && matchRole && matchStatus;
  });

  const totalSales = users.filter((u) => u.role !== "admin").length;
  const totalAdmin = users.filter((u) => u.role === "admin").length;
  const waitingDepositCount = dailyTasks.filter(
    (t) => t.deposit_status === "waiting_confirmation"
  ).length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-navy-900">Manajemen Pengguna & Tugas</h1>
          <p className="mt-0.5 text-xs text-foreground-muted">
            Kelola hak akses akun, target tugas harian bahan baku, dan konfirmasi setoran tagihan sales
          </p>
        </div>

        <button
          onClick={() => handleOpenModal()}
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
          <span>Tambah Pengguna Baru</span>
        </button>
      </div>

      {/* Action Toast Alert */}
      {taskActionToast && (
        <div className="rounded-xl bg-accent-600 text-white px-4 py-3 text-xs font-bold shadow-md flex items-center justify-between animate-fade-in">
          <span>{taskActionToast}</span>
          <button onClick={() => setTaskActionToast(null)} className="text-white/80 hover:text-white">
            ✕
          </button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-2xl border border-navy-100 bg-white p-4 shadow-sm">
          <p className="text-xs text-navy-500 font-medium">Total Akun</p>
          <p className="text-2xl font-bold text-navy-950 mt-1">{users.length}</p>
          <p className="text-[11px] text-navy-400 mt-0.5">Pengguna terdaftar</p>
        </div>

        <div className="rounded-2xl border border-primary-100 bg-primary-50/50 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs text-primary-700 font-bold">Sales Lapangan</p>
            <span className="text-[10px] bg-primary-100 text-primary-800 px-1.5 py-0.5 rounded font-bold">
              Mobile
            </span>
          </div>
          <p className="text-2xl font-bold text-primary-950 mt-1">{totalSales}</p>
          <p className="text-[11px] text-primary-600 mt-0.5">Petugas lapangan</p>
        </div>

        <div className="rounded-2xl border border-purple-100 bg-purple-50/50 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs text-purple-700 font-bold">Administrator</p>
            <span className="text-[10px] bg-purple-100 text-purple-800 px-1.5 py-0.5 rounded font-bold">
              Dashboard
            </span>
          </div>
          <p className="text-2xl font-bold text-purple-950 mt-1">{totalAdmin}</p>
          <p className="text-[11px] text-purple-600 mt-0.5">Akses penuh sistem</p>
        </div>

        <div className="rounded-2xl border border-amber-100 bg-amber-50/60 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs text-amber-800 font-bold">Setoran Masuk</p>
            {waitingDepositCount > 0 && (
              <span className="h-2 w-2 rounded-full bg-amber-500 animate-ping" />
            )}
          </div>
          <p className="text-2xl font-bold text-amber-950 mt-1">{waitingDepositCount}</p>
          <p className="text-[11px] text-amber-700 mt-0.5">Menunggu konfirmasi</p>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="rounded-2xl border border-navy-100 bg-white p-4 shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Search Input */}
          <div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="🔍 Cari nama, email, atau telepon..."
              className="w-full rounded-xl border border-navy-200 bg-surface-dim px-3 py-2 text-xs text-navy-900 outline-none focus:border-primary-500"
            />
          </div>

          {/* Role Filter */}
          <div>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full rounded-xl border border-navy-200 bg-surface-dim px-3 py-2 text-xs font-semibold text-navy-900 outline-none focus:border-primary-500"
            >
              <option value="all">👑 Semua Role Sistem</option>
              <option value="admin">👑 ADMIN (Web Dashboard)</option>
              <option value="sales">🏃 SALES (Pekerja Lapangan)</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full rounded-xl border border-navy-200 bg-surface-dim px-3 py-2 text-xs font-semibold text-navy-900 outline-none focus:border-primary-500"
            >
              <option value="all">⚡ Semua Status Akun</option>
              <option value="active">🟢 Status: Aktif</option>
              <option value="inactive">🔴 Status: Nonaktif</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="rounded-2xl border border-navy-100 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-navy-900">
            <thead className="bg-navy-950 text-white font-semibold">
              <tr>
                <th className="px-4 py-3.5">Pengguna</th>
                <th className="px-4 py-3.5">Role Sistem</th>
                <th className="px-4 py-3.5">Tugas & Setoran</th>
                <th className="px-4 py-3.5">Kontak / Telepon</th>
                <th className="px-4 py-3.5">Status Akun</th>
                <th className="px-4 py-3.5 text-center">Aksi & Reset</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-navy-100">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-navy-400">
                    <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-primary-600 border-t-transparent mb-2" />
                    <p>Memuat data pengguna...</p>
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-navy-400">
                    Tidak ada pengguna yang cocok dengan filter atau pencarian.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user, idx) => {
                  const isAdmin = user.role === "admin";
                  const isActive = (user.status || "active") === "active";
                  const rowKey = user.id ? `u-${user.id}` : `user-${user.email}-${idx}`;
                  const userTask = dailyTasks.find((t) => t.user_id === user.id);
                  const isWaitingConfirmation = userTask?.deposit_status === "waiting_confirmation";

                  return (
                    <tr key={rowKey} className="hover:bg-navy-50/80 transition-colors">
                      {/* Name & Avatar */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div
                            className={`h-9 w-9 rounded-xl flex items-center justify-center font-bold text-xs shadow-xs ${
                              isAdmin
                                ? "bg-purple-600 text-white"
                                : "bg-gradient-to-br from-primary-600 to-accent-600 text-white"
                            }`}
                          >
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-navy-900 leading-snug">
                              {user.name}
                            </p>
                            <p className="text-[11px] text-foreground-muted font-mono">
                              {user.email}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Standardized Role Badge */}
                      <td className="px-4 py-3">
                        {isAdmin ? (
                          <span className="inline-flex items-center gap-1 rounded-lg bg-purple-50 px-2.5 py-1 text-xs font-bold text-purple-700 border border-purple-200 shadow-2xs">
                            <span>👑</span>
                            <span>ADMIN</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-lg bg-primary-50 px-2.5 py-1 text-xs font-bold text-primary-700 border border-primary-200 shadow-2xs">
                            <span>🏃</span>
                            <span>SALES</span>
                          </span>
                        )}
                      </td>

                      {/* Tugas & Setoran Column */}
                      <td className="px-4 py-3">
                        {isAdmin ? (
                          <span className="text-navy-400 text-[11px] font-medium">-</span>
                        ) : (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleOpenTaskModal(user)}
                              className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold border transition-all active:scale-95 ${
                                isWaitingConfirmation
                                  ? "bg-amber-500 text-white border-amber-600 shadow-sm animate-pulse"
                                  : "bg-primary-50 text-primary-700 border-primary-200 hover:bg-primary-100"
                              }`}
                            >
                              <span>📋</span>
                              <span>{isWaitingConfirmation ? "⚡ Setoran Masuk!" : "Atur Tugas"}</span>
                            </button>

                            {userTask && userTask.deposit_status === "approved" && (
                              <span className="text-[10px] font-bold text-accent-700 bg-accent-50 px-1.5 py-0.5 rounded border border-accent-200">
                                ✓ Disetujui
                              </span>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Phone */}
                      <td className="px-4 py-3 font-mono font-medium text-navy-700">
                        {user.phone || "-"}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleToggleStatus(user)}
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold border transition-transform active:scale-95 ${
                            isActive
                              ? "bg-accent-50 text-accent-700 border-accent-200 hover:bg-accent-100"
                              : "bg-danger-50 text-danger-700 border-danger-200 hover:bg-danger-100"
                          }`}
                          title="Klik untuk ubah status"
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              isActive ? "bg-accent-500" : "bg-danger-500"
                            }`}
                          />
                          <span>{isActive ? "Aktif" : "Nonaktif"}</span>
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Reset Password Button */}
                          <button
                            onClick={() => handleQuickResetPassword(user)}
                            className="inline-flex items-center gap-1 rounded-lg bg-amber-50 px-2 py-1 text-[11px] font-bold text-amber-700 border border-amber-200 hover:bg-amber-100 transition-colors"
                            title="Reset Password Pengguna"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3 w-3">
                              <path fillRule="evenodd" d="M15.312 11.424a5.5 5.5 0 01-9.201 2.466l-.312-.311h2.451a.75.75 0 000-1.5H4.5a.75.75 0 00-.75.75v3.75a.75.75 0 001.5 0v-2.199l.462.463a7 7 0 1010.513-3.794.75.75 0 00-.913.424z" clipRule="evenodd" />
                            </svg>
                            <span>Reset</span>
                          </button>

                          <button
                            onClick={() => handleOpenModal(user)}
                            className="rounded-lg bg-navy-100 p-1.5 text-navy-700 hover:bg-navy-200 transition-colors"
                            title="Edit Data User"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
                              <path d="M5.433 13.917l1.262-3.155A4 4 0 017.58 9.42l6.92-6.918a2.121 2.121 0 013 3l-6.92 6.918c-.383.383-.84.685-1.343.886l-3.154 1.262a.5.5 0 01-.65-.65z" />
                              <path d="M3.5 5.75c0-.69.56-1.25 1.25-1.25H10a.75.75 0 000-1.5H4.75A2.75 2.75 0 002 5.75v9.5A2.75 2.75 0 004.75 18h9.5A2.75 2.75 0 0017 15.25V10a.75.75 0 00-1.5 0v5.25c0 .69-.56 1.25-1.25 1.25h-9.5c-.69 0-1.25-.56-1.25-1.25v-9.5z" />
                            </svg>
                          </button>

                          <button
                            onClick={() => setDeleteTargetUser(user)}
                            className="rounded-lg bg-danger-500/10 p-1.5 text-danger-600 hover:bg-danger-500/20 transition-colors"
                            title="Hapus User"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
                              <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 01.75.75v6a.75.75 0 01-1.5 0v-6a.75.75 0 01.75-.75zm3.34 0a.75.75 0 01.75.75v6a.75.75 0 01-1.5 0v-6a.75.75 0 01.75-.75z" clipRule="evenodd" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL ATUR TUGAS HARIAN & KONFIRMASI SETORAN */}
      {taskModalOpen && taskTargetUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in overflow-y-auto">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl space-y-4 my-6 animate-slide-up max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-navy-100 pb-3">
              <div>
                <h2 className="text-base font-bold text-navy-900">
                  Atur Tugas & Setoran Harian
                </h2>
                <p className="text-xs text-foreground-muted">
                  Sales: <span className="font-bold text-navy-900">{taskTargetUser.name}</span> ({taskTargetUser.email})
                </p>
              </div>
              <button
                onClick={() => setTaskModalOpen(false)}
                className="rounded-xl p-1.5 text-navy-400 hover:bg-navy-50 hover:text-navy-700"
              >
                ✕
              </button>
            </div>

            {/* Setoran Masuk Alert (if waiting confirmation) */}
            {currentTask?.deposit_status === "waiting_confirmation" && (
              <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 space-y-2.5 animate-pulse-soft">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                    <span>⚡</span> Setoran Harian Telah Diajukan Sales
                  </span>
                  <span className="rounded bg-amber-200 text-amber-900 px-2 py-0.5 text-[10px] font-bold">
                    Menunggu Konfirmasi
                  </span>
                </div>
                <div className="text-xs text-amber-800 space-y-1">
                  <p>
                    Nominal Disetor:{" "}
                    <strong className="font-mono text-sm text-navy-950">
                      {formatRupiah(currentTask.actual_collection_amount || 0)}
                    </strong>
                  </p>
                  <p className="text-[11px] italic">"{currentTask.deposit_notes || "Setoran harian sales"}"</p>
                </div>
                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => handleConfirmDepositAction(currentTask.id, "approved")}
                    className="flex-1 rounded-xl bg-accent-600 py-2 text-xs font-bold text-white shadow hover:bg-accent-700 active:scale-95"
                  >
                    ✓ Konfirmasi Setoran
                  </button>
                  <button
                    type="button"
                    onClick={() => handleConfirmDepositAction(currentTask.id, "rejected")}
                    className="rounded-xl border border-danger-300 bg-white px-3 py-2 text-xs font-bold text-danger-700 hover:bg-danger-50 active:scale-95"
                  >
                    Tolak
                  </button>
                </div>
              </div>
            )}

            {/* Target Tagihan Rp Input */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-navy-900">
                1. Target Tagihan / Setoran Harian (Rp)
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <span className="text-xs font-bold text-navy-600">Rp</span>
                </div>
                <input
                  type="text"
                  value={taskTargetAmount}
                  onChange={(e) => setTaskTargetAmount(e.target.value)}
                  placeholder="5000000"
                  className="w-full rounded-xl border border-navy-200 bg-surface py-2.5 pl-9 pr-3 text-xs font-mono font-bold text-navy-900 outline-none focus:border-primary-500"
                />
              </div>
            </div>

            {/* Target Bahan Baku List */}
            <div className="space-y-2 pt-2 border-t border-navy-100">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-navy-900">
                  2. Target Bahan Baku yang Wajib Dijual
                </label>
                <span className="text-[10px] text-foreground-muted font-mono">
                  {taskProductItems.length} Produk Ditargetkan
                </span>
              </div>

              {/* Add item to task selector */}
              <div className="flex items-center gap-2 bg-surface-dim p-2.5 rounded-xl border border-navy-200">
                <select
                  value={selectedAddProductId}
                  onChange={(e) => setSelectedAddProductId(e.target.value)}
                  className="flex-1 rounded-lg border border-navy-200 bg-white px-2.5 py-1.5 text-xs text-navy-900 outline-none focus:border-primary-500"
                >
                  {catalogProducts.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.unit})
                    </option>
                  ))}
                </select>

                <input
                  type="number"
                  min={1}
                  max={999}
                  value={selectedAddProductQty}
                  onChange={(e) => setSelectedAddProductQty(parseInt(e.target.value, 10) || 1)}
                  className="w-14 rounded-lg border border-navy-200 bg-white px-2 py-1.5 text-xs font-bold text-center text-navy-900"
                  placeholder="Qty"
                />

                <button
                  type="button"
                  onClick={handleAddProductToTask}
                  className="rounded-lg bg-primary-600 px-3 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-primary-700 active:scale-95 shrink-0"
                >
                  + Tambah
                </button>
              </div>

              {/* Target Items Listing */}
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {taskProductItems.map((item) => (
                  <div
                    key={item.product_id}
                    className="flex items-center justify-between rounded-xl border border-navy-100 bg-white p-2.5 text-xs shadow-xs"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-navy-900 truncate">{item.product_name}</p>
                      <p className="text-[10px] text-foreground-muted">
                        Terjual: <span className="font-bold text-accent-700">{item.sold_qty || 0}</span> / Target: <span className="font-bold text-navy-800">{item.target_qty}</span>
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={1}
                        value={item.target_qty}
                        onChange={(e) => {
                          const val = parseInt(e.target.value, 10) || 1;
                          setTaskProductItems((prev) =>
                            prev.map((p) =>
                              p.product_id === item.product_id ? { ...p, target_qty: val } : p
                            )
                          );
                        }}
                        className="w-14 rounded-lg border border-navy-200 bg-surface px-1.5 py-1 text-center font-bold text-xs text-navy-900"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveProductFromTask(item.product_id)}
                        className="text-danger-500 hover:text-danger-700 p-1"
                        title="Hapus"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="flex justify-end gap-2 pt-3 border-t border-navy-100">
              <button
                type="button"
                onClick={() => setTaskModalOpen(false)}
                className="rounded-xl border border-navy-200 px-4 py-2 text-xs font-bold text-navy-700 hover:bg-navy-50 active:scale-95"
              >
                Tutup
              </button>
              <button
                type="button"
                onClick={handleSaveDailyTask}
                disabled={isSavingTask}
                className="rounded-xl bg-primary-600 px-5 py-2 text-xs font-bold text-white shadow-md hover:bg-primary-700 active:scale-95 disabled:opacity-50"
              >
                {isSavingTask ? "Menyimpan..." : "Simpan Tugas Harian"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Form Tambah / Edit User */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl space-y-4 animate-slide-up max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-navy-100 pb-3">
              <h2 className="text-base font-bold text-navy-900">
                {editingUser ? "Edit Data Pengguna" : "Tambah Pengguna Baru"}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="rounded-xl p-1.5 text-navy-400 hover:bg-navy-50 hover:text-navy-700"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5">
              {errors.form && (
                <div className="rounded-xl bg-danger-50 border border-danger-200 p-3 text-xs text-danger-700 font-medium">
                  {errors.form}
                </div>
              )}

              {/* Nama Lengkap */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-navy-900">
                  Nama Lengkap <span className="text-danger-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Contoh: Budi Santoso"
                  className="w-full rounded-xl border border-navy-200 bg-surface px-3 py-2 text-xs text-navy-900 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
                />
                {errors.name && (
                  <p className="text-[10px] text-danger-600 font-semibold">{errors.name}</p>
                )}
              </div>

              {/* Email */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-navy-900">
                  Alamat Email <span className="text-danger-500">*</span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nama@sll-app.id"
                  className="w-full rounded-xl border border-navy-200 bg-surface px-3 py-2 text-xs text-navy-900 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
                />
                {errors.email && (
                  <p className="text-[10px] text-danger-600 font-semibold">{errors.email}</p>
                )}
              </div>

              {/* Password Field with Toggle & Generator */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-navy-900">
                    Password Awal <span className="text-danger-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={generateRandomPassword}
                    className="text-[11px] font-bold text-primary-600 hover:text-primary-700"
                  >
                    🎲 Generate Acak
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Minimal 6 karakter"
                    className="w-full rounded-xl border border-navy-200 bg-surface py-2 pl-3 pr-10 text-xs font-mono text-navy-900 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-xs text-navy-400 hover:text-navy-700"
                  >
                    {showPassword ? "Sembunyikan" : "Lihat"}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-[10px] text-danger-600 font-semibold">{errors.password}</p>
                )}
              </div>

              {/* Telepon */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-navy-900">
                  Nomor WhatsApp / Telepon <span className="text-navy-400 font-normal">(Opsional)</span>
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="08123456789"
                  className="w-full rounded-xl border border-navy-200 bg-surface px-3 py-2 text-xs text-navy-900 outline-none focus:border-primary-500"
                />
              </div>

              {/* Standardized 2-Role Selector */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-navy-900">
                  Role Sistem Pengguna <span className="text-danger-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRole("sales")}
                    className={`flex flex-col items-start p-3 rounded-xl border transition-all text-left ${
                      role === "sales"
                        ? "border-primary-500 bg-primary-50/70 ring-2 ring-primary-500/20"
                        : "border-navy-200 hover:bg-navy-50"
                    }`}
                  >
                    <span className="text-xs font-bold text-navy-900 flex items-center gap-1">
                      <span>🏃</span> SALES
                    </span>
                    <span className="text-[10px] text-foreground-muted mt-0.5">
                      Pekerja lapangan & Mobile App
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRole("admin")}
                    className={`flex flex-col items-start p-3 rounded-xl border transition-all text-left ${
                      role === "admin"
                        ? "border-purple-500 bg-purple-50/70 ring-2 ring-purple-500/20"
                        : "border-navy-200 hover:bg-navy-50"
                    }`}
                  >
                    <span className="text-xs font-bold text-navy-900 flex items-center gap-1">
                      <span>👑</span> ADMIN
                    </span>
                    <span className="text-[10px] text-foreground-muted mt-0.5">
                      Akses Web Dashboard penuh
                    </span>
                  </button>
                </div>
              </div>

              {/* Status */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-navy-900">Status Akun</label>
                <div className="flex gap-4 pt-1">
                  <label className="flex items-center gap-2 text-xs font-semibold text-navy-800 cursor-pointer">
                    <input
                      type="radio"
                      name="status"
                      value="active"
                      checked={status === "active"}
                      onChange={() => setStatus("active")}
                      className="accent-accent-600"
                    />
                    <span>🟢 Aktif</span>
                  </label>
                  <label className="flex items-center gap-2 text-xs font-semibold text-navy-800 cursor-pointer">
                    <input
                      type="radio"
                      name="status"
                      value="inactive"
                      checked={status === "inactive"}
                      onChange={() => setStatus("inactive")}
                      className="accent-danger-600"
                    />
                    <span>🔴 Nonaktif</span>
                  </label>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex justify-end gap-2 pt-3 border-t border-navy-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl border border-navy-200 px-4 py-2 text-xs font-bold text-navy-700 hover:bg-navy-50 active:scale-95"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-xl bg-gradient-to-r from-accent-600 to-accent-700 px-5 py-2 text-xs font-bold text-white shadow-md hover:from-accent-700 hover:to-accent-800 active:scale-95 disabled:opacity-50"
                >
                  {isSubmitting
                    ? "Menyimpan..."
                    : editingUser
                    ? "Simpan Perubahan"
                    : "Daftarkan Pengguna"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL KREDENSIAL PENGGUNA */}
      {credentialsModalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl space-y-4 animate-slide-up">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent-50 text-accent-600 mx-auto">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6">
                <path fillRule="evenodd" d="M12 1.5a5.25 5.25 0 0 0-5.25 5.25v3a3 3 0 0 0-3 3v6.75a3 3 0 0 0 3 3h10.5a3 3 0 0 0 3-3v-6.75a3 3 0 0 0-3-3v-3c0-2.9-2.35-5.25-5.25-5.25Zm3.75 8.25v-3a3.75 3.75 0 1 0-7.5 0v3h7.5Z" clipRule="evenodd" />
              </svg>
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-base font-bold text-navy-900">
                {credentialsModalData.isNew ? "Pengguna Berhasil Didaftarkan!" : "Password Berhasil Direset!"}
              </h3>
              <p className="text-xs text-foreground-muted">
                Bagikan kredensial login berikut kepada petugas yang bersangkutan:
              </p>
            </div>

            <div className="rounded-xl border border-navy-100 bg-surface-dim p-3.5 space-y-2 font-mono text-xs text-navy-900">
              <div className="flex justify-between">
                <span className="text-navy-500 font-sans">Nama:</span>
                <span className="font-bold">{credentialsModalData.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-navy-500 font-sans">Email:</span>
                <span className="font-bold">{credentialsModalData.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-navy-500 font-sans">Password:</span>
                <span className="font-bold text-accent-700 bg-white px-2 py-0.5 rounded border border-navy-200">
                  {credentialsModalData.password}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-navy-500 font-sans">Role:</span>
                <span className="font-bold text-primary-700">{credentialsModalData.role}</span>
              </div>
            </div>

            <div className="flex flex-col gap-2 pt-1">
              <button
                type="button"
                onClick={handleCopyCredentials}
                className="w-full rounded-xl bg-navy-900 py-2.5 text-xs font-bold text-white shadow hover:bg-navy-800 active:scale-95 transition-all"
              >
                {copySuccess ? "✓ Kredensial Disalin!" : "📋 Salin Kredensial"}
              </button>
              <button
                type="button"
                onClick={() => setCredentialsModalData(null)}
                className="w-full rounded-xl border border-navy-200 py-2 text-xs font-bold text-navy-700 hover:bg-navy-50 active:scale-95"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete User Confirmation Modal */}
      {deleteTargetUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl space-y-4 animate-slide-up">
            <div className="text-center space-y-2">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-danger-100 text-danger-600">
                ⚠️
              </div>
              <h3 className="text-base font-bold text-navy-900">
                Hapus Akun Pengguna?
              </h3>
              <p className="text-xs text-foreground-muted">
                Apakah Anda yakin ingin menghapus akun <strong>{deleteTargetUser.name}</strong> ({deleteTargetUser.email})? Tindakan ini tidak dapat dibatalkan.
              </p>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setDeleteTargetUser(null)}
                className="flex-1 rounded-xl border border-navy-200 py-2.5 text-xs font-bold text-navy-700 hover:bg-navy-50 active:scale-95"
              >
                Batal
              </button>
              <button
                onClick={handleConfirmDelete}
                className="flex-1 rounded-xl bg-danger-600 py-2.5 text-xs font-bold text-white shadow hover:bg-danger-700 active:scale-95"
              >
                Ya, Hapus Akun
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
