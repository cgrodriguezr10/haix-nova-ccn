'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import dynamic from 'next/dynamic';
import {
  MapPin, Activity, Navigation, Layers, Target, DollarSign,
  TrendingUp, Play, Trash2, Zap, CheckCircle, BarChart2,
  AlertTriangle, Radio, Users, Cpu, ThermometerSun,
} from 'lucide-react';
import {
  MAP_POINTS, CIUDAD_CONFIG, CIUDADES, METRICS_POR_CIUDAD,
  SERIE_NACIONAL_30D, SERIE_POR_CIUDAD_30D,
  formatNum,
} from '@/lib/mock-data';
import { SectionHeader } from '@/components/shared/SectionHeader';
import { KpiCard } from '@/components/shared/KpiCard';
import { useAppStore } from '@/store/useAppStore';
import type { Ciudad, FiltroCiudad, FiltroFecha } from '@/lib/mock-data';

const LeafletMap = dynamic(() => import('@/components/map/LeafletMap'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full" style={{ backgroundColor: '#0A1628', borderRadius: 12 }}>
      <div className="text-center space-y-3">
        <div className="w-8 h-8 border-2 rounded-full animate-spin mx-auto" style={{ borderColor: '#00B4D8', borderTopColor: 'transparent' }} />
        <p className="text-xs font-mono" style={{ color: '#64748B' }}>Cargando mapa…</p>
      </div>
    </div>
  ),
});

const LeafletHeatMap = dynamic(() => import('@/components/map/LeafletHeatMap'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full" style={{ backgroundColor: '#0A1628', borderRadius: 12 }}>
      <div className="text-center space-y-3">
        <div className="w-8 h-8 border-2 rounded-full animate-spin mx-auto" style={{ borderColor: '#ef4444', borderTopColor: 'transparent' }} />
        <p className="text-xs font-mono" style={{ color: '#64748B' }}>Cargando zonas calientes…</p>
      </div>
    </div>
  ),
});

// ─── helpers ────────────────────────────────────────────────────────────────
function diasDelPeriodo(f: FiltroFecha): number {
  if (f === 'Hoy') return 1;
  if (f === 'Semana') return 7;
  if (f === 'Mes') return 30;
  if (f === 'Trimestre') return 90;
  return 30;
}
function sumarSeries(ciudad: FiltroCiudad, dias: number) {
  const allSeries = ciudad === 'Todas' ? SERIE_NACIONAL_30D : SERIE_POR_CIUDAD_30D[ciudad as Ciudad];
  const slice = allSeries.slice(-Math.min(dias, allSeries.length));
  return {
    escaneos: slice.reduce((s, d) => s + d.escaneos, 0),
    comparendos: slice.reduce((s, d) => s + d.comparendos, 0),
  };
}
function fmtCOP(n: number) {
  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  return `$${formatNum(n)}`;
}

// ─── datos zonas calientes ───────────────────────────────────────────────────
const ZONAS_HEAT = [
  // Bogotá
  { id: 'z1',  nombre: 'Suba - Calle 80',           ciudad: 'Bogotá',       lat:  4.7417, lng: -74.0928, comparendos: 312, agentes: 8, dispositivos: 5, intensidad: 0.95, tendencia: 'subiendo' as const, top: 'SOAT Vencido' },
  { id: 'z2',  nombre: 'Kennedy - Autopista Sur',    ciudad: 'Bogotá',       lat:  4.6280, lng: -74.1522, comparendos: 278, agentes: 6, dispositivos: 4, intensidad: 0.87, tendencia: 'subiendo' as const, top: 'RTM Vencida' },
  { id: 'z3',  nombre: 'Chapinero - Carrera 7',      ciudad: 'Bogotá',       lat:  4.6351, lng: -74.0641, comparendos: 189, agentes: 5, dispositivos: 3, intensidad: 0.70, tendencia: 'estable'  as const, top: 'Exceso Velocidad' },
  { id: 'z4',  nombre: 'Bosa - Av. Bosa',            ciudad: 'Bogotá',       lat:  4.5957, lng: -74.1838, comparendos: 201, agentes: 5, dispositivos: 3, intensidad: 0.73, tendencia: 'subiendo' as const, top: 'RTM Vencida' },
  // Medellín
  { id: 'z5',  nombre: 'Laureles - Estadio',         ciudad: 'Medellín',     lat:  6.2518, lng: -75.5951, comparendos: 244, agentes: 6, dispositivos: 4, intensidad: 0.88, tendencia: 'subiendo' as const, top: 'SOAT Vencido' },
  { id: 'z6',  nombre: 'Belén - Av. Las Vegas',      ciudad: 'Medellín',     lat:  6.2219, lng: -75.6039, comparendos: 198, agentes: 5, dispositivos: 3, intensidad: 0.73, tendencia: 'estable'  as const, top: 'RTM Vencida' },
  // Cali
  { id: 'z7',  nombre: 'Norte - Av. Roosvelt',       ciudad: 'Cali',         lat:  3.4516, lng: -76.5320, comparendos: 267, agentes: 7, dispositivos: 4, intensidad: 0.90, tendencia: 'subiendo' as const, top: 'SOAT Vencido' },
  { id: 'z8',  nombre: 'Sur - Carrera 1',            ciudad: 'Cali',         lat:  3.3800, lng: -76.5250, comparendos: 189, agentes: 5, dispositivos: 3, intensidad: 0.69, tendencia: 'estable'  as const, top: 'RTM Vencida' },
  // Barranquilla
  { id: 'z9',  nombre: 'Suroccidente - Av. Murillo', ciudad: 'Barranquilla', lat: 10.9680, lng: -74.8050, comparendos: 231, agentes: 6, dispositivos: 4, intensidad: 0.84, tendencia: 'subiendo' as const, top: 'SOAT Vencido' },
  { id: 'z10', nombre: 'Norte - Vía 40',             ciudad: 'Barranquilla', lat: 11.0041, lng: -74.8070, comparendos: 167, agentes: 4, dispositivos: 3, intensidad: 0.62, tendencia: 'estable'  as const, top: 'RTM Vencida' },
];

function heatColor(i: number) {
  if (i > 0.85) return '#ef4444';
  if (i > 0.65) return '#f97316';
  if (i > 0.45) return '#eab308';
  return '#22c55e';
}

// ─── Panel de cards ──────────────────────────────────────────────────────────
function ZonasHeatPanel({ ciudad, selectedId, onSelect }: {
  ciudad: FiltroCiudad;
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const zonas = ciudad === 'Todas'
    ? ZONAS_HEAT
    : ZONAS_HEAT.filter(z => z.ciudad === ciudad);
  const criticas = zonas.filter(z => z.intensidad > 0.85).length;

  return (
    <div className="rounded-xl p-5" style={{ backgroundColor: '#112236', border: '1px solid #1E3A55' }}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <ThermometerSun size={15} style={{ color: '#ef4444' }} />
          <h3 className="font-orbitron text-sm font-semibold" style={{ color: '#E2E8F0' }}>
            Zonas Calientes en Tiempo Real
          </h3>
        </div>
        <div className="flex items-center gap-3">
          {criticas > 0 && (
            <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-semibold"
              style={{ backgroundColor: 'rgba(239,68,68,0.15)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)' }}>
              <AlertTriangle size={9} /> {criticas} crítica{criticas > 1 ? 's' : ''}
            </span>
          )}
          <div className="flex items-center gap-1 text-[10px]" style={{ color: '#64748B' }}>
            <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: '#22c55e' }} />
            Live
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4 mb-4 flex-wrap">
        {[
          { color: '#ef4444', label: 'Crítico >85%' },
          { color: '#f97316', label: 'Alto 65-85%' },
          { color: '#eab308', label: 'Medio 45-65%' },
          { color: '#22c55e', label: 'Bajo <45%' },
        ].map(l => (
          <div key={l.label} className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: l.color, opacity: 0.8 }} />
            <span className="text-[10px]" style={{ color: '#94A3B8' }}>{l.label}</span>
          </div>
        ))}
        <span className="text-[10px] ml-2" style={{ color: '#475569' }}>↑ Haz clic en una zona para centrar el mapa</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {zonas.sort((a, b) => b.intensidad - a.intensidad).map(z => {
          const color = heatColor(z.intensidad);
          const pct = Math.round(z.intensidad * 100);
          const isSelected = selectedId === z.id;
          return (
            <button
              key={z.id}
              onClick={() => onSelect(z.id)}
              className="rounded-lg p-3 text-left transition-all hover:scale-[1.01]"
              style={{
                backgroundColor: isSelected ? color + '18' : '#0A1628',
                border: isSelected ? `1px solid ${color}` : `1px solid ${color}40`,
                borderLeft: `3px solid ${color}`,
                outline: 'none',
              }}>
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="text-xs font-semibold" style={{ color: '#E2E8F0' }}>{z.nombre}</p>
                  {ciudad === 'Todas' && (
                    <p className="text-[10px]" style={{ color: '#64748B' }}>{z.ciudad}</p>
                  )}
                </div>
                <div className="flex items-center gap-1.5">
                  {isSelected && (
                    <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: color }} />
                  )}
                  <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded"
                    style={{ backgroundColor: color + '20', color }}>
                    {pct}%
                  </span>
                </div>
              </div>
              <div className="w-full rounded-full mb-2" style={{ height: 4, backgroundColor: '#1E3A55' }}>
                <div className="rounded-full transition-all" style={{ height: 4, width: `${pct}%`, backgroundColor: color }} />
              </div>
              <div className="flex gap-4">
                <div className="flex items-center gap-1">
                  <BarChart2 size={10} style={{ color }} />
                  <span className="text-[10px] font-mono font-bold" style={{ color }}>{z.comparendos}</span>
                  <span className="text-[9px]" style={{ color: '#64748B' }}>comp.</span>
                </div>
                <div className="flex items-center gap-1">
                  <Users size={10} style={{ color: '#60a5fa' }} />
                  <span className="text-[10px] font-mono font-bold" style={{ color: '#60a5fa' }}>{z.agentes}</span>
                  <span className="text-[9px]" style={{ color: '#64748B' }}>ag.</span>
                </div>
                <div className="flex items-center gap-1">
                  <Cpu size={10} style={{ color: '#a78bfa' }} />
                  <span className="text-[10px] font-mono font-bold" style={{ color: '#a78bfa' }}>{z.dispositivos}</span>
                  <span className="text-[9px]" style={{ color: '#64748B' }}>disp.</span>
                </div>
                <div className="ml-auto">
                  <span className="text-[9px]" style={{ color: '#64748B' }}>Top: </span>
                  <span className="text-[9px]" style={{ color: '#94A3B8' }}>{z.top}</span>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Tab Zonas Calientes: mapa + cards ───────────────────────────────────────
function HeatMapView({ ciudad }: { ciudad: FiltroCiudad }) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showTraffic, setShowTraffic] = useState(false);

  const zonasFiltradas = ciudad === 'Todas'
    ? ZONAS_HEAT
    : ZONAS_HEAT.filter(z => z.ciudad === ciudad);

  const agentesFiltrados = MAP_POINTS.filter(p => ciudad === 'Todas' || p.ciudad === ciudad);

  const selectedZona = ZONAS_HEAT.find(z => z.id === selectedId) ?? null;

  return (
    <div className="space-y-4">
      <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#112236', border: '1px solid #1E3A55' }}>
        <div className="flex items-center justify-between px-5 py-3" style={{ borderBottom: '1px solid #1E3A55' }}>
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: '#ef4444' }} />
            <span className="font-orbitron text-sm font-semibold" style={{ color: '#E2E8F0' }}>
              Mapa de Calor — {ciudad === 'Todas' ? 'Colombia · 4 ciudades' : ciudad}
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full"
              style={{ backgroundColor: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)' }}>
              {zonasFiltradas.length} zonas activas
            </span>
            <button
              onClick={() => setShowTraffic(t => !t)}
              className="flex items-center gap-1.5 text-[10px] px-2.5 py-1 rounded-lg font-medium"
              style={{
                backgroundColor: showTraffic ? 'rgba(239,68,68,0.15)' : 'rgba(255,255,255,0.04)',
                border: `1px solid ${showTraffic ? 'rgba(239,68,68,0.5)' : '#1E3A55'}`,
                color: showTraffic ? '#ef4444' : '#64748B',
              }}>
              🚦 {showTraffic ? 'Tráfico ON' : 'Tráfico'}
            </button>
          </div>
          <span className="text-[10px]" style={{ color: '#475569' }}>
            Haz clic en un punto del mapa para más info
          </span>
        </div>

        <div style={{ height: 480 }}>
          <LeafletHeatMap
            zonas={zonasFiltradas}
            selectedId={selectedId}
            onSelect={setSelectedId}
            agentes={agentesFiltrados}
            showTraffic={showTraffic}
          />
        </div>

        <div className="px-5 py-3 flex items-center gap-6 flex-wrap" style={{ borderTop: '1px solid #1E3A55' }}>
          {[
            { color: '#ef4444', label: 'Crítico' },
            { color: '#f97316', label: 'Alto' },
            { color: '#eab308', label: 'Medio' },
            { color: '#22c55e', label: 'Bajo' },
          ].map(l => (
            <div key={l.label} className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: l.color }} />
              <span className="text-[10px]" style={{ color: '#94A3B8' }}>{l.label}</span>
            </div>
          ))}
          {selectedZona && (
            <div className="ml-auto flex items-center gap-2 px-3 py-1 rounded-lg"
              style={{ backgroundColor: heatColor(selectedZona.intensidad) + '15', border: `1px solid ${heatColor(selectedZona.intensidad)}40` }}>
              <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: heatColor(selectedZona.intensidad) }} />
              <span className="text-[10px] font-semibold" style={{ color: heatColor(selectedZona.intensidad) }}>
                {selectedZona.nombre}
              </span>
              <span className="text-[10px]" style={{ color: '#94A3B8' }}>
                {selectedZona.comparendos} comparendos · {selectedZona.agentes} agentes
              </span>
            </div>
          )}
        </div>
      </div>

      <ZonasHeatPanel ciudad={ciudad} selectedId={selectedId} onSelect={setSelectedId} />
    </div>
  );
}

// ─── Simulador ───────────────────────────────────────────────────────────────


function calcularSim(area: number, horas: number) {
  const agentes = Math.max(2, Math.ceil(area * 1.8));
  const vehiculos = Math.round(area * 4200);
  const escaneos_hora = agentes * 140;
  const comparendos = Math.round(
    Math.min(vehiculos * 0.087 * 0.91, escaneos_hora * horas * 0.087 * 0.91)
  );
  const recaudo = comparendos * 530_000;
  const costo = agentes * horas * 85_000;
  return {
    area_km2: Math.round(area * 100) / 100,
    vehiculos,
    escaneos_hora,
    comparendos,
    recaudo,
    roi: Math.round(((recaudo - costo) / costo) * 100),
    agentes_rec: agentes,
  };
}

const CW = 560, CH = 380;

// Mapa Leaflet para el simulador
const LeafletSimMap = dynamic(() => import('@/components/map/LeafletSimMap'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full" style={{ backgroundColor: '#0A1628' }}>
      <div className="w-6 h-6 border-2 rounded-full animate-spin" style={{ borderColor: '#00B4D8', borderTopColor: 'transparent' }} />
    </div>
  ),
});

function SimuladorPanel({ ciudad }: { ciudad: FiltroCiudad }) {
  const [area, setArea] = useState(0);
  const [drawMode, setDrawMode] = useState(false);
  const [showTraffic, setShowTraffic] = useState(false);

  const [horas, setHoras] = useState(4);
  const [result, setResult] = useState<ReturnType<typeof calcularSim> | null>(null);
  const [loading, setLoading] = useState(false);

  async function simular() {
    if (area < 0.01) return;
    setLoading(true);
    setResult(null);
    await new Promise(r => setTimeout(r, 800));
    setResult(calcularSim(area, horas));
    setLoading(false);
  }

  function limpiar() { setArea(0); setResult(null); setDrawMode(false); }

  return (
    <div className="rounded-xl p-5" style={{ backgroundColor: '#112236', border: '1px solid #1E3A55' }}>
      <div className="flex items-center gap-2 mb-4">
        <Target size={15} style={{ color: '#00B4D8' }} />
        <h3 className="font-orbitron text-sm font-semibold" style={{ color: '#E2E8F0' }}>
          Simulador de Operativo
        </h3>
        <span className="text-[10px] px-2 py-0.5 rounded-full ml-1"
          style={{ backgroundColor: 'rgba(0,180,216,0.1)', color: '#00B4D8', border: '1px solid rgba(0,180,216,0.2)' }}>
          NovaX
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div>
          <p className="text-[11px] mb-2" style={{ color: '#64748B' }}>
            Mantén clic y arrastra sobre el mapa para delimitar la zona
          </p>
          <div className="relative rounded-lg overflow-hidden" style={{ border: '1px solid #1E3A55', height: 380 }}>
            <LeafletSimMap ciudad={ciudad} onAreaChange={(km2) => { setArea(km2); if (km2 > 0) setDrawMode(false); }} drawMode={drawMode} showTraffic={showTraffic} />
            {area > 0.01 && (
              <div className="absolute bottom-2 left-2 text-[10px] px-2 py-1 rounded flex items-center gap-1"
                style={{ backgroundColor: 'rgba(10,22,40,0.85)', border: '1px solid #00B4D8', color: '#00B4D8', zIndex: 1000 }}>
                <MapPin size={9} /> {area.toFixed(2)} km² seleccionados
              </div>
            )}
          </div>

          <div className="flex items-center gap-4 mt-3 flex-wrap">
                        <button
              onClick={() => setShowTraffic(t => !t)}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg"
              style={{
                backgroundColor: showTraffic ? 'rgba(239,68,68,0.15)' : '#0A1628',
                border: `1px solid ${showTraffic ? 'rgba(239,68,68,0.5)' : '#1E3A55'}`,
                color: showTraffic ? '#ef4444' : '#64748B',
              }}>
              🚦 {showTraffic ? 'Tráfico ON' : 'Tráfico'}
            </button>
            <button
              onClick={() => { setDrawMode(d => !d); }}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-semibold"
              style={{
                backgroundColor: drawMode ? 'rgba(0,180,216,0.15)' : '#0A1628',
                border: `1px solid ${drawMode ? '#00B4D8' : '#1E3A55'}`,
                color: drawMode ? '#00B4D8' : '#64748B',
              }}>
              ✏️ {drawMode ? 'Dibujando…' : 'Dibujar zona'}
            </button>
            <button onClick={() => { limpiar(); setDrawMode(false); }}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg"
              style={{ backgroundColor: '#0A1628', border: '1px solid #1E3A55', color: '#64748B' }}>
              <Trash2 size={12} /> Limpiar
            </button>
            <div className="flex items-center gap-2">
              <span className="text-[11px]" style={{ color: '#64748B' }}>Duración</span>
              <input type="range" min={1} max={12} value={horas}
                onChange={e => setHoras(+e.target.value)}
                style={{ width: 80, accentColor: '#A78BFA' }} />
              <span className="text-xs font-mono font-bold w-6" style={{ color: '#A78BFA' }}>{horas}h</span>
            </div>
            <button
              onClick={simular}
              disabled={area < 0.01 || loading}
              className="flex items-center gap-1.5 text-xs px-4 py-1.5 rounded-lg font-semibold ml-auto"
              style={{
                backgroundColor: area < 0.01 ? '#1E3A55' : '#0369a1',
                border: 'none',
                color: area < 0.01 ? '#374151' : 'white',
                cursor: area < 0.01 ? 'not-allowed' : 'pointer',
              }}>
              {loading
                ? <><div className="w-3 h-3 border-2 rounded-full animate-spin" style={{ borderColor: 'white', borderTopColor: 'transparent' }} /> Calculando…</>
                : <><Play size={12} /> Simular</>
              }
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          {!result && !loading && (
            <div className="flex flex-col items-center justify-center h-full rounded-lg text-center p-8"
              style={{ backgroundColor: '#0A1628', border: '1px dashed #1E3A55' }}>
              <Target size={32} style={{ color: '#1E3A55', marginBottom: 10 }} />
              <p className="text-xs" style={{ color: '#334155' }}>Delimita una zona en el mapa</p>
              <p className="text-[10px] mt-1" style={{ color: '#1E3A55' }}>
                NovaX proyectará comparendos, recaudo y ROI del operativo
              </p>
            </div>
          )}

          {loading && (
            <div className="flex flex-col items-center justify-center h-full rounded-lg p-8"
              style={{ backgroundColor: '#0A1628', border: '1px solid rgba(0,180,216,0.2)' }}>
              <div className="w-8 h-8 border-2 rounded-full animate-spin mb-3"
                style={{ borderColor: '#00B4D8', borderTopColor: 'transparent' }} />
              <p className="text-xs font-semibold" style={{ color: '#00B4D8' }}>NovaX procesando zona…</p>
              <p className="text-[10px] mt-1" style={{ color: '#475569' }}>
                Analizando densidad vehicular e histórico
              </p>
            </div>
          )}

          {result && (
            <>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: 'Comparendos proy.', value: formatNum(result.comparendos), color: '#ef4444', icon: <BarChart2 size={12}/> },
                  { label: 'Recaudo estimado',  value: fmtCOP(result.recaudo),        color: '#22c55e', icon: <DollarSign size={12}/> },
                  { label: 'Escaneos / hora',   value: formatNum(result.escaneos_hora),color: '#00B4D8', icon: <Zap size={12}/> },
                  { label: 'ROI operativo',     value: `${result.roi > 0 ? '+' : ''}${result.roi}%`, color: result.roi > 0 ? '#22c55e' : '#f59e0b', icon: <TrendingUp size={12}/> },
                ].map(k => (
                  <div key={k.label} className="rounded-lg p-3"
                    style={{ backgroundColor: '#0A1628', border: `1px solid ${k.color}30` }}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[9px] uppercase tracking-wide" style={{ color: '#64748B' }}>{k.label}</span>
                      <span style={{ color: k.color }}>{k.icon}</span>
                    </div>
                    <div className="text-lg font-mono font-bold" style={{ color: k.color }}>{k.value}</div>
                  </div>
                ))}
              </div>

              <div className="rounded-lg p-3" style={{ backgroundColor: '#0A1628', border: '1px solid #1E3A55' }}>
                {[
                  ['Área zona',            `${result.area_km2} km²`],
                  ['Vehículos estimados',  formatNum(result.vehiculos)],
                  ['Agentes recomendados', String(result.agentes_rec)],
                  ['Duración configurada', `${horas} horas`],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between py-1.5"
                    style={{ borderBottom: '1px solid #1E3A55', fontSize: 11 }}>
                    <span style={{ color: '#64748B' }}>{k}</span>
                    <span className="font-mono font-semibold" style={{ color: '#E2E8F0' }}>{v}</span>
                  </div>
                ))}
              </div>

              <div className="rounded-lg p-3"
                style={{ backgroundColor: '#0c1f3d', border: '1px solid rgba(0,180,216,0.35)' }}>
                <div className="flex gap-2 items-start">
                  <CheckCircle size={13} style={{ color: '#00B4D8', marginTop: 1, flexShrink: 0 }} />
                  <div>
                    <p className="text-[10px] font-bold mb-1" style={{ color: '#00B4D8' }}>Recomendación NovaX</p>
                    <p className="text-[10px] leading-relaxed" style={{ color: '#93c5fd' }}>
                      Con <strong>{result.agentes_rec} agentes</strong> por <strong>{horas}h</strong> en {result.area_km2} km² se proyectan{' '}
                      <strong>{formatNum(result.comparendos)} comparendos</strong> y recaudo de{' '}
                      <strong>{fmtCOP(result.recaudo)}</strong>.{' '}
                      {result.roi > 150
                        ? 'Operativo de alto impacto — priorizar inmediatamente.'
                        : result.roi > 0
                        ? 'Operativo viable — proceder.'
                        : 'Considera ampliar el área o reforzar agentes.'}
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Página principal ────────────────────────────────────────────────────────
type Tab = 'live' | 'heat' | 'simulador';

export default function MapaPage() {
  const { filtroCiudad, filtroFecha, setFiltroCiudad } = useAppStore();
  const [showTrafficLive, setShowTrafficLive] = useState(false);
  const [tab, setTab] = useState<Tab>('live');
  const isNacional = filtroCiudad === 'Todas';
  const dias = diasDelPeriodo(filtroFecha);

  const points = MAP_POINTS.filter(p => isNacional || p.ciudad === filtroCiudad);
  const ciudadesVis = isNacional ? CIUDADES : [filtroCiudad as Ciudad];
  const totalesPeriodo = sumarSeries(filtroCiudad, dias);
  const totalActivos = isNacional
    ? CIUDADES.reduce((s, c) => s + METRICS_POR_CIUDAD[c].agentesActivos, 0)
    : METRICS_POR_CIUDAD[filtroCiudad as Ciudad]?.agentesActivos ?? 0;
  const periodoLabel =
    filtroFecha === 'Hoy' ? 'hoy'
    : filtroFecha === 'Semana' ? 'esta semana'
    : filtroFecha === 'Mes' ? 'este mes'
    : filtroFecha === 'Trimestre' ? 'este trimestre'
    : 'histórico';

  const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'live',      label: 'Vista en Vivo',       icon: <Navigation size={13}/> },
    { id: 'heat',      label: 'Zonas Calientes',     icon: <ThermometerSun size={13}/> },
    { id: 'simulador', label: 'Simulador Operativo', icon: <Target size={13}/> },
  ];

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Mapa Operacional"
        subtitle={`${isNacional ? 'Nacional · 4 ciudades' : filtroCiudad} · ${formatNum(totalActivos)} agentes activos · ${periodoLabel}`}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Agentes Activos"              value={formatNum(totalActivos)}               icon={MapPin}     color="cyan" />
        <KpiCard label="Ciudades Activas"              value={String(ciudadesVis.length)}            icon={Navigation} color="purple" />
        <KpiCard label={`Escaneos · ${filtroFecha}`}  value={formatNum(totalesPeriodo.escaneos)}    icon={Activity}   color="naranja" />
        <KpiCard label={`Comparendos · ${filtroFecha}`} value={formatNum(totalesPeriodo.comparendos)} icon={Layers}   color="green" />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl" style={{ backgroundColor: '#0A1628', border: '1px solid #1E3A55', width: 'fit-content' }}>
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all"
            style={{
              backgroundColor: tab === t.id ? '#112236' : 'transparent',
              color: tab === t.id ? '#00B4D8' : '#64748B',
              border: tab === t.id ? '1px solid #1E3A55' : '1px solid transparent',
            }}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* ── Vista en Vivo ────────────────────────────────────────────────────── */}
      {tab === 'live' && (
        <>
          <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#112236', border: '1px solid #1E3A55' }}>
            <div className="flex items-center justify-between px-5 py-3" style={{ borderBottom: '1px solid #1E3A55' }}>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: '#22C55E' }} />
                <span className="font-orbitron text-sm font-semibold" style={{ color: '#E2E8F0' }}>
                  {isNacional ? 'Colombia — Vista Nacional' : `${filtroCiudad} — Vista Ciudad`}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full"
                  style={{ backgroundColor: 'rgba(0,180,216,0.1)', color: '#00B4D8', border: '1px solid rgba(0,180,216,0.2)' }}>
                  {filtroFecha}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {(['Todas', ...CIUDADES] as FiltroCiudad[]).map(c => (
                  <button key={c} onClick={() => setFiltroCiudad(c)}
                    className="text-[10px] px-2.5 py-1 rounded-lg font-medium transition-all"
                    style={{
                      backgroundColor: filtroCiudad === c
                        ? (c === 'Todas' ? 'rgba(0,180,216,0.2)' : CIUDAD_CONFIG[c as Ciudad].color + '30')
                        : 'rgba(255,255,255,0.04)',
                      color: filtroCiudad === c
                        ? (c === 'Todas' ? '#00B4D8' : CIUDAD_CONFIG[c as Ciudad].color)
                        : '#64748B',
                      border: `1px solid ${filtroCiudad === c
                        ? (c === 'Todas' ? 'rgba(0,180,216,0.4)' : CIUDAD_CONFIG[c as Ciudad].color + '60')
                        : '#1E3A55'}`,
                    }}>
                    {c === 'Todas' ? '🌎 Nacional' : c}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-end px-5 py-2" style={{ borderBottom: '1px solid #1E3A55' }}>
              <button
                onClick={() => setShowTrafficLive(t => !t)}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg"
                style={{
                  backgroundColor: showTrafficLive ? 'rgba(239,68,68,0.15)' : '#0A1628',
                  border: `1px solid ${showTrafficLive ? 'rgba(239,68,68,0.5)' : '#1E3A55'}`,
                  color: showTrafficLive ? '#ef4444' : '#64748B',
                }}>
                🚦 {showTrafficLive ? 'Tráfico ON' : 'Tráfico'}
              </button>
            </div>
            <div style={{ height: isNacional ? 520 : 560 }}>
              <LeafletMap points={points} onCiudadClick={(ciudad) => setFiltroCiudad(ciudad)} showTraffic={showTrafficLive} />
            </div>

            <div className="px-5 py-3 flex items-center gap-6 flex-wrap" style={{ borderTop: '1px solid #1E3A55' }}>
              {isNacional ? (
                CIUDADES.map(c => (
                  <button key={c} onClick={() => setFiltroCiudad(c)} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: CIUDAD_CONFIG[c].color }} />
                    <span className="text-[11px]" style={{ color: '#94A3B8' }}>
                      {c} — <span style={{ color: CIUDAD_CONFIG[c].color }}>{METRICS_POR_CIUDAD[c].agentesActivos} activos</span>
                    </span>
                  </button>
                ))
              ) : (
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: CIUDAD_CONFIG[filtroCiudad as Ciudad].color }} />
                    <span className="text-[11px]" style={{ color: '#94A3B8' }}>Agente activo</span>
                  </div>
                  <span className="text-[11px]" style={{ color: '#64748B' }}>
                    Haz clic en un punto para ver nombre, escaneos, coordenadas y dirección
                  </span>
                </div>
              )}
            </div>
          </div>

          {isNacional && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {CIUDADES.map(c => {
                const cfg = CIUDAD_CONFIG[c];
                const m = METRICS_POR_CIUDAD[c];
                const serie = sumarSeries(c, dias);
                return (
                  <button key={c} onClick={() => setFiltroCiudad(c)}
                    className="p-4 rounded-xl text-left transition-all hover:scale-[1.02]"
                    style={{ backgroundColor: '#112236', border: `1px solid ${cfg.color}40` }}>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cfg.color }} />
                      <span className="font-orbitron text-xs font-bold" style={{ color: cfg.color }}>{c}</span>
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex justify-between">
                        <span className="text-[10px]" style={{ color: '#64748B' }}>Activos</span>
                        <span className="text-xs font-mono font-bold" style={{ color: '#22C55E' }}>{m.agentesActivos}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[10px]" style={{ color: '#64748B' }}>Escaneos · {filtroFecha}</span>
                        <span className="text-xs font-mono" style={{ color: '#E87C2B' }}>{formatNum(serie.escaneos)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[10px]" style={{ color: '#64748B' }}>Comparendos · {filtroFecha}</span>
                        <span className="text-xs font-mono" style={{ color: '#A78BFA' }}>{formatNum(serie.comparendos)}</span>
                      </div>
                    </div>
                    <div className="mt-2 text-[9px] text-center" style={{ color: cfg.color + '80' }}>Clic para ver ciudad →</div>
                  </button>
                );
              })}
            </div>
          )}

          {!isNacional && (
            <div className="rounded-xl p-5" style={{ backgroundColor: '#112236', border: '1px solid #1E3A55' }}>
              <h3 className="font-orbitron text-sm font-semibold mb-4" style={{ color: '#E2E8F0' }}>
                Agentes en Campo — {filtroCiudad} <span style={{ color: '#64748B' }}>({points.length} en mapa)</span>
              </h3>
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                {points.slice(0, 18).map(p => (
                  <div key={p.id} className="flex items-center gap-3 p-3 rounded-lg"
                    style={{ backgroundColor: '#0A1628', border: '1px solid #1E3A55' }}>
                    <div className="w-2 h-2 rounded-full animate-pulse shrink-0"
                      style={{ backgroundColor: CIUDAD_CONFIG[p.ciudad].color }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs truncate" style={{ color: '#E2E8F0' }}>{p.nombre.split(' ').slice(0, 2).join(' ')}</p>
                      <p className="text-[10px]" style={{ color: '#64748B' }}>{formatNum(p.escaneosDia)} escaneos/día</p>
                    </div>
                    <span className="text-[9px] font-mono shrink-0" style={{ color: '#374151' }}>
                      {p.lat.toFixed(3)}, {p.lng.toFixed(3)}
                    </span>
                  </div>
                ))}
              </div>
              {points.length > 18 && (
                <p className="text-center text-[10px] mt-3" style={{ color: '#374151' }}>
                  + {points.length - 18} agentes más visibles en el mapa
                </p>
              )}
            </div>
          )}
        </>
      )}

      {/* ── Zonas Calientes ──────────────────────────────────────────────────── */}
      {tab === 'heat' && <HeatMapView ciudad={filtroCiudad} />}

      {/* ── Simulador ────────────────────────────────────────────────────────── */}
      {tab === 'simulador' && <SimuladorPanel ciudad={filtroCiudad} />}
    </div>
  );
}