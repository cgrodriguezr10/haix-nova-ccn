'use client';

import dynamic from 'next/dynamic';
import {
  Users, Scan, FileX, AlertTriangle,
  TrendingUp, Cpu, DollarSign, Map,
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts';

import { useAppStore } from '@/store/useAppStore';
import {
  METRICS_NACIONAL, METRICS_POR_CIUDAD, CIUDAD_CONFIG, CIUDADES,
  SERIE_POR_CIUDAD_30D, SERIE_NACIONAL_30D,
  SERIE_INTRADAY_NACIONAL, SERIE_INTRADAY_CIUDAD,
  formatCOP, formatNum, type FiltroFecha, type FiltroCiudad, type Ciudad,
} from '@/lib/mock-data';
import { KpiCard } from '@/components/shared/KpiCard';
import { SectionHeader } from '@/components/shared/SectionHeader';

const DashboardMiniMap = dynamic(
  () => import('@/components/map/DashboardMiniMap'),
  {
    ssr: false,
    loading: () => (
      <div style={{ width: '100%', height: '100%', backgroundColor: '#0A1628', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ color: '#64748B', fontSize: 12 }}>Cargando mapa…</span>
      </div>
    ),
  }
);

// ── Dado un filtro de fecha, cuántos días acumular ──────────────────────────
function diasDelPeriodo(f: FiltroFecha): number {
  if (f === 'Hoy') return 1;
  if (f === 'Semana') return 7;
  if (f === 'Mes') return 30;
  if (f === 'Trimestre') return 90;
  return 30;
}

// ── Sumar series filtradas por fecha ────────────────────────────────────────
function sumarSeries(ciudad: FiltroCiudad, dias: number) {
  const allSeries = ciudad === 'Todas'
    ? SERIE_NACIONAL_30D
    : SERIE_POR_CIUDAD_30D[ciudad as Ciudad];

  const slice = allSeries.slice(-Math.min(dias, allSeries.length));
  return {
    escaneos:    slice.reduce((s, d) => s + d.escaneos, 0),
    comparendos: slice.reduce((s, d) => s + d.comparendos, 0),
    soat:        slice.reduce((s, d) => s + d.soat, 0),
    rtm:         slice.reduce((s, d) => s + d.rtm, 0),
    valor:       slice.reduce((s, d) => s + d.valor, 0),
    serie:       slice,
  };
}

// ── Sumar series para un rango de fechas ISO (yyyy-mm-dd) ───────────────────
function sumarSeriesRango(ciudad: FiltroCiudad, desde: string, hasta: string) {
  const allSeries = ciudad === 'Todas'
    ? SERIE_NACIONAL_30D
    : SERIE_POR_CIUDAD_30D[ciudad as Ciudad];
  const slice = allSeries.filter(d => d.fecha >= desde && d.fecha <= hasta);
  return {
    escaneos:    slice.reduce((s, d) => s + d.escaneos, 0),
    comparendos: slice.reduce((s, d) => s + d.comparendos, 0),
    soat:        slice.reduce((s, d) => s + d.soat, 0),
    rtm:         slice.reduce((s, d) => s + d.rtm, 0),
    valor:       slice.reduce((s, d) => s + d.valor, 0),
    serie:       slice,
  };
}

// ── Etiqueta del KPI según periodo ──────────────────────────────────────────
function labelPeriodo(f: FiltroFecha, rangoActivo: boolean, rangoLabel: string): string {
  if (rangoActivo) return rangoLabel;
  if (f === 'Hoy') return 'Hoy';
  if (f === 'Semana') return 'Esta semana';
  if (f === 'Mes') return 'Este mes';
  if (f === 'Trimestre') return 'Este trimestre';
  return 'Período completo';
}

export default function DashboardPage() {
  const {
    filtroCiudad, filtroFecha,
    rangoDesde, rangoHasta, rangoActivo,
  } = useAppStore();
  const isNacional = filtroCiudad === 'Todas';

  const dias = diasDelPeriodo(filtroFecha);

  const totales = rangoActivo
    ? sumarSeriesRango(filtroCiudad, rangoDesde, rangoHasta)
    : sumarSeries(filtroCiudad, dias);

  // Días efectivos del rango personalizado
  const diasRango = rangoActivo && rangoDesde && rangoHasta
    ? Math.max(1, Math.round((new Date(rangoHasta).getTime() - new Date(rangoDesde).getTime()) / 86400000) + 1)
    : dias;
  const rangoLabel = rangoActivo ? `${rangoDesde.slice(5)} → ${rangoHasta.slice(5)}` : '';
  const periodoLabel = labelPeriodo(filtroFecha, rangoActivo, rangoLabel);
  const diasEfectivos = diasRango;

  // Agentes y dispositivos — siempre estáticos (dotación, no acumulan)
  const agentesTotal        = isNacional
    ? METRICS_NACIONAL.agentesTotal
    : METRICS_POR_CIUDAD[filtroCiudad as Ciudad].agentes;
  const agentesActivos      = isNacional
    ? METRICS_NACIONAL.agentesActivos
    : METRICS_POR_CIUDAD[filtroCiudad as Ciudad].agentesActivos;
  const dispositivosTotal   = isNacional
    ? METRICS_NACIONAL.dispositivosTotal
    : METRICS_POR_CIUDAD[filtroCiudad as Ciudad].dispositivosTotal;
  const dispositivosActivos = isNacional
    ? METRICS_NACIONAL.dispositivosActivos
    : METRICS_POR_CIUDAD[filtroCiudad as Ciudad].dispositivosActivos;
  const eficiencia = 100; isNacional
    ? METRICS_NACIONAL.eficienciaPromedio
    : METRICS_POR_CIUDAD[filtroCiudad as Ciudad].eficiencia;

  // ── Gráfica de área ──────────────────────────────────────────────────────
  const esHoy = !rangoActivo && filtroFecha === 'Hoy';
  const areaData = esHoy
    ? (filtroCiudad === 'Todas' ? SERIE_INTRADAY_NACIONAL : SERIE_INTRADAY_CIUDAD[filtroCiudad as Ciudad])
        .filter(h => h.escaneos > 0)
        .map(h => ({ fecha: h.hora, Escaneos: h.escaneos, Comparendos: h.comparendos }))
    : totales.serie.map(s => ({
        fecha: s.fecha.slice(5),
        Escaneos: s.escaneos,
        Comparendos: s.comparendos,
      }));

  // ── Pie — comparendos por ciudad ─────────────────────────────────────────
  const ciudadesVisibles = isNacional ? CIUDADES : [filtroCiudad as Ciudad];
  const pieData = ciudadesVisibles.map(c => {
    const s = rangoActivo
      ? sumarSeriesRango(c, rangoDesde, rangoHasta)
      : sumarSeries(c, dias);
    return { name: c, value: s.comparendos, color: CIUDAD_CONFIG[c].color };
  });

  // ── Bar — SOAT vs RTM ────────────────────────────────────────────────────
  const barData = ciudadesVisibles.map(c => {
    const s = rangoActivo
      ? sumarSeriesRango(c, rangoDesde, rangoHasta)
      : sumarSeries(c, dias);
    return { ciudad: c.slice(0, 3).toUpperCase(), SOAT: s.soat, RTM: s.rtm };
  });

  // ── Tabla resumen ─────────────────────────────────────────────────────────
  const tablaData = ciudadesVisibles.map(c => {
    const base = METRICS_POR_CIUDAD[c];
    const s = rangoActivo
      ? sumarSeriesRango(c, rangoDesde, rangoHasta)
      : sumarSeries(c, dias);
    return { ciudad: c, agentes: base.agentes, dispositivos: base.dispositivosActivos, escaneos: s.escaneos, comparendos: s.comparendos, eficiencia: 100 };
  });
  const tablaTotal = {
    agentes:      tablaData.reduce((s, r) => s + r.agentes, 0),
    dispositivos: tablaData.reduce((s, r) => s + r.dispositivos, 0),
    escaneos:    tablaData.reduce((s, r) => s + r.escaneos, 0),
    comparendos: tablaData.reduce((s, r) => s + r.comparendos, 0),
    eficiencia,
  };

  const tooltipStyle = {
    backgroundColor: '#0A1628', border: '1px solid #1E3A55',
    borderRadius: '8px', color: '#E2E8F0', fontSize: 11,
  };

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Command Center Nacional"
        subtitle={`${isNacional ? '4 ciudades activas' : filtroCiudad} · ${periodoLabel} · 15 oct 2026`}
      />

      {/* KPI Row 1 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Agentes Totales"   value={formatNum(agentesTotal)}       sub={`${formatNum(agentesActivos)} activos ahora`}  icon={Users}      color="cyan"    />
        <KpiCard label={`Escaneos · ${periodoLabel}`}    value={formatNum(totales.escaneos)}    sub={`${formatNum(Math.round(totales.escaneos / diasEfectivos))}/día promedio`}  icon={Scan}       color="cyan"    trend={{ value: 8,  label: 'vs período anterior' }} />
        <KpiCard label={`Comparendos · ${periodoLabel}`} value={formatNum(totales.comparendos)} sub="SOAT + RTM vencidos"                                               icon={FileX}      color="naranja" trend={{ value: 5,  label: 'vs período anterior' }} />
        <KpiCard label={`Recaudado · ${periodoLabel}`}   value={'$' + formatNum(totales.valor)} sub="C02 + C03"                                                         icon={DollarSign} color="green"   trend={{ value: 12, label: 'vs período anterior' }} />
      </div>

      {/* KPI Row 2 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label={`SOAT Vencido (C02) · ${periodoLabel}`} value={formatNum(totales.soat)} sub={formatCOP(totales.soat * 587450)} icon={AlertTriangle} color="red"    />
        <KpiCard label={`RTM Vencido (C03) · ${periodoLabel}`}  value={formatNum(totales.rtm)}  sub={formatCOP(totales.rtm  * 587450)} icon={AlertTriangle} color="naranja" />
        <KpiCard label="Dispositivos Activos"  value={formatNum(dispositivosActivos)}  sub={`${formatNum(dispositivosTotal)} DHNa3 en dotación`}  icon={Cpu}  color="cyan" />
        <KpiCard label="Eficiencia Operativa"  value={`${eficiencia}%`}           sub="Dispositivos activos / total" icon={TrendingUp} color="purple" />
      </div>

      {/* Mapa Nacional */}
      <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#112236', border: '1px solid #1E3A55' }}>
        <div className="px-5 py-3 flex items-center justify-between" style={{ borderBottom: '1px solid #1E3A55' }}>
          <div className="flex items-center gap-2">
            <Map size={15} style={{ color: '#00B4D8' }} />
            <h3 className="font-orbitron text-sm font-semibold" style={{ color: '#E2E8F0' }}>Mapa Operacional Nacional</h3>
            <span className="text-[10px] px-2 py-0.5 rounded-full ml-1" style={{ backgroundColor: 'rgba(34,197,94,0.15)', color: '#22C55E' }}>
              4 ciudades activas
            </span>
          </div>
          <span className="text-[10px] italic" style={{ color: '#64748B' }}>
            🖱️ Clic en ciudad → Mapa Operacional
          </span>
        </div>
        <div style={{ height: 320 }}>
          <DashboardMiniMap />
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2 rounded-xl p-5" style={{ backgroundColor: '#112236', border: '1px solid #1E3A55' }}>
          <h3 className="font-orbitron text-sm font-semibold mb-4" style={{ color: '#E2E8F0' }}>
            Tendencia · {periodoLabel} {!isNacional && `— ${filtroCiudad}`}
            {esHoy && <span className="ml-2 text-[10px] font-normal" style={{ color: '#64748B' }}>por hora del día</span>}
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={areaData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="gradE" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00B4D8" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#00B4D8" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradC" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#E87C2B" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#E87C2B" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1E3A55" />
              <XAxis dataKey="fecha" tick={{ fontSize: 10, fill: '#64748B' }} tickLine={false} axisLine={false}
                interval={areaData.length <= 1 ? 0 : Math.floor(areaData.length / 6)} />
              <YAxis tick={{ fontSize: 10, fill: '#64748B' }} tickLine={false} axisLine={false}
                tickFormatter={v => formatNum(v)} width={65} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v) => formatNum(Number(v ?? 0))} />
              <Area type="monotone" dataKey="Escaneos"    stroke="#00B4D8" strokeWidth={2} fill="url(#gradE)" />
              <Area type="monotone" dataKey="Comparendos" stroke="#E87C2B" strokeWidth={2} fill="url(#gradC)" />
              <Legend wrapperStyle={{ fontSize: 11, color: '#94A3B8' }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-xl p-5" style={{ backgroundColor: '#112236', border: '1px solid #1E3A55' }}>
          <h3 className="font-orbitron text-sm font-semibold mb-4" style={{ color: '#E2E8F0' }}>
            Comparendos por Ciudad
          </h3>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={3} dataKey="value">
                {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} formatter={(v) => formatNum(Number(v ?? 0))} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-1.5 mt-3">
            {pieData.map(d => (
              <div key={d.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }} />
                  <span className="text-[10px]" style={{ color: '#94A3B8' }}>{d.name}</span>
                </div>
                <span className="text-[10px] font-mono" style={{ color: '#64748B' }}>{formatNum(d.value)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-xl p-5" style={{ backgroundColor: '#112236', border: '1px solid #1E3A55' }}>
          <h3 className="font-orbitron text-sm font-semibold mb-4" style={{ color: '#E2E8F0' }}>
            SOAT vs RTM · {periodoLabel}
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={barData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1E3A55" />
              <XAxis dataKey="ciudad" tick={{ fontSize: 10, fill: '#64748B' }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#64748B' }} tickLine={false} axisLine={false}
                tickFormatter={v => formatNum(v)} width={65} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v) => formatNum(Number(v ?? 0))} />
              <Bar dataKey="SOAT" fill="#00B4D8" radius={[3,3,0,0]} maxBarSize={40} />
              <Bar dataKey="RTM"  fill="#E87C2B" radius={[3,3,0,0]} maxBarSize={40} />
              <Legend wrapperStyle={{ fontSize: 11, color: '#94A3B8' }} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-xl p-5" style={{ backgroundColor: '#112236', border: '1px solid #1E3A55' }}>
          <h3 className="font-orbitron text-sm font-semibold mb-4" style={{ color: '#E2E8F0' }}>
            Resumen Operativo · {periodoLabel}
          </h3>
          <table className="w-full text-xs">
            <thead>
              <tr style={{ borderBottom: '1px solid #1E3A55' }}>
                {['Ciudad','Agentes','Disp.','Escaneos','Comp.','Efic.'].map(h => (
                  <th key={h} className="pb-2 text-left font-medium" style={{ color: '#64748B' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tablaData.map((row, i) => (
                <tr key={row.ciudad} style={{ borderBottom: i < tablaData.length - 1 ? '1px solid #1E3A5533' : 'none' }}>
                  <td className="py-2.5">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: CIUDAD_CONFIG[row.ciudad].color }} />
                      <span style={{ color: '#E2E8F0' }}>{row.ciudad}</span>
                    </div>
                  </td>
                  <td style={{ color: '#00B4D8' }}>{row.agentes}</td><td style={{ color: '#A78BFA' }}>{row.dispositivos}</td>
                  <td style={{ color: '#94A3B8' }}>{formatNum(row.escaneos)}</td>
                  <td style={{ color: '#E87C2B' }}>{formatNum(row.comparendos)}</td>
                  <td>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-medium" style={{
                      backgroundColor: row.eficiencia >= 70 ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
                      color: row.eficiencia >= 70 ? '#22C55E' : '#EF4444',
                    }}>
                      {row.eficiencia}%
                    </span>
                  </td>
                </tr>
              ))}
              <tr style={{ borderTop: '1px solid #1E3A55' }}>
                <td className="pt-2.5 font-semibold" style={{ color: '#E2E8F0' }}>TOTAL</td>
                <td className="pt-2.5 font-bold" style={{ color: '#00B4D8' }}>{tablaTotal.agentes}</td><td className="pt-2.5 font-bold" style={{ color: '#A78BFA' }}>{tablaTotal.dispositivos}</td>
                <td className="pt-2.5 font-bold"     style={{ color: '#94A3B8' }}>{formatNum(tablaTotal.escaneos)}</td>
                <td className="pt-2.5 font-bold"     style={{ color: '#E87C2B' }}>{formatNum(tablaTotal.comparendos)}</td>
                <td className="pt-2.5">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-medium"
                    style={{ backgroundColor: 'rgba(34,197,94,0.15)', color: '#22C55E' }}>
                    {tablaTotal.eficiencia}%
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
