'use client';

import { Shield, Users, Building, Glasses, Globe } from 'lucide-react';
import { CIUDAD_CONFIG, CIUDADES, METRICS_POR_CIUDAD, TOTAL_AGENTES, METRICS_NACIONAL } from '@/lib/mock-data';
import { SectionHeader } from '@/components/shared/SectionHeader';
import { KpiCard } from '@/components/shared/KpiCard';
import { formatNum } from '@/lib/mock-data';

const USERS_SISTEMA = [
  { nombre: 'Dr. Roberto Cifuentes', rol: 'Director Nacional SIMIT', ciudad: 'Nacional', acceso: 'Total', ultimo: 'Hace 5 min' },
  { nombre: 'Dr. Hernando Vargas Ruiz', rol: 'Secretario de Movilidad', ciudad: 'Bogotá', acceso: 'Ciudad', ultimo: 'Hace 12 min' },
  { nombre: 'Dra. Marcela Ospina Torres', rol: 'Secretaria de Tránsito y Transporte', ciudad: 'Cali', acceso: 'Ciudad', ultimo: 'Hace 3 min' },
  { nombre: 'Dr. Camilo Restrepo Arias', rol: 'Secretario de Movilidad', ciudad: 'Medellín', acceso: 'Ciudad', ultimo: 'Hace 8 min' },
  { nombre: 'Dra. Sandra Meza Fonseca', rol: 'Directora de Tránsito', ciudad: 'Barranquilla', acceso: 'Ciudad', ultimo: 'Hace 25 min' },
  { nombre: 'Ing. Carlos Rodríguez Rojas', rol: 'CEO HAIX Technologies', ciudad: 'Nacional', acceso: 'Admin', ultimo: 'Ahora' },
];

export default function AdministracionPage() {
  return (
    <div className="space-y-6">
      <SectionHeader title="Administración del Sistema" subtitle="Configuración, usuarios y estado de servicios HAIX Nova · v2.4.1" />

<div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
  <KpiCard label="Ciudades Activas"           value="4"                                        icon={Globe}    color="cyan" />
  <KpiCard label="Usuarios del Sistema"       value={String(USERS_SISTEMA.length)}             icon={Users}   color="purple" />
  <KpiCard label="Agentes Registrados"        value={formatNum(TOTAL_AGENTES)}                 icon={Shield}  color="naranja" />
  <KpiCard label="🥽 Dispositivos HAIX Nova"  value={formatNum(METRICS_NACIONAL.dispositivosTotal)} icon={Glasses} color="cyan" />
</div>

      {/* Ciudades */}
      <div className="rounded-xl p-5" style={{ backgroundColor: '#112236', border: '1px solid #1E3A55' }}>
        <h3 className="font-orbitron text-sm font-semibold mb-4" style={{ color: '#E2E8F0' }}>Ciudades Configuradas</h3>
        <div className="grid grid-cols-2 gap-4">
          {CIUDADES.map(c => {
            const cfg = CIUDAD_CONFIG[c];
            const m = METRICS_POR_CIUDAD[c];
            return (
              <div key={c} className="p-4 rounded-xl flex items-start gap-4" style={{ backgroundColor: '#0A1628', border: '1px solid #1E3A55' }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: cfg.color + '20' }}>
                  <Building size={18} style={{ color: cfg.color }} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-orbitron text-sm font-bold" style={{ color: '#E2E8F0' }}>{c}</h4>
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded" style={{ backgroundColor: 'rgba(34,197,94,0.1)', color: '#22C55E' }}>DANE {cfg.codigoDANE}</span>
                  </div>
                  <p className="text-[10px] mb-2" style={{ color: '#64748B' }}>{cfg.secretaria}</p>
                  <p className="text-[10px] mb-2" style={{ color: '#94A3B8' }}>Director: {cfg.director}</p>
                  <div className="grid grid-cols-3 gap-2">
                    <div><p className="text-[9px]" style={{ color: '#64748B' }}>Agentes</p><p className="text-xs font-mono font-bold" style={{ color: cfg.color }}>{cfg.agentes}</p></div>
                    <div><p className="text-[9px]" style={{ color: '#64748B' }}>Activos</p><p className="text-xs font-mono font-bold" style={{ color: '#22C55E' }}>{m.agentesActivos}</p></div>
                    <div><p className="text-[9px]" style={{ color: '#64748B' }}>Eficiencia</p><p className="text-xs font-mono font-bold" style={{ color: '#A78BFA' }}>{m.eficiencia}%</p></div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Usuarios */}
      <div className="rounded-xl p-5" style={{ backgroundColor: '#112236', border: '1px solid #1E3A55' }}>
        <h3 className="font-orbitron text-sm font-semibold mb-4" style={{ color: '#E2E8F0' }}>Usuarios del Sistema</h3>
        <div className="overflow-hidden rounded-xl" style={{ border: '1px solid #1E3A55' }}>
          <table className="w-full text-xs">
            <thead><tr style={{ backgroundColor: '#0A1628', borderBottom: '1px solid #1E3A55' }}>
              {['Usuario','Rol','Ciudad','Nivel de Acceso','Última Sesión'].map(h => (
                <th key={h} className="px-4 py-3 text-left font-medium font-orbitron tracking-wide" style={{ color: '#64748B' }}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {USERS_SISTEMA.map((u, i) => (
                <tr key={i} className="hover:bg-white/[0.02]"
                  style={{ borderBottom: i < USERS_SISTEMA.length-1 ? '1px solid #1E3A55' : 'none', backgroundColor: i%2===0 ? 'rgba(17,34,54,0.5)' : 'transparent' }}>
                  <td className="px-4 py-3" style={{ color: '#E2E8F0' }}>{u.nombre}</td>
                  <td className="px-4 py-3" style={{ color: '#94A3B8' }}>{u.rol}</td>
                  <td className="px-4 py-3" style={{ color: '#64748B' }}>{u.ciudad}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-medium"
                      style={{ backgroundColor: u.acceso === 'Admin' ? 'rgba(167,139,250,0.15)' : u.acceso === 'Total' ? 'rgba(0,180,216,0.15)' : 'rgba(34,197,94,0.15)', color: u.acceso === 'Admin' ? '#A78BFA' : u.acceso === 'Total' ? '#00B4D8' : '#22C55E' }}>
                      {u.acceso}
                    </span>
                  </td>
                  <td className="px-4 py-3" style={{ color: '#64748B' }}>{u.ultimo}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}