"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { addStore, getUserProfile } from "@/lib/db";

// Dynamically import Leaflet Map to avoid SSR window reference errors
const StoreLocationMap = dynamic(
  () => import("@/components/StoreLocationMap"),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-64 w-full flex-col items-center justify-center rounded-xl border border-navy-200 bg-navy-50 text-navy-400">
        <div className="h-7 w-7 animate-spin rounded-full border-3 border-primary-600 border-t-transparent mb-2" />
        <span className="text-xs font-medium">Memuat Peta Interaktif...</span>
      </div>
    ),
  }
);

export default function RegistrasiTokoBaruPage() {
  const router = useRouter();

  // Form State
  const [kategori, setKategori] = useState("Retail / Sembako");
  const [storeName, setStoreName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [picName, setPicName] = useState("");
  const [picPhone, setPicPhone] = useState("");
  const [fullAddress, setFullAddress] = useState("");

  // Location State
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [locationSource, setLocationSource] = useState<"gps" | "manual" | null>(null);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [locationSuccess, setLocationSuccess] = useState<string | null>(null);

  // Form Process State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [successData, setSuccessData] = useState<Record<string, any> | null>(null);

  // Validate Indonesian Phone Number Format (08..., 021..., +62...)
  const validatePhone = (phone: string) => {
    const cleaned = phone.replace(/[\s-]/g, "");
    return /^(\+62|62|0)[0-9]{8,13}$/.test(cleaned);
  };

  // Get Current Geolocation
  const handleGetCurrentLocation = () => {
    setIsLocating(true);
    setLocationError(null);
    setLocationSuccess(null);

    if (!navigator.geolocation) {
      setLocationError("Fitur Geolocation tidak didukung oleh browser ini.");
      setIsLocating(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = parseFloat(position.coords.latitude.toFixed(7));
        const lng = parseFloat(position.coords.longitude.toFixed(7));
        const acc = position.coords.accuracy;

        setLatitude(lat);
        setLongitude(lng);
        setAccuracy(acc);
        setLocationSource("gps");
        setIsLocating(false);

        // Clear location validation error if any
        if (errors.location) {
          setErrors((prev) => {
            const next = { ...prev };
            delete next.location;
            return next;
          });
        }

        setLocationSuccess(
          `Koordinat lokasi berhasil ditangkap via GPS (Akurasi: ±${Math.round(
            acc
          )}m).`
        );
      },
      (error) => {
        setIsLocating(false);
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setLocationError(
              "Izin lokasi ditolak. Silakan aktifkan GPS atau pilih titik lokasi secara manual pada peta di bawah."
            );
            break;
          case error.POSITION_UNAVAILABLE:
            setLocationError(
              "Informasi lokasi tidak tersedia. Silakan gunakan pin-drop manual pada peta."
            );
            break;
          case error.TIMEOUT:
            setLocationError(
              "Waktu permintaan lokasi habis. Silakan coba lagi atau tandai di peta."
            );
            break;
          default:
            setLocationError(
              "Gagal mendapatkan lokasi. Silakan tandai lokasi toko secara manual di peta."
            );
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 12000,
        maximumAge: 0,
      }
    );
  };

  // Handle Manual Map Pin Location Selection
  const handleManualLocationSelect = (lat: number, lng: number) => {
    const formattedLat = parseFloat(lat.toFixed(7));
    const formattedLng = parseFloat(lng.toFixed(7));

    setLatitude(formattedLat);
    setLongitude(formattedLng);
    setLocationSource("manual");
    setAccuracy(null);
    setLocationError(null);
    setLocationSuccess(
      "Titik lokasi toko diperbarui secara manual dari peta."
    );

    if (errors.location) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next.location;
        return next;
      });
    }
  };

  // Form Validation Before Submission
  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!storeName.trim() || storeName.trim().length < 3) {
      newErrors.storeName = "Nama Toko wajib diisi (minimal 3 karakter).";
    }

    if (!phoneNumber.trim()) {
      newErrors.phoneNumber = "Nomor Telepon Toko wajib diisi.";
    } else if (!validatePhone(phoneNumber)) {
      newErrors.phoneNumber =
        "Nomor Telepon Toko tidak valid (contoh: 08123456789 atau 021555123).";
    }

    if (!picName.trim()) {
      newErrors.picName = "Nama Kontak Person (PIC) wajib diisi.";
    }

    if (picPhone.trim() && !validatePhone(picPhone)) {
      newErrors.picPhone = "Nomor HP PIC tidak valid (contoh: 085712345678).";
    }

    if (!fullAddress.trim() || fullAddress.trim().length < 5) {
      newErrors.fullAddress = "Alamat Lengkap Toko wajib diisi (minimal 5 karakter).";
    }

    if (latitude === null || longitude === null) {
      newErrors.location =
        "Koordinat lokasi toko belum ditentukan. Gunakan tombol 'Gunakan Lokasi Saat Ini' atau tandai titik lokasi pada peta.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      // Scroll to top of error
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    setIsSubmitting(true);

    const currentUser = await getUserProfile();

    addStore({
      name: storeName.trim(),
      kategori,
      phone: phoneNumber.trim(),
      pic_name: picName.trim(),
      pic_phone: picPhone.trim() || undefined,
      address: fullAddress.trim(),
      latitude: latitude!,
      longitude: longitude!,
      verification_status: "pending",
      current_status: "closed",
      created_by: currentUser?.id,
    })
      .then((createdStore) => {
        setIsSubmitting(false);
        setSuccessData({
          kode_toko: createdStore.kode_toko,
          kategori: createdStore.kategori,
          store_name: createdStore.name,
          phone_number: createdStore.phone,
          pic_name: createdStore.pic_name,
          pic_phone: createdStore.pic_phone || "-",
          full_address: createdStore.address,
          latitude: createdStore.latitude,
          longitude: createdStore.longitude,
          location_source: locationSource,
          verification_status: createdStore.verification_status,
          created_at: createdStore.created_at || new Date().toISOString(),
        });
      })
      .catch(() => {
        setIsSubmitting(false);
      });
  };

  return (
    <div className="p-4 space-y-5 max-w-lg mx-auto pb-12">
      {/* Top Header Navigation */}
      <div className="flex items-center gap-3">
        <Link
          href="/mobile/toko"
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-white border border-navy-100 text-navy-700 shadow-sm active:scale-95 transition-transform"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="h-5 w-5"
          >
            <path
              fillRule="evenodd"
              d="M17 10a.75.75 0 01-.75.75H5.612l4.158 3.96a.75.75 0 11-1.04 1.08l-5.5-5.25a.75.75 0 010-1.08l5.5-5.25a.75.75 0 111.04 1.08L5.612 9.25H16.25A.75.75 0 0117 10z"
              clipRule="evenodd"
            />
          </svg>
        </Link>
        <div>
          <h1 className="text-lg font-bold text-navy-900 leading-tight">
            Registrasi Toko Baru
          </h1>
          <p className="text-xs text-foreground-muted">
            Tambahkan mitra toko baru ke sistem SLL
          </p>
        </div>
      </div>

      {/* Main Form Card */}
      <div className="rounded-2xl border border-navy-100 bg-white p-5 shadow-sm space-y-4">
        {/* Global Validation Summary Warning */}
        {Object.keys(errors).length > 0 && (
          <div className="rounded-xl bg-danger-500/10 border border-danger-500/30 p-3.5 text-xs text-danger-600 animate-fade-in space-y-1">
            <div className="flex items-center gap-1.5 font-bold">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="h-4 w-4"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z"
                  clipRule="evenodd"
                />
              </svg>
              Mohon periksa kembali inputan Anda:
            </div>
            <ul className="list-disc pl-5 space-y-0.5 font-medium">
              {Object.values(errors).map((err, idx) => (
                <li key={idx}>{err}</li>
              ))}
            </ul>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 0. Kategori Toko */}
          <div>
            <label className="mb-1 block text-xs font-semibold text-navy-900">
              Kategori Usaha Mitra <span className="text-danger-500">*</span>
            </label>
            <select
              value={kategori}
              onChange={(e) => setKategori(e.target.value)}
              className="w-full rounded-xl border border-navy-200 bg-surface px-3.5 py-2.5 text-sm font-semibold text-navy-900 outline-none transition-all focus:border-primary-500 focus:ring-2 focus:ring-primary-500"
            >
              <option value="Retail / Sembako">🏪 Retail / Sembako (Kode: RS-XXX)</option>
              <option value="Frozen Food">❄️ Frozen Food (Kode: FF-XXX)</option>
              <option value="Agent Bumbu / Baku">🧂 Agent Bumbu / Bahan Baku (Kode: AB-XXX)</option>
              <option value="Lainnya">📦 Mitra Lainnya (Kode: LN-XXX)</option>
            </select>
          </div>

          {/* 1. Nama Toko */}
          <div>
            <label className="mb-1 block text-xs font-semibold text-navy-900">
              Nama Toko <span className="text-danger-500">*</span>
            </label>
            <input
              type="text"
              value={storeName}
              onChange={(e) => {
                setStoreName(e.target.value);
                if (errors.storeName) {
                  setErrors((prev) => {
                    const next = { ...prev };
                    delete next.storeName;
                    return next;
                  });
                }
              }}
              placeholder="Contoh: Toko Berkah Jaya"
              className={`w-full rounded-xl border ${
                errors.storeName
                  ? "border-danger-500 bg-danger-500/5 focus:ring-danger-500"
                  : "border-navy-200 bg-surface focus:border-primary-500 focus:ring-primary-500"
              } px-3.5 py-2.5 text-sm text-navy-900 outline-none transition-all focus:ring-2`}
            />
            {errors.storeName && (
              <p className="mt-1 text-[11px] font-medium text-danger-500">
                {errors.storeName}
              </p>
            )}
          </div>

          {/* 2. Nomor Telepon Toko */}
          <div>
            <label className="mb-1 block text-xs font-semibold text-navy-900">
              Nomor Telepon Toko <span className="text-danger-500">*</span>
            </label>
            <input
              type="tel"
              value={phoneNumber}
              onChange={(e) => {
                setPhoneNumber(e.target.value);
                if (errors.phoneNumber) {
                  setErrors((prev) => {
                    const next = { ...prev };
                    delete next.phoneNumber;
                    return next;
                  });
                }
              }}
              placeholder="Contoh: 08123456789 atau 021555123"
              className={`w-full rounded-xl border ${
                errors.phoneNumber
                  ? "border-danger-500 bg-danger-500/5 focus:ring-danger-500"
                  : "border-navy-200 bg-surface focus:border-primary-500 focus:ring-primary-500"
              } px-3.5 py-2.5 text-sm text-navy-900 outline-none transition-all focus:ring-2`}
            />
            {errors.phoneNumber && (
              <p className="mt-1 text-[11px] font-medium text-danger-500">
                {errors.phoneNumber}
              </p>
            )}
          </div>

          {/* 3. Nama PIC & 4. No HP PIC */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold text-navy-900">
                Nama PIC (Kontak Person) <span className="text-danger-500">*</span>
              </label>
              <input
                type="text"
                value={picName}
                onChange={(e) => {
                  setPicName(e.target.value);
                  if (errors.picName) {
                    setErrors((prev) => {
                      const next = { ...prev };
                      delete next.picName;
                      return next;
                    });
                  }
                }}
                placeholder="Contoh: Pak Budi Santoso"
                className={`w-full rounded-xl border ${
                  errors.picName
                    ? "border-danger-500 bg-danger-500/5 focus:ring-danger-500"
                    : "border-navy-200 bg-surface focus:border-primary-500 focus:ring-primary-500"
                } px-3.5 py-2.5 text-sm text-navy-900 outline-none transition-all focus:ring-2`}
              />
              {errors.picName && (
                <p className="mt-1 text-[11px] font-medium text-danger-500">
                  {errors.picName}
                </p>
              )}
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-navy-900">
                Nomor HP PIC <span className="text-navy-400 font-normal">(Opsional)</span>
              </label>
              <input
                type="tel"
                value={picPhone}
                onChange={(e) => {
                  setPicPhone(e.target.value);
                  if (errors.picPhone) {
                    setErrors((prev) => {
                      const next = { ...prev };
                      delete next.picPhone;
                      return next;
                    });
                  }
                }}
                placeholder="Contoh: 085712345678"
                className={`w-full rounded-xl border ${
                  errors.picPhone
                    ? "border-danger-500 bg-danger-500/5 focus:ring-danger-500"
                    : "border-navy-200 bg-surface focus:border-primary-500 focus:ring-primary-500"
                } px-3.5 py-2.5 text-sm text-navy-900 outline-none transition-all focus:ring-2`}
              />
              {errors.picPhone && (
                <p className="mt-1 text-[11px] font-medium text-danger-500">
                  {errors.picPhone}
                </p>
              )}
            </div>
          </div>

          {/* 5. Alamat Lengkap */}
          <div>
            <label className="mb-1 block text-xs font-semibold text-navy-900">
              Alamat Lengkap Toko <span className="text-danger-500">*</span>
            </label>
            <textarea
              rows={3}
              value={fullAddress}
              onChange={(e) => {
                setFullAddress(e.target.value);
                if (errors.fullAddress) {
                  setErrors((prev) => {
                    const next = { ...prev };
                    delete next.fullAddress;
                    return next;
                  });
                }
              }}
              placeholder="Jl. Raya Bogor No. 45, RT 02/05, Kramat Jati, Jakarta Timur"
              className={`w-full rounded-xl border ${
                errors.fullAddress
                  ? "border-danger-500 bg-danger-500/5 focus:ring-danger-500"
                  : "border-navy-200 bg-surface focus:border-primary-500 focus:ring-primary-500"
              } px-3.5 py-2.5 text-sm text-navy-900 outline-none transition-all focus:ring-2`}
            />
            {errors.fullAddress && (
              <p className="mt-1 text-[11px] font-medium text-danger-500">
                {errors.fullAddress}
              </p>
            )}
          </div>

          {/* 6. Geolocation & Interactive Map Section */}
          <div className="pt-2 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-navy-900">
                Koordinat Lokasi Toko <span className="text-danger-500">*</span>
              </label>
              {locationSource && (
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                    locationSource === "gps"
                      ? "bg-accent-50 text-accent-700 border border-accent-200"
                      : "bg-primary-50 text-primary-700 border border-primary-200"
                  }`}
                >
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      locationSource === "gps" ? "bg-accent-500" : "bg-primary-500"
                    }`}
                  />
                  {locationSource === "gps" ? "Sumber: GPS HP" : "Sumber: Manual Peta"}
                </span>
              )}
            </div>

            {/* Auto GPS Trigger Button */}
            <button
              type="button"
              onClick={handleGetCurrentLocation}
              disabled={isLocating}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary-600 to-primary-700 px-4 py-2.5 text-xs font-semibold text-white shadow-md transition-all hover:from-primary-700 hover:to-primary-800 active:scale-[0.98] disabled:opacity-70"
            >
              {isLocating ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>Mengambil Koordinat GPS...</span>
                </>
              ) : (
                <>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="h-4 w-4"
                  >
                    <path
                      fillRule="evenodd"
                      d="M11.54 22.351.07.04.028.016a.76.76 0 0 0 .723 0l.028-.015.071-.041a16.975 16.975 0 0 0 1.144-.742 19.58 19.58 0 0 0 2.683-2.282c1.944-1.99 3.963-4.98 3.963-8.827a8.25 8.25 0 0 0-16.5 0c0 3.846 2.02 6.837 3.963 8.827a19.58 19.58 0 0 0 3.824 3.024Zm.46-12.6a2.25 2.25 0 1 0 0-4.5 2.25 2.25 0 0 0 0 4.5Z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span>Gunakan Lokasi Saat Ini (GPS)</span>
                </>
              )}
            </button>

            {/* GPS Feedback Notifications */}
            {locationSuccess && (
              <div className="rounded-xl bg-accent-50 border border-accent-200 px-3 py-2 text-xs text-accent-800 flex items-center gap-1.5 animate-fade-in">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="h-4 w-4 text-accent-600 shrink-0"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>{locationSuccess}</span>
              </div>
            )}

            {locationError && (
              <div className="rounded-xl bg-warning-500/10 border border-warning-500/30 px-3 py-2 text-xs text-warning-700 flex items-start gap-1.5 animate-fade-in">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="h-4 w-4 text-warning-600 shrink-0 mt-0.5"
                >
                  <path
                    fillRule="evenodd"
                    d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>{locationError}</span>
              </div>
            )}

            {/* Latitude & Longitude Input Fields (Read-Only Display) */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="block text-[11px] font-medium text-navy-600 mb-0.5">
                  Latitude
                </span>
                <input
                  type="text"
                  readOnly
                  value={latitude !== null ? latitude : ""}
                  placeholder="-6.2088000"
                  className="w-full rounded-lg border border-navy-200 bg-navy-50/70 px-3 py-1.5 font-mono text-xs text-navy-900 outline-none cursor-default"
                />
              </div>

              <div>
                <span className="block text-[11px] font-medium text-navy-600 mb-0.5">
                  Longitude
                </span>
                <input
                  type="text"
                  readOnly
                  value={longitude !== null ? longitude : ""}
                  placeholder="106.8456000"
                  className="w-full rounded-lg border border-navy-200 bg-navy-50/70 px-3 py-1.5 font-mono text-xs text-navy-900 outline-none cursor-default"
                />
              </div>
            </div>

            {/* Leaflet Map Picker Component */}
            <StoreLocationMap
              lat={latitude}
              lng={longitude}
              onLocationSelect={handleManualLocationSelect}
              accuracy={accuracy}
            />

            {errors.location && (
              <p className="mt-1 text-[11px] font-medium text-danger-500">
                {errors.location}
              </p>
            )}
          </div>

          {/* Submit Action */}
          <div className="pt-3">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-accent-600 py-3 text-sm font-bold text-white shadow-lg transition-all hover:bg-accent-700 active:scale-[0.98] disabled:opacity-60"
            >
              {isSubmitting ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>Mendaftarkan Toko...</span>
                </>
              ) : (
                <>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className="h-5 w-5"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span>Submit Registrasi Toko</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Success Modal Confirmation */}
      {successData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl space-y-4 animate-slide-up">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-accent-100 text-accent-600">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="h-8 w-8"
              >
                <path
                  fillRule="evenodd"
                  d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25Z"
                  clipRule="evenodd"
                />
              </svg>
            </div>

            <div className="text-center space-y-1">
              <h2 className="text-lg font-bold text-navy-900">
                Registrasi Toko Berhasil!
              </h2>
              <p className="text-xs text-foreground-muted">
                Toko telah masuk ke sistem dan menunggu verifikasi Admin.
              </p>
            </div>

            {/* Summary Details */}
            <div className="rounded-xl bg-surface-dim p-3.5 space-y-2 text-xs text-navy-900 border border-navy-100">
              <div className="flex justify-between items-center">
                <span className="text-navy-500 font-medium">Kode Toko:</span>
                <span className="font-mono font-bold text-primary-700 bg-primary-50 px-2 py-0.5 rounded border border-primary-200">
                  {successData.kode_toko || "Dibuat Otomatis"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-navy-500 font-medium">Kategori Usaha:</span>
                <span className="font-semibold text-navy-800">{successData.kategori || "Retail / Sembako"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-navy-500 font-medium">Nama Toko:</span>
                <span className="font-bold">{successData.store_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-navy-500 font-medium">Telepon Toko:</span>
                <span className="font-semibold">{successData.phone_number}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-navy-500 font-medium">PIC:</span>
                <span className="font-semibold">{successData.pic_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-navy-500 font-medium">Koordinat:</span>
                <span className="font-mono font-semibold">
                  {successData.latitude}, {successData.longitude}
                </span>
              </div>
              <div className="flex justify-between items-center pt-1 border-t border-navy-200/60">
                <span className="text-navy-500 font-medium">Status Verifikasi:</span>
                <span className="rounded-full bg-warning-500/15 px-2 py-0.5 text-[10px] font-bold text-warning-700">
                  Pending Verifikasi Admin
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <button
                onClick={() => {
                  setSuccessData(null);
                  setStoreName("");
                  setPhoneNumber("");
                  setPicName("");
                  setPicPhone("");
                  setFullAddress("");
                  setLatitude(null);
                  setLongitude(null);
                  setLocationSource(null);
                  setAccuracy(null);
                  setLocationSuccess(null);
                }}
                className="w-full rounded-xl bg-primary-600 py-2.5 text-xs font-bold text-white transition-all hover:bg-primary-700 active:scale-95"
              >
                + Registrasi Toko Lainnya
              </button>
              <button
                onClick={() => router.push("/mobile/toko")}
                className="w-full rounded-xl border border-navy-200 bg-white py-2.5 text-xs font-bold text-navy-700 transition-all hover:bg-navy-50 active:scale-95"
              >
                Ke Daftar Toko
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
