"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { trackingService, LiveTrackingState } from "@/lib/trackingService";
import { getLocationLogs } from "@/lib/db";
import type { LocationLogRow } from "@/lib/database.types";

// Dynamically import Leaflet Map for location
const LocationMap = dynamic(() => import("@/components/LocationTrackingMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-64 w-full flex-col items-center justify-center rounded-xl border border-navy-200 bg-navy-50 text-navy-400">
      <div className="h-7 w-7 animate-spin rounded-full border-3 border-primary-600 border-t-transparent mb-2" />
      <span className="text-xs font-medium">Memuat Peta...</span>
    </div>
  ),
});

export default function LokasiPage() {
  const [trackingState, setTrackingState] = useState<LiveTrackingState>({
    isActive: false,
    userId: null,
    sessionId: null,
    storeId: null,
    startTime: null,
    lastPingTime: null,
    totalPings: 0,
  });
  const [locationLogs, setLocationLogs] = useState<LocationLogRow[]>([]);
  const [currentPosition, setCurrentPosition] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [isLoadingLogs, setIsLoadingLogs] = useState(true);
  const [timer, setTimer] = useState(0);

  // Subscribe to tracking service
  useEffect(() => {
    const unsub = trackingService.subscribe((state) => {
      setTrackingState(state);
      if (state.startTime) {
        setTimer(Math.floor((Date.now() - state.startTime) / 1000));
      }
    });
    return () => unsub();
  }, []);

  // Timer tick
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (trackingState.isActive && trackingState.startTime) {
      interval = setInterval(() => {
        setTimer(Math.floor((Date.now() - trackingState.startTime!) / 1000));
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [trackingState.isActive, trackingState.startTime]);

  // Get current position and load location logs
  useEffect(() => {
    // Attempt to get current position via browser API
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setCurrentPosition({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          });
        },
        () => {
          // Fallback to Jakarta
          setCurrentPosition({ lat: -6.2088, lng: 106.8456 });
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    } else {
      setCurrentPosition({ lat: -6.2088, lng: 106.8456 });
    }

    // Load location logs
    getLocationLogs()
      .then((logs) => {
        setLocationLogs(logs);
        setIsLoadingLogs(false);
      })
      .catch(() => setIsLoadingLogs(false));
  }, []);

  // Refresh logs periodically if tracking active
  useEffect(() => {
    if (!trackingState.isActive) return;
    const interval = setInterval(() => {
      getLocationLogs().then((logs) => setLocationLogs(logs));
    }, 15000);
    return () => clearInterval(interval);
  }, [trackingState.isActive]);

  const handleToggleTracking = async () => {
    if (!trackingState.isActive) {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition((pos) => {
          setCurrentPosition({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          });
        });
      }
      const { getUserProfile } = await import("@/lib/db");
      const user = await getUserProfile();
      await trackingService.startLiveTracking(undefined, user?.id);
    } else {
      trackingService.stopLiveTracking();
    }
  };

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, "0")}:${mins
      .toString()
      .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const formatTimestamp = (dateStr?: string) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  return (
    <div className="p-4 space-y-4 max-w-lg mx-auto">
      {/* Page Header */}
      <div>
        <h1 className="text-lg font-bold text-navy-900">Lokasi Saya</h1>
        <p className="mt-0.5 text-xs text-foreground-muted">
          Aktifkan Shareloc Live dan pantau posisi Anda secara real-time.
        </p>
      </div>

      {/* Tracking Status Card */}
      <div
        className={`rounded-2xl p-5 shadow-md transition-all ${
          trackingState.isActive
            ? "bg-gradient-to-br from-blue-600 to-blue-800 text-white"
            : "bg-white border border-navy-100 text-navy-900"
        }`}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            {trackingState.isActive && (
              <span className="relative flex h-3 w-3">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white/60" />
                <span className="relative inline-flex h-3 w-3 rounded-full bg-white" />
              </span>
            )}
            <span className="text-sm font-bold">
              {trackingState.isActive ? "📡 Shareloc Live Aktif" : "Shareloc Live"}
            </span>
          </div>
          {trackingState.isActive && trackingState.sessionId && (
            <span className="rounded-full bg-white/20 px-2.5 py-1 text-[10px] font-mono font-bold">
              {trackingState.sessionId}
            </span>
          )}
        </div>

        {/* Timer Display */}
        {trackingState.isActive && (
          <div className="mb-4 text-center">
            <p className="text-3xl font-mono font-bold tracking-wider">
              {formatTime(timer)}
            </p>
            <p className={`text-[10px] mt-1 ${trackingState.isActive ? "text-white/60" : "text-navy-400"}`}>
              Durasi Tracking Berjalan
            </p>
          </div>
        )}

        {/* Stats Row */}
        {trackingState.isActive && (
          <div className="grid grid-cols-3 gap-2 mb-4">
            <div className="rounded-xl bg-white/15 backdrop-blur-sm p-2.5 text-center">
              <p className="text-lg font-bold">{trackingState.totalPings}</p>
              <p className="text-[9px] text-white/70">Ping Terkirim</p>
            </div>
            <div className="rounded-xl bg-white/15 backdrop-blur-sm p-2.5 text-center">
              <p className="text-sm font-bold">
                {trackingState.lastPingTime || "-"}
              </p>
              <p className="text-[9px] text-white/70">Ping Terakhir</p>
            </div>
            <div className="rounded-xl bg-white/15 backdrop-blur-sm p-2.5 text-center">
              <p className="text-sm font-bold">60s</p>
              <p className="text-[9px] text-white/70">Interval</p>
            </div>
          </div>
        )}

        {/* Toggle Button */}
        <button
          onClick={handleToggleTracking}
          className={`w-full rounded-xl py-3 text-sm font-bold shadow-md transition-all active:scale-[0.98] ${
            trackingState.isActive
              ? "bg-white text-red-600 hover:bg-red-50"
              : "bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800"
          }`}
        >
          {trackingState.isActive ? (
            <span className="flex items-center justify-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                <path fillRule="evenodd" d="M2 10a8 8 0 1116 0 8 8 0 01-16 0zm5-2.25A.75.75 0 017.75 7h.5a.75.75 0 01.75.75v4.5a.75.75 0 01-.75.75h-.5a.75.75 0 01-.75-.75v-4.5zm4 0a.75.75 0 01.75-.75h.5a.75.75 0 01.75.75v4.5a.75.75 0 01-.75.75h-.5a.75.75 0 01-.75-.75v-4.5z" clipRule="evenodd" />
              </svg>
              Stop Shareloc Live
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
                <path fillRule="evenodd" d="m11.54 22.351.07.04.028.016a.76.76 0 0 0 .723 0l.028-.015.071-.041a16.975 16.975 0 0 0 1.144-.742 19.58 19.58 0 0 0 2.683-2.282c1.944-1.99 3.963-4.98 3.963-8.827a8.25 8.25 0 0 0-16.5 0c0 3.846 2.02 6.837 3.963 8.827a19.58 19.58 0 0 0 3.824 3.024Zm.46-12.6a2.25 2.25 0 1 0 0-4.5 2.25 2.25 0 0 0 0 4.5Z" clipRule="evenodd" />
              </svg>
              Mulai Shareloc Live
            </span>
          )}
        </button>
      </div>

      {/* Map Section */}
      <div className="rounded-2xl border border-navy-100 bg-white shadow-sm overflow-hidden">
        <div className="flex items-center justify-between border-b border-navy-100 bg-white/90 px-4 py-2.5">
          <div className="flex items-center gap-1.5 text-xs font-bold text-navy-900">
            <span className={`h-2 w-2 rounded-full ${trackingState.isActive ? "bg-blue-500 animate-pulse" : "bg-navy-300"}`} />
            Posisi Saat Ini
          </div>
          {currentPosition && (
            <span className="text-[10px] font-mono text-navy-500">
              {currentPosition.lat.toFixed(5)}, {currentPosition.lng.toFixed(5)}
            </span>
          )}
        </div>
        <div className="h-56">
          <LocationMap
            lat={currentPosition?.lat || -6.2088}
            lng={currentPosition?.lng || 106.8456}
            isTracking={trackingState.isActive}
          />
        </div>
      </div>

      {/* Location Ping History */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-semibold text-navy-700">
            Riwayat Ping Lokasi
          </h2>
          <span className="text-[10px] text-navy-400">
            {locationLogs.length} record
          </span>
        </div>

        {isLoadingLogs ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-xl border border-navy-100 bg-white p-3 flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-navy-100 animate-pulse" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 w-32 rounded bg-navy-100 animate-pulse" />
                  <div className="h-2 w-20 rounded bg-navy-50 animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        ) : locationLogs.length === 0 ? (
          <div className="rounded-xl border border-dashed border-navy-200 bg-white p-6 text-center">
            <p className="text-xs text-navy-400">
              Belum ada riwayat ping lokasi.
            </p>
            <p className="text-[10px] text-navy-300 mt-1">
              Aktifkan Shareloc Live untuk memulai.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {locationLogs.slice(0, 10).map((log, idx) => (
              <div
                key={log.id}
                className="flex items-center gap-3 rounded-xl border border-navy-100 bg-white p-3 text-xs"
              >
                <div
                  className={`h-8 w-8 rounded-full flex items-center justify-center text-white text-[10px] font-bold ${
                    log.ping_status === "success"
                      ? "bg-accent-500"
                      : log.ping_status === "gps_denied"
                      ? "bg-warning-500"
                      : "bg-danger-500"
                  }`}
                >
                  {idx + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-mono text-navy-800 text-[11px]">
                    {log.latitude.toFixed(6)}, {log.longitude.toFixed(6)}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5 text-[10px] text-navy-400">
                    <span>{formatTimestamp(log.created_at)}</span>
                    {log.accuracy_m && (
                      <span>±{Math.round(log.accuracy_m)}m</span>
                    )}
                    {log.battery_level && (
                      <span className="flex items-center gap-0.5">
                        🔋 {log.battery_level}%
                      </span>
                    )}
                  </div>
                </div>
                <span
                  className={`rounded-full px-2 py-0.5 text-[9px] font-bold ${
                    log.ping_status === "success"
                      ? "bg-accent-50 text-accent-700"
                      : "bg-warning-50 text-warning-700"
                  }`}
                >
                  {log.ping_status === "success" ? "OK" : "WARN"}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
