"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix Leaflet default icon issues in Next.js bundler with modern custom SVG pin
const customMarkerIcon = L.divIcon({
  className: "custom-leaflet-marker",
  html: `
    <div style="position: relative; width: 36px; height: 36px; display: flex; items-center: center; justify-content: center;">
      <div style="position: absolute; width: 36px; height: 36px; background: rgba(27, 108, 245, 0.25); border-radius: 50%; animation: pulse-soft 2s infinite;"></div>
      <div style="position: relative; width: 28px; height: 28px; background: #1b6cf5; border: 3px solid #ffffff; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); box-shadow: 0 4px 10px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center;">
        <div style="width: 8px; height: 8px; background: #ffffff; border-radius: 50%;"></div>
      </div>
    </div>
  `,
  iconSize: [36, 36],
  iconAnchor: [18, 36],
  popupAnchor: [0, -36],
});

interface LocationMarkerProps {
  position: [number, number] | null;
  onPositionChange: (lat: number, lng: number) => void;
}

// Component to handle map clicks and marker updates
function LocationMarker({ position, onPositionChange }: LocationMarkerProps) {
  const map = useMap();

  // Fly to location when position changes
  useEffect(() => {
    if (position) {
      map.flyTo(position, 16, { duration: 1.2 });
    }
  }, [position, map]);

  useMapEvents({
    click(e) {
      onPositionChange(e.latlng.lat, e.latlng.lng);
    },
  });

  if (!position) return null;

  return (
    <Marker
      position={position}
      icon={customMarkerIcon}
      draggable={true}
      eventHandlers={{
        dragend(e) {
          const marker = e.target;
          const pos = marker.getLatLng();
          onPositionChange(pos.lat, pos.lng);
        },
      }}
    />
  );
}

interface StoreLocationMapProps {
  lat: number | null;
  lng: number | null;
  onLocationSelect: (lat: number, lng: number, source: "manual") => void;
  accuracy?: number | null;
}

export default function StoreLocationMap({
  lat,
  lng,
  onLocationSelect,
  accuracy,
}: StoreLocationMapProps) {
  // Default coordinates (Jakarta CBD center fallback if no coords specified)
  const defaultLat = -6.2088;
  const defaultLng = 106.8456;

  const currentPos: [number, number] | null =
    lat !== null && lng !== null ? [lat, lng] : null;

  const centerPos: [number, number] = currentPos || [defaultLat, defaultLng];

  return (
    <div className="relative w-full overflow-hidden rounded-xl border border-navy-200 shadow-inner">
      <div className="h-64 w-full">
        <MapContainer
          center={centerPos}
          zoom={currentPos ? 16 : 12}
          scrollWheelZoom={true}
          style={{ height: "100%", width: "100%", zIndex: 10 }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <LocationMarker
            position={currentPos}
            onPositionChange={(newLat, newLng) => {
              onLocationSelect(newLat, newLng, "manual");
            }}
          />
        </MapContainer>
      </div>

      {/* Map Overlay Helper Banner */}
      <div className="absolute top-2 left-2 right-2 z-20 flex items-center justify-between rounded-lg bg-navy-950/80 backdrop-blur-md px-3 py-1.5 text-xs text-white shadow-md">
        <span className="flex items-center gap-1.5 font-medium">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="h-4 w-4 text-accent-400"
          >
            <path
              fillRule="evenodd"
              d="M9.69 18.933l.003.001C9.89 19.02 10 19 10 19s.11.02.307-.066l.003-.001.006-.003.018-.008a5.741 5.741 0 00.281-.14c.186-.096.446-.24.757-.433.62-.384 1.445-.966 2.274-1.765C15.302 14.988 17 12.493 17 9A7 7 0 103 9c0 3.492 1.698 5.988 3.355 7.584a13.731 13.731 0 003.03 2.198l.018.008.006.003zM10 11.25a2.25 2.25 0 100-4.5 2.25 2.25 0 000 4.5z"
              clipRule="evenodd"
            />
          </svg>
          {currentPos
            ? "Geser marker atau ketuk peta untuk koreksi titik"
            : "Ketuk peta untuk menandai titik lokasi toko"}
        </span>
        {accuracy && (
          <span className="rounded bg-accent-500/20 px-1.5 py-0.5 text-[10px] text-accent-300 font-mono">
            ±{Math.round(accuracy)}m
          </span>
        )}
      </div>
    </div>
  );
}
