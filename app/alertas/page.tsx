'use client';

import { useState } from 'react';
import { AlertTriangle, FileX, CheckCircle, Clock, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import {
  ALERTAS, CIUDAD_CONFIG,
  formatNum, formatCOP,
  type Ciudad,
} from '@/lib/mock-data';
import { KpiCard } from '@/components/shared/KpiCard';
import { SectionHeader } from '@/components/shared/SectionHeader';

const PAGE_SIZE = 15;

export default function AlertasPage() {
  const { filtroCiudad } = useAppStore();
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');
  const [tipoFilter, setTipoFilter] = useState<'Todos' | 'C02' | 'C03'>('Todos');
  const [estadoFilter, setEstadoFilter] = useState<'Todos' | 'Activa' | 'Pendiente' | 'Procesada'>('Todos');

  const isNacional = filtroCiudad === 'Todas';

  const base = ALERTAS
    .filter(a => isNacional || a.ciudad === (filtroCiudad as Ciudad))
    .filter(a => tipoFilter === 'Todos' || a.tipo === tipoFilter)
    .filter(a => estadoFilter === 'Todos' || a.estado === estadoFilter)
    .filter(a =>
      search === '' ||
      a.placa.toLowerCase().includes(search.toLowerCase()) ||
      a.id.toLowerCase().includes(search.toLowerCase()) ||
      a.agente.toLowerCase().includes(search.toLowerCase())
    );

  const totalPages = Math.ceil(base.length / PAGE_SIZE);
  const paged = base.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const totalAlertas = ALERTAS.filter(a => isNacional || a.ciudad === (filtroCiudad as Ciudad));
  const activas    = totalAlertas.filter(a => a.estado === 'Activa').length;
  const pendientes = totalAlertas.filter(a => a.estado === 'Pendiente').length;
  const procesadas = totalAlertas.filter(a => a.estado === 'Procesada').length;
  const totalValor = totalAlertas.reduce((s, a) => s + a.valorComparendo, 0);

  const tiempoPromedio = (minutos: number) => {
    const ts = new Date(minutos);
    const mins = Math.floor((Date.now() - ts.getTime()) / 60000);
    if (mins < 60) return `${mins} min`;
    return `${Math.floor(mins/60)}h ${mins%60}min`;
  };

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Centro de Alertas"
        subtitle={`${isNacional ? 'Nacional' : filtroCiudad} · Solo infracciones SOAT (C02) y RTM (C03) · ${new Date('2026-10-14T14:30:00').toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })}`}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Total Alertas"    value={formatNum(totalAlertas.length)} icon={AlertTriangle} color="naranja" />
        <KpiCard label="Activas Ahora"    value={formatNum(activas)}             icon={FileX}         color="red" />
        <KpiCard label="Pendiente Proc."  value={formatNum(pendientes)}          icon={Clock}         color="naranja" />
        <KpiCard label="Valor Comparendos" value={formatCOP(totalValor)}         icon={CheckCircle}   color="green"
          sub={`${formatNum(procesadas)} procesados`} />
      </div>

      {/* Filters */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="text-xs mr-1" style={{ color: '#64748B' }}>Tipo:</span>
          {(['Todos','C02','C03'] as const).map(t => (
            <button key={t} onClick={() => { setTipoFilter(t); setPage(0); }}
              className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
              style={{
                backgroundColor: tipoFilter === t ? (t === 'C02' ? 'rgba(239,68,68,0.2)' : t === 'C03' ? 'rgba(232,124,43,0.2)' : 'rgba(0,180,216,0.2)') : 'rgba(255,255,255,0.04)',
                color: tipoFilter === t ? (t === 'C02' ? '#EF4444' : t === 'C03' ? '#E87C2B' : '#00B4D8') : '#64748B',
                border: '1px solid #1E3A55',
              }}>
              {t === 'C02' ? '⚠ C02 SOAT' : t === 'C03' ? '⚠ C03 RTM' : 'Todos'}
            </button>
          ))}
          <span className="text-xs ml-2 mr-1" style={{ color: '#64748B' }}>Estado:</span>
          {(['Todos','Activa','Pendiente','Procesada'] as const).map(e => (
            <button key={e} onClick={() => { setEstadoFilter(e); setPage(0); }}
              className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
              style={{
                backgroundColor: estadoFilter === e ? 'rgba(0,180,216,0.2)' : 'rgba(255,255,255,0.04)',
                color: estadoFilter === e ? '#00B4D8' : '#64748B',
                border: '1px solid #1E3A55',
              }}>
              {e}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ backgroundColor: '#0A1628', border: '1px solid #1E3A55' }}>
          <Search size={13} style={{ color: '#64748B' }} />
          <input
            type="text"
            placeholder="Placa, ID o Agente..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(0); }}
            className="bg-transparent text-xs outline-none w-48"
            style={{ color: '#E2E8F0' }}
          />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl overflow-hidden" style={{ border: '1px solid #1E3A55' }}>
        <table className="w-full text-xs">
          <thead>
            <tr style={{ backgroundColor: '#0A1628', borderBottom: '1px solid #1E3A55' }}>
              {['ID','Placa','Infracción','Ciudad','Agente','Valor','Estado','Hace'].map(h => (
                <th key={h} className="px-4 py-3 text-left font-medium font-orbitron tracking-wide" style={{ color: '#64748B' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paged.map((a, i) => (
              <tr key={a.id}
                className="transition-colors hover:bg-white/[0.02]"
                style={{
                  borderBottom: i < paged.length - 1 ? '1px solid #1E3A55' : 'none',
                  backgroundColor: i % 2 === 0 ? 'rgba(17,34,54,0.5)' : 'transparent',
                }}>
                <td className="px-4 py-3 font-mono" style={{ color: '#64748B' }}>{a.id}</td>
                <td className="px-4 py-3 font-mono font-bold" style={{ color: '#E2E8F0' }}>{a.placa}</td>
                <td className="px-4 py-3">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold"
                    style={{
                      backgroundColor: a.tipo === 'C02' ? 'rgba(239,68,68,0.15)' : 'rgba(232,124,43,0.15)',
                      color: a.tipo === 'C02' ? '#EF4444' : '#E87C2B',
                    }}>
                    {a.tipo} · {a.descripcion}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: CIUDAD_CONFIG[a.ciudad].color }} />
                    <span style={{ color: '#94A3B8' }}>{a.ciudad}</span>
                  </div>
                </td>
                <td className="px-4 py-3" style={{ color: '#94A3B8' }}>{a.agente.split(' ').slice(0,2).join(' ')}</td>
                <td className="px-4 py-3 font-mono" style={{ color: '#22C55E' }}>{formatCOP(a.valorComparendo)}</td>
                <td className="px-4 py-3">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-medium"
                    style={{
                      backgroundColor: a.estado === 'Activa' ? 'rgba(239,68,68,0.15)' : a.estado === 'Pendiente' ? 'rgba(245,158,11,0.15)' : 'rgba(34,197,94,0.15)',
                      color: a.estado === 'Activa' ? '#EF4444' : a.estado === 'Pendiente' ? '#F59E0B' : '#22C55E',
                    }}>
                    {a.estado}
                  </span>
                </td>
                <td className="px-4 py-3" style={{ color: '#64748B' }}>
                  {tiempoPromedio(new Date(a.timestamp).getTime())}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between px-1">
        <p className="text-[10px]" style={{ color: '#64748B' }}>
          {base.length} alertas · Página {page + 1} de {Math.max(1, totalPages)}
        </p>
        <div className="flex gap-1">
          <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
            className="p-1.5 rounded hover:bg-white/5 disabled:opacity-30" style={{ color: '#64748B', border: '1px solid #1E3A55' }}>
            <ChevronLeft size={14} />
          </button>
          <button onClick={() => setPage(p => Math.min(Math.max(0, totalPages - 1), p + 1))} disabled={page >= totalPages - 1}
            className="p-1.5 rounded hover:bg-white/5 disabled:opacity-30" style={{ color: '#64748B', border: '1px solid #1E3A55' }}>
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      {/* Summary by city */}
      {isNacional && (
        <div className="grid grid-cols-4 gap-4">
          {(['Bogotá','Cali','Medellín','Barranquilla'] as Ciudad[]).map(c => {
            const cts = ALERTAS.filter(a => a.ciudad === c);
            const cActivas = cts.filter(a => a.estado === 'Activa').length;
            return (
              <div key={c} className="rounded-xl p-4" style={{ backgroundColor: '#112236', border: '1px solid #1E3A55' }}>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: CIUDAD_CONFIG[c].color }} />
                  <span className="text-xs font-orbitron font-semibold" style={{ color: '#E2E8F0' }}>{c}</span>
                </div>
                <p className="font-orbitron font-bold text-2xl" style={{ color: CIUDAD_CONFIG[c].color }}>{cts.length}</p>
                <p className="text-[10px] mt-1" style={{ color: '#64748B' }}>{cActivas} activas · {cts.length - cActivas} procesadas</p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
