'use client';

import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell,
} from 'recharts';
import { TrendingUp, BarChart2, DollarSign, Target, Activity } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import {
  SERIE_NACIONAL_30D, SERIE_POR_CIUDAD_30D, CIUDAD_CONFIG, CIUDADES, METRICS_POR_CIUDAD,
  formatNum, formatCOP,
  type FiltroCiudad, type Ciudad, type FiltroFecha,
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
  const s = ciudad === 'Todas' ? SERIE_NACIONAL_30D : SERIE_POR_CIUDAD_30D[ciudad as Ciudad];
  const slice = s.slice(-Math.min(dias, s.length));
  return {
    escaneos:    slice.reduce((a, d) => a + d.escaneos, 0),
    comparendos: slice.reduce((a, d) => a + d.comparendos, 0),
    soat:        slice.reduce((a, d) => a + d.soat, 0),
    rtm:         slice.reduce((a, d) => a + d.rtm, 0),
    valor:       slice.reduce((a, d) => a + d.valor, 0),
    serie: slice,
  };
}

function labelPeriodo(f: FiltroFecha) {
  if (f === 'Hoy') return 'Hoy';
  if (f === 'Semana') return 'Esta semana';
  if (f === 'Mes') return 'Este mes';
  if (f === 'Trimestre') return 'Este trimestre';
  return 'Período completo';
}

const tooltipStyle = {
  backgroundColor: '#0A1628', border: '1px solid #1E3A55',
  borderRadius: '8px', color: '#E2E8F0', fontSize: 11,
};

export default function AnaliticaPage() {
  const { filtroCiudad, filtroFecha } = useAppStore();
  const isNacional = filtroCiudad === 'Todas';
  const dias = diasDelPeriodo(filtroFecha);
  const totales = sumarSeries(filtroCiudad, dias);
  const periodoLabel = labelPeriodo(filtroFecha);

  const areaData = totales.serie.map(s => ({
    fecha: s.fecha.slice(5),
    Escaneos: s.escaneos,
    Comparendos: s.comparendos,
    SOAT: s.soat,
    RTM: s.rtm,
  }));

  // Eficiencia por ciudad
  const eficienciaData = CIUDADES.map(c => ({
    ciudad: c.slice(0, 3).toUpperCase(),
    Eficiencia: METRICS_POR_CIUDAD[c].eficiencia,
    Meta: 75,
  }));

  // Distribución SOAT vs RTM
  const pieData = [
    { name: 'SOAT (C02)', value: totales.soat,  color: '#EF4444' },
    { name: 'RTM (C03)',  value: totales.rtm,   color: '#E87C2B' },
  ];

  // Recaudo por ciudad en período
  const recaudoBar = (isNacional ? CIUDADES : [filtroCiudad as Ciudad]).map(c => {
    const s = sumarSeries(c, dias);
    return { ciudad: c.slice(0,3).toUpperCase(), Recaudo: Math.round(s.valor / 1_000_000), color: CIUDAD_CONFIG[c].color };
  });

  const tasaDeteccion = (totales.comparendos / totales.escaneos * 100).toFixed(2);
  const valorPromedio = totales.comparendos ? Math.round(totales.valor / totales.comparendos) : 0;

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Analítica Operativa"
        subtitle={`${isNacional ? 'Nacional' : filtroCiudad} · ${periodoLabel} · Datos en tiempo real simulado`}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label={`Escaneos · ${periodoLabel}`}    value={formatNum(totales.escaneos)}    icon={Activity}   color="cyan"    trend={{ value: 8,  label: 'vs anterior' }} />
        <KpiCard label="Tasa de Detección"              value={`${tasaDeteccion}%`}             icon={Target}     color="naranja" sub="comparendos / escaneos" />
        <KpiCard label={`Recaudado · ${periodoLabel}`}  value={formatCOP(totales.valor)}        icon={DollarSign} color="green"   trend={{ value: 12, label: 'vs anterior' }} />
        <KpiCard label="Valor Prom. Comparendo"         value={formatCOP(valorPromedio)}        icon={TrendingUp} color="purple" />
      </div>

      {/* Main area chart */}
      <div className="rounded-xl p-5" style={{ backgroundColor: '#112236', border: '1px solid #1E3A55' }}>
        <h3 className="font-orbitron text-sm font-semibold mb-4" style={{ color: '#E2E8F0' }}>
          Evolución Escaneos & Comparendos — {periodoLabel}
        </h3>
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={areaData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="gAE" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#00B4D8" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#00B4D8" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gAC" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#E87C2B" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#E87C2B" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1E3A55" />
            <XAxis dataKey="fecha" tick={{ fontSize: 10, fill: '#64748B' }} tickLine={false} axisLine={false}
              interval={areaData.length <= 1 ? 0 : Math.floor(areaData.length / 6)} />
            <YAxis tick={{ fontSize: 10, fill: '#64748B' }} tickLine={false} axisLine={false} tickFormatter={v => formatNum(v)} width={70} />
            <Tooltip contentStyle={tooltipStyle} formatter={(v) => formatNum(Number(v ?? 0))} />
            <Area type="monotone" dataKey="Escaneos"    stroke="#00B4D8" strokeWidth={2} fill="url(#gAE)" />
            <Area type="monotone" dataKey="Comparendos" stroke="#E87C2B" strokeWidth={2} fill="url(#gAC)" />
            <Legend wrapperStyle={{ fontSize: 11, color: '#94A3B8' }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {/* SOAT vs RTM line */}
        <div className="col-span-2 rounded-xl p-5" style={{ backgroundColor: '#112236', border: '1px solid #1E3A55' }}>
          <h3 className="font-orbitron text-sm font-semibold mb-4" style={{ color: '#E2E8F0' }}>
            SOAT vs RTM — Desglose {periodoLabel}
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={areaData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1E3A55" />
              <XAxis dataKey="fecha" tick={{ fontSize: 10, fill: '#64748B' }} tickLine={false} axisLine={false}
                interval={areaData.length <= 1 ? 0 : Math.floor(areaData.length / 5)} />
              <YAxis tick={{ fontSize: 10, fill: '#64748B' }} tickLine={false} axisLine={false} tickFormatter={v => formatNum(v)} width={65} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v) => formatNum(Number(v ?? 0))} />
              <Line type="monotone" dataKey="SOAT" stroke="#EF4444" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="RTM"  stroke="#E87C2B" strokeWidth={2} dot={false} />
              <Legend wrapperStyle={{ fontSize: 11, color: '#94A3B8' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Pie SOAT vs RTM */}
        <div className="rounded-xl p-5 flex flex-col items-center justify-center" style={{ backgroundColor: '#112236', border: '1px solid #1E3A55' }}>
          <h3 className="font-orbitron text-sm font-semibold mb-4 self-start" style={{ color: '#E2E8F0' }}>
            Distribución
          </h3>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={65} paddingAngle={3} dataKey="value">
                {pieData.map((e, i) => <Cell key={i} fill={e.color} />)}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} formatter={(v) => formatNum(Number(v ?? 0))} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-2 w-full">
            {pieData.map(d => (
              <div key={d.name} className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }} />
                  <span className="text-[10px]" style={{ color: '#94A3B8' }}>{d.name}</span>
                </div>
                <span className="text-[10px] font-mono" style={{ color: '#64748B' }}>
                  {formatNum(d.value)} ({totales.comparendos ? ((d.value/totales.comparendos)*100).toFixed(1) : 0}%)
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Recaudo por ciudad */}
        <div className="rounded-xl p-5" style={{ backgroundColor: '#112236', border: '1px solid #1E3A55' }}>
          <h3 className="font-orbitron text-sm font-semibold mb-4" style={{ color: '#E2E8F0' }}>
            Recaudo por Ciudad — {periodoLabel} (MM COP)
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={recaudoBar} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1E3A55" />
              <XAxis dataKey="ciudad" tick={{ fontSize: 10, fill: '#64748B' }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#64748B' }} tickLine={false} axisLine={false}
                tickFormatter={v => `$${v}M`} width={65} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v) => `$${formatNum(Number(v ?? 0))}M`} />
              <Bar dataKey="Recaudo" radius={[4,4,0,0]} maxBarSize={60}>
                {recaudoBar.map((e, i) => <Cell key={i} fill={e.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Eficiencia vs meta */}
        <div className="rounded-xl p-5" style={{ backgroundColor: '#112236', border: '1px solid #1E3A55' }}>
          <h3 className="font-orbitron text-sm font-semibold mb-4" style={{ color: '#E2E8F0' }}>
            Eficiencia vs Meta (75%)
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={eficienciaData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1E3A55" />
              <XAxis dataKey="ciudad" tick={{ fontSize: 10, fill: '#64748B' }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#64748B' }} tickLine={false} axisLine={false}
                domain={[0, 100]} tickFormatter={v => `${v}%`} width={45} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v) => `${v}%`} />
              <Bar dataKey="Eficiencia" fill="#00B4D8" radius={[4,4,0,0]} maxBarSize={50} />
              <Bar dataKey="Meta" fill="rgba(232,124,43,0.4)" radius={[4,4,0,0]} maxBarSize={50} />
              <Legend wrapperStyle={{ fontSize: 11, color: '#94A3B8' }} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Stats summary */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Promedio diario escaneos', value: formatNum(Math.round(totales.escaneos / dias)), icon: Activity, color: '#00B4D8' },
          { label: 'Promedio diario comparendos', value: formatNum(Math.round(totales.comparendos / dias)), icon: BarChart2, color: '#E87C2B' },
          { label: 'Recaudo promedio diario', value: formatCOP(Math.round(totales.valor / dias)), icon: DollarSign, color: '#22C55E' },
        ].map(stat => (
          <div key={stat.label} className="rounded-xl p-4" style={{ backgroundColor: '#112236', border: '1px solid #1E3A55' }}>
            <div className="flex items-center gap-2 mb-2">
              <stat.icon size={14} style={{ color: stat.color }} />
              <span className="text-xs" style={{ color: '#64748B' }}>{stat.label}</span>
            </div>
            <p className="font-orbitron font-bold text-xl" style={{ color: stat.color }}>{stat.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
