'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import type { Ciudad } from '@/lib/mock-data';
import { CIUDAD_CONFIG, CIUDADES, METRICS_POR_CIUDAD, formatNum } from '@/lib/mock-data';

const NACIONAL_VIEW = { lat: 4.5, lng: -74.2, zoom: 6 };

const CIUDAD_MARKERS: Record<Ciudad, { lat: number; lng: number }> = {
  Bogotá:       { lat: 4.6097,  lng: -74.0817 },
  Cali:         { lat: 3.4516,  lng: -76.5319 },
  Medellín:     { lat: 6.2442,  lng: -75.5812 },
  Barranquilla: { lat: 10.9685, lng: -74.7813 },
};

export default function DashboardMiniMap() {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<import('leaflet').Map | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (!mapRef.current) return;
    let cancelled = false;

    import('leaflet').then((L) => {
      if (cancelled || !mapRef.current) return;

      // Si ya hay instancia previa (StrictMode), destruirla primero
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
      });

      try {
        mapInstance.current = L.map(mapRef.current, {
          center: [NACIONAL_VIEW.lat, NACIONAL_VIEW.lng],
          zoom: NACIONAL_VIEW.zoom,
          zoomControl: false,
          attributionControl: true,
          dragging: true,
          scrollWheelZoom: false,
          doubleClickZoom: false,
        });
      } catch {
        return; // div ya inicializado — el cleanup del ciclo anterior lo manejará
      }

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        subdomains: ['a', 'b', 'c'],
        attribution: '© <a href="https://openstreetmap.org">OpenStreetMap</a>',
      }).addTo(mapInstance.current);

      const markersLayer = L.layerGroup().addTo(mapInstance.current);

      CIUDADES.forEach((ciudad) => {
        const cfg = CIUDAD_CONFIG[ciudad];
        const metrics = METRICS_POR_CIUDAD[ciudad];
        const center = CIUDAD_MARKERS[ciudad];

        const circle = L.circleMarker([center.lat, center.lng], {
          radius: 22,
          fillColor: cfg.color,
          color: '#ffffff',
          weight: 2,
          opacity: 0.7,
          fillOpacity: 0.4,
        });

        circle.bindTooltip(
          `<div style="background:#0D1B2A;border:2px solid ${cfg.color};border-radius:10px;padding:10px 14px;min-width:170px;font-family:Inter,sans-serif;box-shadow:0 4px 20px rgba(0,0,0,0.6)">
            <div style="color:${cfg.color};font-weight:700;font-size:13px;margin-bottom:6px">📍 ${ciudad}</div>
            <div style="color:#94A3B8;font-size:11px;line-height:1.8">
              Dispositivos activos: <span style="color:#22C55E;font-weight:700">${metrics.dispositivosActivos}</span><br/>
              Escaneos/día: <span style="color:#E87C2B;font-weight:600">${formatNum(metrics.escaneosDia)}</span><br/>
              Eficiencia: <span style="color:#A78BFA;font-weight:600">${metrics.eficiencia}%</span>
            </div>
            <div style="color:${cfg.color};font-size:10px;margin-top:6px;font-style:italic">🖱️ Clic → Mapa Operacional</div>
          </div>`,
          { permanent: false, direction: 'top', offset: [0, -12], opacity: 1 }
        );

        circle.on('click', () => router.push('/map'));
        circle.addTo(markersLayer);

        const label = L.divIcon({
          html: `<div style="color:#ffffff;font-size:10px;font-family:Inter,sans-serif;font-weight:700;white-space:nowrap;text-shadow:0 1px 4px #000,0 0 8px ${cfg.color}">${ciudad}</div>`,
          className: '',
          iconAnchor: [22, -6],
        });
        L.marker([center.lat, center.lng], { icon: label, interactive: false }).addTo(markersLayer);
      });
    });

    return () => {
      cancelled = true;
      mapInstance.current?.remove();
      mapInstance.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <style>{`
        .haix-mini-map .leaflet-control-attribution {
          background: rgba(10,22,40,0.85) !important;
          color: #374151 !important;
          font-size: 9px !important;
          border-radius: 4px !important;
        }
        .haix-mini-map .leaflet-control-attribution a { color: #4B5563 !important; }
        .haix-mini-map .leaflet-tooltip {
          background: transparent !important;
          border: none !important;
          box-shadow: none !important;
          padding: 0 !important;
        }
        .haix-mini-map .leaflet-container { cursor: pointer !important; }
      `}</style>
      <div className="haix-mini-map" ref={mapRef} style={{ width: '100%', height: '100%', borderRadius: 10 }} />
    </>
  );
}
