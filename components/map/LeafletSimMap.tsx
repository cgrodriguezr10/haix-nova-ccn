'use client';

import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { FiltroCiudad } from '@/lib/mock-data';
import { MAP_POINTS } from '@/lib/mock-data';

export interface HeatZone {
  id: string; nombre: string; ciudad: string;
  lat: number; lng: number; intensidad: number;
  comparendos: number; tendencia: 'subiendo' | 'estable';
}

const ZONAS_SIM: HeatZone[] = [
  { id:'z1',  nombre:'Av. El Dorado',       ciudad:'Bogotá',      lat:4.6565,  lng:-74.1058, intensidad:0.92, comparendos:187, tendencia:'subiendo' },
  { id:'z2',  nombre:'Calle 100 / Autopista',ciudad:'Bogotá',     lat:4.6890,  lng:-74.0520, intensidad:0.78, comparendos:143, tendencia:'subiendo' },
  { id:'z3',  nombre:'Zona Rosa / T-93',    ciudad:'Bogotá',      lat:4.6679,  lng:-74.0526, intensidad:0.61, comparendos: 98, tendencia:'estable'  },
  { id:'z4',  nombre:'Av. 68 sur',          ciudad:'Bogotá',      lat:4.5950,  lng:-74.1200, intensidad:0.45, comparendos: 72, tendencia:'estable'  },
  { id:'z5',  nombre:'El Poblado',          ciudad:'Medellín',    lat:6.2087,  lng:-75.5679, intensidad:0.88, comparendos:165, tendencia:'subiendo' },
  { id:'z6',  nombre:'Laureles',            ciudad:'Medellín',    lat:6.2442,  lng:-75.5902, intensidad:0.55, comparendos: 84, tendencia:'estable'  },
  { id:'z7',  nombre:'Av. Américas',        ciudad:'Cali',        lat:3.4516,  lng:-76.5320, intensidad:0.73, comparendos:121, tendencia:'subiendo' },
  { id:'z8',  nombre:'Granada',             ciudad:'Cali',        lat:3.4678,  lng:-76.5289, intensidad:0.49, comparendos: 67, tendencia:'estable'  },
  { id:'z9',  nombre:'Murillo / Vía 40',    ciudad:'Barranquilla',lat:10.9878, lng:-74.7889, intensidad:0.82, comparendos:154, tendencia:'subiendo' },
  { id:'z10', nombre:'El Prado',            ciudad:'Barranquilla',lat:10.9990, lng:-74.8120, intensidad:0.58, comparendos: 91, tendencia:'estable'  },
];

const CIUDAD_CENTER: Record<string, [number, number]> = {
  Bogotá:[4.6549,-74.0628], Medellín:[6.2442,-75.5812],
  Cali:[3.4516,-76.5320], Barranquilla:[10.9878,-74.7889], Todas:[5.5,-74.0],
};
const CIUDAD_ZOOM: Record<string, number> = {
  Bogotá:12, Medellín:12, Cali:12, Barranquilla:12, Todas:6,
};

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
  const s = document.createElement('style');
  s.textContent = `
    @keyframes simPulse  { 0%{transform:scale(1);opacity:.75} 60%{transform:scale(2.6);opacity:0} 100%{transform:scale(1);opacity:0} }
    @keyframes simPulse2 { 0%{transform:scale(1);opacity:.5}  60%{transform:scale(2.0);opacity:0} 100%{transform:scale(1);opacity:0} }
    .sp-wrap  { position:relative;display:flex;align-items:center;justify-content:center; }
    .sp-ring1 { position:absolute;border-radius:50%;animation:simPulse  1.8s ease-out infinite; }
    .sp-ring2 { position:absolute;border-radius:50%;animation:simPulse2 1.8s ease-out infinite;animation-delay:.6s; }
    .sp-core  { position:relative;border-radius:50%;z-index:2; }
    .sp-badge {
      position:absolute;bottom:calc(100% + 3px);left:50%;transform:translateX(-50%);
      background:rgba(10,22,40,.95);color:#e2e8f0;font-size:10px;font-family:Inter,sans-serif;
      white-space:nowrap;padding:2px 6px;border-radius:4px;pointer-events:none;z-index:3;
      border:1px solid var(--hc);
    }
    .sp-badge strong { color:var(--hc); }
    .sim-draw-cursor { cursor: crosshair !important; }
    .sim-draw-cursor .leaflet-grab { cursor: crosshair !important; }
  `;
  document.head.appendChild(s);
}

interface Props {
  ciudad: FiltroCiudad;
  onAreaChange: (km2: number) => void;
  drawMode: boolean;
  showTraffic?: boolean;
}

export default function LeafletSimMap({ ciudad, onAreaChange, drawMode, showTraffic = false }: Props) {
  const containerRef  = useRef<HTMLDivElement>(null);
  const mapRef        = useRef<L.Map | null>(null);
  const polyRef       = useRef<L.Polygon | null>(null);
  const latlngsRef    = useRef<L.LatLng[]>([]);
  const drawingRef    = useRef(false);
  const heatLayerRef  = useRef<L.Marker[]>([]);
  const agentLayerRef = useRef<L.CircleMarker[]>([]);
  const drawModeRef   = useRef(drawMode);

  // Sync drawMode into ref (accessible inside event handlers)
  useEffect(() => { drawModeRef.current = drawMode; }, [drawMode]);

  // ── Init map ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    injectCSS();

    const map = L.map(containerRef.current, {
      center: CIUDAD_CENTER[ciudad] ?? [4.6549, -74.0628],
      zoom:   CIUDAD_ZOOM[ciudad]   ?? 12,
      zoomControl: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);

    const ttKey = process.env.NEXT_PUBLIC_TOMTOM_KEY;
    const trafficLayer = L.tileLayer(
      `https://api.tomtom.com/traffic/map/4/tile/flow/relative0/{z}/{x}/{y}.png?key=${ttKey}`,
      { opacity: 0.7, maxZoom: 19, zIndex: 10 }
    );
    (map as L.Map & { _traffic?: L.TileLayer })._traffic = trafficLayer;

    mapRef.current = map;

    function startDraw(e: L.LeafletMouseEvent) {
      if (!drawModeRef.current) return;
      drawingRef.current = true;
      latlngsRef.current = [e.latlng];
      if (polyRef.current) { polyRef.current.remove(); polyRef.current = null; }
      map.dragging.disable();
    }

    function moveDraw(e: L.LeafletMouseEvent) {
      if (!drawModeRef.current || !drawingRef.current) return;
      latlngsRef.current.push(e.latlng);
      if (polyRef.current) polyRef.current.remove();
      polyRef.current = L.polygon(latlngsRef.current, {
        color: '#00B4D8', weight: 2, fillColor: '#00B4D8', fillOpacity: 0.18,
      }).addTo(map);
    }

    function endDraw() {
      if (!drawingRef.current) return;
      drawingRef.current = false;
      map.dragging.enable();
      const pts = latlngsRef.current;
      if (pts.length < 3) { onAreaChange(0); return; }
      let area = 0;
      const R = 6371;
      for (let i = 0; i < pts.length; i++) {
        const j = (i + 1) % pts.length;
        const xi = pts[i].lng * Math.PI / 180 * R * Math.cos(pts[i].lat * Math.PI / 180);
        const yi = pts[i].lat * Math.PI / 180 * R;
        const xj = pts[j].lng * Math.PI / 180 * R * Math.cos(pts[j].lat * Math.PI / 180);
        const yj = pts[j].lat * Math.PI / 180 * R;
        area += xi * yj - xj * yi;
      }
      onAreaChange(Math.abs(area) / 2);
    }

    map.on('mousedown',  startDraw);
    map.on('mousemove',  moveDraw);
    map.on('mouseup',    endDraw);
    map.on('mouseleave', endDraw);

    return () => { map.remove(); mapRef.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Cursor según modo ─────────────────────────────────────────────────────
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    if (drawMode) {
      el.classList.add('sim-draw-cursor');
      mapRef.current?.dragging.enable();
    } else {
      el.classList.remove('sim-draw-cursor');
      mapRef.current?.dragging.enable();
    }
  }, [drawMode]);

  // ── Fly to city ───────────────────────────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    map.flyTo(CIUDAD_CENTER[ciudad] ?? [4.6549, -74.0628], CIUDAD_ZOOM[ciudad] ?? 12, { duration: 1.0 });
    if (polyRef.current) { polyRef.current.remove(); polyRef.current = null; }
    latlngsRef.current = [];
    onAreaChange(0);
  }, [ciudad]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Heat zones ────────────────────────────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    heatLayerRef.current.forEach(m => m.remove());
    heatLayerRef.current = [];
    const zonas = ciudad === 'Todas' ? ZONAS_SIM : ZONAS_SIM.filter(z => z.ciudad === ciudad);
    zonas.forEach(z => {
      const color = heatColor(z.intensidad);
      const pct   = Math.round(z.intensidad * 100);
      const core  = Math.round(10 + z.intensidad * 18);
      const wrap  = core * 3;
      const ring2 = Math.round(wrap * 0.72);
      const html = `
        <div class="sp-wrap" style="width:${wrap}px;height:${wrap}px;--hc:${color}">
          <div class="sp-ring1" style="width:${wrap}px;height:${wrap}px;background:${color}40;"></div>
          <div class="sp-ring2" style="width:${ring2}px;height:${ring2}px;background:${color}50;"></div>
          <div class="sp-core"  style="width:${core}px;height:${core}px;background:${color};box-shadow:0 0 8px 2px ${color}80;"></div>
          <div class="sp-badge" style="--hc:${color}"><strong>${pct}%</strong> · ${z.comparendos}</div>
        </div>`;
      const icon = L.divIcon({ html, className: '', iconSize: [wrap, wrap], iconAnchor: [wrap/2, wrap/2+12] });
      const marker = L.marker([z.lat, z.lng], { icon, zIndexOffset: 500, interactive: false }).addTo(map);
      heatLayerRef.current.push(marker);
    });
  }, [ciudad]);

  // ── Agent dots ────────────────────────────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    agentLayerRef.current.forEach(m => m.remove());
    agentLayerRef.current = [];
    const pts = ciudad === 'Todas' ? MAP_POINTS : MAP_POINTS.filter(p => p.ciudad === ciudad);
    pts.forEach(p => {
      const cm = L.circleMarker([p.lat, p.lng], {
        radius: 4, color: '#00B4D8', fillColor: '#00B4D8',
        fillOpacity: 0.85, weight: 1.5, interactive: false,
      }).addTo(map);
      agentLayerRef.current.push(cm);
    });
  }, [ciudad]);

    useEffect(() => {
    const map = mapRef.current as (L.Map & { _traffic?: L.TileLayer }) | null;
    if (!map?._traffic) return;
    if (showTraffic) map._traffic.addTo(map);
    else map._traffic.remove();
  }, [showTraffic]);

  return <div ref={containerRef} style={{ width: '100%', height: '100%' }} />;
}