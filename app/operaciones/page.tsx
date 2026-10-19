'use client';

import { useState, useMemo } from 'react';
import { Scan, FileX, AlertTriangle, ShieldCheck, Users, ChevronLeft, Clock, Cpu, TrendingUp, Award } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import {
  CIUDADES, METRICS_POR_CIUDAD, METRICS_NACIONAL,
  AGENTES_CCN,
  formatNum, formatCOP,
  type FiltroCiudad, type Ciudad, type FiltroFecha,
  SERIE_NACIONAL_30D, SERIE_POR_CIUDAD_30D,
} from '@/lib/mock-data';
import { KpiCard } from '@/components/shared/KpiCard';
import { SectionHeader } from '@/components/shared/SectionHeader';

function diasDelPeriodo(f: FiltroFecha): number {
  if (f === 'Hoy') return 1;
  if (f === 'Semana') return 7;
  if (f === 'Mes') return 30;
  if (f === 'Trimestre') return 90;
  return 30;
}

function sumarSeries(ciudad: FiltroCiudad, dias: number) {
  const series = ciudad === 'Todas' ? SERIE_NACIONAL_30D : SERIE_POR_CIUDAD_30D[ciudad as Ciudad];
  const slice = series.slice(-Math.min(dias, series.length));
  return {
    escaneos:    slice.reduce((s, d) => s + d.escaneos, 0),
    soat:        slice.reduce((s, d) => s + d.soat, 0),
    rtm:         slice.reduce((s, d) => s + d.rtm, 0),
    comparendos: slice.reduce((s, d) => s + d.comparendos, 0),
  };
}

function labelPeriodo(f: FiltroFecha): string {
  if (f === 'Hoy') return 'Hoy';
  if (f === 'Semana') return 'Esta semana';
  if (f === 'Mes') return 'Este mes';
  if (f === 'Trimestre') return 'Este trimestre';
  return 'Período completo';
}

const CIUDAD_COLOR: Record<string, string> = {
  Bogotá: '#00B4D8', Cali: '#E87C2B', Medellín: '#A78BFA', Barranquilla: '#34D399',
};

function BarPct({ value, max, color }: { value: number; max: number; color: string }) {
  return (
    <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: '#0A1628' }}>
      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${Math.round((value / max) * 100)}%`, backgroundColor: color }} />
    </div>
  );
}

export default function OperacionesPage() {
  const { filtroCiudad, filtroFecha } = useAppStore();
  const isNacional = filtroCiudad === 'Todas';
  const dias = diasDelPeriodo(filtroFecha);
  const totales = sumarSeries(filtroCiudad, dias);
  const periodoLabel = labelPeriodo(filtroFecha);

  const [tabRanking, setTabRanking] = useState<'escaneos' | 'infracciones'>('escaneos');
  const [agenteSeleccionado, setAgenteSeleccionado] = useState<string | null>(null);

  const agentesFiltrados = useMemo(() => {
    const base = isNacional ? AGENTES_CCN : AGENTES_CCN.filter(a => a.ciudad === filtroCiudad as Ciudad);
    return base;
  }, [isNacional, filtroCiudad]);

  const top20Escaneos = useMemo(() =>
    [...agentesFiltrados].sort((a, b) => b.escaneosTotal - a.escaneosTotal).slice(0, 20),
    [agentesFiltrados]);

  const top20Infracciones = useMemo(() =>
    [...agentesFiltrados].sort((a, b) => b.infracciones - a.infracciones).slice(0, 20),
    [agentesFiltrados]);

  const rankingActual = tabRanking === 'escaneos' ? top20Escaneos : top20Infracciones;
  const maxVal = tabRanking === 'escaneos'
    ? (rankingActual[0]?.escaneosTotal ?? 1)
    : (rankingActual[0]?.infracciones ?? 1);

  const agente = agenteSeleccionado ? AGENTES_CCN.find(a => a.id === agenteSeleccionado) : null;

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Operaciones"
        subtitle={`${isNacional ? '4 ciudades activas' : filtroCiudad} · ${periodoLabel}`}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label={`Vehículos Escaneados · ${periodoLabel}`} value={formatNum(totales.escaneos)} icon={Scan} color="cyan" trend={{ value: 8, label: 'vs anterior' }} />
        <KpiCard label={`Vigentes · ${periodoLabel}`} value={formatNum(totales.escaneos - totales.comparendos)} sub="Sin infracciones detectadas" icon={ShieldCheck} color="green" />
        <KpiCard label={`SOAT Vencido (C02) · ${periodoLabel}`} value={formatNum(totales.soat)} sub={formatCOP(totales.soat * 587450)} icon={AlertTriangle} color="red" trend={{ value: 3, label: 'vs anterior' }} />
        <KpiCard label={`RTM Vencido (C03) · ${periodoLabel}`} value={formatNum(totales.rtm)} sub={formatCOP(totales.rtm * 587450)} icon={FileX} color="naranja" trend={{ value: 5, label: 'vs anterior' }} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-xl p-5 flex flex-col gap-4" style={{ backgroundColor: '#112236', border: '1px solid #1E3A55' }}>
          <div className="flex items-center justify-between">
            <h3 className="font-orbitron text-sm font-semibold" style={{ color: '#E2E8F0' }}>Ranking Operativo</h3>
            <div className="flex gap-1">
              {(['escaneos', 'infracciones'] as const).map(t => (
                <button key={t} onClick={() => setTabRanking(t)} className="text-[10px] px-3 py-1 rounded-full font-medium transition-all"
                  style={{ backgroundColor: tabRanking === t ? '#00B4D8' : 'rgba(0,180,216,0.08)', color: tabRanking === t ? '#0D1B2A' : '#64748B' }}>
                  {t === 'escaneos' ? 'Escaneos' : 'Infracciones'}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-1 overflow-y-auto" style={{ maxHeight: '480px' }}>
            {rankingActual.map((a, i) => {
              const val = tabRanking === 'escaneos' ? a.escaneosTotal : a.infracciones;
              const color = CIUDAD_COLOR[a.ciudad] ?? '#00B4D8';
              const isSelected = agenteSeleccionado === a.id;
              return (
                <button key={a.id} onClick={() => setAgenteSeleccionado(isSelected ? null : a.id)}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all text-left"
                  style={{ backgroundColor: isSelected ? 'rgba(0,180,216,0.12)' : 'transparent', border: isSelected ? '1px solid rgba(0,180,216,0.3)' : '1px solid transparent' }}>
                  <span className="text-[11px] font-bold font-mono w-6 shrink-0 text-center"
                    style={{ color: i === 0 ? '#F59E0B' : i === 1 ? '#94A3B8' : i === 2 ? '#E87C2B' : '#64748B' }}>#{i + 1}</span>
                  <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold"
                    style={{ backgroundColor: `${color}22`, color }}>{a.ciudad.slice(0, 2).toUpperCase()}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold truncate" style={{ color: '#E2E8F0' }}>{a.nombre}</span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded-full shrink-0"
                        style={{ backgroundColor: a.estado === 'ACTIVO' ? 'rgba(34,197,94,0.15)' : 'rgba(100,116,139,0.2)', color: a.estado === 'ACTIVO' ? '#22C55E' : '#64748B' }}>
                        {a.estado}</span>
                    </div>
                    <BarPct value={val} max={maxVal} color={color} />
                  </div>
                  <span className="text-xs font-bold font-mono shrink-0" style={{ color }}>{formatNum(val)}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="rounded-xl p-5 flex flex-col gap-4" style={{ backgroundColor: '#112236', border: '1px solid #1E3A55' }}>
          {!agente ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 py-16">
              <Users size={36} style={{ color: '#1E3A55' }} />
              <p className="text-sm text-center" style={{ color: '#64748B' }}>Selecciona un agente del ranking<br />para ver su detalle operativo</p>
            </div>
          ) : (
            <>
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold"
                  style={{ backgroundColor: `${CIUDAD_COLOR[agente.ciudad]}22`, color: CIUDAD_COLOR[agente.ciudad] }}>
                  {agente.nombre.slice(0, 2).toUpperCase()}</div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-orbitron font-bold text-base" style={{ color: '#E2E8F0' }}>{agente.nombre}</h4>
                    <span className="text-[9px] px-2 py-0.5 rounded-full font-medium"
                      style={{ backgroundColor: agente.estado === 'ACTIVO' ? 'rgba(34,197,94,0.15)' : 'rgba(100,116,139,0.2)', color: agente.estado === 'ACTIVO' ? '#22C55E' : '#94A3B8' }}>
                      {agente.estado}</span>
                    <span className="text-[9px] px-2 py-0.5 rounded-full font-bold"
                      style={{ backgroundColor: 'rgba(245,158,11,0.15)', color: '#F59E0B' }}>
                      <Award size={8} className="inline mr-0.5" />#{agente.ranking} Esc · #{agente.rankingInfr} Infr</span>
                  </div>
                  <p className="text-[11px] mt-0.5" style={{ color: '#64748B' }}>{agente.id} · {agente.ciudad}</p>
                  <p className="text-[10px]" style={{ color: '#64748B' }}>{agente.secretaria}</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { icon: Clock, label: 'Turno', val: agente.turno },
                  { icon: Cpu, label: 'Horas dispositivo', val: `${agente.horasUso}h` },
                  { icon: Users, label: 'Turnos activos', val: String(agente.turnos) },
                ].map(({ icon: Icon, label, val }) => (
                  <div key={label} className="rounded-lg p-3 flex flex-col gap-1" style={{ backgroundColor: '#0D1B2A', border: '1px solid #1E3A55' }}>
                    <Icon size={13} style={{ color: '#64748B' }} />
                    <p className="text-sm font-bold" style={{ color: '#E2E8F0' }}>{val}</p>
                    <p className="text-[10px]" style={{ color: '#64748B' }}>{label}</p>
                  </div>
                ))}
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider mb-2" style={{ color: '#64748B' }}>Métricas de operación</p>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: 'Vehículos escaneados', val: formatNum(agente.escaneosTotal), color: '#00B4D8' },
                    { label: 'SOAT detectado (C02)', val: formatNum(agente.soatDetectado), color: '#EF4444' },
                    { label: 'RTM detectado (C03)',  val: formatNum(agente.rtmDetectado),  color: '#E87C2B' },
                    { label: 'Total infracciones',   val: formatNum(agente.infracciones),  color: '#A78BFA' },
                  ].map(({ label, val, color }) => (
                    <div key={label} className="rounded-lg p-3" style={{ backgroundColor: '#0D1B2A', border: '1px solid #1E3A55' }}>
                      <p className="text-base font-bold font-mono" style={{ color }}>{val}</p>
                      <p className="text-[10px] mt-0.5" style={{ color: '#64748B' }}>{label}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider mb-3" style={{ color: '#64748B' }}>Métricas de rendimiento</p>
                {[
                  { label: 'Precisión OCR', val: agente.precisionOCR, color: '#00B4D8', suffix: '%' },
                  { label: 'Uso de voz',    val: agente.usoVoz,       color: '#A78BFA', suffix: '%' },
                  { label: 'Tasa de alerta',val: agente.tasaAlerta,   color: '#E87C2B', suffix: '%' },
                ].map(({ label, val, color, suffix }) => (
                  <div key={label} className="flex items-center gap-3 mb-2">
                    <span className="text-[11px] w-32 shrink-0" style={{ color: '#94A3B8' }}>{label}</span>
                    <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ backgroundColor: '#0A1628' }}>
                      <div className="h-full rounded-full" style={{ width: `${val}%`, backgroundColor: color }} />
                    </div>
                    <span className="text-[11px] font-mono w-10 text-right shrink-0" style={{ color }}>{val}{suffix}</span>
                  </div>
                ))}
              </div>
              <button onClick={() => setAgenteSeleccionado(null)} className="flex items-center gap-1 text-[11px] mt-auto" style={{ color: '#64748B' }}>
                <ChevronLeft size={12} /> Volver al ranking
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}