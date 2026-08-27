"use client";

import { useEffect, useState, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { getLocationLogs } from "@/lib/db";
import { LocationLogRow } from "@/lib/database.types";
import type { ActiveSalesPosition } from "@/lib/db";

export interface AdminStoreMarker {
  id: string;
  store_name: string;
  pic_name: string;
  phone_number: string;
  full_address: string;
  latitude: number;
  longitude: number;
  verification_status: "verified" | "pending";
  current_status: "open" | "closed";
  is_tracking_active: boolean;
  last_ping_at?: string;
  registered_by?: string;
}

export interface MapFocusTarget {
  lat: number;
  lng: number;
  zoom?: number;
  id?: string;
  type?: "store" | "sales";
}

// Generate Leaflet Marker Icons dynamically based on store status
function createStatusMarkerIcon(
  status: "open" | "closed" | "pending",
  isTracking: boolean
) {
  let mainColor = "#10b981"; // Emerald Green for Open
  let ringPulse = false;

  if (isTracking) {
    mainColor = "#1b6cf5"; // Primary Blue for Shareloc Live
    ringPulse = true;
  } else if (status === "closed") {
    mainColor = "#64748b"; // Slate for Closed
  } else if (status === "pending") {
    mainColor = "#f59e0b"; // Amber for Pending
  }

  return L.divIcon({
    className: "admin-leaflet-marker",
    html: `
      <div style="position: relative; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center;">
        ${
          ringPulse
            ? `<div style="position: absolute; width: 38px; height: 38px; background: rgba(27, 108, 245, 0.35); border-radius: 50%; animation: pulse-soft 1.5s infinite;"></div>`
            : ""
        }
        <div style="position: relative; width: 28px; height: 28px; background: ${mainColor}; border: 3px solid #ffffff; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); box-shadow: 0 4px 10px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center;">
          <div style="width: 8px; height: 8px; background: #ffffff; border-radius: 50%;"></div>
        </div>
      </div>
    `,
    iconSize: [36, 36],
    iconAnchor: [18, 36],
    popupAnchor: [0, -34],
  });
}

// Sales Person Marker (distinct blue circle with person icon)
function createSalesMarkerIcon(batteryLevel: number) {
  let ringColor = "#1b6cf5";
  if (batteryLevel < 20) ringColor = "#ef4444";
  else if (batteryLevel < 50) ringColor = "#f59e0b";

  return L.divIcon({
    className: "sales-leaflet-marker",
    html: `
      <div style="position: relative; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center;">
        <div style="position: absolute; width: 44px; height: 44px; background: rgba(27, 108, 245, 0.25); border-radius: 50%; animation: pulse-soft 2s infinite;"></div>
        <div style="position: relative; width: 30px; height: 30px; background: ${ringColor}; border: 3px solid #ffffff; border-radius: 50%; box-shadow: 0 4px 12px rgba(0,0,0,0.35); display: flex; align-items: center; justify-content: center;">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="white" width="14" height="14">
            <path d="M10 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM3.465 14.493a1.23 1.23 0 0 0 .41 1.412A9.957 9.957 0 0 0 10 18c2.31 0 4.438-.784 6.131-2.1.43-.333.604-.903.408-1.41a7.002 7.002 0 0 0-13.074.003Z"/>
          </svg>
        </div>
      </div>
    `,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    popupAnchor: [0, -20],
  });
}

// Helper component for focusing camera and opening popup
function MapFocusController({
  focusTarget,
  markersRef,
}: {
  focusTarget?: MapFocusTarget | null;
  markersRef: React.MutableRefObject<Record<string, L.Marker | null>>;
}) {
  const map = useMap();

  useEffect(() => {
    if (focusTarget && focusTarget.lat && focusTarget.lng) {
      map.flyTo([focusTarget.lat, focusTarget.lng], focusTarget.zoom || 17, {
        duration: 1.2,
      });

      const targetId = focusTarget.id;
      if (targetId && markersRef.current[targetId]) {
        setTimeout(() => {
          markersRef.current[targetId]?.openPopup();
        }, 500);
      }
    }
  }, [focusTarget, map, markersRef]);

  return null;
}

interface AdminLiveMapProps {
  stores: AdminStoreMarker[];
  salesPositions?: ActiveSalesPosition[];
  height?: string;
  selectedStoreId?: string | null;
  focusedTarget?: MapFocusTarget | null;
}

export default function AdminLiveMap({
  stores,
  salesPositions = [],
  height = "420px",
  selectedStoreId,
  focusedTarget,
}: AdminLiveMapProps) {
  const [filter, setFilter] = useState<"all" | "live" | "open" | "closed" | "pending" | "sales">("all");
  const [liveLogs, setLiveLogs] = useState<LocationLogRow[]>([]);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<string>("Baru saja");
  const markersRef = useRef<Record<string, L.Marker | null>>({});

  // Realtime Polling Subscription (every 10 seconds)
  useEffect(() => {
    const fetchLogs = () => {
      getLocationLogs().then((logs) => {
        setLiveLogs(logs);
        setLastRefreshedAt(
          new Date().toLocaleTimeString("id-ID", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          })
        );
      });
    };

    fetchLogs();
    const interval = setInterval(fetchLogs, 10000);
    return () => clearInterval(interval);
  }, []);

  const filteredStores = filter === "sales" ? [] : stores.filter((s) => {
    if (filter === "live") return s.is_tracking_active;
    if (filter === "open") return s.current_status === "open" && !s.is_tracking_active;
    if (filter === "closed") return s.current_status === "closed" && !s.is_tracking_active;
    if (filter === "pending") return s.verification_status === "pending";
    return true;
  });

  const showSalesMarkers = filter === "all" || filter === "sales";

  // Default Map Center (Jakarta Center)
  const defaultCenter: [number, number] = [-6.2088, 106.8456];

  const formatTimeAgo = (dateStr: string) => {
    const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
    if (diff < 60) return `${diff} detik lalu`;
    if (diff < 3600) return `${Math.floor(diff / 60)} menit lalu`;
    return `${Math.floor(diff / 3600)} jam lalu`;
  };

  return (
    <div className="relative w-full overflow-hidden rounded-2xl border border-navy-100 shadow-sm bg-white">
      {/* Map Filter Pills Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-navy-100 bg-white/90 backdrop-blur-md px-4 py-2.5 z-20">
        <div className="flex items-center gap-2 text-xs font-bold text-navy-900">
          <span className="h-2 w-2 rounded-full bg-accent-500 animate-pulse-soft" />
          <span>Peta Monitoring Real-Time ({filteredStores.length} Toko{showSalesMarkers && salesPositions.length > 0 ? ` + ${salesPositions.length} Sales` : ""})</span>
          <span className="rounded bg-accent-50 px-2 py-0.5 text-[10px] font-mono text-accent-700 border border-accent-200">
            ⚡ Sync: {lastRefreshedAt}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {(
            [
              { id: "all", label: "Semua", count: stores.length },
              { id: "sales", label: "🏃 Sales Aktif", count: salesPositions.length },
              { id: "live", label: "🔵 Shareloc Live", count: stores.filter((s) => s.is_tracking_active).length },
              { id: "open", label: "🟢 Buka", count: stores.filter((s) => s.current_status === "open" && !s.is_tracking_active).length },
              { id: "closed", label: "⚪ Tutup/Offline", count: stores.filter((s) => s.current_status === "closed" && !s.is_tracking_active).length },
              { id: "pending", label: "🟡 Pending", count: stores.filter((s) => s.verification_status === "pending").length },
            ] as { id: string; label: string; count?: number }[]
          ).map((btn) => (
            <button
              key={btn.id}
              onClick={() => setFilter(btn.id as typeof filter)}
              className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-all ${
                filter === btn.id
                  ? "bg-navy-900 text-white shadow-sm"
                  : "bg-surface-dim text-navy-600 hover:bg-navy-100"
              }`}
            >
              {btn.label} {btn.count !== undefined ? `(${btn.count})` : ""}
            </button>
          ))}
        </div>
      </div>

      {/* Map Container */}
      <div style={{ height }} className="w-full relative z-10">
        <MapContainer
          center={defaultCenter}
          zoom={12}
          scrollWheelZoom={true}
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* Dynamic Map Focus Controller */}
          <MapFocusController focusTarget={focusedTarget} markersRef={markersRef} />

          {/* Store Markers */}
          {filteredStores.map((store) => {
            const markerIcon = createStatusMarkerIcon(
              store.verification_status === "pending"
                ? "pending"
                : store.current_status,
              store.is_tracking_active
            );

            return (
              <Marker
                key={store.id}
                ref={(ref) => {
                  markersRef.current[store.id] = ref;
                }}
                position={[store.latitude, store.longitude]}
                icon={markerIcon}
              >
                <Popup className="admin-map-popup">
                  <div className="p-1 space-y-2 max-w-xs font-sans text-xs text-navy-900">
                    <div className="flex items-start justify-between gap-2 border-b border-navy-100 pb-1.5">
                      <div>
                        <h4 className="font-bold text-sm leading-snug text-navy-900">
                          {store.store_name}
                        </h4>
                        <p className="text-[11px] text-navy-600 font-medium">
                          PIC: {store.pic_name} ({store.phone_number})
                        </p>
                      </div>
                    </div>

                    <div className="space-y-1 text-[11px]">
                      <div className="flex items-center justify-between">
                        <span className="text-navy-500">Status Toko:</span>
                        <span
                          className={`font-bold ${
                            store.current_status === "open"
                              ? "text-accent-600"
                              : "text-navy-400"
                          }`}
                        >
                          {store.current_status === "open" ? "🟢 Buka" : "🔴 Tutup"}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-navy-500">Shareloc Live:</span>
                        <span
                          className={`font-bold ${
                            store.is_tracking_active
                              ? "text-primary-600 animate-pulse"
                              : "text-navy-400"
                          }`}
                        >
                          {store.is_tracking_active ? "🔵 Aktif (Live)" : "Nonaktif"}
                        </span>
                      </div>

                      {store.last_ping_at && (
                        <div className="flex items-center justify-between">
                          <span className="text-navy-500">Last Ping:</span>
                          <span className="font-mono text-navy-700">
                            {store.last_ping_at}
                          </span>
                        </div>
                      )}

                      <div className="pt-1 text-[10px] text-foreground-muted line-clamp-2">
                        📍 {store.full_address}
                      </div>
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}

          {/* SALES POSITION MARKERS */}
          {showSalesMarkers &&
            salesPositions.map((sp) => (
              <Marker
                key={`sales-${sp.id}`}
                ref={(ref) => {
                  markersRef.current[`sales-${sp.id}`] = ref;
                }}
                position={[sp.latitude, sp.longitude]}
                icon={createSalesMarkerIcon(sp.battery_level)}
              >
                <Popup className="admin-map-popup">
                  <div className="p-2 space-y-2 max-w-[220px] font-sans text-xs">
                    <div className="flex items-center gap-2 border-b border-navy-100 pb-2">
                      <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary-600 to-accent-600 flex items-center justify-center text-white font-bold text-xs shadow-sm">
                        {sp.sales_name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-bold text-navy-900 text-[13px] leading-snug">
                          {sp.sales_name}
                        </p>
                        <span className="inline-flex items-center gap-1 text-[10px] text-primary-600 font-bold">
                          <span className="h-1.5 w-1.5 rounded-full bg-primary-500 animate-pulse" />
                          Sales Aktif
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1.5 text-[11px]">
                      <div className="flex items-center justify-between">
                        <span className="text-navy-500">Ping Terakhir:</span>
                        <span className="font-mono font-bold text-navy-800">
                          {formatTimeAgo(sp.last_ping)}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-navy-500">🔋 Baterai:</span>
                        <span
                          className={`font-bold ${
                            sp.battery_level < 20
                              ? "text-danger-600"
                              : sp.battery_level < 50
                              ? "text-amber-600"
                              : "text-accent-600"
                          }`}
                        >
                          {sp.battery_level}%
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-navy-500">📡 Akurasi GPS:</span>
                        <span className="font-mono text-navy-700">
                          ±{sp.accuracy_m}m
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-navy-500">Status:</span>
                        <span className="font-bold text-accent-600">
                          ✅ {sp.ping_status === "success" ? "Terkoneksi" : "Error"}
                        </span>
                      </div>
                    </div>

                    <div className="pt-1 border-t border-navy-100 text-[10px] text-foreground-muted font-mono">
                      📍 {sp.latitude.toFixed(6)}, {sp.longitude.toFixed(6)}
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}
        </MapContainer>
      </div>
    </div>
  );
}
