'use client';

import { useAppStore } from '@/store/useAppStore';
import type { FiltroCiudad, FiltroFecha } from '@/lib/mock-data';
import { CIUDADES } from '@/lib/mock-data';
import { Bell, Download, CalendarRange, X } from 'lucide-react';
import { useState, useEffect } from 'react';

const FECHAS: FiltroFecha[] = ['Hoy', 'Semana', 'Mes', 'Trimestre', 'Todo'];
const CIUDADES_FILTRO: FiltroCiudad[] = ['Todas', ...CIUDADES];

// Fecha mínima disponible en mock data (30 días atrás)
function isoHoy(): string {
  return new Date().toISOString().slice(0, 10);
}
function isoMake(diasAtras: number): string {
  const d = new Date();
  d.setDate(d.getDate() - diasAtras);
  return d.toISOString().slice(0, 10);
}

const fmt = new Intl.DateTimeFormat('es-CO', {
  timeZone: 'America/Bogota',
  day: '2-digit', month: 'short', year: 'numeric',
  hour: '2-digit', minute: '2-digit', hour12: false,
});

export function TopBar() {
  const {
    filtroCiudad, filtroFecha,
    setFiltroCiudad, setFiltroFecha,
    rangoDesde, rangoHasta, rangoActivo,
    setFiltroRango, clearFiltroRango,
  } = useAppStore();

  // ✅ FIX: reloj solo en cliente — evita hydration mismatch
  const [colTime, setColTime] = useState('');
  useEffect(() => {
    const update = () => setColTime(fmt.format(new Date()));
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, []);

  const inputStyle: React.CSSProperties = {
    backgroundColor: rangoActivo ? 'rgba(167,139,250,0.12)' : 'rgba(255,255,255,0.04)',
    border: `1px solid ${rangoActivo ? 'rgba(167,139,250,0.5)' : '#1E3A55'}`,
    color: rangoActivo ? '#A78BFA' : '#94A3B8',
    borderRadius: 6,
    padding: '3px 8px',
    fontSize: 11,
    fontFamily: 'Inter, sans-serif',
    outline: 'none',
    cursor: 'pointer',
    colorScheme: 'dark',
  };

  return (
    <header
      className="flex items-center gap-3 px-6 py-3 shrink-0 flex-wrap"
      style={{
        backgroundColor: '#0A1628',
        borderBottom: '1px solid #1E3A55',
        minHeight: '56px',
      }}
    >
      {/* Ciudad */}
      <div className="flex items-center gap-1">
        <span className="text-[10px] font-medium mr-2" style={{ color: '#64748B' }}>CIUDAD</span>
        {CIUDADES_FILTRO.map(c => (
          <button
            key={c}
            onClick={() => setFiltroCiudad(c)}
            className="px-3 py-1 text-xs rounded-md font-medium transition-all duration-150"
            style={{
              backgroundColor: filtroCiudad === c ? '#00B4D8' : 'rgba(255,255,255,0.04)',
              color: filtroCiudad === c ? '#0D1B2A' : '#94A3B8',
              border: filtroCiudad === c ? 'none' : '1px solid #1E3A55',
              fontFamily: 'Inter, sans-serif',
            }}
          >
            {c}
          </button>
        ))}
      </div>

      <div style={{ width: '1px', height: '24px', backgroundColor: '#1E3A55' }} />

      {/* Periodo rápido */}
      <div className="flex items-center gap-1">
        <span className="text-[10px] font-medium mr-2" style={{ color: '#64748B' }}>PERIODO</span>
        {FECHAS.map(f => (
          <button
            key={f}
            onClick={() => { clearFiltroRango(); setFiltroFecha(f); }}
            className="px-3 py-1 text-xs rounded-md font-medium transition-all duration-150"
            style={{
              backgroundColor: !rangoActivo && filtroFecha === f ? '#E87C2B' : 'rgba(255,255,255,0.04)',
              color: !rangoActivo && filtroFecha === f ? '#fff' : '#94A3B8',
              border: !rangoActivo && filtroFecha === f ? 'none' : '1px solid #1E3A55',
              fontFamily: 'Inter, sans-serif',
            }}
          >
            {f}
          </button>
        ))}
      </div>

      <div style={{ width: '1px', height: '24px', backgroundColor: '#1E3A55' }} />

      {/* Rango personalizado — date pickers */}
      <div className="flex items-center gap-2">
        <CalendarRange size={13} style={{ color: rangoActivo ? '#A78BFA' : '#64748B' }} />
        <span className="text-[10px] font-medium" style={{ color: rangoActivo ? '#A78BFA' : '#64748B' }}>RANGO</span>
        <input
          type="date"
          value={rangoDesde}
          min={isoMake(29)}
          max={rangoHasta || isoHoy()}
          style={inputStyle}
          onChange={e => setFiltroRango(e.target.value, rangoHasta)}
        />
        <span style={{ color: '#64748B', fontSize: 11 }}>→</span>
        <input
          type="date"
          value={rangoHasta}
          min={rangoDesde || isoMake(29)}
          max={isoHoy()}
          style={inputStyle}
          onChange={e => setFiltroRango(rangoDesde, e.target.value)}
        />
        {rangoActivo && (
          <button
            onClick={clearFiltroRango}
            title="Limpiar rango"
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: '#64748B', padding: '2px', display: 'flex', alignItems: 'center',
            }}
          >
            <X size={13} />
          </button>
        )}
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Live indicator */}
      <div className="flex items-center gap-2">
        <div className="pulse-dot w-2 h-2 rounded-full" style={{ backgroundColor: '#22C55E' }} />
        <span className="text-xs font-mono" style={{ color: '#22C55E' }}>LIVE</span>
        <span className="text-[10px]" suppressHydrationWarning style={{ color: '#64748B' }}>{colTime}</span>
      </div>

      <div style={{ width: '1px', height: '24px', backgroundColor: '#1E3A55' }} />

      <button
        className="relative flex items-center justify-center rounded-lg p-2 transition-colors hover:bg-white/5"
        style={{ color: '#94A3B8' }}
      >
        <Bell size={16} />
        <span
          className="absolute -top-0.5 -right-0.5 text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center"
          style={{ backgroundColor: '#EF4444', color: '#fff' }}
        >
          4
        </span>
      </button>

      <button
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 hover:opacity-90"
        style={{ backgroundColor: '#1A3C5E', color: '#00B4D8', border: '1px solid #1E3A55' }}
      >
        <Download size={13} />
        Exportar
      </button>
    </header>
  );
}