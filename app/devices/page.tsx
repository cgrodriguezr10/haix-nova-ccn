'use client';

import { useState, useMemo } from 'react';
import {
  Cpu, Wifi, WifiOff, Battery, BatteryLow, Thermometer,
  RefreshCw, Power, Lock, Trash2, AlertTriangle, ChevronLeft,
  Activity, Clock, CheckCircle2,
} from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import {
  DISPOSITIVOS, formatNum,
  type Ciudad, type DispositivoStatus,
} from '@/lib/mock-data';
import { KpiCard } from '@/components/shared/KpiCard';
import { SectionHeader } from '@/components/shared/SectionHeader';

const STATUS_COLOR: Record<DispositivoStatus, string> = {
  Operativo:     '#22C55E',
  Mantenimiento: '#F59E0B',
  Falla:         '#EF4444',
  Inactivo:      '#64748B',
};
const STATUS_BG: Record<DispositivoStatus, string> = {
  Operativo:     'rgba(34,197,94,0.12)',
  Mantenimiento: 'rgba(245,158,11,0.12)',
  Falla:         'rgba(239,68,68,0.12)',
  Inactivo:      'rgba(100,116,139,0.12)',
};
const CIUDAD_COLOR: Record<string, string> = {
  Bogotá: '#00B4D8', Cali: '#E87C2B', Medellín: '#A78BFA', Barranquilla: '#34D399',
};
function batColor(pct: number) {
  if (pct >= 50) return '#22C55E';
  if (pct >= 25) return '#F59E0B';
  return '#EF4444';
}
function tempColor(t: number) {
  if (t <= 35) return '#22C55E';
  if (t <= 42) return '#F59E0B';
  return '#EF4444';
}
type FiltroStatus = 'Todos' | DispositivoStatus;

export default function DispositivosPage() {
  const { filtroCiudad } = useAppStore();
  const [filtroStatus, setFiltroStatus] = useState<FiltroStatus>('Todos');
  const [deviceSel, setDeviceSel] = useState<string | null>(null);
  const [accionFeedback, setAccionFeedback] = useState<string | null>(null);

  const baseTotal = filtroCiudad === 'Todas'
    ? DISPOSITIVOS
    : DISPOSITIVOS.filter(d => d.ciudad === filtroCiudad as Ciudad);

  const dispositivos = useMemo(() => {
    if (filtroStatus === 'Todos') return baseTotal;
    return baseTotal.filter(d => d.status === filtroStatus);
  }, [baseTotal, filtroStatus]);

  const totalDisp    = baseTotal.length;
  const totalOnline  = baseTotal.filter(d => d.status === 'Operativo').length;
  const totalOffline = baseTotal.filter(d => d.status !== 'Operativo').length;
  const totalFalla   = baseTotal.filter(d => d.status === 'Falla').length;

  const dev = deviceSel ? DISPOSITIVOS.find(d => d.id === deviceSel) : null;

  function ejecutarAccion(accion: string) {
    setAccionFeedback(`${accion} enviado a ${dev?.serial} — en proceso...`);
    setTimeout(() => setAccionFeedback(null), 3000);
  }

  return (
    <div className="space-y-6">
      <SectionHeader
        title="🥽 Dispositivos"
        subtitle={`Gestión y monitoreo de gafas DHNa3 · ${filtroCiudad === 'Todas' ? '4 ciudades' : filtroCiudad}`}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="🥽 Total Dispositivos" value={formatNum(totalDisp)} icon={Cpu} color="cyan" />
        <KpiCard label="Online / Operativos" value={formatNum(totalOnline)} sub={`${Math.round((totalOnline / totalDisp) * 100)}% del flota`} icon={Wifi} color="green" />
        <KpiCard label="Offline / Inactivos" value={formatNum(totalOffline)} sub="Mantenimiento o inactivos" icon={WifiOff} color="naranja" />
        <KpiCard label="Con Falla" value={formatNum(totalFalla)} sub={totalFalla > 0 ? 'Requieren atención' : 'Sin fallas activas'} icon={AlertTriangle} color={totalFalla > 0 ? 'red' : 'green'} />
      </div>

      {totalFalla > 0 && (
        <div className="flex items-center gap-3 rounded-xl px-4 py-3" style={{ backgroundColor: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)' }}>
          <AlertTriangle size={16} style={{ color: '#EF4444', flexShrink: 0 }} />
          <p className="text-sm" style={{ color: '#FCA5A5' }}>
            <strong>{totalFalla} dispositivo{totalFalla > 1 ? 's' : ''} con falla crítica</strong>
            {' '}— notificar a los responsables técnicos para revisión inmediata.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Lista */}
        <div className="rounded-xl p-5 flex flex-col gap-4" style={{ backgroundColor: '#112236', border: '1px solid #1E3A55' }}>
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <h3 className="font-orbitron text-sm font-semibold" style={{ color: '#E2E8F0' }}>Listado de dispositivos</h3>
            <div className="flex gap-1 flex-wrap">
              {(['Todos', 'Operativo', 'Mantenimiento', 'Falla', 'Inactivo'] as FiltroStatus[]).map(s => (
                <button key={s} onClick={() => setFiltroStatus(s)}
                  className="text-[10px] px-2.5 py-1 rounded-full font-medium transition-all"
                  style={{ backgroundColor: filtroStatus === s ? (s === 'Todos' ? '#00B4D8' : STATUS_COLOR[s as DispositivoStatus]) : 'rgba(255,255,255,0.05)', color: filtroStatus === s ? '#0D1B2A' : '#64748B' }}>
                  {s}
                </button>
              ))}
            </div>
          </div>
          <p className="text-[10px]" style={{ color: '#64748B' }}>Mostrando {dispositivos.length} de {baseTotal.length} dispositivos</p>
          <div className="space-y-1 overflow-y-auto" style={{ maxHeight: '480px' }}>
            {dispositivos.map(d => {
              const color = CIUDAD_COLOR[d.ciudad] ?? '#00B4D8';
              const isSel = deviceSel === d.id;
              return (
                <button key={d.id} onClick={() => setDeviceSel(isSel ? null : d.id)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-left"
                  style={{ backgroundColor: isSel ? 'rgba(0,180,216,0.12)' : 'transparent', border: isSel ? '1px solid rgba(0,180,216,0.3)' : '1px solid transparent' }}>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                    style={{ backgroundColor: `${color}18`, border: `1px solid ${color}33` }}>
                    <Cpu size={14} style={{ color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold font-mono truncate" style={{ color: '#E2E8F0' }}>{d.serial}</span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded-full shrink-0 font-medium"
                        style={{ backgroundColor: STATUS_BG[d.status], color: STATUS_COLOR[d.status] }}>{d.status}</span>
                    </div>
                    <p className="text-[10px] truncate mt-0.5" style={{ color: '#64748B' }}>{d.agenteAsignado} · {d.ciudad}</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <BatteryLow size={12} style={{ color: batColor(d.bateria) }} />
                    <span className="text-[11px] font-mono font-bold" style={{ color: batColor(d.bateria) }}>{d.bateria}%</span>
                  </div>
                </button>
              );
            })}
            {dispositivos.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 gap-2">
                <Cpu size={32} style={{ color: '#1E3A55' }} />
                <p className="text-sm" style={{ color: '#64748B' }}>Sin dispositivos para este filtro</p>
              </div>
            )}
          </div>
        </div>

        {/* Panel detalle */}
        <div className="rounded-xl p-5 flex flex-col gap-4" style={{ backgroundColor: '#112236', border: '1px solid #1E3A55' }}>
          {!dev ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 py-16">
              <Cpu size={40} style={{ color: '#1E3A55' }} />
              <p className="text-sm text-center" style={{ color: '#64748B' }}>Selecciona un dispositivo<br />para ver su detalle y acciones remotas</p>
            </div>
          ) : (
            <>
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                  style={{ backgroundColor: STATUS_BG[dev.status], border: `1px solid ${STATUS_COLOR[dev.status]}44` }}>
                  <Cpu size={22} style={{ color: STATUS_COLOR[dev.status] }} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-orbitron font-bold text-sm" style={{ color: '#E2E8F0' }}>{dev.serial}</h4>
                    <span className="text-[9px] px-2 py-0.5 rounded-full font-medium"
                      style={{ backgroundColor: STATUS_BG[dev.status], color: STATUS_COLOR[dev.status] }}>{dev.status}</span>
                  </div>
                  <p className="text-[11px] mt-0.5" style={{ color: '#94A3B8' }}>{dev.id} · {dev.ciudad}</p>
                  <p className="text-[10px]" style={{ color: '#64748B' }}>Asignado a: {dev.agenteAsignado}</p>
                </div>
              </div>

              {/* Descripción de falla */}
              {dev.descripcionFalla && (
                <div className="flex items-start gap-3 rounded-xl px-4 py-3"
                  style={{ backgroundColor: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.35)' }}>
                  <AlertTriangle size={15} style={{ color: '#EF4444', flexShrink: 0, marginTop: 1 }} />
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider mb-0.5" style={{ color: '#EF4444' }}>Descripción de falla</p>
                    <p className="text-xs leading-relaxed" style={{ color: '#FCA5A5' }}>{dev.descripcionFalla}</p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-3 gap-2">
                {[
                  { icon: Battery,     label: 'Batería',     val: `${dev.bateria}%`,         color: batColor(dev.bateria) },
                  { icon: Thermometer, label: 'Temperatura', val: `${dev.temperatura}°C`,    color: tempColor(dev.temperatura) },
                  { icon: Clock,       label: 'Uptime',      val: `${dev.tiempoOperacion}h`, color: '#00B4D8' },
                ].map(({ icon: Icon, label, val, color }) => (
                  <div key={label} className="rounded-lg p-3 flex flex-col gap-1"
                    style={{ backgroundColor: '#0D1B2A', border: '1px solid #1E3A55' }}>
                    <Icon size={13} style={{ color: '#64748B' }} />
                    <p className="text-sm font-bold font-mono" style={{ color }}>{val}</p>
                    <p className="text-[10px]" style={{ color: '#64748B' }}>{label}</p>
                  </div>
                ))}
              </div>

              <div className="rounded-lg p-3 flex flex-col gap-2" style={{ backgroundColor: '#0D1B2A', border: '1px solid #1E3A55' }}>
                <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: '#64748B' }}>Información del dispositivo</p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                  {[
                    ['Modelo',       'DHNa3'],
                    ['Firmware',     dev.firmwareVersion],
                    ['Escaneos hoy', formatNum(dev.escaneosDia)],
                    ['Última sync',  dev.ultimaSync],
                  ].map(([k, v]) => (
                    <div key={k} className="flex flex-col">
                      <span className="text-[9px]" style={{ color: '#64748B' }}>{k}</span>
                      <span className="text-[11px] font-medium font-mono" style={{ color: '#E2E8F0' }}>{v}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider mb-3" style={{ color: '#64748B' }}>Acciones Remotas</p>
                {accionFeedback && (
                  <div className="flex items-center gap-2 rounded-lg px-3 py-2 mb-3"
                    style={{ backgroundColor: 'rgba(0,180,216,0.1)', border: '1px solid rgba(0,180,216,0.25)' }}>
                    <Activity size={12} style={{ color: '#00B4D8' }} />
                    <p className="text-[11px]" style={{ color: '#00B4D8' }}>{accionFeedback}</p>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: 'Actualizar Software', icon: RefreshCw, color: '#00B4D8', bg: 'rgba(0,180,216,0.1)',   border: 'rgba(0,180,216,0.3)' },
                    { label: 'Reiniciar',           icon: Power,     color: '#F59E0B', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.3)' },
                    { label: 'Bloquear',            icon: Lock,      color: '#EF4444', bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.3)' },
                    { label: 'Borrado Remoto',      icon: Trash2,    color: '#EF4444', bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.3)' },
                  ].map(({ label, icon: Icon, color, bg, border }) => (
                    <button key={label} onClick={() => ejecutarAccion(label)}
                      className="flex items-center justify-center gap-2 rounded-xl py-3 font-semibold text-xs transition-all hover:brightness-125 active:scale-95"
                      style={{ backgroundColor: bg, border: `1px solid ${border}`, color }}>
                      <Icon size={14} />{label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2 mt-auto">
                <CheckCircle2 size={13} style={{ color: STATUS_COLOR[dev.status] }} />
                <span className="text-[11px]" style={{ color: '#64748B' }}>Estado operativo: <span style={{ color: STATUS_COLOR[dev.status] }}>{dev.status}</span></span>
              </div>

              <button onClick={() => setDeviceSel(null)} className="flex items-center gap-1 text-[11px]" style={{ color: '#64748B' }}>
                <ChevronLeft size={12} /> Volver al listado
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}