"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { AdminStoreMarker } from "./AdminLiveMap";
import { addStore } from "@/lib/db";

// Dynamically import StoreLocationMap to allow map pin-drop in the admin modal
const StoreLocationMap = dynamic(() => import("./StoreLocationMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-52 w-full flex-col items-center justify-center rounded-xl border border-navy-200 bg-navy-50 text-navy-400">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary-600 border-t-transparent mb-2" />
      <span className="text-xs font-medium">Memuat Peta Pin-Drop...</span>
    </div>
  ),
});

interface AdminAddStoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddStore: (newStore: AdminStoreMarker) => void;
}

export default function AdminAddStoreModal({
  isOpen,
  onClose,
  onAddStore,
}: AdminAddStoreModalProps) {
  const [kategori, setKategori] = useState<string>("Retail / Sembako");
  const [storeName, setStoreName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [picName, setPicName] = useState("");
  const [picPhone, setPicPhone] = useState("");
  const [fullAddress, setFullAddress] = useState("");
  const [latitude, setLatitude] = useState<number | null>(-6.2088);
  const [longitude, setLongitude] = useState<number | null>(106.8456);
  const [verificationStatus, setVerificationStatus] = useState<"verified" | "pending">("verified");

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const validatePhone = (phone: string) => {
    const cleaned = phone.replace(/[\s-]/g, "");
    return /^(\+62|62|0)[0-9]{8,13}$/.test(cleaned);
  };

  const handleMapPinSelect = (lat: number, lng: number) => {
    setLatitude(parseFloat(lat.toFixed(7)));
    setLongitude(parseFloat(lng.toFixed(7)));
    if (errors.location) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next.location;
        return next;
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!storeName.trim() || storeName.trim().length < 3) {
      newErrors.storeName = "Nama Toko wajib diisi (minimal 3 karakter).";
    }

    if (!phoneNumber.trim() || !validatePhone(phoneNumber)) {
      newErrors.phoneNumber = "Nomor Telepon Toko tidak valid.";
    }

    if (!picName.trim()) {
      newErrors.picName = "Nama PIC (Kontak Person) wajib diisi.";
    }

    if (!fullAddress.trim() || fullAddress.trim().length < 5) {
      newErrors.fullAddress = "Alamat Lengkap Toko wajib diisi.";
    }

    if (latitude === null || longitude === null) {
      newErrors.location = "Koordinat lokasi toko (Latitude & Longitude) wajib diisi.";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);

    addStore({
      name: storeName.trim(),
      kategori,
      phone: phoneNumber.trim(),
      pic_name: picName.trim(),
      pic_phone: picPhone.trim() || undefined,
      address: fullAddress.trim(),
      latitude: latitude!,
      longitude: longitude!,
      verification_status: verificationStatus,
      current_status: "closed",
    })
      .then((createdStore) => {
        setIsSubmitting(false);
        const createdMarker: AdminStoreMarker = {
          id: createdStore.id,
          store_name: createdStore.name,
          phone_number: createdStore.phone,
          pic_name: createdStore.pic_name,
          full_address: createdStore.address,
          latitude: createdStore.latitude,
          longitude: createdStore.longitude,
          verification_status: createdStore.verification_status,
          current_status: createdStore.current_status,
          is_tracking_active: false,
          last_ping_at: "Baru ditambahkan (Admin)",
          registered_by: "Admin",
        };

        onAddStore(createdMarker);

        setStoreName("");
        setPhoneNumber("");
        setPicName("");
        setPicPhone("");
        setFullAddress("");
        setLatitude(-6.2088);
        setLongitude(106.8456);
        setErrors({});
        onClose();
      })
      .catch(() => {
        setIsSubmitting(false);
      });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in overflow-y-auto">
      <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl space-y-4 my-8 animate-slide-up">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-navy-100 pb-3">
          <div>
            <h2 className="text-lg font-bold text-navy-900">
              + Tambah Toko Manual (Admin)
            </h2>
            <p className="text-xs text-foreground-muted">
              Registrasi toko baru langsung dari Dashboard Admin
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-1.5 text-navy-400 hover:bg-navy-50 hover:text-navy-700 transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="h-5 w-5"
            >
              <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
            </svg>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* 0. Kategori Toko */}
              <div>
                <label className="mb-1 block font-semibold text-navy-900">
                  Kategori Usaha Mitra <span className="text-danger-500">*</span>
                </label>
                <select
                  value={kategori}
                  onChange={(e) => setKategori(e.target.value)}
                  className="w-full rounded-xl border border-navy-200 bg-surface px-3 py-2 text-xs font-semibold text-navy-900 outline-none focus:border-primary-500"
                >
                  <option value="Retail / Sembako">🏪 Retail / Sembako (Kode Prefix: RS-)</option>
                  <option value="Frozen Food">❄️ Frozen Food (Kode Prefix: FF-)</option>
                  <option value="Agent Bumbu / Baku">🧂 Agent Bumbu / Bahan Baku (Kode Prefix: AB-)</option>
                  <option value="Lainnya">📦 Mitra Lainnya (Kode Prefix: LN-)</option>
                </select>
              </div>

              {/* 1. Nama Toko */}
              <div>
                <label className="mb-1 block font-semibold text-navy-900">
                  Nama Toko <span className="text-danger-500">*</span>
                </label>
                <input
                  type="text"
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  placeholder="Contoh: Toko Sembako Berkah Jaya"
                  className="w-full rounded-xl border border-navy-200 bg-surface px-3 py-2 text-xs text-navy-900 outline-none focus:border-primary-500"
                />
                {errors.storeName && (
                  <p className="mt-1 text-[10px] text-danger-500 font-medium">
                    {errors.storeName}
                  </p>
                )}
              </div>

            {/* 2. Telepon Toko */}
            <div>
              <label className="mb-1 block font-semibold text-navy-900">
                Nomor Telepon Toko <span className="text-danger-500">*</span>
              </label>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="Contoh: 08123456789"
                className="w-full rounded-xl border border-navy-200 bg-surface px-3 py-2 text-xs text-navy-900 outline-none focus:border-primary-500"
              />
              {errors.phoneNumber && (
                <p className="mt-1 text-[10px] text-danger-500 font-medium">
                  {errors.phoneNumber}
                </p>
              )}
            </div>

            {/* 3. Nama PIC */}
            <div>
              <label className="mb-1 block font-semibold text-navy-900">
                Nama PIC (Kontak Person) <span className="text-danger-500">*</span>
              </label>
              <input
                type="text"
                value={picName}
                onChange={(e) => setPicName(e.target.value)}
                placeholder="Contoh: Pak Budi Santoso"
                className="w-full rounded-xl border border-navy-200 bg-surface px-3 py-2 text-xs text-navy-900 outline-none focus:border-primary-500"
              />
              {errors.picName && (
                <p className="mt-1 text-[10px] text-danger-500 font-medium">
                  {errors.picName}
                </p>
              )}
            </div>

            {/* 4. Status Verifikasi Awal */}
            <div>
              <label className="mb-1 block font-semibold text-navy-900">
                Status Verifikasi Toko
              </label>
              <select
                value={verificationStatus}
                onChange={(e) => setVerificationStatus(e.target.value as any)}
                className="w-full rounded-xl border border-navy-200 bg-surface px-3 py-2 text-xs font-semibold text-navy-900 outline-none focus:border-primary-500"
              >
                <option value="verified">🟢 Langsung Verifikasi (Verified)</option>
                <option value="pending">🟡 Tinjau Ulang (Pending)</option>
              </select>
            </div>
          </div>

          {/* 5. Alamat Lengkap */}
          <div>
            <label className="mb-1 block font-semibold text-navy-900">
              Alamat Lengkap Toko <span className="text-danger-500">*</span>
            </label>
            <textarea
              rows={2}
              value={fullAddress}
              onChange={(e) => setFullAddress(e.target.value)}
              placeholder="Alamat lengkap toko beserta nomor & patokan..."
              className="w-full rounded-xl border border-navy-200 bg-surface px-3 py-2 text-xs text-navy-900 outline-none focus:border-primary-500"
            />
            {errors.fullAddress && (
              <p className="mt-1 text-[10px] text-danger-500 font-medium">
                {errors.fullAddress}
              </p>
            )}
          </div>

          {/* 6. Coordinate Pickers & Map Pin-Drop */}
          <div className="space-y-2 pt-1 border-t border-navy-100">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-navy-900">
                Koordinat Lokasi Toko (Klik Peta atau Ketik Manual) <span className="text-danger-500">*</span>
              </label>
              <span className="text-[10px] text-primary-600 font-medium">
                Ketuk titik di peta untuk memilih lokasi
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="block text-[10px] text-navy-500 font-medium mb-0.5">Latitude</span>
                <input
                  type="number"
                  step="any"
                  value={latitude !== null ? latitude : ""}
                  onChange={(e) => setLatitude(parseFloat(e.target.value) || 0)}
                  placeholder="-6.2088"
                  className="w-full rounded-lg border border-navy-200 bg-surface-dim px-3 py-1.5 font-mono text-xs text-navy-900 outline-none"
                />
              </div>

              <div>
                <span className="block text-[10px] text-navy-500 font-medium mb-0.5">Longitude</span>
                <input
                  type="number"
                  step="any"
                  value={longitude !== null ? longitude : ""}
                  onChange={(e) => setLongitude(parseFloat(e.target.value) || 0)}
                  placeholder="106.8456"
                  className="w-full rounded-lg border border-navy-200 bg-surface-dim px-3 py-1.5 font-mono text-xs text-navy-900 outline-none"
                />
              </div>
            </div>

            {/* Embedded Interactive Map for Admin Pin-Drop */}
            <StoreLocationMap
              lat={latitude}
              lng={longitude}
              onLocationSelect={handleMapPinSelect}
            />

            {errors.location && (
              <p className="text-[10px] text-danger-500 font-medium">
                {errors.location}
              </p>
            )}
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-navy-100">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-navy-200 bg-white px-4 py-2 text-xs font-bold text-navy-700 hover:bg-navy-50 active:scale-95"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-1.5 rounded-xl bg-accent-600 px-5 py-2 text-xs font-bold text-white shadow-md hover:bg-accent-700 active:scale-95 disabled:opacity-70"
            >
              {isSubmitting ? (
                <>
                  <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>Menyimpan Toko...</span>
                </>
              ) : (
                <span>+ Simpan Toko</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
