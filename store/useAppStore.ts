import { create } from 'zustand';
import type { FiltroCiudad, FiltroFecha } from '@/lib/mock-data';

interface AppStore {
  filtroCiudad: FiltroCiudad;
  filtroFecha:  FiltroFecha;
  setFiltroCiudad: (c: FiltroCiudad) => void;
  setFiltroFecha:  (f: FiltroFecha)  => void;
  /** Fechas de rango personalizado (ISO yyyy-mm-dd) */
  rangoDesde: string;
  rangoHasta: string;
  rangoActivo: boolean;
  setFiltroRango: (desde: string, hasta: string) => void;
  clearFiltroRango: () => void;
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
}

export const useAppStore = create<AppStore>((set) => ({
  filtroCiudad:     'Todas',
  filtroFecha:      'Mes',
  setFiltroCiudad:  (filtroCiudad)  => set({ filtroCiudad }),
  setFiltroFecha:   (filtroFecha)   => set({ filtroFecha, rangoActivo: false, filtroRangoIdx: -1 }),
  rangoDesde:       '',
  rangoHasta:       '',
  rangoActivo:      false,
  setFiltroRango:   (desde, hasta) => set({ rangoDesde: desde, rangoHasta: hasta, rangoActivo: !!(desde && hasta) }),
  clearFiltroRango: () => set({ rangoDesde: '', rangoHasta: '', rangoActivo: false }),
  sidebarCollapsed: false,
  toggleSidebar:    () => set(s => ({ sidebarCollapsed: !s.sidebarCollapsed })),
}));
