'use client';

import { useEffect, useRef } from 'react';
import type { MapPoint, Ciudad } from '@/lib/mock-data';
import { CIUDAD_CONFIG, CIUDADES, METRICS_POR_CIUDAD, formatNum } from '@/lib/mock-data';
import { useAppStore } from '@/store/useAppStore';

const CIUDAD_VIEW: Record<Ciudad, { lat: number; lng: number; zoom: number }> = {
  Bogotá:       { lat: 4.6097,  lng: -74.0817, zoom: 12 },
  Cali:         { lat: 3.4516,  lng: -76.5319, zoom: 13 },
  Medellín:     { lat: 6.2442,  lng: -75.5812, zoom: 13 },
  Barranquilla: { lat: 10.9685, lng: -74.7813, zoom: 13 },
};

const NACIONAL_VIEW = { lat: 4.5, lng: -74.2, zoom: 6 };

const CIUDAD_MARKERS: Record<Ciudad, { lat: number; lng: number }> = {
  Bogotá:       { lat: 4.6097,  lng: -74.0817 },
  Cali:         { lat: 3.4516,  lng: -76.5319 },
  Medellín:     { lat: 6.2442,  lng: -75.5812 },
  Barranquilla: { lat: 10.9685, lng: -74.7813 },
};

// Barrios simulados por ciudad para dirección realista
const BARRIOS: Record<Ciudad, string[]> = {
  Bogotá: [
    'Cra 7 #45-12, Chapinero', 'Av. 68 #23-40, Kennedy', 'Cra 30 #53-10, Teusaquillo',
    'Cll 100 #15-32, Usaquén', 'Av. NQS #38-50, Puente Aranda', 'Cra 13 #60-20, Barrios Unidos',
    'Cll 80 #78-15, Engativá', 'Av. Suba #115-25, Suba', 'Cra 50 #12-8, Antonio Nariño',
    'Cll 26 #35-60, La Candelaria',
  ],
  Cali: [
    'Cra 5 #15-30, El Centro', 'Av. Roosevelt #34-12, San Fernando', 'Cll 5 #44-20, Univalle',
    'Av. 3N #24-10, Granada', 'Cra 1 #70-5, El Peñón', 'Cll 70 #2-15, Ciudad Jardín',
    'Av. 6N #38-40, Versalles', 'Cra 100 #16-50, Pance', 'Cll 44 #3-20, Aguablanca',
    'Av. Colombia #2-10, San Bosco',
  ],
  Medellín: [
    'Cra 43A #18-12, El Poblado', 'Av. El Poblado #10-40, Laureles', 'Cll 33 #76-20, Estadio',
    'Cra 65 #44-10, Belén', 'Av. Las Vegas #52-30, Envigado', 'Cll 10 #43-50, La América',
    'Cra 70 #30-15, Robledo', 'Av. 33 #82-40, Castilla', 'Cll 50 #46-25, Manrique',
    'Cra 80 #12-60, Aranjuez',
  ],
  Barranquilla: [
    'Cra 43 #72-30, El Prado', 'Cll 72 #57-10, Altamira', 'Av. Murillo #34-20, El Centro',
    'Cra 50 #82-15, Ciudad Jardín', 'Cll 98 #70-40, Las Delicias', 'Av. Olaya #45-30, Boston',
    'Cra 38 #66-25, El Golf', 'Cll 84 #44-10, Modelo', 'Av. Circunvalar #75-50, Manga',
    'Cra 46 #55-20, Riomar',
  ],
};

// Seed reproducible para asignar barrio a cada agente
function getBarrio(ciudad: Ciudad, id: string): string {
  const list = BARRIOS[ciudad];
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) & 0xffff;
  return list[hash % list.length];
}

interface Props {
  points: MapPoint[];
  onCiudadClick?: (ciudad: Ciudad) => void;
  showTraffic?: boolean;
}

export default function LeafletMap({ points, onCiudadClick, showTraffic = false }: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<import('leaflet').Map | null>(null);
  const markersLayer = useRef<import('leaflet').LayerGroup | null>(null);
  const { filtroCiudad, setFiltroCiudad } = useAppStore();

  useEffect(() => {
    if (!mapRef.current) return;

    import('leaflet').then((L) => {
      // Fix icon paths para Next.js
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
      });

      // Crear mapa solo una vez
      if (!mapInstance.current) {
        const isNac = filtroCiudad === 'Todas';
        const view = isNac ? NACIONAL_VIEW : CIUDAD_VIEW[filtroCiudad as Ciudad];

        mapInstance.current = L.map(mapRef.current!, {
          center: [view.lat, view.lng],
          zoom: view.zoom,
          zoomControl: true,
          attributionControl: true,
        });

        // OpenStreetMap — sin API key, gratuito
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          subdomains: ['a', 'b', 'c'],
          attribution: '© <a href="https://openstreetmap.org">OpenStreetMap</a>',
        }).addTo(mapInstance.current);

        markersLayer.current = L.layerGroup().addTo(mapInstance.current);

        const ttKey = process.env.NEXT_PUBLIC_TOMTOM_KEY;
        const trafficLayer = L.tileLayer(
          `https://api.tomtom.com/traffic/map/4/tile/flow/relative0/{z}/{x}/{y}.png?key=${ttKey}`,
          { opacity: 0.7, maxZoom: 19, zIndex: 10 }
        );
        (mapInstance.current as L.Map & { _traffic?: L.TileLayer })._traffic = trafficLayer;
      }

      // Asegurar capa de tráfico siempre referenciada
      if (!(mapInstance.current as L.Map & { _traffic?: L.TileLayer })._traffic) {
        const ttKey2 = process.env.NEXT_PUBLIC_TOMTOM_KEY;
        const tl = L.tileLayer(
          `https://api.tomtom.com/traffic/map/4/tile/flow/relative0/{z}/{x}/{y}.png?key=${ttKey2}`,
          { opacity: 0.7, maxZoom: 19, zIndex: 10 }
        );
        (mapInstance.current as L.Map & { _traffic?: L.TileLayer })._traffic = tl;
      }

      markersLayer.current?.clearLayers();

      const map = mapInstance.current;
      const isNacional = filtroCiudad === 'Todas';

      if (isNacional) {
        map.setView([NACIONAL_VIEW.lat, NACIONAL_VIEW.lng], NACIONAL_VIEW.zoom, { animate: true });

        CIUDADES.forEach((ciudad) => {
          const cfg = CIUDAD_CONFIG[ciudad];
          const metrics = METRICS_POR_CIUDAD[ciudad];
          const center = CIUDAD_MARKERS[ciudad];

          const circle = L.circleMarker([center.lat, center.lng], {
            radius: 26,
            fillColor: cfg.color,
            color: '#ffffff',
            weight: 2,
            opacity: 0.7,
            fillOpacity: 0.45,
          });

          circle.bindTooltip(
            `<div style="background:#0D1B2A;border:2px solid ${cfg.color};border-radius:10px;padding:12px 16px;min-width:180px;font-family:Inter,sans-serif;box-shadow:0 4px 20px rgba(0,0,0,0.6)">
              <div style="color:${cfg.color};font-weight:700;font-size:14px;margin-bottom:8px">📍 ${ciudad}</div>
              <div style="color:#94A3B8;font-size:11px;line-height:1.8">
                Agentes activos: <span style="color:#22C55E;font-weight:700">${metrics.agentesActivos}</span><br/>
                Total agentes: <span style="color:#E2E8F0;font-weight:600">${metrics.agentes}</span><br/>
                Escaneos/día: <span style="color:#E87C2B;font-weight:600">${formatNum(metrics.escaneosDia)}</span><br/>
                Eficiencia: <span style="color:#A78BFA;font-weight:600">${metrics.eficiencia}%</span>
              </div>
              <div style="color:${cfg.color};font-size:10px;margin-top:8px;font-style:italic">🖱️ Clic para ver ciudad →</div>
            </div>`,
            { permanent: false, direction: 'top', offset: [0, -14], opacity: 1 }
          );

          circle.on('click', () => {
            setFiltroCiudad(ciudad);
            onCiudadClick?.(ciudad);
          });

          circle.addTo(markersLayer.current!);

          // Label flotante con nombre
          const label = L.divIcon({
            html: `<div style="color:#ffffff;font-size:11px;font-family:Inter,sans-serif;font-weight:700;white-space:nowrap;text-shadow:0 1px 4px #000,0 0 8px ${cfg.color}">${ciudad}</div>`,
            className: '',
            iconAnchor: [24, -8],
          });
          L.marker([center.lat, center.lng], { icon: label, interactive: false }).addTo(markersLayer.current!);
        });

      } else {
        const ciudad = filtroCiudad as Ciudad;
        const view = CIUDAD_VIEW[ciudad];
        const cfg = CIUDAD_CONFIG[ciudad];

        map.setView([view.lat, view.lng], view.zoom, { animate: true });

        points.forEach((p) => {
          const dot = L.circleMarker([p.lat, p.lng], {
            radius: 7,
            fillColor: cfg.color,
            color: '#0D1B2A',
            weight: 1.5,
            opacity: 1,
            fillOpacity: 0.9,
          });

          const direccion = getBarrio(p.ciudad, p.id);
          const coordStr = `${p.lat.toFixed(5)}, ${p.lng.toFixed(5)}`;

          // Popup inicial con dirección simulada
          const popupContent = `
            <div style="background:#0D1B2A;border:2px solid ${cfg.color};border-radius:12px;padding:14px 16px;min-width:230px;font-family:Inter,sans-serif">
              <div style="color:${cfg.color};font-weight:700;font-size:13px;margin-bottom:10px;display:flex;align-items:center;gap:6px">
                <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#22C55E;box-shadow:0 0 6px #22C55E"></span>
                ${p.nombre.split(' ').slice(0, 3).join(' ')}
              </div>
              <div style="display:grid;gap:5px">
                <div style="color:#64748B;font-size:10px;text-transform:uppercase;letter-spacing:.5px;margin-bottom:2px">Identificación</div>
                <div style="color:#94A3B8;font-size:11px">ID: <span style="color:#00B4D8;font-family:monospace;font-weight:600">${p.id}</span></div>
                <div style="color:#94A3B8;font-size:11px">Ciudad: <span style="color:#E2E8F0">${p.ciudad}</span></div>
                <div style="color:#94A3B8;font-size:11px">Estado: <span style="color:#22C55E;font-weight:700">● Activo</span></div>

                <div style="border-top:1px solid #1E3A55;margin:4px 0"></div>
                <div style="color:#64748B;font-size:10px;text-transform:uppercase;letter-spacing:.5px;margin-bottom:2px">Operativo</div>
                <div style="color:#94A3B8;font-size:11px">Escaneos hoy: <span style="color:#E87C2B;font-weight:700;font-size:14px">${formatNum(p.escaneosDia)}</span></div>

                <div style="border-top:1px solid #1E3A55;margin:4px 0"></div>
                <div style="color:#64748B;font-size:10px;text-transform:uppercase;letter-spacing:.5px;margin-bottom:2px">Ubicación</div>
                <div style="color:#94A3B8;font-size:11px">📍 ${direccion}</div>
                <div style="color:#374151;font-size:10px;font-family:monospace">${coordStr}</div>
              </div>
            </div>`;

          dot.bindPopup(popupContent, { maxWidth: 260, className: 'haix-popup' });
          dot.addTo(markersLayer.current!);
        });
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtroCiudad, points]);

  // Toggle tráfico
  useEffect(() => {
    const map = mapInstance.current as (L.Map & { _traffic?: L.TileLayer }) | null;
    if (!map?._traffic) return;
    if (showTraffic) map._traffic.addTo(map);
    else map._traffic.remove();
  }, [showTraffic]);

  // Cleanup
  useEffect(() => {
    return () => {
      mapInstance.current?.remove();
      mapInstance.current = null;
    };
  }, []);

  return (
    <>
      <style>{`
        .haix-popup .leaflet-popup-content-wrapper {
          background: transparent !important;
          border: none !important;
          border-radius: 12px !important;
          padding: 0 !important;
          box-shadow: 0 8px 32px rgba(0,0,0,0.7) !important;
        }
        .haix-popup .leaflet-popup-tip-container { display: none; }
        .haix-popup .leaflet-popup-content { margin: 0 !important; }
        .leaflet-tooltip {
          background: transparent !important;
          border: none !important;
          box-shadow: none !important;
          padding: 0 !important;
        }
        .leaflet-control-zoom {
          border: 1px solid #1E3A55 !important;
          border-radius: 8px !important;
          overflow: hidden;
        }
        .leaflet-control-zoom a {
          background: #0D1B2A !important;
          color: #00B4D8 !important;
          border-color: #1E3A55 !important;
          font-size: 16px !important;
        }
        .leaflet-control-zoom a:hover { background: #112236 !important; }
        .leaflet-control-attribution {
          background: rgba(10,22,40,0.85) !important;
          color: #374151 !important;
          font-size: 9px !important;
          border-radius: 4px !important;
        }
        .leaflet-control-attribution a { color: #4B5563 !important; }
      `}</style>
      <div ref={mapRef} style={{ width: '100%', height: '100%', borderRadius: 12 }} />
    </>
  );
}
