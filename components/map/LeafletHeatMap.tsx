'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

export interface HeatZone {
  id: string; nombre: string; ciudad: string;
  lat: number; lng: number; intensidad: number;
  comparendos: number; agentes: number; dispositivos: number;
  top: string; tendencia: 'subiendo' | 'estable';
}

export interface AgentPoint {
  id: string; nombre: string; ciudad: string;
  lat: number; lng: number; escaneosDia: number;
}

function heatColor(i: number) {
  if (i > 0.85) return '#ef4444';
  if (i > 0.65) return '#f97316';
  if (i > 0.45) return '#eab308';
  return '#22c55e';
}

let cssInjected = false;
function injectCSS() {
  if (cssInjected || typeof document === 'undefined') return;
  cssInjected = true;
  const style = document.createElement('style');
  style.textContent = `
    @keyframes heatPulse {
      0%   { transform: scale(1);   opacity: 0.75; }
      60%  { transform: scale(2.6); opacity: 0; }
      100% { transform: scale(1);   opacity: 0; }
    }
    @keyframes heatPulse2 {
      0%   { transform: scale(1);   opacity: 0.5; }
      60%  { transform: scale(2.0); opacity: 0; }
      100% { transform: scale(1);   opacity: 0; }
    }
    .hm-wrap { position: relative; display: flex; align-items: center; justify-content: center; }
    .hm-ring1 { position: absolute; border-radius: 50%; animation: heatPulse 1.8s ease-out infinite; }
    .hm-ring2 { position: absolute; border-radius: 50%; animation: heatPulse2 1.8s ease-out infinite; animation-delay: 0.6s; }
    .hm-core  { position: relative; border-radius: 50%; z-index: 2; }
    .hm-badge {
      position: absolute; bottom: calc(100% + 3px); left: 50%; transform: translateX(-50%);
      background: rgba(10,22,40,0.95); color: #e2e8f0; font-size: 10px; font-family: Inter, sans-serif;
      white-space: nowrap; padding: 2px 6px; border-radius: 4px;
      pointer-events: none; z-index: 3; border: 1px solid var(--hc);
    }
    .hm-badge strong { color: var(--hc); }
    .leaflet-tooltip.heat-tip {
      background: rgba(10,22,40,0.95) !important; border: 1px solid #1E3A55 !important;
      color: #e2e8f0 !important; border-radius: 8px !important;
      font-family: Inter, sans-serif !important; padding: 8px 12px !important;
      font-size: 11px !important; box-shadow: 0 4px 20px rgba(0,0,0,0.5) !important;
    }
    .leaflet-tooltip.heat-tip::before { display: none !important; }
    .leaflet-tooltip.agent-tip {
      background: rgba(10,22,40,0.92) !important; border: 1px solid #1E3A55 !important;
      color: #e2e8f0 !important; border-radius: 6px !important;
      font-family: Inter, sans-serif !important; padding: 5px 9px !important;
      font-size: 10px !important; box-shadow: 0 2px 10px rgba(0,0,0,0.4) !important;
    }
    .leaflet-tooltip.agent-tip::before { display: none !important; }
  `;
  document.head.appendChild(style);
}

function centerOf(zonas: HeatZone[]): [number, number] {
  if (zonas.length === 0) return [4.711, -74.0721];
  const lats = zonas.map(z => z.lat);
  const lngs = zonas.map(z => z.lng);
  return [(Math.min(...lats) + Math.max(...lats)) / 2, (Math.min(...lngs) + Math.max(...lngs)) / 2];
}

function zoomFor(zonas: HeatZone[]): number {
  if (zonas.length === 0) return 12;
  const ciudades = new Set(zonas.map(z => z.ciudad));
  return ciudades.size > 1 ? 6 : 12;
}

export default function LeafletHeatMap({ zonas, selectedId, onSelect, agentes = [], showTraffic = false }: {
  zonas: HeatZone[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  agentes?: AgentPoint[];
  showTraffic?: boolean;
}) {
  const divRef   = useRef<HTMLDivElement>(null);
  const mapRef   = useRef<L.Map | null>(null);
  const markRef  = useRef<L.Marker[]>([]);
  const agentRef = useRef<L.CircleMarker[]>([]);

  // Inicializar mapa una sola vez
  useEffect(() => {
    if (!divRef.current || mapRef.current) return;
    injectCSS();
    const center = centerOf(zonas);
    const zoom   = zoomFor(zonas);
    const map = L.map(divRef.current, { center, zoom, zoomControl: true, scrollWheelZoom: true });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);

    const ttKey = process.env.NEXT_PUBLIC_TOMTOM_KEY;
    const trafficLayer = L.tileLayer(
      `https://api.tomtom.com/traffic/map/4/tile/flow/relative0/{z}/{x}/{y}.png?key=${ttKey}`,
      { opacity: 0.7, maxZoom: 19, zIndex: 10 }
    );
    (map as L.Map & { _traffic?: L.TileLayer })._traffic = trafficLayer;
    mapRef.current = map;
    return () => { map.remove(); mapRef.current = null; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Dibujar agentes como puntos pequeños
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    agentRef.current.forEach(m => m.remove());
    agentRef.current = [];
    agentes.forEach(a => {
      const cm = L.circleMarker([a.lat, a.lng], {
        radius: 4,
        fillColor: '#00B4D8',
        fillOpacity: 0.85,
        color: '#0e7490',
        weight: 1,
      }).addTo(map);
      cm.bindTooltip(
        `<div><strong style="color:#00B4D8">${a.nombre}</strong><br/><span style="color:#94a3b8">${a.ciudad}</span><br/>📡 ${a.escaneosDia.toLocaleString()} esc/día</div>`,
        { className: 'agent-tip', direction: 'top', permanent: false }
      );
      agentRef.current.push(cm);
    });
  }, [agentes]);

  // Dibujar zonas calientes
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    injectCSS();
    markRef.current.forEach(m => m.remove());
    markRef.current = [];
    zonas.forEach(z => {
      const color = heatColor(z.intensidad);
      const pct   = Math.round(z.intensidad * 100);
      const core  = Math.round(10 + z.intensidad * 20);
      const wrap  = core * 3;
      const ring2 = Math.round(wrap * 0.72);
      const isSel = z.id === selectedId;
      const html = `<div class="hm-wrap" style="width:${wrap}px;height:${wrap}px;--hc:${color}">
        <div class="hm-ring1" style="width:${wrap}px;height:${wrap}px;background:${color}${isSel?'60':'40'};"></div>
        <div class="hm-ring2" style="width:${ring2}px;height:${ring2}px;background:${color}${isSel?'70':'50'};"></div>
        <div class="hm-core"  style="width:${core}px;height:${core}px;background:${color};box-shadow:0 0 ${isSel?16:8}px ${isSel?5:2}px ${color}80;"></div>
        <div class="hm-badge" style="--hc:${color}"><strong>${pct}%</strong> · ${z.comparendos}</div>
      </div>`;
      const icon = L.divIcon({ html, className: '', iconSize: [wrap, wrap], iconAnchor: [wrap/2, wrap/2+12] });
      const marker = L.marker([z.lat, z.lng], { icon, zIndexOffset: isSel ? 2000 : 1000 })
        .addTo(map).on('click', () => onSelect(z.id));
      const tendArrow = z.tendencia === 'subiendo' ? '↑ Subiendo' : '→ Estable';
      marker.bindTooltip(`<div style="min-width:170px">
        <div style="font-weight:700;color:${color};margin-bottom:4px;font-size:12px">${z.nombre}</div>
        <div style="color:#94a3b8;margin-bottom:6px">${z.ciudad} · ${tendArrow}</div>
        <div style="display:grid;gap:3px">
          <div>🔥 Intensidad: <strong style="color:${color}">${pct}%</strong></div>
          <div>📋 Comparendos: <strong>${z.comparendos}</strong></div>
          <div>👮 Agentes: <strong>${z.agentes}</strong> · 📡 Dispositivos: <strong>${z.dispositivos}</strong></div>
          <div style="color:#64748b;margin-top:2px">Top infracción: ${z.top}</div>
        </div></div>`,
        { className: 'heat-tip', direction: 'top', permanent: false, offset: [0, -wrap/2-6] });
      markRef.current.push(marker);
    });
  }, [zonas, selectedId, onSelect]);

  // Volar al seleccionado
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !selectedId) return;
    const zona = zonas.find(z => z.id === selectedId);
    if (zona) map.flyTo([zona.lat, zona.lng], 14, { duration: 1.1 });
  }, [selectedId, zonas]);

    useEffect(() => {
    const map = mapRef.current as (L.Map & { _traffic?: L.TileLayer }) | null;
    if (!map?._traffic) return;
    if (showTraffic) map._traffic.addTo(map);
    else map._traffic.remove();
  }, [showTraffic]);
  
  return <div ref={divRef} style={{ height: '100%', width: '100%', background: '#0A1628' }} />;
}