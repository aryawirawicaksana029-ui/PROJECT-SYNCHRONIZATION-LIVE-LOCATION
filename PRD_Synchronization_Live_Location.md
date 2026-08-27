# PRODUCT REQUIREMENTS DOCUMENT (PRD)
# Synchronization Live Location (SLL)

| | |
|---|---|
| **Versi Dokumen** | 1.1 |
| **Tanggal** | 6 Agustus 2026 |
| **Tahap** | 1 dari 6 — PRD & Perencanaan |
| **Status** | Draft untuk Review |
| **Target Klien** | Perusahaan UMK (distribusi/sales toko) |
| **Platform** | Dashboard Admin/Supervisor: Web App · App Petugas Lapangan: Android (Capacitor) |

**Riwayat Revisi**
| Versi | Tanggal | Perubahan |
|---|---|---|
| 1.0 | 4 Agustus 2026 | Draft awal — platform Petugas Lapangan: web app/PWA |
| 1.1 | 6 Agustus 2026 | Platform Petugas Lapangan diubah ke Android app (Capacitor) agar tracking tetap berjalan saat layar mati/terkunci — dikonfirmasi tim lapangan 100% Android; dashboard Admin/Supervisor tetap web |

---

## Daftar Isi

1. [Executive Summary & Product Vision](#1-executive-summary--product-vision)
2. [User Stories & Detailed User Flow](#2-user-stories--detailed-user-flow)
3. [System Architecture & Component Diagram](#3-system-architecture--component-diagram)
4. [Database Schema Design](#4-database-schema-design)
5. [API Endpoint Requirements & Realtime Specification](#5-api-endpoint-requirements--realtime-specification)
6. [Edge Cases & Security Considerations](#6-edge-cases--security-considerations)
7. [Step-by-Step Task Development List](#7-step-by-step-task-development-list)

> **Catatan sebelum membaca:** Beberapa keputusan desain di dokumen ini melampaui spesifikasi asli (mis. field tambahan, status verifikasi toko) untuk membuat sistem robust secara production. Semua keputusan ini ditandai dengan label **[ASUMSI]** agar mudah direview dan diubah.

---

## 1. EXECUTIVE SUMMARY & PRODUCT VISION

### 1.1 Latar Belakang & Problem Statement

Perusahaan UMK dengan tim lapangan (sales/kolektor/supervisor) yang bertugas mengunjungi toko-toko mitra menghadapi tiga masalah operasional inti:

| Masalah | Dampak |
|---|---|
| Tidak ada visibilitas real-time terhadap posisi petugas lapangan | Supervisor tidak bisa memverifikasi kunjungan benar-benar terjadi di lokasi toko |
| Pencatatan kunjungan, status toko, dan tagihan masih manual (laporan lisan/chat/Excel) | Data terlambat, rawan human error, sulit direkap untuk laporan keuangan |
| Tidak ada jejak historis presensi & lokasi per toko | Sengketa "sudah visit atau belum" tidak bisa dibuktikan, evaluasi kinerja tim sulit dilakukan |

### 1.2 Product Vision

> **"Menjadi sistem sinkronisasi lapangan-ke-dashboard yang membuat setiap kunjungan toko—lokasi, kehadiran, order, dan pembayaran—tercatat otomatis, akurat, dan real-time, tanpa menambah beban kerja manual bagi petugas lapangan."**

SLL memposisikan diri sebagai **lightweight field-force monitoring tool**, bukan ERP penuh — fokus MVP pada sinkronisasi lokasi & status, bukan manajemen inventori/logistik.

### 1.3 Target Pengguna & Persona

| Persona | Peran | Kebutuhan Utama |
|---|---|---|
| **Bos/Owner UMK** (Admin) | Melihat gambaran besar operasional dari kantor | Dashboard peta live, laporan tagihan harian, kepercayaan bahwa tim benar-benar kerja lapangan |
| **Supervisor** | Mengawasi tim sales/kolektor | Log presensi per toko, deteksi toko yang "terlewat" kunjungannya |
| **Sales/Kolektor** (Petugas Lapangan) | Berkeliling toko setiap hari, mendaftarkan toko baru, update status | Interface simpel, cepat diisi di HP, tidak boros kuota/baterai |

### 1.4 Tujuan Bisnis & Success Metrics (KPI)

| KPI | Target MVP |
|---|---|
| Akurasi lokasi tercatat vs lokasi aktual toko | ≤ 50 meter (akurasi GPS standar smartphone) |
| Compliance ping presensi (toko dengan sesi aktif yang berhasil ping tiap 5 menit) | ≥ 90% saat aplikasi foreground |
| Waktu input update status toko (buka/tutup/order/tagihan) | ≤ 15 detik per toko |
| Downtime dashboard admin | < 1% (di luar maintenance) |
| Adopsi: jumlah toko teregistrasi dalam 30 hari pertama | Sesuai target rollout klien (ditentukan saat onboarding) |

### 1.5 Ruang Lingkup Produk (Scope)

**In-Scope (MVP — Tahap 1-6):**
- Registrasi & verifikasi toko
- Live location sharing (Shareloc Live) manual-trigger oleh petugas
- Automated presensi ping 5 menit selama sesi aktif
- Toggle status Buka/Tutup toko
- Pencatatan status Order/Tidak Order
- Pencatatan status Bayar Tagihan/Tidak + nominal
- Dashboard monitoring peta real-time untuk Admin/Supervisor
- Autentikasi berbasis role (Admin/Supervisor vs Petugas Lapangan)
- App Petugas Lapangan dikemas sebagai Android APK (Capacitor) dengan background location tracking (tetap jalan saat layar mati/terkunci)

**Out-of-Scope (Fase Berikutnya / Tidak di MVP ini):**
- App iOS untuk Petugas Lapangan — tim lapangan dikonfirmasi 100% Android, sehingga versi iOS di luar scope MVP
- Modul inventori/stok barang
- Sistem penggajian/komisi sales otomatis
- Notifikasi push native (bisa pakai in-app/browser notification sederhana sebagai gantinya)
- Multi-tenant (SaaS untuk banyak perusahaan sekaligus) — MVP ini single-tenant untuk 1 klien UMK dahulu

### 1.6 Asumsi & Batasan (Assumptions & Constraints) **[ASUMSI]**

1. **Platform hybrid:** Dashboard Admin/Supervisor tetap web app (Next.js, browser desktop); App Petugas Lapangan dibungkus **Capacitor** menjadi APK Android agar background location tracking tetap reliable saat layar mati/terkunci — keputusan final setelah tim lapangan dikonfirmasi 100% Android (detail di Bagian 6.1.3).
2. Field **PIC** pada registrasi toko diasumsikan butuh **nama** (wajib) dan **nomor HP** (opsional) agar bisa dihubungi — spec asli hanya menyebut "Kontak Person" tanpa merinci sub-field.
3. Frasa *"toko yang sudah terverifikasi/teregister"* pada spec mengindikasikan ada tahap **verifikasi** setelah registrasi — sehingga ditambahkan status `pending / verified / rejected` pada tabel `stores`.
4. **Shareloc Live** (real-time, frekuensi tinggi saat sesi aktif) dan **Presensi Ping** (heartbeat tetap 5 menit) diperlakukan sebagai dua aliran data terpisah dengan tujuan berbeda — sesuai permintaan tabel `Location_Logs` dan `Presensi_Pings` yang terpisah di spec asli.
5. Satu petugas lapangan bisa menangani banyak toko; satu toko hanya didaftarkan oleh satu petugas (`registered_by`), tapi update status bisa dilakukan siapa pun yang berwenang (dibahas di RBAC, Bagian 6.2).
6. Mata uang tagihan diasumsikan **IDR (Rupiah)** saja untuk MVP.

---

## 2. USER STORIES & DETAILED USER FLOW

### 2.1 Definisi Peran (Roles)

| Role | Kode | Akses |
|---|---|---|
| Admin | `admin` | Full access — semua data, semua toko, manajemen user |
| Supervisor | `supervisor` | Read-only dashboard (peta, log, laporan) — tidak bisa edit data toko |
| Petugas Lapangan | `petugas_lapangan` | CRUD toko yang ia daftarkan/ditugaskan, kirim lokasi & presensi, update status |

### 2.2 User Stories per Epic

**Epic A — Registrasi Toko**
| ID | User Story |
|---|---|
| US-01 | Sebagai **petugas lapangan**, saya ingin mendaftarkan toko baru dengan nama, no. telepon, PIC, dan alamat lengkap, agar toko tersebut masuk ke sistem dan bisa dipantau. |
| US-02 | Sebagai **petugas lapangan**, saya ingin lokasi GPS saya saat ini otomatis terisi sebagai koordinat awal toko, agar saya tidak perlu input manual latitude/longitude. |
| US-03 | Sebagai **admin**, saya ingin melihat daftar toko yang baru didaftarkan dan memverifikasinya, agar data yang masuk ke sistem valid. |

**Epic B — Live Location & Shareloc Live**
| ID | User Story |
|---|---|
| US-04 | Sebagai **petugas lapangan**, saya ingin mengaktifkan "Shareloc Live" saat mengunjungi toko, agar posisi saya terlihat real-time oleh supervisor. |
| US-05 | Sebagai **admin/supervisor**, saya ingin melihat peta yang menampilkan posisi live semua petugas/toko yang sedang aktif, agar saya tahu siapa sedang di mana. |
| US-06 | Sebagai **petugas lapangan**, saya ingin bisa menonaktifkan Shareloc Live saat kunjungan selesai, agar baterai dan kuota tidak boros sepanjang hari. |

**Epic C — Automated Presensi**
| ID | User Story |
|---|---|
| US-07 | Sebagai **sistem**, saya perlu mengirim ping presensi (lokasi + status) setiap 5 menit selama aplikasi aktif, agar ada jejak kehadiran otomatis tanpa petugas harus input manual. |
| US-08 | Sebagai **admin/supervisor**, saya ingin melihat riwayat log presensi per toko per hari, agar saya bisa mengevaluasi konsistensi kunjungan. |
| US-09 | Sebagai **admin**, saya ingin sistem menandai toko sebagai "tidak ada sinyal/offline" jika tidak ada ping selama >10 menit padahal sesi masih aktif, agar anomali cepat terdeteksi. |

**Epic D — Status Operasional Toko**
| ID | User Story |
|---|---|
| US-10 | Sebagai **petugas lapangan**, saya ingin menandai toko sebagai Buka/Tutup, agar status operasional toko tercatat akurat. |
| US-11 | Sebagai **petugas lapangan**, saya ingin mencatat apakah ada Order/Tidak Order pada kunjungan hari ini, agar aktivitas penjualan terekam. |

**Epic E — Pembayaran Tagihan**
| ID | User Story |
|---|---|
| US-12 | Sebagai **petugas lapangan**, saya ingin mencatat status Bayar Tagihan/Tidak, dan jika Bayar, memasukkan nominalnya, agar arus kas tercatat dari lapangan langsung. |
| US-13 | Sebagai **admin**, saya ingin melihat rekap total tagihan yang masuk per hari/per toko, agar saya punya laporan keuangan harian tanpa menunggu setoran manual. |

**Epic F — Dashboard Monitoring**
| ID | User Story |
|---|---|
| US-14 | Sebagai **admin/supervisor**, saya ingin login ke dashboard web dan langsung melihat ringkasan: jumlah toko aktif, total tagihan hari ini, toko yang belum dikunjungi, agar saya cepat mengambil keputusan. |

### 2.3 Detailed User Flow

**Flow 1 — Registrasi Toko Baru (Petugas Lapangan)**
```
[Login] → [Tap "Daftar Toko Baru"]
   → [Browser minta izin akses lokasi]
        ├─ Izin DIBERIKAN → [Auto-isi Lat/Long dari GPS]
        └─ Izin DITOLAK   → [Input manual Lat/Long via pin-drop peta] (lihat Edge Case 6.1.2)
   → [Isi form: Nama Toko, No. Telp, Nama+No.HP PIC, Alamat Lengkap]
   → [Submit] → [Status toko: "pending" verifikasi]
   → [Notifikasi ke Admin: "Toko baru menunggu verifikasi"]
   → [Admin verifikasi] → [Status: "verified"] → [Toko siap dipakai fitur live location]
```

**Flow 2 — Aktivasi Shareloc Live & Kunjungan Toko**
```
[Petugas buka detail toko (verified)] → [Tap "Mulai Shareloc Live"]
   → [Cek permission GPS aktif?]
        ├─ Aktif  → [session_id baru dibuat] → [Kirim koordinat tiap interval singkat ke location_logs]
        │              → [Dashboard admin: marker toko bergerak real-time via Realtime subscription]
        └─ Nonaktif → [Prompt aktifkan GPS] (lihat Edge Case 6.1.1)
   → [Petugas update status: Buka/Tutup, Order/Tidak, Bayar Tagihan/Tidak (+nominal jika bayar)]
   → [Submit status] → [Tersimpan ke transactions_bills]
   → [Petugas tap "Selesai Kunjungan"] → [Shareloc Live dimatikan, session ditutup]
```

**Flow 3 — Siklus Automated Presensi (Foreground Service, per 5 menit)**
```
[Petugas aktifkan tracking] → [Android foreground service dimulai + notifikasi persisten muncul]
   → [Timer internal 5 menit berjalan — tetap jalan walau layar mati/terkunci/app di-background]
   → [T+5 menit] → [Ambil koordinat GPS terkini via plugin background geolocation]
        ├─ Sukses → [POST presensi_pings: {store_id, lat, long, battery, timestamp}]
        │              → [Update stores.last_ping_at]
        └─ Gagal (GPS off/permission dicabut) → [POST presensi_pings dengan ping_status='gps_denied']
   → [Scheduled Task server (tiap 5 menit)] → [Scan stores dengan is_tracking_active=true]
        → [Jika last_ping_at > 10 menit lalu] → [Tandai status "offline/no-signal" di dashboard]
   → [Ulangi setiap 5 menit, berhenti saat petugas tap "Selesai Kunjungan"]
```

**Flow 4 — Monitoring Dashboard (Admin/Supervisor)**
```
[Login] → [Dashboard Home: ringkasan hari ini]
   → [Tab "Peta Live"] → [Subscribe Realtime channel location_logs & stores]
        → [Peta menampilkan marker toko: hijau=online, abu=offline, biru=sedang shareloc live]
   → [Tab "Log Presensi"] → [Filter by toko/tanggal] → [Tabel riwayat ping]
   → [Tab "Laporan Tagihan"] → [Filter by tanggal] → [Total nominal masuk, breakdown per toko]
   → [Tab "Manajemen Toko"] → [Verifikasi toko pending / lihat semua toko]
```

---

## 3. SYSTEM ARCHITECTURE & COMPONENT DIAGRAM

### 3.1 High-Level Architecture Diagram

```
┌──────────────────────────────────────────────────────────────────────────┐
│                                CLIENT LAYER                               │
│  ┌────────────────────────────┐      ┌────────────────────────────────┐  │
│  │  Android App — Petugas      │      │  Dashboard Web — Admin/Super   │  │
│  │  Lapangan (Capacitor-wrap)  │      │  (Next.js, desktop-first)      │  │
│  │  • Form Registrasi Toko     │      │  • Peta Live (Leaflet/GMaps)   │  │
│  │  • Toggle Shareloc Live     │      │  • Log Presensi & Filter       │  │
│  │  • Toggle Buka/Tutup/Order  │      │  • Laporan Tagihan             │  │
│  │  • Form Bayar Tagihan       │      │  • Manajemen Verifikasi Toko   │  │
│  │  • Foreground Service +     │      │  • Realtime feed marker toko   │  │
│  │    Background Geolocation   │      │                                │  │
│  └───────────────┬──────────────┘      └────────────────┬────────────────┘  │
└──────────────────┼─────────────────────────────────────┼───────────────────┘
                    │ HTTPS REST (auto-generated)         │ WSS (Realtime pub/sub)
                    ▼                                     ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                          INSFORGE (BaaS) LAYER                            │
│  ┌───────────────────┐  ┌────────────────────┐  ┌────────────────────┐  │
│  │  Auth              │  │  PostgreSQL         │  │  Realtime           │  │
│  │  JWT + OAuth        │  │  users, stores,     │  │  WebSocket pub/sub  │  │
│  │  Role-based session │  │  location_logs,     │  │  channel per tabel  │  │
│  │                    │  │  presensi_pings,     │  │  (stores, location_ │  │
│  │                    │  │  transactions_bills  │  │  logs)              │  │
│  └───────────────────┘  └────────────────────┘  └────────────────────┘  │
│  ┌────────────────────────────┐  ┌──────────────────────────────────┐   │
│  │  Edge Functions              │  │  Scheduled Tasks (Cron)          │   │
│  │  • Validasi nominal tagihan  │  │  • Agregasi & deteksi toko       │   │
│  │  • Hitung ringkasan harian   │  │    offline (tiap 5 menit)        │   │
│  └────────────────────────────┘  └──────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────────────┘
                    ▲
                    │ Native Geolocation API (Android) via Capacitor plugin
┌──────────────────┴─────────────────────────────────────────────────────┐
│               DEVICE LAYER — Android HP Petugas Lapangan                │
│   GPS Hardware · Foreground Service (notifikasi persisten) ·            │
│   Background Location Permission ("Izinkan selalu")                     │
└───────────────────────────────────────────────────────────────────────┘
```

### 3.2 Komponen & Tanggung Jawab

| Komponen | Teknologi | Tanggung Jawab |
|---|---|---|
| App Client (Petugas) | Next.js App Router dibungkus **Capacitor**, Client Components | Form registrasi, kontrol GPS, kirim status, UI mobile-first, dikemas jadi APK Android |
| Background Geolocation | Capacitor plugin (native Android foreground service) | Ambil & kirim koordinat GPS walau layar mati/terkunci — dasar Shareloc Live & Presensi 5 menit |
| Dashboard Client (Admin) | Next.js, Client Components + Server Components untuk data non-realtime | Visualisasi peta, laporan, manajemen |
| Peta Interaktif | Leaflet.js (default, gratis, tanpa API key) atau Google Maps API (jika butuh Street View/geocoding presisi tinggi) | Render marker toko, live position |
| Auth | InsForge Auth (JWT) | Login, session, role-based access |
| Database | InsForge PostgreSQL (auto REST via PostgREST-style endpoint) | Penyimpanan seluruh entitas |
| Realtime | InsForge Realtime (WebSocket pub/sub) | Push update lokasi & status ke dashboard tanpa polling |
| Edge Functions | InsForge Edge Functions | Logika validasi (nominal tagihan), agregasi laporan |
| Scheduled Tasks | InsForge Scheduled Tasks/Cron (via `@insforge/cli schedules`) | Deteksi toko offline tiap 5 menit, cleanup data lama |

### 3.3 Data Flow: Live Location & Presensi

```
[GPS Device] --lat/long--> [Client Next.js]
     │
     ├── Mode Shareloc Live (interval pendek, mis. tiap 15-30 detik saat aktif)
     │        → INSERT location_logs (session_id, store_id, lat, long, accuracy, timestamp)
     │        → InsForge Realtime broadcast perubahan → Dashboard Admin subscribe & render marker
     │
     └── Mode Presensi Otomatis (fixed interval 5 menit, selalu berjalan saat app aktif)
              → INSERT presensi_pings (store_id, lat, long, battery, ping_status, timestamp)
              → UPDATE stores.last_ping_at
              → [Scheduled Task tiap 5 menit di server] → SELECT stores WHERE is_tracking_active
                    AND last_ping_at < NOW() - 10 menit → UPDATE status → "offline"
                    → Realtime broadcast perubahan status → Dashboard Admin update warna marker
```

### 3.4 Tech Stack Summary

| Layer | Teknologi | Catatan |
|---|---|---|
| Frontend Framework | Next.js (App Router) | SSR untuk dashboard, CSR untuk komponen peta/GPS |
| Styling | Tailwind CSS | Utility-first, cepat untuk mobile-first UI |
| Peta | Leaflet.js + OpenStreetMap tiles (default) / Google Maps API (opsional) | Leaflet lebih murah (tanpa biaya API), GMaps lebih presisi untuk alamat Indonesia |
| Mobile Packaging (Petugas) | Capacitor | Bungkus app Petugas Lapangan jadi APK Android asli |
| Background Location | Capacitor Background Geolocation plugin | Foreground service + tracking saat layar mati/terkunci |
| Backend/BaaS | InsForge (PostgreSQL, Auth, Realtime, Edge Functions, Scheduled Tasks) | AI-agent-native BaaS, cocok dengan workflow coding agent (Antigravity) yang sudah dipakai |
| SDK Client | `@insforge/sdk` (JS/TS) | Official SDK untuk koneksi dari Next.js/Capacitor |
| Hosting Backend | InsForge Cloud | Sesuai spec |
| Hosting Dashboard (Admin) | InsForge Cloud **[perlu verifikasi di Tahap 6]** atau Vercel sebagai alternatif jika InsForge Cloud belum full-support Next.js SSR/API routes | Lihat catatan 3.5 — khusus dashboard web; app Petugas didistribusikan sebagai APK, bukan hosting web |

### 3.5 Deployment Architecture **[ASUMSI — perlu verifikasi]**

Spec meminta **INSForge Cloud Deployment**. Karena InsForge secara primer adalah platform *backend*, sementara Next.js App Router butuh runtime Node.js/Edge untuk SSR & API routes, ada dua opsi yang perlu dikonfirmasi saat Tahap 6 (khusus untuk **Dashboard Admin/Supervisor**, yang tetap web):

1. **Full InsForge Cloud** — jika InsForge Cloud mendukung hosting frontend Next.js secara langsung (perlu dicek dokumentasi resmi InsForge terbaru saat eksekusi).
2. **Hybrid** — Backend (DB, Auth, Realtime, Edge Functions) tetap 100% di InsForge Cloud; Frontend Dashboard di-deploy terpisah (mis. Vercel) yang terhubung ke InsForge via `@insforge/sdk` dan environment variable API URL.

Kedua opsi tidak mengubah desain database/API — hanya memengaruhi langkah deployment di Tahap 6. Direkomendasikan mengecek dokumentasi InsForge terbaru sebelum eksekusi Tahap 6.

**Distribusi App Petugas Lapangan (Android APK):** terpisah dari pertanyaan hosting di atas. Karena internal untuk 1 klien UMK, APK hasil build Capacitor didistribusikan manual (link download langsung / grup WhatsApp tim) — tidak perlu publish ke Play Store untuk MVP. Signing key (`keystore`) perlu disiapkan & disimpan aman di Tahap 6 agar update APK berikutnya tetap konsisten.

---

## 4. DATABASE SCHEMA DESIGN

### 4.1 Entity Relationship Overview

```
users (1) ──────< (N) stores            [stores.registered_by → users.id]
stores (1) ──────< (N) location_logs    [location_logs.store_id → stores.id]
stores (1) ──────< (N) presensi_pings   [presensi_pings.store_id → stores.id]
stores (1) ──────< (N) transactions_bills [transactions_bills.store_id → stores.id]
users (1) ──────< (N) location_logs, presensi_pings, transactions_bills  [via user_id — siapa yang input/kirim]
```

### 4.2 Detail Tabel

#### Tabel: `users`
| Field | Tipe | Constraint | Deskripsi |
|---|---|---|---|
| id | uuid | PK, default `gen_random_uuid()` | ID unik |
| email | varchar(255) | unique, not null | Login email |
| password_hash | varchar(255) | not null | Dikelola oleh InsForge Auth |
| full_name | varchar(150) | not null | Nama lengkap |
| phone_number | varchar(20) | nullable | No. HP |
| role | enum(`admin`,`supervisor`,`petugas_lapangan`) | not null, default `petugas_lapangan` | Peran akses |
| is_active | boolean | default `true` | Nonaktifkan tanpa hapus akun |
| created_at | timestamptz | default `now()` | |
| updated_at | timestamptz | default `now()` | |
| last_login_at | timestamptz | nullable | |

#### Tabel: `stores`
| Field | Tipe | Constraint | Deskripsi |
|---|---|---|---|
| id | uuid | PK | |
| store_name | varchar(150) | not null | Nama Toko |
| phone_number | varchar(20) | not null | Nomor Telepon Toko |
| pic_name | varchar(100) | not null | Kontak Person (PIC) |
| pic_phone | varchar(20) | nullable **[ASUMSI]** | No. HP PIC |
| full_address | text | not null | Alamat Lengkap Toko |
| latitude | numeric(10,7) | not null | Koordinat awal registrasi |
| longitude | numeric(10,7) | not null | Koordinat awal registrasi |
| registered_by | uuid | FK → `users.id`, not null | Petugas yang mendaftarkan |
| verification_status | enum(`pending`,`verified`,`rejected`) | default `pending` **[ASUMSI]** | Status verifikasi admin |
| current_status | enum(`open`,`closed`) | default `closed` | Toggle Buka/Tutup |
| is_tracking_active | boolean | default `false` | Sesi Shareloc Live sedang berjalan |
| last_ping_at | timestamptz | nullable | Dipakai cron untuk deteksi offline |
| created_at | timestamptz | default `now()` | |
| updated_at | timestamptz | default `now()` | |

#### Tabel: `location_logs` (trail Shareloc Live, frekuensi tinggi)
| Field | Tipe | Constraint | Deskripsi |
|---|---|---|---|
| id | bigserial | PK | |
| store_id | uuid | FK → `stores.id`, not null | |
| user_id | uuid | FK → `users.id`, not null | Petugas yang share lokasi |
| session_id | uuid | not null | Mengelompokkan satu sesi Shareloc Live |
| latitude | numeric(10,7) | not null | |
| longitude | numeric(10,7) | not null | |
| accuracy_m | numeric(6,2) | nullable | Akurasi GPS (meter) dari browser |
| recorded_at | timestamptz | default `now()` | |

*Index:* `(store_id, recorded_at)`, `(session_id)`

#### Tabel: `presensi_pings` (heartbeat otomatis 5 menit)
| Field | Tipe | Constraint | Deskripsi |
|---|---|---|---|
| id | bigserial | PK | |
| store_id | uuid | FK → `stores.id`, not null | |
| user_id | uuid | FK → `users.id`, not null | |
| latitude | numeric(10,7) | nullable (null jika `ping_status≠success`) | |
| longitude | numeric(10,7) | nullable | |
| ping_status | enum(`success`,`gps_denied`,`failed`) | default `success` | Lihat Edge Case 6.1.1 |
| battery_level | smallint | nullable, check 0-100 | Diagnostik |
| ping_timestamp | timestamptz | default `now()` | |

*Index:* `(store_id, ping_timestamp)` — untuk query histori & deteksi cron

#### Tabel: `transactions_bills`
| Field | Tipe | Constraint | Deskripsi |
|---|---|---|---|
| id | uuid | PK | |
| store_id | uuid | FK → `stores.id`, not null | |
| user_id | uuid | FK → `users.id`, not null | Petugas yang input |
| visit_date | date | not null, default `current_date` | |
| order_status | enum(`order`,`no_order`) | not null | |
| payment_status | enum(`paid`,`unpaid`) | not null | |
| bill_amount | numeric(14,2) | nullable, **check:** wajib > 0 jika `payment_status='paid'`, harus `null` jika `unpaid` | Nominal tagihan (Rp) |
| notes | text | nullable | Catatan bebas |
| created_at | timestamptz | default `now()` | |

*Index:* `(store_id, visit_date)` — untuk laporan harian per toko

### 4.3 Indexing & Performance Strategy

- `location_logs` dan `presensi_pings` adalah tabel **time-series, high-write** — wajib composite index `(store_id, timestamp)` agar query "riwayat toko X hari ini" tetap cepat walau data jutaan baris.
- Pertimbangkan **partitioning by month** pada `location_logs` jika volume Shareloc Live tinggi (banyak toko aktif setiap hari) — dapat ditunda sampai data riil menunjukkan kebutuhan.
- `stores.last_ping_at` didenormalisasi (disalin dari `presensi_pings` terbaru) supaya scheduled task deteksi offline tidak perlu `JOIN`/`GROUP BY` tabel besar setiap 5 menit — cukup `WHERE last_ping_at < NOW() - interval '10 minutes'`.

### 4.4 Data Retention Strategy **[ASUMSI]**

Rekomendasi (dikonfirmasi ke klien saat implementasi): simpan `location_logs` mentah selama 90 hari lalu diarsipkan/dihapus (karena volumenya besar dan nilai bisnisnya menurun setelah beberapa bulan); `presensi_pings` dan `transactions_bills` disimpan permanen karena menjadi dasar laporan historis/audit keuangan.

---

## 5. API ENDPOINT REQUIREMENTS & REALTIME SPECIFICATION

> InsForge men-generate REST endpoint otomatis per tabel (gaya PostgREST). Tabel di bawah mendefinisikan **kontrak logis** yang dibutuhkan aplikasi; penamaan path persis akan mengikuti konvensi InsForge saat implementasi Tahap 4.

### 5.1 Authentication (via InsForge Auth)

| Method | Endpoint (logis) | Deskripsi | Role |
|---|---|---|---|
| POST | `/auth/login` | Login email+password → JWT | Semua |
| POST | `/auth/logout` | Invalidate session | Semua |
| GET | `/auth/session` | Ambil user & role aktif | Semua |
| POST | `/auth/register` | Buat akun petugas baru | Admin only (bukan self-signup publik) |

### 5.2 Stores

| Method | Endpoint | Deskripsi | Role |
|---|---|---|---|
| POST | `/stores` | Registrasi toko baru | `petugas_lapangan` |
| GET | `/stores` | List toko (+filter status, area) | Semua (scope berbeda per role) |
| GET | `/stores/:id` | Detail satu toko | Semua |
| PATCH | `/stores/:id` | Update `current_status`, toggle tracking | `petugas_lapangan` (toko miliknya), `admin` (semua) |
| PATCH | `/stores/:id/verify` | Ubah `verification_status` | `admin` only |

### 5.3 Location & Shareloc Live

| Method | Endpoint | Deskripsi | Role |
|---|---|---|---|
| POST | `/location-logs` | Kirim satu titik koordinat sesi Shareloc Live | `petugas_lapangan` |
| POST | `/stores/:id/tracking/start` | Mulai sesi (generate `session_id` baru, set `is_tracking_active=true`) | `petugas_lapangan` |
| POST | `/stores/:id/tracking/stop` | Akhiri sesi (`is_tracking_active=false`) | `petugas_lapangan` |
| GET | `/location-logs?store_id=&session_id=` | Riwayat trail satu sesi | `admin`,`supervisor` |

### 5.4 Presensi

| Method | Endpoint | Deskripsi | Role |
|---|---|---|---|
| POST | `/presensi-pings` | Kirim heartbeat 5 menit | Sistem (dipicu client tiap 5 menit) |
| GET | `/presensi-pings?store_id=&date=` | Riwayat presensi | `admin`,`supervisor` |

### 5.5 Transactions/Bills

| Method | Endpoint | Deskripsi | Role |
|---|---|---|---|
| POST | `/transactions-bills` | Submit status order + tagihan kunjungan | `petugas_lapangan` |
| GET | `/transactions-bills?store_id=&date_from=&date_to=` | Laporan/riwayat | `admin`,`supervisor` |
| GET | `/transactions-bills/summary?date=` | Agregat total tagihan harian | `admin` |

### 5.6 Realtime Subscriptions (WebSocket Channel)

| Channel | Event | Dipakai Oleh | Payload |
|---|---|---|---|
| `realtime:stores` | `UPDATE` | Dashboard Admin (peta status buka/tutup/offline) | Row `stores` yang berubah |
| `realtime:location_logs` | `INSERT` | Dashboard Admin (marker bergerak saat Shareloc Live) | Row baru `location_logs` |
| `realtime:presensi_pings` | `INSERT` | Dashboard Admin (opsional: live feed presensi masuk) | Row baru `presensi_pings` |

**Pola subscribe (sisi client dashboard):**
```
subscribe("realtime:stores", filter: is_tracking_active=true)
  → on update → refresh marker warna/posisi di peta tanpa reload halaman
```

### 5.7 Edge Functions & Scheduled Tasks

| Nama | Trigger | Fungsi |
|---|---|---|
| `validate-bill-amount` | Sebelum INSERT `transactions_bills` | Tolak jika `payment_status='paid'` tapi `bill_amount` kosong/≤0; tolak jika `unpaid` tapi `bill_amount` diisi |
| `detect-offline-stores` | Scheduled, tiap 5 menit | `SELECT` toko `is_tracking_active=true` dengan `last_ping_at` > 10 menit lalu → update flag offline → trigger realtime broadcast |
| `daily-summary` | Scheduled, tiap hari jam 23:59 | Hitung total tagihan, jumlah toko dikunjungi, simpan snapshot laporan harian |

---

## 6. EDGE CASES & SECURITY CONSIDERATIONS

### 6.1 Edge Case Operasional

**6.1.1 — GPS Mati / Permission Ditolak**
| Skenario | Penanganan |
|---|---|
| User menolak izin lokasi saat pertama kali | Tampilkan modal edukatif menjelaskan lokasi wajib untuk fitur inti; sediakan tombol "Buka Pengaturan Aplikasi" (deep-link ke Android App Settings) |
| GPS dimatikan di tengah sesi presensi aktif | Ping tetap dikirim dengan `ping_status='gps_denied'`, lat/long `null`; dashboard admin menampilkan badge "GPS bermasalah" (bukan hilang begitu saja) |
| Akurasi GPS sangat rendah (mis. di dalam gedung, >100m) | Tetap terima data tapi simpan `accuracy_m` agar admin bisa menilai kualitas titik saat audit |

**6.1.2 — Registrasi Tanpa Akses Lokasi**
Jika izin lokasi ditolak saat registrasi toko, sediakan **fallback pin-drop manual** di peta agar registrasi tidak buntu — dicatat sebagai `location_source: 'manual'` vs `'gps'` **[ASUMSI: tambahan field opsional]**.

**6.1.3 — Background Tracking Saat Layar Mati/Terkunci (Resolved via Capacitor)**
Web app murni (PWA) tidak bisa menjamin tracking saat layar mati/terkunci — iOS Safari dan Android Chrome sama-sama men-suspend `navigator.geolocation.watchPosition()` begitu app di-background. Karena kebutuhan ini eksplisit dan tim lapangan **dikonfirmasi 100% Android**, keputusan final: App Petugas Lapangan dibungkus **Capacitor** menjadi APK Android dengan **foreground service** + plugin *background geolocation* native.

**Implikasi teknis yang perlu diperhatikan saat Tahap 5:**
- Android **mewajibkan notifikasi persisten** ("Sedang membagikan lokasi...") selama foreground service berjalan — ini kebijakan OS, bukan pilihan desain, dan tidak bisa disembunyikan/dimatikan.
- Sejak Android 10+, ada permission terpisah untuk lokasi background ("Izinkan selalu"/*Allow all the time*) di luar izin lokasi biasa ("Hanya saat menggunakan aplikasi") — flow permission butuh 2 tahap, dan alasan izin ekstra ini perlu dijelaskan ke petugas sebelum prompt native muncul.
- Battery optimization Android (Doze mode, ditambah battery manager khas vendor seperti Xiaomi/Oppo/Vivo) bisa tetap membunuh background service di merk HP tertentu — perlu diminta pengecualian battery optimization saat onboarding app, dan diuji di merk HP yang benar-benar dipakai tim lapangan, bukan cuma 1 merk saat testing.
- Karena tim lapangan 100% Android, **iOS resmi di luar scope MVP** — tidak ada effort tambahan untuk kompatibilitas iOS.

**Fallback tetap dipertahankan** (untuk kasus permission/battery-optimization gagal di device tertentu): Wake Lock API + reminder in-app bila tidak ada ping >10 menit — sebagai lapisan kedua, bukan solusi utama lagi.

**6.1.4 — Duplikasi Registrasi Toko**
Validasi soft: cek kombinasi `store_name` + radius ±50m dari toko lain yang sudah ada sebelum submit; jika mirip, tampilkan peringatan "Toko serupa terdeteksi, lanjutkan?" (bukan hard block, karena bisa saja dua toko memang berdekatan).

### 6.2 Keamanan Autentikasi & Otorisasi (RBAC)

- Semua endpoint di belakang JWT InsForge Auth; token divalidasi tiap request.
- **Row-level scoping:** `petugas_lapangan` hanya boleh `PATCH` toko dengan `registered_by = auth.uid()` (atau daftar toko yang di-assign ke dia); `admin`/`supervisor` bebas akses.
- `supervisor` read-only — tidak boleh punya endpoint `PATCH`/`DELETE` di level API, bukan hanya disembunyikan di UI (agar tidak bisa di-bypass via request langsung).

### 6.3 Validasi Data & Input

| Field | Aturan Validasi |
|---|---|
| `bill_amount` | Numerik, > 0, maksimal wajar (mis. Rp 1 miliar — sesuaikan ke klien) untuk menangkap salah ketik; wajib terisi jika `payment_status='paid'`; wajib `null`/kosong jika `unpaid` |
| `phone_number` (toko & user) | Format nomor Indonesia (`08xxx` atau `+62xxx`), divalidasi regex di client & server |
| `latitude`/`longitude` | Harus dalam rentang valid Indonesia secara kasar (lat -11 s/d 6, long 95 s/d 141) sebagai sanity check, bukan hard constraint (jaga-jaga toko di luar rentang itu) |
| Semua input teks | Sanitasi terhadap XSS sebelum render di dashboard (escape HTML) |

### 6.4 Privasi Data Lokasi

- Data lokasi personal (lokasi petugas) hanya bisa diakses oleh `admin`/`supervisor` di organisasi yang sama — bukan data publik.
- Sertakan pemberitahuan/consent eksplisit ke petugas lapangan bahwa lokasi mereka dipantau selama jam kerja saat fitur diaktifkan (etika & kepatuhan ketenagakerjaan).
- Pertimbangkan auto-nonaktifkan tracking di luar jam kerja yang dikonfigurasi (mis. otomatis stop jam 18:00).

### 6.5 Reliability & Error Handling

- **Offline queue:** jika koneksi internet putus saat ping/update status, simpan sementara di `localStorage`/`IndexedDB` client dan retry otomatis saat koneksi kembali (penting untuk area toko dengan sinyal lemah).
- **Rate limiting** pada endpoint POST presensi (maks 1 request per store per ~4 menit) untuk mencegah spam/bug infinite-loop dari client membanjiri database.
- **Idempotency:** gunakan `session_id` + timestamp agar retry ping yang sama tidak membuat duplikat data.

---

## 7. STEP-BY-STEP TASK DEVELOPMENT LIST

### 7.1 Ringkasan Roadmap

```
[Tahap 1: PRD]  →  [Tahap 2: Setup Agent]  →  [Tahap 3: Frontend Next.js]
     ✅ (dokumen ini)      Antigravity + InsForge CLI        UI mobile-first + dashboard
        ↓
[Tahap 4: Backend InsForge] → [Tahap 5: Live Tracking & Cron] → [Tahap 6: Security Audit & Deploy]
   Schema + Auth + API           Realtime + Scheduled Task         RBAC test + go-live
```

### 7.2 Tahap 2 — Setup Agent
- [ ] Install InsForge CLI (`npx @insforge/cli`), login, buat project baru
- [ ] Jalankan `insforge create`/`link` agar skill InsForge otomatis terpasang untuk coding agent (Antigravity)
- [ ] Masukkan file PRD ini ke `prd.md` di root project sebagai konteks utama agent
- [ ] Inisialisasi repo Next.js (App Router) + Tailwind CSS
- [ ] Install `@insforge/sdk` dan konfigurasi environment variable (API URL, anon key)
- [ ] Install Capacitor (`@capacitor/core`, `@capacitor/cli`, `@capacitor/android`) + `npx cap init` untuk target Petugas Lapangan
- [ ] Install plugin background geolocation Android (mis. `@capacitor/geolocation` + plugin foreground-service/background-geolocation)

### 7.3 Tahap 3 — Frontend Next.js (UI)
- [ ] Layout dasar: shell mobile-first untuk app Petugas (target build Capacitor), shell desktop untuk dashboard admin
- [ ] Halaman Login (role-aware redirect: petugas → form kerja, admin/supervisor → dashboard)
- [ ] Form Registrasi Toko + integrasi `navigator.geolocation` + fallback pin-drop peta
- [ ] Komponen Toggle: Shareloc Live, Buka/Tutup, Order/Tidak, Bayar Tagihan/Tidak + input nominal (dengan format Rupiah otomatis)
- [ ] Halaman Dashboard Admin: widget ringkasan (toko aktif, tagihan hari ini, toko belum dikunjungi)
- [ ] Integrasi peta Leaflet.js (atau Google Maps API) dengan marker dinamis
- [ ] Halaman Log Presensi (tabel + filter tanggal/toko)
- [ ] Halaman Laporan Tagihan (tabel + total agregat)
- [ ] Responsive testing di berbagai ukuran layar HP

### 7.4 Tahap 4 — Backend InsForge
- [ ] Buat 5 tabel sesuai skema Bagian 4 (`users` dikelola InsForge Auth + tabel profil tambahan bila perlu, `stores`, `location_logs`, `presensi_pings`, `transactions_bills`)
- [ ] Set foreign key & index sesuai Bagian 4.3
- [ ] Konfigurasi Auth: role custom (`admin`,`supervisor`,`petugas_lapangan`), aturan row-level scoping (Bagian 6.2)
- [ ] Implementasi Edge Function `validate-bill-amount`
- [ ] Uji seluruh endpoint REST auto-generated terhadap kontrak API di Bagian 5

### 7.5 Tahap 5 — Live Tracking & Cron
- [ ] Setup Android foreground service (via plugin Capacitor) dengan notifikasi persisten "Sedang membagikan lokasi"
- [ ] Implementasi flow permission 2 tahap: lokasi foreground → lokasi background ("Izinkan selalu"), dengan layar penjelasan konteks sebelum prompt native muncul
- [ ] Implementasi timer background: Shareloc Live (posting `location_logs`) & Presensi otomatis (posting `presensi_pings` tiap 5 menit) — tetap jalan saat layar mati/terkunci via foreground service
- [ ] Minta pengecualian battery optimization saat onboarding app (khususnya device Xiaomi/Oppo/Vivo yang agresif mematikan background service)
- [ ] Implementasi Wake Lock API sebagai lapisan fallback saat sesi Shareloc Live aktif di foreground
- [ ] Subscribe Realtime channel `stores` & `location_logs` di dashboard, render update peta tanpa reload
- [ ] Buat Scheduled Task `detect-offline-stores` (tiap 5 menit) via `@insforge/cli schedules create`
- [ ] Buat Scheduled Task `daily-summary`
- [ ] Implementasi offline queue (local storage device) untuk ping yang gagal terkirim
- [ ] Uji end-to-end: layar dikunci 30+ menit dengan tracking aktif, matikan GPS di tengah sesi, matikan internet, uji di minimal 2 merk HP berbeda (mis. Samsung + Xiaomi) untuk cek battery optimization

### 7.6 Tahap 6 — Security Audit & Deploy
- [ ] Verifikasi RBAC: petugas tidak bisa akses/edit toko orang lain via direct API call (bukan hanya UI)
- [ ] Verifikasi validasi `bill_amount` tidak bisa dilewati dari sisi client
- [ ] Verifikasi HTTPS enforced (wajib untuk Geolocation API browser)
- [ ] Cek dokumentasi InsForge Cloud terbaru untuk opsi hosting dashboard Next.js (lihat Bagian 3.5) — putuskan Full InsForge vs Hybrid
- [ ] Setup environment production (env vars, domain, SSL)
- [ ] Deploy backend ke InsForge Cloud
- [ ] Deploy dashboard admin (InsForge Cloud atau alternatif sesuai keputusan di atas)
- [ ] Generate signing key Capacitor/Android, build APK release, simpan keystore dengan aman untuk update berikutnya
- [ ] Siapkan kanal distribusi APK ke tim lapangan (link download/WhatsApp) + panduan instalasi ("Install dari sumber tidak dikenal")
- [ ] UAT bersama klien: simulasi 1 hari penuh kerja lapangan dengan data riil, termasuk skenario layar terkunci
- [ ] Serah terima + dokumentasi SOP penggunaan untuk petugas & admin

---

## Lampiran — Daftar Asumsi untuk Direview Klien

| # | Asumsi | Perlu Dikonfirmasi? |
|---|---|---|
| 1 | Field `pic_phone` ditambahkan di luar spec asli | Ya/Tidak perlu field ini? | butuh
| 2 | Ada tahap verifikasi admin sebelum toko aktif | Sesuai alur bisnis riil klien? | harus disetujui (diverifikasi) dulu oleh Admin kantor lewat dashboard
| 3 | Presensi otomatis via Android foreground service (Capacitor), bukan lagi via browser | ✅ Resolved — perlu diuji di berbagai merk HP karena battery optimization tiap vendor beda-beda | 
| 4 | Data retensi `location_logs` 90 hari | Sesuai kebutuhan audit klien? | disimpan di sistem selama 90 hari (3 bulan) saja
| 5 | Hosting dashboard: InsForge Cloud vs Vercel | Diputuskan di Tahap 6 |
| 6 | Distribusi APK manual/sideload (bukan Play Store) untuk MVP | Sesuai untuk internal 1 klien? |