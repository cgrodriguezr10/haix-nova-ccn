'use client';

import { FileText, CheckCircle, Clock, Calendar, Download } from 'lucide-react';
import { REPORTES, CIUDAD_CONFIG, formatNum, formatCOP } from '@/lib/mock-data';
import { SectionHeader } from '@/components/shared/SectionHeader';
import { KpiCard } from '@/components/shared/KpiCard';
import { useAppStore } from '@/store/useAppStore';
import type { Ciudad } from '@/lib/mock-data';

const ESTADO_COLOR = {
  Generado:   { bg: 'rgba(34,197,94,0.15)',  text: '#22C55E' },
  Pendiente:  { bg: 'rgba(245,158,11,0.15)', text: '#F59E0B' },
  Programado: { bg: 'rgba(0,180,216,0.15)',  text: '#00B4D8' },
};
const TIPO_COLOR = {
  Diario:      '#00B4D8',
  Semanal:     '#A78BFA',
  Mensual:     '#22C55E',
  Trimestral:  '#E87C2B',
};

export default function ReportesPage() {
  const { filtroCiudad } = useAppStore();
  const isNacional = filtroCiudad === 'Todas';
  const filtered = REPORTES.filter(r => isNacional || r.ciudad === filtroCiudad || r.ciudad === 'Nacional');

  return (
    <div className="space-y-6">
      <SectionHeader title="Reportes Operativos" subtitle={`${isNacional ? 'Nacional' : filtroCiudad} · Generación automática y manual · 14 oct 2026`} />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Total Reportes"  value={String(filtered.length)}                                    icon={FileText}    color="cyan" />
        <KpiCard label="Generados"       value={String(filtered.filter(r=>r.estado==='Generado').length)}   icon={CheckCircle} color="green" />
        <KpiCard label="Pendientes"      value={String(filtered.filter(r=>r.estado==='Pendiente').length)}  icon={Clock}       color="naranja" />
        <KpiCard label="Programados"     value={String(filtered.filter(r=>r.estado==='Programado').length)} icon={Calendar}    color="purple" />
      </div>
      <div className="rounded-xl overflow-hidden" style={{ border: '1px solid #1E3A55' }}>
        <table className="w-full text-xs">
          <thead>
            <tr style={{ backgroundColor: '#0A1628', borderBottom: '1px solid #1E3A55' }}>
              {['ID','Reporte','Ciudad','Tipo','Fecha','Comparendos','Valor','Estado',''].map(h => (
                <th key={h} className="px-4 py-3 text-left font-medium font-orbitron tracking-wide" style={{ color: '#64748B' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((r, i) => {
              const ec = ESTADO_COLOR[r.estado];
              const tc = TIPO_COLOR[r.tipo];
              const cColor = r.ciudad !== 'Nacional' ? CIUDAD_CONFIG[r.ciudad as Ciudad].color : '#A78BFA';
              return (
                <tr key={r.id} className="hover:bg-white/[0.02]"
                  style={{ borderBottom: i < filtered.length-1 ? '1px solid #1E3A55' : 'none', backgroundColor: i%2===0 ? 'rgba(17,34,54,0.5)' : 'transparent' }}>
                  <td className="px-4 py-3 font-mono" style={{ color: '#64748B' }}>{r.id}</td>
                  <td className="px-4 py-3" style={{ color: '#E2E8F0' }}>{r.titulo}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: cColor }} />
                      <span style={{ color: '#94A3B8' }}>{r.ciudad}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3"><span className="text-[10px] px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: tc+'20', color: tc }}>{r.tipo}</span></td>
                  <td className="px-4 py-3 font-mono" style={{ color: '#64748B' }}>{r.fecha}</td>
                  <td className="px-4 py-3 font-mono" style={{ color: '#E87C2B' }}>{r.comparendos > 0 ? formatNum(r.comparendos) : '—'}</td>
                  <td className="px-4 py-3 font-mono" style={{ color: '#22C55E' }}>{r.valor > 0 ? formatCOP(r.valor) : '—'}</td>
                  <td className="px-4 py-3"><span className="px-2 py-0.5 rounded-full text-[10px] font-medium" style={{ backgroundColor: ec.bg, color: ec.text }}>{r.estado}</span></td>
                  <td className="px-4 py-3">
                    {r.estado === 'Generado' && (
                      <button className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-[10px] font-medium transition-colors hover:opacity-80"
                        style={{ backgroundColor: 'rgba(0,180,216,0.15)', color: '#00B4D8', border: '1px solid rgba(0,180,216,0.3)' }}>
                        <Download size={11} />PDF
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="grid grid-cols-4 gap-4">
        {(['Diario','Semanal','Mensual','Trimestral'] as const).map(tipo => {
          const count = filtered.filter(r => r.tipo === tipo);
          const tc = TIPO_COLOR[tipo];
          return (
            <div key={tipo} className="rounded-xl p-4" style={{ backgroundColor: '#112236', border: '1px solid #1E3A55' }}>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: tc+'20', color: tc }}>{tipo}</span>
              <p className="font-orbitron font-bold text-2xl mt-2" style={{ color: tc }}>{count.length}</p>
              <p className="text-[10px] mt-1" style={{ color: '#64748B' }}>{count.filter(r=>r.estado==='Generado').length} generados</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
