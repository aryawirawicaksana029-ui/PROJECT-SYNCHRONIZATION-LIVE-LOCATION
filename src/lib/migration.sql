-- ========================================================
-- InsForge Migration Schema for Synchronized Live Location (SLL)
-- ========================================================

-- 1. Enum Types
CREATE TYPE user_role_type AS ENUM ('admin', 'sales', 'supervisor', 'petugas_lapangan');
CREATE TYPE user_status_type AS ENUM ('active', 'inactive');
CREATE TYPE verification_status_type AS ENUM ('verified', 'pending');
CREATE TYPE store_status_type AS ENUM ('open', 'closed');
CREATE TYPE stock_status_type AS ENUM ('ready', 'limited', 'out_of_stock');

-- 2. Users Table
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  role user_role_type NOT NULL DEFAULT 'sales',
  status user_status_type NOT NULL DEFAULT 'active',
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Stores Table
CREATE TABLE IF NOT EXISTS public.stores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kode_toko VARCHAR(50),
  kategori VARCHAR(100) DEFAULT 'Retail / Sembako',
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(50) NOT NULL,
  pic_name VARCHAR(255) NOT NULL,
  pic_phone VARCHAR(50),
  address TEXT NOT NULL,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  verification_status verification_status_type NOT NULL DEFAULT 'verified',
  current_status store_status_type NOT NULL DEFAULT 'closed',
  is_tracking_active BOOLEAN NOT NULL DEFAULT FALSE,
  last_ping_at VARCHAR(100),
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Products Table (Katalog Bahan Baku)
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sku VARCHAR(100) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  unit VARCHAR(50) NOT NULL,
  price NUMERIC(12,2) NOT NULL DEFAULT 0,
  stock_status stock_status_type NOT NULL DEFAULT 'ready',
  image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Visit Logs Table
CREATE TABLE IF NOT EXISTS public.visit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE,
  store_name VARCHAR(255),
  check_in_time TIMESTAMPTZ,
  check_out_time TIMESTAMPTZ,
  is_open BOOLEAN NOT NULL DEFAULT TRUE,
  is_ordered BOOLEAN NOT NULL DEFAULT FALSE,
  is_paid BOOLEAN NOT NULL DEFAULT FALSE,
  total_amount NUMERIC(12,2) DEFAULT 0,
  notes TEXT,
  photo_url TEXT,
  photo_key TEXT,
  is_live_tracking BOOLEAN NOT NULL DEFAULT FALSE,
  session_id VARCHAR(100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Order Items Table
CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visit_log_id UUID REFERENCES public.visit_logs(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  product_name VARCHAR(255),
  sku VARCHAR(100),
  unit VARCHAR(50),
  quantity INT NOT NULL DEFAULT 1,
  unit_price NUMERIC(12,2) NOT NULL DEFAULT 0,
  subtotal NUMERIC(12,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. Location Logs Table (Realtime Tracking & Presensi)
CREATE TABLE IF NOT EXISTS public.location_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  store_id UUID REFERENCES public.stores(id) ON DELETE SET NULL,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  accuracy_m DOUBLE PRECISION,
  battery_level INT DEFAULT 100,
  ping_status VARCHAR(50) DEFAULT 'success',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS & Seed default initial products
INSERT INTO public.products (sku, name, unit, price, stock_status)
VALUES 
  ('SKU-TER-01', 'Tepung Terigu Cakra Kembar Premium', 'Sak (25kg)', 245000, 'ready'),
  ('SKU-GUL-02', 'Gula Pasir Kristal Industri', 'Sak (50kg)', 780000, 'ready'),
  ('SKU-MYK-03', 'Minyak Goreng Sawit Industri', 'Drum (200L)', 3450000, 'limited'),
  ('SKU-RGI-04', 'Ragi Instan Mauripan Industri', 'Karton (20 pack)', 420000, 'ready'),
  ('SKU-CKL-05', 'Cokelat Bubuk Pure Cocoa 100%', 'Karton (5kg)', 350000, 'out_of_stock')
ON CONFLICT (sku) DO NOTHING;
