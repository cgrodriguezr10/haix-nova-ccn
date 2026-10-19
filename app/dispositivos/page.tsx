'use client';

import { useState } from 'react';
import { Cpu, Battery, Thermometer, Wifi, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { DISPOSITIVOS, CIUDAD_CONFIG, formatNum, type Ciudad, type DispositivoStatus } from '@/lib/mock-data';
import { KpiCard } from '@/components/shared/KpiCard';
import { SectionHeader } from '@/components/shared/SectionHeader';

const STATUS_COLOR: Record<DispositivoStatus, { bg: string; text: string }> = {
  'Operativo':     { bg: 'rgba(34,197,94,0.15)',   text: '#22C55E' },
  'Mantenimiento': { bg: 'rgba(245,158,11,0.15)',   text: '#F59E0B' },
  'Falla':         { bg: 'rgba(239,68,68,0.15)',    text: '#EF4444' },
  'Inactivo':      { bg: 'rgba(100,116,139,0.15)',  text: '#64748B' },
};

const PAGE_SIZE = 12;

export default function DispositivosPage() {
  const { filtroCiudad } = useAppStore();
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<DispositivoStatus | 'Todos'>('Todos');
  const isNacional = filtroCiudad === 'Todas';

  const base = DISPOSITIVOS
    .filter(d => isNacional || d.ciudad === (filtroCiudad as Ciudad))
    .filter(d => statusFilter === 'Todos' || d.status === statusFilter)
    .filter(d => search === '' || d.serial.toLowerCase().includes(search.toLowerCase()) || d.agenteAsignado.toLowerCase().includes(search.toLowerCase()));

  const totalPages = Math.ceil(base.length / PAGE_SIZE);
  const paged = base.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const countStatus = (s: DispositivoStatus) => DISPOSITIVOS.filter(d => (isNacional || d.ciudad === (filtroCiudad as Ciudad)) && d.status === s).length;
  const all = DISPOSITIVOS.filter(d => isNacional || d.ciudad === (filtroCiudad as Ciudad));

  return (
    <div className="space-y-6">
      <SectionHeader title="Dispositivos DHNa3" subtitle={`${isNacional ? 'Nacional' : filtroCiudad} · Firmware v2.4.1`} />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Total Dispositivos"  value={formatNum(all.length)}                icon={Cpu}          color="cyan" />
        <KpiCard label="Operativos"          value={formatNum(countStatus('Operativo'))}   icon={Wifi}         color="green" />
        <KpiCard label="Mantenimiento"       value={formatNum(countStatus('Mantenimiento'))} icon={Thermometer} color="naranja" />
        <KpiCard label="Falla / Inactivo"    value={formatNum(countStatus('Falla') + countStatus('Inactivo'))} icon={Battery} color="red" />
      </div>

      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          {(['Todos','Operativo','Mantenimiento','Falla','Inactivo'] as const).map(s => (
            <button key={s} onClick={() => { setStatusFilter(s); setPage(0); }}
              className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
              style={{
                backgroundColor: statusFilter === s ? (s === 'Todos' ? 'rgba(0,180,216,0.2)' : STATUS_COLOR[s as DispositivoStatus]?.bg) : 'rgba(255,255,255,0.04)',
                color: statusFilter === s ? (s === 'Todos' ? '#00B4D8' : STATUS_COLOR[s as DispositivoStatus]?.text) : '#64748B',
                border: '1px solid #1E3A55',
              }}>
              {s}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ backgroundColor: '#0A1628', border: '1px solid #1E3A55' }}>
          <Search size={13} style={{ color: '#64748B' }} />
          <input type="text" placeholder="Serial o agente..." value={search}
            onChange={e => { setSearch(e.target.value); setPage(0); }}
            className="bg-transparent text-xs outline-none w-48" style={{ color: '#E2E8F0' }} />
        </div>
      </div>

      <div className="rounded-xl overflow-hidden" style={{ border: '1px solid #1E3A55' }}>
        <table className="w-full text-xs">
          <thead>
            <tr style={{ backgroundColor: '#0A1628', borderBottom: '1px solid #1E3A55' }}>
              {['Serial','Ciudad','Agente Asignado','Estado','Batería','Temp.','Escaneos/día','Última Sync','Firmware'].map(h => (
                <th key={h} className="px-4 py-3 text-left font-medium font-orbitron tracking-wide" style={{ color: '#64748B' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paged.map((d, i) => (
              <tr key={d.id} className="hover:bg-white/[0.02]"
                style={{ borderBottom: i < paged.length - 1 ? '1px solid #1E3A55' : 'none', backgroundColor: i % 2 === 0 ? 'rgba(17,34,54,0.5)' : 'transparent' }}>
                <td className="px-4 py-3 font-mono text-[11px]" style={{ color: '#00B4D8' }}>{d.serial}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: CIUDAD_CONFIG[d.ciudad].color }} />
                    <span style={{ color: '#94A3B8' }}>{d.ciudad}</span>
                  </div>
                </td>
                <td className="px-4 py-3" style={{ color: '#E2E8F0' }}>{d.agenteAsignado.split(' ').slice(0,2).join(' ')}</td>
                <td className="px-4 py-3">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-medium"
                    style={{ backgroundColor: STATUS_COLOR[d.status].bg, color: STATUS_COLOR[d.status].text }}>
                    {d.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-12 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: '#0A1628' }}>
                      <div className="h-full rounded-full" style={{ width: `${d.bateria}%`, backgroundColor: d.bateria > 50 ? '#22C55E' : d.bateria > 20 ? '#F59E0B' : '#EF4444' }} />
                    </div>
                    <span className="font-mono" style={{ color: d.bateria > 50 ? '#22C55E' : d.bateria > 20 ? '#F59E0B' : '#EF4444' }}>{d.bateria}%</span>
                  </div>
                </td>
                <td className="px-4 py-3 font-mono" style={{ color: d.temperatura > 38 ? '#EF4444' : '#94A3B8' }}>{d.temperatura}°C</td>
                <td className="px-4 py-3 font-mono" style={{ color: '#94A3B8' }}>{formatNum(d.escaneosDia)}</td>
                <td className="px-4 py-3" style={{ color: '#64748B' }}>{d.ultimaSync}</td>
                <td className="px-4 py-3 font-mono text-[10px]" style={{ color: '#64748B' }}>v{d.firmwareVersion}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between px-1">
        <p className="text-[10px]" style={{ color: '#64748B' }}>{base.length} dispositivos · Página {page + 1} de {Math.max(1, totalPages)}</p>
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
