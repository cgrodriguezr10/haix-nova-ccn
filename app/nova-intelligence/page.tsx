'use client';

import { Brain, TrendingUp, AlertTriangle, Zap, Target, Activity } from 'lucide-react';
import { NOVA_INSIGHTS, CIUDAD_CONFIG } from '@/lib/mock-data';
import { SectionHeader } from '@/components/shared/SectionHeader';
import { KpiCard } from '@/components/shared/KpiCard';
import { useAppStore } from '@/store/useAppStore';
import type { Ciudad } from '@/lib/mock-data';

const TIPO_CONFIG = {
  Prediccion:   { icon: TrendingUp,    color: '#00B4D8',  label: 'Predicción' },
  Anomalia:     { icon: AlertTriangle, color: '#EF4444',  label: 'Anomalía' },
  Optimizacion: { icon: Target,        color: '#22C55E',  label: 'Optimización' },
  Alerta:       { icon: Zap,           color: '#E87C2B',  label: 'Alerta' },
};
const IMPACTO_COLOR = {
  Alto:  { bg: 'rgba(239,68,68,0.15)',   text: '#EF4444' },
  Medio: { bg: 'rgba(245,158,11,0.15)',  text: '#F59E0B' },
  Bajo:  { bg: 'rgba(34,197,94,0.15)',   text: '#22C55E' },
};

export default function NovaIntelligencePage() {
  const { filtroCiudad } = useAppStore();
  const isNacional = filtroCiudad === 'Todas';
  const insights = NOVA_INSIGHTS.filter(n => isNacional || n.ciudad === filtroCiudad || n.ciudad === 'Nacional');
  const formatTs = (ts: string) => {
  const d = new Date(ts);
  const months = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
  const day = String(d.getDate()).padStart(2,'0');
  const h = String(d.getHours()).padStart(2,'0');
  const m = String(d.getMinutes()).padStart(2,'0');
  return `${day} ${months[d.getMonth()]}, ${h}:${m}`;
};

  return (
    <div className="space-y-6">
      <SectionHeader title="Nova Intelligence" subtitle={`IA analítica predictiva · ${insights.length} predicciones e insights activos`} />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Insights Activos" value={String(insights.length)} icon={Brain} color="purple" />
        <KpiCard label="Impacto Alto" value={String(insights.filter(n=>n.impacto==='Alto').length)} icon={AlertTriangle} color="red" />
        <KpiCard label="Predicciones" value={String(insights.filter(n=>n.tipo==='Prediccion').length)} icon={TrendingUp} color="cyan" />
        <KpiCard label="Optimizaciones" value={String(insights.filter(n=>n.tipo==='Optimizacion').length)} icon={Target} color="green" />
      </div>
      <div className="rounded-xl p-6 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #0D1B2A 0%, #1A3C5E 50%, #0D1B2A 100%)', border: '1px solid rgba(0,180,216,0.3)' }}>
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(0,180,216,0.2)', border: '2px solid rgba(0,180,216,0.5)' }}>
            <Brain size={28} style={{ color: '#00B4D8' }} />
          </div>
          <div>
            <h2 className="font-orbitron font-bold text-2xl" style={{ color: '#00B4D8' }}>NOVA AI</h2>
            <p className="text-sm mt-0.5" style={{ color: '#94A3B8' }}>Motor de inteligencia artificial HAIX — Detección, predicción y optimización operativa</p>
            <div className="flex items-center gap-4 mt-2">
              <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: '#22C55E' }} /><span className="text-[11px]" style={{ color: '#22C55E' }}>Modelos activos</span></div>
              <span className="text-[11px]" style={{ color: '#64748B' }}>Análisis en tiempo real · 4 ciudades</span>
              <span className="text-[11px]" style={{ color: '#64748B' }}>Última actualización: 01 oct 2026</span>
            </div>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4">
        {insights.map(insight => {
          const tc = TIPO_CONFIG[insight.tipo];
          const ic = IMPACTO_COLOR[insight.impacto];
          const TIcon = tc.icon;
          const cColor = insight.ciudad !== 'Nacional' ? CIUDAD_CONFIG[insight.ciudad as Ciudad].color : '#A78BFA';
          return (
            <div key={insight.id} className="rounded-xl p-5" style={{ backgroundColor: '#112236', border: '1px solid #1E3A55' }}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4 flex-1">
                  <div className="p-2.5 rounded-xl shrink-0" style={{ backgroundColor: tc.color + '20' }}>
                    <TIcon size={18} style={{ color: tc.color }} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className="font-orbitron text-sm font-bold" style={{ color: '#E2E8F0' }}>{insight.titulo}</h3>
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: tc.color + '20', color: tc.color }}>{tc.label}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: ic.bg, color: ic.text }}>Impacto {insight.impacto}</span>
                      <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full" style={{ backgroundColor: cColor }} /><span className="text-[10px]" style={{ color: '#64748B' }}>{insight.ciudad}</span></div>
                    </div>
                    <p className="text-xs leading-relaxed mb-3" style={{ color: '#94A3B8' }}>{insight.descripcion}</p>
                    <div className="flex items-start gap-2 p-3 rounded-lg" style={{ backgroundColor: 'rgba(0,180,216,0.05)', border: '1px solid rgba(0,180,216,0.15)' }}>
                      <Activity size={12} className="shrink-0 mt-0.5" style={{ color: '#00B4D8' }} />
                      <p className="text-[11px]" style={{ color: '#94A3B8' }}><span className="font-semibold" style={{ color: '#00B4D8' }}>Acción sugerida: </span>{insight.accionSugerida}</p>
                    </div>
                  </div>
                </div>
                <span className="text-[10px] shrink-0" style={{ color: '#374151' }}>{formatTs(insight.timestamp)}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
