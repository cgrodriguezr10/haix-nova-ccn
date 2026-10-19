'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAppStore } from '@/store/useAppStore';
import {
  LayoutDashboard, Activity, Cpu, Map,
  Sparkles, FileText, MessageSquare,
  Settings, ChevronLeft, ChevronRight, Shield, Bot, BadgeDollarSign
} from 'lucide-react';

const NAV_ITEMS = [
  { label: 'Dashboard',          href: '/',                    icon: LayoutDashboard },
  { label: 'Operaciones',        href: '/operaciones',         icon: Activity },
  { label: 'Cartera Vial',       href: '/cartera',             icon: BadgeDollarSign },
  { label: 'Dispositivos',       href: '/devices',             icon: Cpu },
  { label: 'Mapa Operacional',   href: '/map',                 icon: Map },
  { label: 'Nova Intelligence',  href: '/nova-intelligence',   icon: Sparkles },
  { label: 'NovaX AI',           href: '/novax',               icon: Bot },
  { label: 'Reportes',           href: '/reports',             icon: FileText },
  { label: 'Comunicación',       href: '/communication',       icon: MessageSquare },
  { label: 'Administración',     href: '/administration',      icon: Settings },
] as const;

export function Sidebar() {
  const pathname = usePathname();
  const { sidebarCollapsed, toggleSidebar } = useAppStore();

  return (
    <aside
      className="fixed left-0 top-0 h-full z-40 flex flex-col transition-all duration-300"
      style={{
        width: sidebarCollapsed ? '64px' : '240px',
        backgroundColor: '#0A1628',
        borderRight: '1px solid #1E3A55',
      }}
    >
      <div
        className="flex items-center gap-3 px-4 py-4 shrink-0"
        style={{ borderBottom: '1px solid #1E3A55', minHeight: '64px' }}
      >
        <div
          className="flex items-center justify-center rounded-lg shrink-0"
          style={{ width: '32px', height: '32px', backgroundColor: '#00B4D8', borderRadius: '8px' }}
        >
          <Shield size={18} color="#0D1B2A" strokeWidth={2.5} />
        </div>
        {!sidebarCollapsed && (
          <div>
            <p className="font-orbitron text-xs font-bold" style={{ color: '#00B4D8', lineHeight: 1.2 }}>HAIX NOVA</p>
            <p className="text-[9px] font-medium" style={{ color: '#64748B', lineHeight: 1.2 }}>COMMAND CENTER NACIONAL</p>
          </div>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto py-3 px-2">
        {NAV_ITEMS.map(({ label, href, icon: Icon }) => {
          const isActive = href === '/' ? pathname === '/' : pathname.startsWith(href);
          return (
            <Link key={href} href={href}>
              <div
                className="flex items-center gap-3 px-3 py-2 mb-1 rounded-lg cursor-pointer transition-all duration-150 group"
                style={{
                  backgroundColor: isActive ? 'rgba(0,180,216,0.12)' : 'transparent',
                  border: isActive ? '1px solid rgba(0,180,216,0.25)' : '1px solid transparent',
                }}
                title={sidebarCollapsed ? label : undefined}
              >
                <Icon
                  size={16}
                  style={{ color: isActive ? '#00B4D8' : '#64748B', flexShrink: 0 }}
                  className="group-hover:text-cyan-400 transition-colors"
                />
                {!sidebarCollapsed && (
                  <span
                    className="text-xs font-medium transition-colors group-hover:text-slate-200"
                    style={{ color: isActive ? '#E2E8F0' : '#94A3B8' }}
                  >
                    {label}
                  </span>
                )}
                {!sidebarCollapsed && label === 'Comunicación' && (
                  <span
                    className="ml-auto text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                    style={{ backgroundColor: '#00B4D8', color: '#0D1B2A' }}
                  >
                    4
                  </span>
                )}
              </div>
            </Link>
          );
        })}
      </nav>

      <div
        className="px-2 py-3 shrink-0"
        style={{ borderTop: '1px solid #1E3A55' }}
      >
        {!sidebarCollapsed && (
          <div className="px-3 pb-3">
            <p className="text-[9px] font-orbitron" style={{ color: '#64748B' }}>HAIX Technologies Colombia</p>
            <p className="text-[9px] mt-0.5" style={{ color: '#1E3A55' }}>v1.0.0 — Demo SIMIT</p>
          </div>
        )}
        <button
          onClick={toggleSidebar}
          className="flex items-center justify-center w-full rounded-lg py-2 transition-colors hover:bg-white/5"
          style={{ color: '#64748B' }}
        >
          {sidebarCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>
    </aside>
  );
}