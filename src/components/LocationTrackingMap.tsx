"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface LocationTrackingMapProps {
  lat: number;
  lng: number;
  isTracking: boolean;
}

// User Position Marker Icon with pulsing radar animation
function createUserMarkerIcon(isTracking: boolean) {
  const color = isTracking ? "#1b6cf5" : "#64748b";
  return L.divIcon({
    className: "user-location-marker",
    html: `
      <div style="position: relative; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center;">
        ${
          isTracking
            ? `<div style="position: absolute; width: 44px; height: 44px; background: rgba(27, 108, 245, 0.3); border-radius: 50%; animation: pulse-soft 1.5s infinite;"></div>`
            : ""
        }
        <div style="position: relative; width: 22px; height: 22px; background: ${color}; border: 3px solid #ffffff; border-radius: 50%; box-shadow: 0 4px 12px rgba(0,0,0,0.35); display: flex; align-items: center; justify-content: center;">
          <div style="width: 6px; height: 6px; background: #ffffff; border-radius: 50%;"></div>
        </div>
      </div>
    `,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -18],
  });
}

// Auto-Focus & Camera Centering Component
function MapCameraController({
  lat,
  lng,
  isTracking,
  focusTrigger,
}: {
  lat: number;
  lng: number;
  isTracking: boolean;
  focusTrigger: number;
}) {
  const map = useMap();

  useEffect(() => {
    if (lat && lng && !isNaN(lat) && !isNaN(lng)) {
      map.flyTo([lat, lng], 16, {
        animate: true,
        duration: 1.2,
      });
    }
  }, [lat, lng, isTracking, focusTrigger, map]);

  return null;
}

export default function LocationTrackingMap({
  lat,
  lng,
  isTracking,
}: LocationTrackingMapProps) {
  const [focusTrigger, setFocusTrigger] = useState(0);

  const handleRecenter = () => {
    setFocusTrigger((prev) => prev + 1);
  };

  return (
    <div className="relative h-full w-full">
      <MapContainer
        center={[lat, lng]}
        zoom={16}
        scrollWheelZoom={true}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Dynamic Camera Centering Controller */}
        <MapCameraController
          lat={lat}
          lng={lng}
          isTracking={isTracking}
          focusTrigger={focusTrigger}
        />

        {/* Accuracy radius ring */}
        <Circle
          center={[lat, lng]}
          radius={isTracking ? 35 : 50}
          pathOptions={{
            color: isTracking ? "#1b6cf5" : "#94a3b8",
            fillColor: isTracking ? "#1b6cf5" : "#94a3b8",
            fillOpacity: 0.12,
            weight: 1.5,
          }}
        />

        {/* User position marker */}
        <Marker position={[lat, lng]} icon={createUserMarkerIcon(isTracking)}>
          <Popup>
            <div className="text-xs p-1.5 space-y-1 font-sans">
              <div className="flex items-center gap-1.5 font-bold text-navy-900">
                <span className="text-sm">📍</span>
                <span>Posisi Sales Anda</span>
              </div>
              <p className="font-mono text-[11px] text-navy-600">
                {lat.toFixed(6)}, {lng.toFixed(6)}
              </p>
              {isTracking ? (
                <div className="rounded bg-primary-50 px-2 py-0.5 text-[10px] font-bold text-primary-700 border border-primary-200">
                  📡 Shareloc Live Aktif (Auto-Sync)
                </div>
              ) : (
                <div className="text-[10px] text-navy-400">
                  Shareloc Live Nonaktif
                </div>
              )}
            </div>
          </Popup>
        </Marker>
      </MapContainer>

      {/* Floating Recenter Button */}
      <button
        type="button"
        onClick={handleRecenter}
        className="absolute bottom-3 right-3 z-400 flex items-center gap-1.5 rounded-xl bg-white/95 px-3 py-2 text-xs font-bold text-navy-800 shadow-lg border border-navy-200 backdrop-blur-md hover:bg-navy-50 active:scale-95 transition-all"
        title="Fokuskan Kamera ke Posisi Saya"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          className="h-4 w-4 text-primary-600"
        >
          <path
            fillRule="evenodd"
            d="M11.54 22.351.07.04.028.016a.76.76 0 0 0 .723 0l.028-.015.071-.041a16.975 16.975 0 0 0 1.144-.742 19.58 19.58 0 0 0 2.683-2.282c1.944-1.99 3.963-4.98 3.963-8.827a8.25 8.25 0 0 0-16.5 0c0 3.846 2.02 6.837 3.963 8.827a19.58 19.58 0 0 0 3.824 3.024Zm.46-12.6a2.25 2.25 0 1 0 0-4.5 2.25 2.25 0 0 0 0 4.5Z"
            clipRule="evenodd"
          />
        </svg>
        <span>Fokus Lokasi Saya</span>
      </button>
    </div>
  );
}
