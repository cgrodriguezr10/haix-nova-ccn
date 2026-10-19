'use client';

import { useState } from 'react';
import { Users, Activity, Clock, TrendingUp, Shield, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import {
  AGENTES, CIUDAD_CONFIG, METRICS_POR_CIUDAD, METRICS_NACIONAL,
  formatNum,
  type Ciudad, type AgentStatus,
} from '@/lib/mock-data';
import { KpiCard } from '@/components/shared/KpiCard';
import { SectionHeader } from '@/components/shared/SectionHeader';

const STATUS_COLOR: Record<AgentStatus, { bg: string; text: string }> = {
  'Activo':       { bg: 'rgba(34,197,94,0.15)',   text: '#22C55E' },
  'En pausa':     { bg: 'rgba(245,158,11,0.15)',   text: '#F59E0B' },
  'Inactivo':     { bg: 'rgba(100,116,139,0.15)',  text: '#64748B' },
  'Desconectado': { bg: 'rgba(239,68,68,0.15)',    text: '#EF4444' },
};

const PAGE_SIZE = 12;

export default function AgentesPage() {
  const { filtroCiudad } = useAppStore();
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<AgentStatus | 'Todos'>('Todos');

  const isNacional = filtroCiudad === 'Todas';
  const metrics = isNacional ? METRICS_NACIONAL : METRICS_POR_CIUDAD[filtroCiudad as Ciudad];
  const agentesTotal  = 'agentesTotal' in metrics ? metrics.agentesTotal : metrics.agentes;
  const agentesActivos = metrics.agentesActivos;
  const eficiencia = 'eficienciaPromedio' in metrics ? metrics.eficienciaPromedio : metrics.eficiencia;

  const filtered = AGENTES
    .filter(a => isNacional || a.ciudad === filtroCiudad)
    .filter(a => statusFilter === 'Todos' || a.status === statusFilter)
    .filter(a =>
      search === '' ||
      a.nombre.toLowerCase().includes(search.toLowerCase()) ||
      a.id.toLowerCase().includes(search.toLowerCase()) ||
      a.cedula.includes(search)
    );

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const countByStatus = (s: AgentStatus) => AGENTES.filter(a => (isNacional || a.ciudad === filtroCiudad) && a.status === s).length;

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Gestión de Agentes"
        subtitle={`${isNacional ? '4 ciudades' : filtroCiudad} · ${formatNum(agentesTotal)} agentes registrados`}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Agentes Totales"  value={formatNum(agentesTotal)}   icon={Users}     color="cyan" />
        <KpiCard label="Activos Ahora"    value={formatNum(agentesActivos)}  icon={Activity}  color="green" />
        <KpiCard label="En Pausa"         value={formatNum(countByStatus('En pausa'))} icon={Clock}    color="naranja" />
        <KpiCard label="Eficiencia Prom." value={`${eficiencia}%`}           icon={TrendingUp} color="purple" />
      </div>

      {/* Filters bar */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          {(['Todos', 'Activo', 'En pausa', 'Inactivo', 'Desconectado'] as const).map(s => (
            <button
              key={s}
              onClick={() => { setStatusFilter(s); setPage(0); }}
              className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
              style={{
                backgroundColor: statusFilter === s ? (s === 'Todos' ? 'rgba(0,180,216,0.2)' : STATUS_COLOR[s as AgentStatus]?.bg ?? 'rgba(0,180,216,0.2)') : 'rgba(255,255,255,0.04)',
                color: statusFilter === s ? (s === 'Todos' ? '#00B4D8' : STATUS_COLOR[s as AgentStatus]?.text ?? '#00B4D8') : '#64748B',
                border: `1px solid ${statusFilter === s ? 'rgba(0,180,216,0.3)' : '#1E3A55'}`,
              }}
            >
              {s} {s !== 'Todos' && `(${countByStatus(s as AgentStatus)})`}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ backgroundColor: '#0A1628', border: '1px solid #1E3A55' }}>
          <Search size={13} style={{ color: '#64748B' }} />
          <input
            type="text"
            placeholder="Buscar por nombre, ID o cédula..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(0); }}
            className="bg-transparent text-xs outline-none w-56"
            style={{ color: '#E2E8F0' }}
          />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl overflow-hidden" style={{ border: '1px solid #1E3A55' }}>
        <table className="w-full text-xs">
          <thead>
            <tr style={{ backgroundColor: '#0A1628', borderBottom: '1px solid #1E3A55' }}>
              {['ID','Agente','Ciudad','Zona','Turno','Estado','Escaneos/día','Comparendos','Efic.','Última conexión'].map(h => (
                <th key={h} className="px-4 py-3 text-left font-medium font-orbitron tracking-wide" style={{ color: '#64748B' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paged.map((a, i) => (
              <tr
                key={a.id}
                className="transition-colors hover:bg-white/[0.02]"
                style={{
                  borderBottom: i < paged.length - 1 ? '1px solid #1E3A55' : 'none',
                  backgroundColor: i % 2 === 0 ? 'rgba(17,34,54,0.5)' : 'transparent',
                }}
              >
                <td className="px-4 py-3 font-mono" style={{ color: '#64748B' }}>{a.id}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0"
                      style={{ backgroundColor: CIUDAD_CONFIG[a.ciudad].color + '30', color: CIUDAD_CONFIG[a.ciudad].color }}>
                      {a.nombre.charAt(0)}
                    </div>
                    <span style={{ color: '#E2E8F0' }}>{a.nombre}</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: CIUDAD_CONFIG[a.ciudad].color }} />
                    <span style={{ color: '#94A3B8' }}>{a.ciudad}</span>
                  </div>
                </td>
                <td className="px-4 py-3" style={{ color: '#94A3B8' }}>{a.zona}</td>
                <td className="px-4 py-3" style={{ color: '#64748B' }}>{a.turno}</td>
                <td className="px-4 py-3">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-medium"
                    style={{ backgroundColor: STATUS_COLOR[a.status].bg, color: STATUS_COLOR[a.status].text }}>
                    {a.status}
                  </span>
                </td>
                <td className="px-4 py-3 font-mono" style={{ color: '#00B4D8' }}>{formatNum(a.escaneosDia)}</td>
                <td className="px-4 py-3 font-mono" style={{ color: '#E87C2B' }}>{formatNum(a.comparendosDia)}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: '#0A1628' }}>
                      <div className="h-full rounded-full" style={{ width: `${a.eficiencia}%`, backgroundColor: a.eficiencia >= 70 ? '#22C55E' : '#E87C2B' }} />
                    </div>
                    <span style={{ color: a.eficiencia >= 70 ? '#22C55E' : '#E87C2B' }}>{a.eficiencia}%</span>
                  </div>
                </td>
                <td className="px-4 py-3" style={{ color: '#64748B' }}>{a.ultimaConexion}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between px-1">
        <p className="text-[10px]" style={{ color: '#64748B' }}>
          {filtered.length} agentes · Página {page + 1} de {totalPages}
        </p>
        <div className="flex gap-1">
          <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
            className="p-1.5 rounded hover:bg-white/5 disabled:opacity-30" style={{ color: '#64748B', border: '1px solid #1E3A55' }}>
            <ChevronLeft size={14} />
          </button>
          <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page === totalPages - 1}
            className="p-1.5 rounded hover:bg-white/5 disabled:opacity-30" style={{ color: '#64748B', border: '1px solid #1E3A55' }}>
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      {/* Zone summary */}
      <div className="grid grid-cols-4 gap-4">
        {(['Norte','Sur','Centro','Occidente'] as const).map(zona => {
          const count = filtered.filter(a => a.zona === zona).length;
          const activos = filtered.filter(a => a.zona === zona && a.status === 'Activo').length;
          return (
            <div key={zona} className="rounded-xl p-4" style={{ backgroundColor: '#112236', border: '1px solid #1E3A55' }}>
              <div className="flex items-center gap-2 mb-3">
                <Shield size={14} style={{ color: '#00B4D8' }} />
                <span className="text-xs font-orbitron font-semibold" style={{ color: '#E2E8F0' }}>Zona {zona}</span>
              </div>
              <p className="font-orbitron font-bold text-xl" style={{ color: '#00B4D8' }}>{activos}</p>
              <p className="text-[10px] mt-1" style={{ color: '#64748B' }}>activos de {count} total</p>
              <div className="mt-2 h-1 rounded-full overflow-hidden" style={{ backgroundColor: '#0A1628' }}>
                <div className="h-full rounded-full" style={{ width: count ? `${(activos/count)*100}%` : '0%', backgroundColor: '#00B4D8' }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
