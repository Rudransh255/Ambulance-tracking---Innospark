import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix leaflet default icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const ambulanceIcon = (status) =>
  L.divIcon({
    className: 'custom-marker',
    html: `<div style="
      width: 32px; height: 32px; border-radius: 50%;
      background: ${status === 'transporting' ? '#DC2626' : status === 'dispatched' ? '#1044A0' : '#64748B'};
      display: flex; align-items: center; justify-content: center;
      border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      ${status === 'transporting' ? 'animation: pulse-ring 1.5s infinite;' : ''}
    ">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
        <path d="M10 10H6V6h4v4zM14 6v4h4V6h-4z"/><rect x="1" y="3" width="15" height="13" rx="2"/><path d="M16 8h4l3 5v5h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>
      </svg>
    </div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });

const hospitalIcon = L.divIcon({
  className: 'custom-marker',
  html: `<div style="
    width: 28px; height: 28px; border-radius: 50%;
    background: white; display: flex; align-items: center; justify-content: center;
    border: 2px solid #1044A0; box-shadow: 0 2px 6px rgba(0,0,0,0.2);
  ">
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1044A0" stroke-width="2.5">
      <path d="M12 2v20M2 12h20"/>
    </svg>
  </div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

const sosIcon = L.divIcon({
  className: 'custom-marker',
  html: `<div style="
    width: 20px; height: 20px; border-radius: 50%;
    background: #DC2626;
    border: 3px solid white; box-shadow: 0 0 0 3px #DC2626, 0 2px 8px rgba(0,0,0,0.3);
  "></div>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

function FitBounds({ bounds }) {
  const map = useMap();
  useEffect(() => {
    if (bounds && bounds.length > 0) {
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [bounds, map]);
  return null;
}

export default function AmbulanceMap({
  ambulances = [],
  hospitals = [],
  sosLocation = null,
  center = [28.6139, 77.2090],
  zoom = 12,
  className = 'h-[400px]',
  showRoute = false,
  routePoints = [],
}) {
  return (
    <MapContainer center={center} zoom={zoom} className={`${className} rounded-lg z-0`} scrollWheelZoom>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {ambulances.filter((amb) => (amb.lat || amb.current_lat) && (amb.lng || amb.current_lng)).map((amb) => (
        <Marker
          key={amb.id || amb.ambulanceId}
          position={[amb.lat || amb.current_lat, amb.lng || amb.current_lng]}
          icon={ambulanceIcon(amb.status)}
        >
          <Popup>
            <div className="text-sm">
              <p className="font-semibold">{amb.vehicle_number}</p>
              <p className="text-gray-500">Status: {amb.status}</p>
              {amb.speed && <p className="text-gray-500">Speed: {amb.speed} km/h</p>}
            </div>
          </Popup>
        </Marker>
      ))}

      {hospitals.filter((h) => h.lat && h.lng).map((h) => (
        <Marker key={h.id} position={[h.lat, h.lng]} icon={hospitalIcon}>
          <Popup>
            <div className="text-sm">
              <p className="font-semibold">{h.name}</p>
              <p className="text-gray-500">{h.address}</p>
              {h.resources && (
                <div className="mt-1 text-xs">
                  <p>Beds: {h.resources.general_beds_available} | ICU: {h.resources.icu_beds_available}</p>
                  <p>Ventilators: {h.resources.ventilators_available} | O2: {h.resources.o2_tanks_available}</p>
                </div>
              )}
            </div>
          </Popup>
        </Marker>
      ))}

      {sosLocation && sosLocation.lat && sosLocation.lng && (
        <>
          <Marker position={[sosLocation.lat, sosLocation.lng]} icon={sosIcon}>
            <Popup><span className="text-sm font-semibold text-red-600">SOS Location</span></Popup>
          </Marker>
          <Circle
            center={[sosLocation.lat, sosLocation.lng]}
            radius={200}
            pathOptions={{ color: '#DC2626', fillColor: '#DC2626', fillOpacity: 0.1 }}
          />
        </>
      )}

      {showRoute && routePoints.length >= 2 && (
        <Polyline
          positions={routePoints.map((p) => [p.lat, p.lng])}
          pathOptions={{ color: '#1044A0', weight: 4, dashArray: '10, 10' }}
        />
      )}
    </MapContainer>
  );
}
