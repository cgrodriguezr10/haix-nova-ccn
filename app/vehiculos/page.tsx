'use client';

import { useState } from 'react';
import { Car, FileX, CheckCircle, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { VEHICULOS_DETECTADOS, CIUDAD_CONFIG, formatNum, formatCOP, type Ciudad } from '@/lib/mock-data';
import { KpiCard } from '@/components/shared/KpiCard';
import { SectionHeader } from '@/components/shared/SectionHeader';

const PAGE_SIZE = 15;

export default function VehiculosPage() {
  const { filtroCiudad } = useAppStore();
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');
  const [tipoFilter, setTipoFilter] = useState<'Todos' | 'SOAT Vencido' | 'RTM Vencida'>('Todos');
  const isNacional = filtroCiudad === 'Todas';

  const base = VEHICULOS_DETECTADOS
    .filter(v => isNacional || v.ciudad === (filtroCiudad as Ciudad))
    .filter(v => tipoFilter === 'Todos' || v.tipoInfraccion === tipoFilter)
    .filter(v => search === '' || v.placa.toLowerCase().includes(search.toLowerCase()) || v.id.toLowerCase().includes(search.toLowerCase()));

  const all = VEHICULOS_DETECTADOS.filter(v => isNacional || v.ciudad === (filtroCiudad as Ciudad));
  const totalPages = Math.ceil(base.length / PAGE_SIZE);
  const paged = base.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const soatCount = all.filter(v => v.tipoInfraccion === 'SOAT Vencido').length;
  const rtmCount  = all.filter(v => v.tipoInfraccion === 'RTM Vencida').length;
  const totalValor = all.reduce((s, v) => s + v.valorComparendo, 0);

  const formatFecha = (ts: string) => new Date(ts).toLocaleString('es-CO', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });

  return (
    <div className="space-y-6">
      <SectionHeader title="Vehículos Detectados" subtitle={`${isNacional ? 'Nacional' : filtroCiudad} · Solo infracciones SOAT y RTM · 14 oct 2026`} />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Total Detectados"  value={formatNum(all.length)}   icon={Car}         color="cyan" />
        <KpiCard label="SOAT Vencido (C02)" value={formatNum(soatCount)}   icon={FileX}       color="red" />
        <KpiCard label="RTM Vencida (C03)" value={formatNum(rtmCount)}     icon={FileX}       color="naranja" />
        <KpiCard label="Valor Total"       value={formatCOP(totalValor)}   icon={CheckCircle} color="green" />
      </div>

      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          {(['Todos','SOAT Vencido','RTM Vencida'] as const).map(t => (
            <button key={t} onClick={() => { setTipoFilter(t); setPage(0); }}
              className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
              style={{
                backgroundColor: tipoFilter === t ? (t === 'SOAT Vencido' ? 'rgba(239,68,68,0.2)' : t === 'RTM Vencida' ? 'rgba(232,124,43,0.2)' : 'rgba(0,180,216,0.2)') : 'rgba(255,255,255,0.04)',
                color: tipoFilter === t ? (t === 'SOAT Vencido' ? '#EF4444' : t === 'RTM Vencida' ? '#E87C2B' : '#00B4D8') : '#64748B',
                border: '1px solid #1E3A55',
              }}>
              {t === 'SOAT Vencido' ? '⚠ SOAT Vencido' : t === 'RTM Vencida' ? '⚠ RTM Vencida' : 'Todos'}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ backgroundColor: '#0A1628', border: '1px solid #1E3A55' }}>
          <Search size={13} style={{ color: '#64748B' }} />
          <input type="text" placeholder="Placa o ID..." value={search}
            onChange={e => { setSearch(e.target.value); setPage(0); }}
            className="bg-transparent text-xs outline-none w-44" style={{ color: '#E2E8F0' }} />
        </div>
      </div>

      <div className="rounded-xl overflow-hidden" style={{ border: '1px solid #1E3A55' }}>
        <table className="w-full text-xs">
          <thead>
            <tr style={{ backgroundColor: '#0A1628', borderBottom: '1px solid #1E3A55' }}>
              {['ID','Placa','Infracción','Código','Ciudad','Agente','Fecha Detección','Estado','Valor'].map(h => (
                <th key={h} className="px-4 py-3 text-left font-medium font-orbitron tracking-wide" style={{ color: '#64748B' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paged.map((v, i) => (
              <tr key={v.id} className="hover:bg-white/[0.02]"
                style={{ borderBottom: i < paged.length - 1 ? '1px solid #1E3A55' : 'none', backgroundColor: i % 2 === 0 ? 'rgba(17,34,54,0.5)' : 'transparent' }}>
                <td className="px-4 py-3 font-mono" style={{ color: '#64748B' }}>{v.id}</td>
                <td className="px-4 py-3 font-mono font-bold" style={{ color: '#E2E8F0' }}>{v.placa}</td>
                <td className="px-4 py-3">
                  <span className="px-2 py-0.5 rounded text-[10px] font-medium"
                    style={{ backgroundColor: v.tipoInfraccion === 'SOAT Vencido' ? 'rgba(239,68,68,0.15)' : 'rgba(232,124,43,0.15)', color: v.tipoInfraccion === 'SOAT Vencido' ? '#EF4444' : '#E87C2B' }}>
                    {v.tipoInfraccion}
                  </span>
                </td>
                <td className="px-4 py-3 font-mono font-bold" style={{ color: v.codigoComparendo === 'C02' ? '#EF4444' : '#E87C2B' }}>{v.codigoComparendo}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: CIUDAD_CONFIG[v.ciudad].color }} />
                    <span style={{ color: '#94A3B8' }}>{v.ciudad}</span>
                  </div>
                </td>
                <td className="px-4 py-3" style={{ color: '#94A3B8' }}>{v.agente.split(' ').slice(0,2).join(' ')}</td>
                <td className="px-4 py-3" style={{ color: '#64748B' }}>{formatFecha(v.fechaDeteccion)}</td>
                <td className="px-4 py-3">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-medium"
                    style={{
                      backgroundColor: v.estado === 'Comparendo generado' ? 'rgba(34,197,94,0.15)' : v.estado === 'Notificado' ? 'rgba(0,180,216,0.15)' : 'rgba(245,158,11,0.15)',
                      color: v.estado === 'Comparendo generado' ? '#22C55E' : v.estado === 'Notificado' ? '#00B4D8' : '#F59E0B',
                    }}>
                    {v.estado}
                  </span>
                </td>
                <td className="px-4 py-3 font-mono" style={{ color: '#22C55E' }}>{formatCOP(v.valorComparendo)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between px-1">
        <p className="text-[10px]" style={{ color: '#64748B' }}>{base.length} vehículos · Página {page + 1} de {Math.max(1, totalPages)}</p>
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
    </div>
  );
}
