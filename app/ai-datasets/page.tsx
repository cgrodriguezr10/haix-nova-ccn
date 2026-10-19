'use client';

import { Database, CheckCircle, Clock, RefreshCw, TrendingUp } from 'lucide-react';
import { DATASETS } from '@/lib/mock-data';
import { SectionHeader } from '@/components/shared/SectionHeader';
import { KpiCard } from '@/components/shared/KpiCard';
import { formatNum } from '@/lib/mock-data';

const ESTADO_COLOR = {
  Activo:     { bg: 'rgba(34,197,94,0.15)',  text: '#22C55E' },
  Entrenando: { bg: 'rgba(0,180,216,0.15)',  text: '#00B4D8' },
  Pendiente:  { bg: 'rgba(245,158,11,0.15)', text: '#F59E0B' },
};

export default function AiDatasetsPage() {
  const activos     = DATASETS.filter(d => d.estado === 'Activo').length;
  const totalReg    = DATASETS.reduce((s, d) => s + d.registros, 0);
  const precPromedio = (DATASETS.reduce((s, d) => s + d.precision, 0) / DATASETS.length).toFixed(1);

  return (
    <div className="space-y-6">
      <SectionHeader title="IA · Datasets & Modelos" subtitle="Gestión de modelos de visión artificial y datasets de entrenamiento HAIX" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Datasets Totales"    value={String(DATASETS.length)} icon={Database}    color="cyan" />
        <KpiCard label="Activos"             value={String(activos)}         icon={CheckCircle} color="green" />
        <KpiCard label="Total Registros"     value={formatNum(totalReg)}     icon={TrendingUp}  color="purple" />
        <KpiCard label="Precisión Promedio"  value={`${precPromedio}%`}      icon={TrendingUp}  color="naranja" />
      </div>
      <div className="grid grid-cols-1 gap-4">
        {DATASETS.map(ds => {
          const ec = ESTADO_COLOR[ds.estado];
          return (
            <div key={ds.id} className="rounded-xl p-5" style={{ backgroundColor: '#112236', border: '1px solid #1E3A55' }}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4 flex-1">
                  <div className="p-2.5 rounded-xl shrink-0" style={{ backgroundColor: 'rgba(0,180,216,0.15)' }}>
                    <Database size={18} style={{ color: '#00B4D8' }} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 flex-wrap mb-1">
                      <h3 className="font-orbitron text-sm font-bold" style={{ color: '#E2E8F0' }}>{ds.nombre}</h3>
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: ec.bg, color: ec.text }}>{ds.estado}</span>
                      <span className="text-[10px] font-mono" style={{ color: '#64748B' }}>v{ds.version}</span>
                      <span className="text-[10px]" style={{ color: '#64748B' }}>{ds.ciudad}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-6 mt-3">
                      <div>
                        <p className="text-[10px]" style={{ color: '#64748B' }}>Registros</p>
                        <p className="font-mono font-bold text-sm" style={{ color: '#00B4D8' }}>{formatNum(ds.registros)}</p>
                      </div>
                      <div>
                        <p className="text-[10px]" style={{ color: '#64748B' }}>Precisión</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: '#0A1628' }}>
                            <div className="h-full rounded-full" style={{ width: `${ds.precision}%`, backgroundColor: ds.precision > 95 ? '#22C55E' : '#F59E0B' }} />
                          </div>
                          <span className="font-mono text-xs font-bold" style={{ color: ds.precision > 95 ? '#22C55E' : '#F59E0B' }}>{ds.precision}%</span>
                        </div>
                      </div>
                      <div>
                        <p className="text-[10px]" style={{ color: '#64748B' }}>Último entrenamiento</p>
                        <p className="text-xs" style={{ color: '#94A3B8' }}>{ds.ultimoEntrenamiento}</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {ds.estado === 'Entrenando' && <RefreshCw size={14} className="animate-spin" style={{ color: '#00B4D8' }} />}
                  {ds.estado === 'Pendiente'  && <Clock size={14} style={{ color: '#F59E0B' }} />}
                  <span className="text-[10px]" style={{ color: '#374151' }}>{ds.id}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
