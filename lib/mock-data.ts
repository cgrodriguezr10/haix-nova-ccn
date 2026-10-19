/**
 * HAIX Nova Command Center Nacional — Mock Data
 * Seed fijo para reproducibilidad. Datos 100% simulados.
 * Fórmulas del brief técnico v1.0 — SIMIT Demo, 19 oct 2026
 */

// ─── SEED PRNG ──────────────────────────────────────────────────────────────
function seededRng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

// ─── CONSTANTES ─────────────────────────────────────────────────────────────
export const COLORS = {
  azul: '#1A3C5E',
  cyan: '#00B4D8',
  naranja: '#E87C2B',
  bg: '#0D1B2A',
  success: '#22C55E',
  warning: '#F59E0B',
  danger: '#EF4444',
  muted: '#64748B',
};

export const VALOR_COMPARENDO = 587450; // COP

export const CIUDADES = ['Bogotá', 'Cali', 'Medellín', 'Barranquilla'] as const;
export type Ciudad = typeof CIUDADES[number];

export const CIUDAD_CONFIG: Record<Ciudad, {
  agentes: number;
  color: string;
  secretaria: string;
  director: string;
  codigoDANE: string;
}> = {
  Bogotá:       { agentes: 577, color: '#00B4D8', secretaria: 'Secretaría Distrital de Movilidad', director: 'Dr. Hernando Vargas Ruiz',    codigoDANE: '11001' },
  Cali:         { agentes: 250, color: '#E87C2B', secretaria: 'Secretaría de Movilidad de Cali',   director: 'Dra. Marcela Ospina Torres',     codigoDANE: '76001' },
  Medellín:     { agentes: 220, color: '#A78BFA', secretaria: 'Secretaría de Movilidad de Medellín', director: 'Dr. Camilo Restrepo Arias', codigoDANE: '05001' },
  Barranquilla: { agentes: 70,  color: '#34D399', secretaria: 'Secretaría de Tránsito de Barranquilla', director: 'Dra. Sandra Meza Fonseca', codigoDANE: '08001' },
};

export const TOTAL_AGENTES = Object.values(CIUDAD_CONFIG).reduce((s, c) => s + c.agentes, 0); // 1117

// ─── MÉTRICAS POR CIUDAD ────────────────────────────────────────────────────
export interface CiudadMetrics {
  ciudad: Ciudad;
  agentes: number;
  agentesActivos: number;
  escaneosDia: number;
  soatVencido: number;       // comparendos C02
  rtmVencido: number;        // comparendos C03
  totalComparendos: number;
  valorRecaudado: number;    // COP
  dispositivosActivos: number;
  dispositivosTotal: number;
  eficiencia: number;        // %
}

// ─── TURNO ACTIVO según hora local Colombia (UTC-5) ─────────────────────────
// Turnos: Mañana 06-14, Tarde 14-22, Noche 22-06
// En cada turno trabaja ~1/3 del total + pequeño solapamiento (~5%)
function calcAgentesActivosPorTurno(totalAgentes: number): number {
  const horaUTC = new Date().getUTCHours();
  const horaCOL = ((horaUTC - 5) + 24) % 24; // UTC-5
  // Agentes por turno: ~35% en turno activo, ~5% solapamiento entrada/salida
  const enTurno = Math.round(totalAgentes * 0.335);
  // En cambio de turno (±30 min alrededor de 06, 14, 22) hay más activos
  const minCOL = new Date().getUTCMinutes();
  const enCambio = (
    (horaCOL === 5 && minCOL >= 30) || horaCOL === 6 ||
    (horaCOL === 13 && minCOL >= 30) || horaCOL === 14 ||
    (horaCOL === 21 && minCOL >= 30) || horaCOL === 22
  );
  return enCambio ? Math.round(enTurno * 1.08) : enTurno;
}

function buildCiudadMetrics(ciudad: Ciudad): CiudadMetrics {
  const cfg = CIUDAD_CONFIG[ciudad];
  const agentesActivos = calcAgentesActivosPorTurno(cfg.agentes);
  const escaneosDia = cfg.agentes * 60 * 10;
  // Comparendos calibrados al doble del recaudo real SIMIT por ciudad
  const TASA: Record<Ciudad, { soat: number; rtm: number }> = {
    Bogotá:       { soat: 0.00077, rtm: 0.00051 },
    Cali:         { soat: 0.00059, rtm: 0.00039 },
    Medellín:     { soat: 0.00061, rtm: 0.00041 },
    Barranquilla: { soat: 0.00105, rtm: 0.00070 },
  };
  const tasa = TASA[ciudad];
  const soatVencido = Math.round(escaneosDia * tasa.soat);
  const rtmVencido  = Math.round(escaneosDia * tasa.rtm);
  const totalComparendos = soatVencido + rtmVencido;
  const valorRecaudado = totalComparendos * VALOR_COMPARENDO;
  // 1 dispositivo (gafas) por cada pareja de agentes (motorizado + parrillero)
  const dispositivosTotal   = Math.round(cfg.agentes / 2);
  const dispositivosActivos = Math.round(agentesActivos / 2);
  const eficiencia = Math.round((agentesActivos / cfg.agentes) * 100);

  return {
    ciudad, agentes: cfg.agentes, agentesActivos, escaneosDia,
    soatVencido, rtmVencido, totalComparendos, valorRecaudado,
    dispositivosActivos, dispositivosTotal, eficiencia,
  };
}

export const METRICS_POR_CIUDAD: Record<Ciudad, CiudadMetrics> =
  Object.fromEntries(CIUDADES.map(c => [c, buildCiudadMetrics(c)])) as Record<Ciudad, CiudadMetrics>;

export const METRICS_NACIONAL = {
  agentesTotal:         TOTAL_AGENTES,
  agentesActivos:       CIUDADES.reduce((s, c) => s + METRICS_POR_CIUDAD[c].agentesActivos, 0),
  dispositivosTotal:    CIUDADES.reduce((s, c) => s + METRICS_POR_CIUDAD[c].dispositivosTotal, 0),
  dispositivosActivos:  CIUDADES.reduce((s, c) => s + METRICS_POR_CIUDAD[c].dispositivosActivos, 0),
  escaneosDia:          CIUDADES.reduce((s, c) => s + METRICS_POR_CIUDAD[c].escaneosDia, 0),
  soatVencido:          CIUDADES.reduce((s, c) => s + METRICS_POR_CIUDAD[c].soatVencido, 0),
  rtmVencido:           CIUDADES.reduce((s, c) => s + METRICS_POR_CIUDAD[c].rtmVencido, 0),
  totalComparendos:     CIUDADES.reduce((s, c) => s + METRICS_POR_CIUDAD[c].totalComparendos, 0),
  valorRecaudado:       CIUDADES.reduce((s, c) => s + METRICS_POR_CIUDAD[c].valorRecaudado, 0),
  ciudadesActivas:      4,
  eficienciaPromedio:   Math.round(CIUDADES.reduce((s, c) => s + METRICS_POR_CIUDAD[c].eficiencia, 0) / 4),
};

// ─── SERIE TEMPORAL (últimos 30 días) ───────────────────────────────────────
export interface DaySeries {
  fecha: string;
  escaneos: number;
  comparendos: number;
  valor: number;
  soat: number;
  rtm: number;
}

export const SERIE_NACIONAL_30D: DaySeries[] = (() => {
  const rng = seededRng(42);
  const base = METRICS_NACIONAL.escaneosDia;
  const today = new Date('2026-10-14');
  return Array.from({ length: 30 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - (29 - i));
    const factor = 0.85 + rng() * 0.30;
    const isWeekend = d.getDay() === 0 || d.getDay() === 6;
    const escaneos = Math.round(base * factor * (isWeekend ? 0.65 : 1));
    const soat = Math.round(escaneos * 0.00101);
    const rtm  = Math.round(escaneos * 0.00067);
    return {
      fecha: d.toISOString().split('T')[0],
      escaneos,
      soat,
      rtm,
      comparendos: soat + rtm,
      valor: (soat + rtm) * VALOR_COMPARENDO,
    };
  });
})();

export const SERIE_POR_CIUDAD_30D: Record<Ciudad, DaySeries[]> = (() => {
  const today = new Date('2026-10-14');
  return Object.fromEntries(CIUDADES.map((ciudad, ci) => {
    const rng = seededRng(100 + ci * 13);
    const base = METRICS_POR_CIUDAD[ciudad].escaneosDia;
    const series = Array.from({ length: 30 }, (_, i) => {
      const d = new Date(today);
      d.setDate(today.getDate() - (29 - i));
      const factor = 0.85 + rng() * 0.30;
      const isWeekend = d.getDay() === 0 || d.getDay() === 6;
      const escaneos = Math.round(base * factor * (isWeekend ? 0.65 : 1));
      const TASA_SERIE: Record<string, { soat: number; rtm: number }> = {
        Bogotá:       { soat: 0.001100, rtm: 0.000732 },
        Cali:         { soat: 0.000873, rtm: 0.000582 },
        Medellín:     { soat: 0.000883, rtm: 0.000589 },
        Barranquilla: { soat: 0.001480, rtm: 0.000986 },
      };
      const t = TASA_SERIE[ciudad] ?? { soat: 0.00101, rtm: 0.00067 };
      const soat = Math.round(escaneos * t.soat);
      const rtm  = Math.round(escaneos * t.rtm);
      return {
        fecha: d.toISOString().split('T')[0],
        escaneos,
        soat,
        rtm,
        comparendos: soat + rtm,
        valor: (soat + rtm) * VALOR_COMPARENDO,
      };
    });
    return [ciudad, series];
  })) as Record<Ciudad, DaySeries[]>;
})();

// ─── SERIE INTRADAY (hoy por hora, para gráfica Tendencia·Hoy) ──────────────
export interface HourSeries {
  hora: string;   // "06:00", "07:00", …
  escaneos: number;
  comparendos: number;
  soat: number;
  rtm: number;
}

// Curva realista de actividad: mañana alta, mediodía pico, tarde-noche baja
const HORA_FACTOR = [
  0,    // 00
  0,    // 01
  0,    // 02
  0,    // 03
  0,    // 04
  0,    // 05
  0.55, // 06 — entrada turno mañana
  0.75,
  0.90,
  1.00, // 09 — pico mañana
  0.95,
  0.88,
  0.80, // 12
  0.70,
  0.85, // 14 — entrada turno tarde
  0.92,
  0.95,
  0.90,
  0.82,
  0.70,
  0.60,
  0.50,
  0.40, // 22 — entrada turno noche
  0.25,
];

export const SERIE_INTRADAY_NACIONAL: HourSeries[] = (() => {
  const rng = seededRng(201);
  const baseHora = Math.round(METRICS_NACIONAL.escaneosDia / 18); // ~18 horas operativas

  return Array.from({ length: 24 }, (_, h) => {
    const factor = HORA_FACTOR[h];
    if (factor === 0 || h > 14) {
      return { hora: `${String(h).padStart(2,'0')}:00`, escaneos: 0, comparendos: 0, soat: 0, rtm: 0 };
    }
    const jitter = 0.9 + rng() * 0.2;
    const escaneos = Math.round(baseHora * factor * jitter);
    const soat = Math.round(escaneos * 0.03);
    const rtm  = Math.round(escaneos * 0.02);
    return { hora: `${String(h).padStart(2,'0')}:00`, escaneos, comparendos: soat + rtm, soat, rtm };
  });
})();

export const SERIE_INTRADAY_CIUDAD: Record<Ciudad, HourSeries[]> = (() => {

  return Object.fromEntries(CIUDADES.map((ciudad, ci) => {
    const rng = seededRng(300 + ci * 17);
    const baseHora = Math.round(METRICS_POR_CIUDAD[ciudad].escaneosDia / 18);
    const series = Array.from({ length: 24 }, (_, h) => {
      const factor = HORA_FACTOR[h];
      if (factor === 0 || h > 14) {
        return { hora: `${String(h).padStart(2,'0')}:00`, escaneos: 0, comparendos: 0, soat: 0, rtm: 0 };
      }
      const jitter = 0.9 + rng() * 0.2;
      const escaneos = Math.round(baseHora * factor * jitter);
      const soat = Math.round(escaneos * 0.03);
      const rtm  = Math.round(escaneos * 0.02);
      return { hora: `${String(h).padStart(2,'0')}:00`, escaneos, comparendos: soat + rtm, soat, rtm };
    });
    return [ciudad, series];
  })) as Record<Ciudad, HourSeries[]>;
})();

// ─── AGENTES ────────────────────────────────────────────────────────────────
export type AgentStatus = 'Activo' | 'Inactivo' | 'En pausa' | 'Desconectado';
export type AgentZona = 'Norte' | 'Sur' | 'Centro' | 'Oriente' | 'Occidente';

export interface Agente {
  id: string;
  nombre: string;
  cedula: string;
  ciudad: Ciudad;
  zona: AgentZona;
  status: AgentStatus;
  dispositivo: string;
  escaneosDia: number;
  comparendosDia: number;
  eficiencia: number;
  horasServicio: number;
  ultimaConexion: string;
  turno: 'Mañana' | 'Tarde' | 'Noche';
}

const NOMBRES_M = ['Carlos','Andrés','Jorge','Luis','Diego','Sergio','Fabián','Mauricio','Alejandro','Iván','Jhon','Wilson','Camilo','Harold','Nelson'];
const NOMBRES_F = ['Diana','Paola','María','Sandra','Luz','Claudia','Catalina','Valentina','Lorena','Mónica','Adriana','Natalia','Juliana','Patricia','Viviana'];
const APELLIDOS = ['Rodríguez','García','Martínez','López','González','Hernández','Pérez','Jiménez','Ramírez','Torres','Morales','Vargas','Ospina','Castro','Muñoz','Ríos','Cruz','Suárez','Rojas','Reyes'];
const ZONAS: AgentZona[] = ['Norte','Sur','Centro','Oriente','Occidente'];
const TURNOS = ['Mañana','Tarde','Noche'] as const;

export const AGENTES: Agente[] = (() => {
  const rng = seededRng(77);
  const result: Agente[] = [];
  let seq = 1;

  for (const ciudad of CIUDADES) {
    const { agentes, agentesActivos } = METRICS_POR_CIUDAD[ciudad];
    for (let i = 0; i < agentes; i++) {
      const isFem = rng() > 0.55;
      const nombrePool = isFem ? NOMBRES_F : NOMBRES_M;
      const nombre = `${nombrePool[Math.floor(rng() * nombrePool.length)]} ${APELLIDOS[Math.floor(rng() * APELLIDOS.length)]} ${APELLIDOS[Math.floor(rng() * APELLIDOS.length)]}`;
      const isActive = i < agentesActivos;
      const statusPool: AgentStatus[] = isActive
        ? ['Activo', 'Activo', 'Activo', 'En pausa']
        : ['Inactivo', 'Desconectado', 'Inactivo'];
      const status = statusPool[Math.floor(rng() * statusPool.length)];
      const escaneosDia = status === 'Activo' ? Math.round(50 + rng() * 120) : Math.round(rng() * 30);
      const comparendosDia = Math.round(escaneosDia * (0.03 + rng() * 0.02)); // 3–5% de escaneos
      const horasServicio = status === 'Activo' ? Math.round(4 + rng() * 6) : Math.round(rng() * 3);

      result.push({
        id: `AGT-${String(seq).padStart(5, '0')}`,
        nombre,
        cedula: `${Math.floor(10000000 + rng() * 90000000)}`,
        ciudad,
        zona: ZONAS[Math.floor(rng() * ZONAS.length)],
        status,
        dispositivo: `INMO-AIR3-${String(seq).padStart(4, '0')}`,
        escaneosDia,
        comparendosDia,
        eficiencia: Math.round((escaneosDia / 600) * 100),
        horasServicio,
        ultimaConexion: status === 'Activo'
          ? `Hace ${Math.floor(rng() * 30)} min`
          : `Hace ${Math.floor(1 + rng() * 23)} h`,
        turno: TURNOS[Math.floor(rng() * TURNOS.length)],
      });
      seq++;
    }
  }
  return result;
})();

// ─── DISPOSITIVOS (DHNa3) ───────────────────────────────────────────────────
// 1 dispositivo por pareja de agentes (motorizado + parrillero) → agentes / 2
export type DispositivoStatus = 'Operativo' | 'Mantenimiento' | 'Falla' | 'Inactivo';

export interface Dispositivo {
  id: string;
  serial: string;
  ciudad: Ciudad;
  agenteAsignado: string;
  status: DispositivoStatus;
  bateria: number;
  temperatura: number;
  escaneosDia: number;
  firmwareVersion: string;
  ultimaSync: string;
  tiempoOperacion: number;
  descripcionFalla?: string;
}

const FALLAS_FIJAS: { serial: string; ciudad: Ciudad; descripcion: string }[] = [
  { serial: 'DHNa3-0042', ciudad: 'Bogotá',       descripcion: 'Error GPS: sin fix tras 5 min de intento. Módulo u-blox no responde.' },
  { serial: 'DHNa3-0138', ciudad: 'Bogotá',       descripcion: 'Batería crítica: cayó a 8% en turno. Célula de carga degradada.' },
  { serial: 'DHNa3-0251', ciudad: 'Cali',         descripcion: 'Falla óptica: cámara principal reporta imagen saturada. Posible lente bloqueada.' },
  { serial: 'DHNa3-0312', ciudad: 'Medellín',     descripcion: 'Error de red: pérdida de conectividad 4G LTE. SIM sin señal desde las 09:14.' },
  { serial: 'DHNa3-0389', ciudad: 'Medellín',     descripcion: 'Temperatura crítica: 52°C registrados. Apagado automático por protección térmica.' },
  { serial: 'DHNa3-0441', ciudad: 'Barranquilla', descripcion: 'Falla firmware: actualización 2.4.1 interrumpida. Dispositivo en modo recovery.' },
];

export const DISPOSITIVOS: Dispositivo[] = (() => {
  const rng = seededRng(99);
  const result: Dispositivo[] = [];
  let seq = 1;

  const operativosPorCiudad: Record<Ciudad, number> = Object.fromEntries(
    CIUDADES.map(c => [c, METRICS_POR_CIUDAD[c].dispositivosActivos])
  ) as Record<Ciudad, number>;
  const operativosUsados: Record<Ciudad, number> = { Bogotá: 0, Cali: 0, Medellín: 0, Barranquilla: 0 };

  for (const ciudad of CIUDADES) {
    const cfg = CIUDAD_CONFIG[ciudad];
    const totalDisp = Math.round(cfg.agentes / 2);
    const agentesCity = AGENTES.filter(a => a.ciudad === ciudad);
    const operativosTarget = operativosPorCiudad[ciudad];

    for (let i = 0; i < totalDisp; i++) {
      const serial = `DHNa3-${String(seq).padStart(4, '0')}`;
      const fallaFija = FALLAS_FIJAS.find(f => f.serial === serial);
      const agente = agentesCity[i * 2] ?? agentesCity[i] ?? agentesCity[0];
      const batPct = Math.round(10 + rng() * 90);

      let status: DispositivoStatus;
      if (fallaFija) {
        status = 'Falla';
      } else {
        const restanteOperativos = operativosTarget - operativosUsados[ciudad];
        const restanteDispositivos = totalDisp - i;
        if (restanteOperativos > 0 && (restanteOperativos >= restanteDispositivos || rng() < restanteOperativos / restanteDispositivos)) {
          status = 'Operativo';
          operativosUsados[ciudad]++;
        } else {
          status = rng() > 0.45 ? 'Mantenimiento' : 'Inactivo';
        }
      }

      result.push({
        id:               `DEV-${String(seq).padStart(4, '0')}`,
        serial,
        ciudad,
        agenteAsignado:   agente.nombre,
        status,
        bateria:          fallaFija?.descripcion.includes('Batería') ? 8 : batPct,
        temperatura:      fallaFija?.descripcion.includes('Temperatura') ? 52 : Math.round(28 + rng() * 12),
        escaneosDia:      agente.escaneosDia * 2,
        firmwareVersion:  fallaFija?.descripcion.includes('firmware') ? '2.4.1-ERR' : '2.4.1',
        ultimaSync:       agente.ultimaConexion,
        tiempoOperacion:  Math.round(200 + rng() * 2800),
        ...(fallaFija ? { descripcionFalla: fallaFija.descripcion } : {}),
      });
      seq++;
    }
  }
  return result;
})();
// ─── ALERTAS ────────────────────────────────────────────────────────────────
export type AlertaSeveridad = 'Alta' | 'Media' | 'Baja';
export type AlertaTipo = 'C02' | 'C03';

export interface Alerta {
  id: string;
  tipo: AlertaTipo;
  descripcion: string;
  placa: string;
  ciudad: Ciudad;
  agente: string;
  severidad: AlertaSeveridad;
  timestamp: string;
  estado: 'Activa' | 'Procesada' | 'Pendiente';
  valorComparendo: number;
}

export const ALERTAS: Alerta[] = (() => {
  const rng = seededRng(55);
  const result: Alerta[] = [];
  const letras = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const now = new Date('2026-10-14T14:30:00');

  let idx = 1;
  for (const ciudad of CIUDADES) {
    // Generar ~20 alertas recientes por ciudad para el demo
    const numAlertas = 20;
    for (let i = 0; i < numAlertas; i++) {
      const tipo: AlertaTipo = rng() > 0.45 ? 'C03' : 'C02';
      const placa = `${letras[Math.floor(rng()*26)]}${letras[Math.floor(rng()*26)]}${letras[Math.floor(rng()*26)]}${Math.floor(100+rng()*900)}`;
      const minutosAtras = Math.floor(rng() * 240);
      const ts = new Date(now.getTime() - minutosAtras * 60000);
      const agentesCiudad = AGENTES.filter(a => a.ciudad === ciudad && a.status === 'Activo');
      const agente = agentesCiudad[Math.floor(rng() * agentesCiudad.length)]?.nombre ?? 'Sin asignar';
      result.push({
        id:          `ALT-${String(idx).padStart(5, '0')}`,
        tipo,
        descripcion: tipo === 'C02' ? 'SOAT Vencido' : 'RTM/Tecnicomecánica Vencida',
        placa,
        ciudad,
        agente,
        severidad:   tipo === 'C02' ? 'Alta' : 'Media',
        timestamp:   ts.toISOString(),
        estado:      rng() > 0.6 ? 'Activa' : rng() > 0.5 ? 'Procesada' : 'Pendiente',
        valorComparendo: VALOR_COMPARENDO,
      });
      idx++;
    }
  }
  return result.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
})();

// ─── VEHÍCULOS (detectados con infracción) ──────────────────────────────────
export interface VehiculoDetectado {
  id: string;
  placa: string;
  ciudad: Ciudad;
  tipoInfraccion: 'SOAT Vencido' | 'RTM Vencida';
  codigoComparendo: 'C02' | 'C03';
  agente: string;
  fechaDeteccion: string;
  estado: 'Comparendo generado' | 'Pendiente notificación' | 'Notificado';
  valorComparendo: number;
}

export const VEHICULOS_DETECTADOS: VehiculoDetectado[] = ALERTAS.map(a => ({
  id:              `VEH-${a.id.split('-')[1]}`,
  placa:           a.placa,
  ciudad:          a.ciudad,
  tipoInfraccion:  a.tipo === 'C02' ? 'SOAT Vencido' : 'RTM Vencida',
  codigoComparendo: a.tipo,
  agente:          a.agente,
  fechaDeteccion:  a.timestamp,
  estado:          a.estado === 'Procesada' ? 'Comparendo generado'
                 : a.estado === 'Activa'    ? 'Pendiente notificación'
                 : 'Notificado',
  valorComparendo: VALOR_COMPARENDO,
}));

// ─── MAPA — coordenadas de agentes activos ──────────────────────────────────
export interface MapPoint {
  id: string;
  nombre: string;
  ciudad: Ciudad;
  lat: number;
  lng: number;
  status: AgentStatus;
  escaneosDia: number;
}

// Bounding boxes del casco urbano de cada ciudad (zonas construidas, no rural ni reservas)
const CIUDAD_BBOX: Record<Ciudad, { latMin: number; latMax: number; lngMin: number; lngMax: number }> = {
  // Bogotá: plano urbano, excluye cerros orientales y bordes rurales
  Bogotá:       { latMin: 4.478, latMax: 4.730, lngMin: -74.185, lngMax: -74.058 },
  // Cali: fondo del valle, excluye Farallones al oeste y cerros al este
  Cali:         { latMin: 3.375, latMax: 3.505, lngMin: -76.560, lngMax: -76.480 },
  // Medellín: fondo del valle del Aburrá, excluye laderas altas
  Medellín:     { latMin: 6.200, latMax: 6.310, lngMin: -75.620, lngMax: -75.545 },
  // Barranquilla: trama urbana plana, excluye borde norte y ciénaga sur
  Barranquilla: { latMin: 10.945, latMax: 11.010, lngMin: -74.840, lngMax: -74.755 },
};

export const MAP_POINTS: MapPoint[] = (() => {
  const rng = seededRng(33);
  const POR_CIUDAD: Record<Ciudad, number> = { Bogotá: 80, Cali: 50, Medellín: 45, Barranquilla: 25 };
  const result: MapPoint[] = [];
  for (const ciudad of CIUDADES) {
    const activos = AGENTES.filter(a => a.ciudad === ciudad && a.status === 'Activo').slice(0, POR_CIUDAD[ciudad]);
    const bbox = CIUDAD_BBOX[ciudad];
    const latRange = bbox.latMax - bbox.latMin;
    const lngRange = bbox.lngMax - bbox.lngMin;
    for (const a of activos) {
      result.push({
        id:          a.id,
        nombre:      a.nombre,
        ciudad:      a.ciudad,
        lat:         bbox.latMin + rng() * latRange,
        lng:         bbox.lngMin + rng() * lngRange,
        status:      a.status,
        escaneosDia: a.escaneosDia,
      });
    }
  }
  return result;
})();

// ─── COMUNICACIÓN — mensajes entre director nacional y secretarías ───────────
export interface Mensaje {
  id: string;
  de: string;       // 'nacional' | Ciudad
  para: string;
  contenido: string;
  timestamp: string;
  leido: boolean;
}

const MSG_TEMPLATES_NACIONAL = [
  'Por favor confirmen operativos de hoy en hora pico.',
  'Recuerden activar el protocolo de verificación masiva este fin de semana.',
  'Necesito reporte de comparendos al cierre de turno.',
  'Coordinar con secretaría zonas de mayor infracción SOAT.',
  'Actualizamos firmware a versión 2.4.1 — favor confirmar recepción.',
];

const MSG_TEMPLATES_CIUDAD: Record<Ciudad, string[]> = {
  Bogotá: [
    'Operativo activo en Av. 68 con 80. 145 agentes en campo.',
    'Zona norte reporta alta densidad vehicular, solicitamos refuerzo.',
    'Comparendos del turno mañana: 1.340 SOAT, 1.608 RTM.',
  ],
  Cali: [
    'Desplegados 183 agentes en corredor de Aguablanca.',
    'Falla técnica en 3 dispositivos — enviados a mantenimiento.',
    'Total comparendos hoy: 712 SOAT, 854 RTM.',
  ],
  Medellín: [
    'Operativo en El Poblado y Laureles. 160 agentes activos.',
    'Solicitamos calibración de cámara en lote 05.',
    'Reporte diario enviado al sistema. Comparendos: 627 SOAT, 792 RTM.',
  ],
  Barranquilla: [
    '51 agentes en campo. Zona portuaria con alta actividad.',
    'Coordinando con Policía de Tránsito operativo especial.',
    'Informe de turno: 200 SOAT, 240 RTM.',
  ],
};

export const MENSAJES_COMUNICACION: Mensaje[] = (() => {
  const rng = seededRng(21);
  const result: Mensaje[] = [];
  const now = new Date('2026-10-14T14:30:00');
  let idx = 1;

  for (const ciudad of CIUDADES) {
    // 3 mensajes del nacional a ciudad
    MSG_TEMPLATES_NACIONAL.slice(0, 3).forEach((msg, i) => {
      const ts = new Date(now.getTime() - (60 - i * 15) * 60000);
      result.push({ id: `MSG-${String(idx++).padStart(4,'0')}`, de: 'nacional', para: ciudad, contenido: msg, timestamp: ts.toISOString(), leido: i < 2 });
    });
    // 3 respuestas de la ciudad
    MSG_TEMPLATES_CIUDAD[ciudad].forEach((msg, i) => {
      const ts = new Date(now.getTime() - (50 - i * 12) * 60000);
      result.push({ id: `MSG-${String(idx++).padStart(4,'0')}`, de: ciudad, para: 'nacional', contenido: msg, timestamp: ts.toISOString(), leido: rng() > 0.5 });
    });
  }
  return result.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
})();

// ─── IA / DATASETS ──────────────────────────────────────────────────────────
export interface Dataset {
  id: string;
  nombre: string;
  ciudad: Ciudad | 'Nacional';
  registros: number;
  precision: number;    // %
  version: string;
  ultimoEntrenamiento: string;
  estado: 'Activo' | 'Entrenando' | 'Pendiente';
}

export const DATASETS: Dataset[] = [
  { id: 'DS-001', nombre: 'YOLOv8 Detección de Placas', ciudad: 'Nacional', registros: 2_450_000, precision: 97.3, version: '3.2.1', ultimoEntrenamiento: '2026-10-01', estado: 'Activo' },
  { id: 'DS-002', nombre: 'Clasificador SOAT Vencido', ciudad: 'Nacional', registros: 185_000, precision: 99.1, version: '2.0.0', ultimoEntrenamiento: '2026-09-15', estado: 'Activo' },
  { id: 'DS-003', nombre: 'Clasificador RTM Vencido', ciudad: 'Nacional', registros: 210_000, precision: 98.7, version: '2.0.0', ultimoEntrenamiento: '2026-09-15', estado: 'Activo' },
  { id: 'DS-004', nombre: 'Dataset Placas Bogotá', ciudad: 'Bogotá', registros: 980_000, precision: 98.2, version: '1.5.0', ultimoEntrenamiento: '2026-10-05', estado: 'Activo' },
  { id: 'DS-005', nombre: 'Dataset Placas Cali', ciudad: 'Cali', registros: 420_000, precision: 97.8, version: '1.3.0', ultimoEntrenamiento: '2026-09-28', estado: 'Activo' },
  { id: 'DS-006', nombre: 'Dataset Placas Medellín', ciudad: 'Medellín', registros: 370_000, precision: 97.5, version: '1.3.0', ultimoEntrenamiento: '2026-09-28', estado: 'Activo' },
  { id: 'DS-007', nombre: 'Dataset Placas Barranquilla', ciudad: 'Barranquilla', registros: 118_000, precision: 96.9, version: '1.1.0', ultimoEntrenamiento: '2026-09-20', estado: 'Entrenando' },
  { id: 'DS-008', nombre: 'Modelo Predictivo Picos Tráfico', ciudad: 'Nacional', registros: 56_000, precision: 89.4, version: '0.9.0', ultimoEntrenamiento: '2026-08-30', estado: 'Pendiente' },
];

// ─── NOVA INTELLIGENCE — insights IA ────────────────────────────────────────
export interface NovaInsight {
  id: string;
  titulo: string;
  descripcion: string;
  ciudad: Ciudad | 'Nacional';
  impacto: 'Alto' | 'Medio' | 'Bajo';
  tipo: 'Prediccion' | 'Anomalia' | 'Optimizacion' | 'Alerta';
  timestamp: string;
  accionSugerida: string;
}

export const NOVA_INSIGHTS: NovaInsight[] = [
  { id: 'NI-001', titulo: 'Pico de infracciones SOAT previsto — Bogotá norte', descripcion: 'El modelo predictivo detecta un incremento del 23% en vehículos con SOAT vencido los viernes entre 7–9 am en Bogotá zona norte. El patrón se repite durante 6 semanas consecutivas con correlación del 91%.', ciudad: 'Bogotá', impacto: 'Alto', tipo: 'Prediccion', timestamp: '2026-10-15T06:00:00Z', accionSugerida: 'Desplegar 8 agentes adicionales en Av. NQS con Calle 80 y Suba los viernes entre 6:30–9:30 am. Priorizar motos y vehículos de carga liviana.' },
  { id: 'NI-002', titulo: 'Zona de alta evasión RTM identificada — Cali sur', descripcion: 'El 34% de los vehículos detectados en la Calle 5a con Carrera 50 (Aguablanca) presentan RTM vencida, triplicando el promedio de la ciudad del 11%. El patrón es consistente en todos los turnos.', ciudad: 'Cali', impacto: 'Alto', tipo: 'Alerta', timestamp: '2026-10-15T07:30:00Z', accionSugerida: 'Establecer operativo fijo de 5 días en corredor Aguablanca. Coordinar con CDA más cercano para facilitar regularización in situ.' },
  { id: 'NI-003', titulo: 'Optimización de turno — redistribución agentes Medellín', descripcion: 'El corredor El Poblado–Laureles registra el 12% de los comparendos pero concentra el 28% de los agentes. Reasignar 15 unidades al Centro y Robledo proyecta +19% en efectividad.', ciudad: 'Medellín', impacto: 'Medio', tipo: 'Optimizacion', timestamp: '2026-10-14T22:00:00Z', accionSugerida: 'Proponer al Dr. Camilo Restrepo la redistribución de 15 agentes hacia los corredores de mayor incidencia para el turno del lunes.' },
  { id: 'NI-004', titulo: 'Tendencia nacional alcista — SOAT vencido Q4 2026', descripcion: 'Aumento sostenido del 8,3% mensual en vehículos con SOAT vencido a nivel nacional durante los últimos 3 meses. Para diciembre se proyecta un 31% más de infractores que en julio.', ciudad: 'Nacional', impacto: 'Alto', tipo: 'Alerta', timestamp: '2026-10-14T07:00:00Z', accionSugerida: 'Escalar al SIMIT para activar campaña nacional y aumentar la densidad de operativos en diciembre. Priorizar ciudades intermedias.' },
  { id: 'NI-005', titulo: 'Día y hora de máxima infracción — Barranquilla', descripcion: 'Los martes y jueves entre 11 am–1 pm concentran el 41% de todas las infracciones semanales en Barranquilla. Los corredores Murillo y 30 de Agosto son los puntos críticos.', ciudad: 'Barranquilla', impacto: 'Alto', tipo: 'Prediccion', timestamp: '2026-10-14T18:00:00Z', accionSugerida: 'Concentrar el 60% de los agentes en corredores Murillo y 30 de Agosto los martes y jueves entre 10:30 am–1:30 pm.' },
  { id: 'NI-006', titulo: 'Baja eficiencia operativa — turno nocturno nacional', descripcion: 'Los agentes en turno noche registran 45% menos escaneos que en turno mañana. Sin embargo la tasa de infracción por escaneo es 17% más alta en noche: oportunidad perdida.', ciudad: 'Nacional', impacto: 'Medio', tipo: 'Anomalia', timestamp: '2026-10-14T06:00:00Z', accionSugerida: 'Reforzar turno nocturno en zonas de alto tráfico (salidas de bares, terminales). El ROI por agente en noche supera al de mañana en un 22%.' },
  { id: 'NI-007', titulo: 'Predicción de evasión masiva — puente festivo 20-oct', descripcion: 'Basado en los últimos 4 puentes festivos, se proyecta un incremento del 38% en flujo vehicular y 29% más vehículos con documentos vencidos el 20 de octubre en las 4 ciudades.', ciudad: 'Nacional', impacto: 'Alto', tipo: 'Prediccion', timestamp: '2026-10-15T08:00:00Z', accionSugerida: 'Activar turno reforzado el 20-oct. Priorizar salidas: Autopista Norte (Bogotá), Vía al Mar (Barranquilla), Autopista Sur (Cali) y Autopista Medellín–Bogotá.' },
  { id: 'NI-008', titulo: 'Infractores reincidentes identificados — Bogotá', descripcion: 'Se identificaron 1.243 placas en Bogotá con 3 o más detecciones de SOAT vencido sin regularizar en 30 días. Representan el 4% de los vehículos pero el 21% del valor en multas no cobradas.', ciudad: 'Bogotá', impacto: 'Alto', tipo: 'Alerta', timestamp: '2026-10-13T20:00:00Z', accionSugerida: 'Generar listado de placas reincidentes para inmovilización preventiva. Coordinar con Secretaría de Movilidad el protocolo de retención.' },
  { id: 'NI-009', titulo: 'Corredor sin cobertura detectado — Medellín norte', descripcion: 'El corredor Autopista Norte entre Bello y Copacabana registra 0 escaneos en los últimos 15 días, pese a un flujo estimado de 8.200 vehículos/día.', ciudad: 'Medellín', impacto: 'Alto', tipo: 'Anomalia', timestamp: '2026-10-14T11:00:00Z', accionSugerida: 'Asignar rotación de al menos 3 agentes en el corredor Bello–Copacabana. Potencial estimado: 180 comparendos diarios.' },
  { id: 'NI-010', titulo: 'Optimización de patrullaje — Cali occidente', descripcion: 'Cambiar el recorrido de 12 agentes en Cali occidente reduce el tiempo muerto entre escaneos de 34 min a 11 min, equivalente a 2.800 escaneos adicionales por turno.', ciudad: 'Cali', impacto: 'Medio', tipo: 'Optimizacion', timestamp: '2026-10-14T14:00:00Z', accionSugerida: 'Implementar ruta optimizada el miércoles como prueba piloto. El sistema generará reporte comparativo al finalizar el turno.' },
  { id: 'NI-011', titulo: 'Concentración de motos sin RTM — Bogotá sur', descripcion: 'El 52% de las motos en la Autopista Sur entre Bosa y Usme presentan RTM vencida, vs el promedio de la ciudad del 19%. Motos de trabajo representan el 73% de los infractores.', ciudad: 'Bogotá', impacto: 'Alto', tipo: 'Alerta', timestamp: '2026-10-15T05:00:00Z', accionSugerida: 'Operativo especializado en motos en Autopista Sur. Coordinar con CDA de Bosa para revisión y notificación inmediata de multas.' },
  { id: 'NI-012', titulo: 'Predicción de baja operativa — lluvia Barranquilla', descripcion: 'Los días de lluvia intensa en Barranquilla la efectividad operativa cae un 61%. Pronóstico indica lluvias los próximos 3 días. Se anticipan 12.000 escaneos perdidos.', ciudad: 'Barranquilla', impacto: 'Medio', tipo: 'Prediccion', timestamp: '2026-10-15T06:30:00Z', accionSugerida: 'Reubicar operativos a zonas cubiertas: terminales y vías con separador. Compensar con turno extendido en días soleados posteriores.' },
  { id: 'NI-013', titulo: 'Hora de oro para comparendos — Medellín', descripcion: 'El 67% de los comparendos de Medellín se generan entre 7–9 am y 5–7 pm en 90 días de análisis. Fuera de esas ventanas la tasa cae a menos del 8% del total diario.', ciudad: 'Medellín', impacto: 'Medio', tipo: 'Optimizacion', timestamp: '2026-10-14T16:00:00Z', accionSugerida: 'Concentrar el 80% de los agentes en ventanas 7–9 am y 5–7 pm. Reducir cobertura en horas valle para optimizar el costo por comparendo.' },
  { id: 'NI-014', titulo: 'Vehículos de carga pesada — zonas sin cobertura', descripcion: 'Los vehículos de carga representan el 8% del flujo pero el 31% de las infracciones RTM a nivel nacional. Zona Industrial de Cali y Puerto de Barranquilla tienen cobertura inferior al 5%.', ciudad: 'Nacional', impacto: 'Alto', tipo: 'Alerta', timestamp: '2026-10-13T15:00:00Z', accionSugerida: 'Crear operativos en zonas industriales y puertos. Un agente en zona de carga genera 4,2 veces más valor en comparendos que en zona residencial.' },
  { id: 'NI-015', titulo: 'Detección de placas clonadas — patrón identificado', descripcion: 'Se detectaron 47 casos en 7 días donde una misma placa fue registrada simultáneamente en dos ubicaciones distintas. Bogotá concentra el 68% de los casos.', ciudad: 'Bogotá', impacto: 'Alto', tipo: 'Anomalia', timestamp: '2026-10-14T19:00:00Z', accionSugerida: 'Reportar al RUNT y Policía de Tránsito las 47 placas sospechosas. Activar protocolo de alerta para captura en campo.' },
  { id: 'NI-016', titulo: 'Agentes de alto rendimiento — modelo replicable', descripcion: 'El 10% de los agentes genera el 34% de todos los comparendos. El análisis de sus rutas, horarios y técnicas de escaneo permite crear un modelo replicable para el resto del equipo.', ciudad: 'Nacional', impacto: 'Medio', tipo: 'Optimizacion', timestamp: '2026-10-13T12:00:00Z', accionSugerida: 'Compartir el protocolo de los agentes top-10 con todas las secretarías. Organizar sesión de capacitación replicando rutas y técnicas de los mejores operadores.' },
  { id: 'NI-017', titulo: 'Zona ciega nocturna — Cali norte', descripcion: 'La Carrera 1 entre Calles 70 y 100 en Cali registra tasa de detección del 12% en turno nocturno vs 78% en diurno. Alto índice de accidentalidad nocturna en esa zona amplifica el riesgo.', ciudad: 'Cali', impacto: 'Alto', tipo: 'Anomalia', timestamp: '2026-10-14T21:00:00Z', accionSugerida: 'Asignar agentes con protocolo de iluminación reforzada en Carrera 1 norte durante turno nocturno. Considerar puntos de control fijos.' },
  { id: 'NI-018', titulo: 'Proyección de recaudo — superará meta mensual', descripcion: 'Con el ritmo de comparendos de los primeros 15 días de octubre, se proyecta superar la meta SIMIT en un 14,7%, equivalente a $2.840 millones adicionales en recaudo.', ciudad: 'Nacional', impacto: 'Bajo', tipo: 'Prediccion', timestamp: '2026-10-15T04:00:00Z', accionSugerida: 'Mantener el nivel operativo actual. Informar al SIMIT sobre la proyección para ajuste de metas Q4 y reforzar zonas con menor rendimiento.' },
  { id: 'NI-019', titulo: 'Punto crítico de accidentalidad sin cobertura — Bogotá', descripcion: 'La Glorieta de las Américas es el tercer punto con más accidentes de Bogotá según el IDU, pero no registra escaneos en los últimos 30 días. Alta concentración de motos sin documentos en el sector.', ciudad: 'Bogotá', impacto: 'Alto', tipo: 'Alerta', timestamp: '2026-10-14T13:00:00Z', accionSugerida: 'Incorporar la Glorieta de las Américas al mapa de operativos permanentes. Alta accidentalidad + baja cobertura = zona prioritaria de intervención.' },
  { id: 'NI-020', titulo: 'Rotación inteligente de agentes — +28% cobertura territorial', descripcion: 'Implementando rotación de zonas cada 90 minutos en lugar de fija por turno, la cobertura territorial efectiva aumentaría del 43% al 71% con el mismo número de agentes.', ciudad: 'Nacional', impacto: 'Alto', tipo: 'Optimizacion', timestamp: '2026-10-15T03:00:00Z', accionSugerida: 'Pilotear rotación cada 90 min en Barranquilla durante 2 semanas. Comparar cobertura y comparendos vs esquema actual antes de escalar.' },
];

// ─── REPORTES ────────────────────────────────────────────────────────────────
export interface Reporte {
  id: string;
  titulo: string;
  ciudad: Ciudad | 'Nacional';
  tipo: 'Diario' | 'Semanal' | 'Mensual' | 'Trimestral';
  fecha: string;
  estado: 'Generado' | 'Pendiente' | 'Programado';
  comparendos: number;
  valor: number;
}

export const REPORTES: Reporte[] = [
  { id: 'REP-001', titulo: 'Reporte Operativo Diario Nacional', ciudad: 'Nacional', tipo: 'Diario', fecha: '2026-10-13', estado: 'Generado', comparendos: METRICS_NACIONAL.totalComparendos, valor: METRICS_NACIONAL.valorRecaudado },
  { id: 'REP-002', titulo: 'Reporte Semanal Bogotá', ciudad: 'Bogotá', tipo: 'Semanal', fecha: '2026-10-10', estado: 'Generado', comparendos: METRICS_POR_CIUDAD.Bogotá.totalComparendos * 5, valor: METRICS_POR_CIUDAD.Bogotá.valorRecaudado * 5 },
  { id: 'REP-003', titulo: 'Reporte Semanal Cali', ciudad: 'Cali', tipo: 'Semanal', fecha: '2026-10-10', estado: 'Generado', comparendos: METRICS_POR_CIUDAD.Cali.totalComparendos * 5, valor: METRICS_POR_CIUDAD.Cali.valorRecaudado * 5 },
  { id: 'REP-004', titulo: 'Reporte Mensual Nacional — Sep 2026', ciudad: 'Nacional', tipo: 'Mensual', fecha: '2026-09-30', estado: 'Generado', comparendos: METRICS_NACIONAL.totalComparendos * 22, valor: METRICS_NACIONAL.valorRecaudado * 22 },
  { id: 'REP-005', titulo: 'Reporte Trimestral Q3 2026', ciudad: 'Nacional', tipo: 'Trimestral', fecha: '2026-09-30', estado: 'Generado', comparendos: METRICS_NACIONAL.totalComparendos * 65, valor: METRICS_NACIONAL.valorRecaudado * 65 },
  { id: 'REP-006', titulo: 'Reporte Diario Medellín', ciudad: 'Medellín', tipo: 'Diario', fecha: '2026-10-14', estado: 'Pendiente', comparendos: 0, valor: 0 },
  { id: 'REP-007', titulo: 'Reporte Diario Barranquilla', ciudad: 'Barranquilla', tipo: 'Diario', fecha: '2026-10-14', estado: 'Programado', comparendos: 0, valor: 0 },
];

// ─── UTILIDADES DE FILTRO ────────────────────────────────────────────────────
export type FiltroFecha = 'Hoy' | 'Semana' | 'Mes' | 'Trimestre' | 'Todo';
export type FiltroCiudad = 'Todas' | Ciudad;

export function filtrarPorCiudad<T extends { ciudad: Ciudad | 'Nacional' }>(
  items: T[],
  ciudad: FiltroCiudad
): T[] {
  if (ciudad === 'Todas') return items;
  return items.filter(i => i.ciudad === ciudad);
}

export function getMetricsCiudad(ciudad: FiltroCiudad): CiudadMetrics | typeof METRICS_NACIONAL {
  if (ciudad === 'Todas') return METRICS_NACIONAL;
  return METRICS_POR_CIUDAD[ciudad];
}

export function getSeriesCiudad(ciudad: FiltroCiudad): DaySeries[] {
  if (ciudad === 'Todas') return SERIE_NACIONAL_30D;
  return SERIE_POR_CIUDAD_30D[ciudad];
}

export function filtrarPorFecha(series: DaySeries[], filtro: FiltroFecha): DaySeries[] {
  const today = new Date('2026-10-14');
  if (filtro === 'Todo') return series;
  const days = filtro === 'Hoy' ? 1 : filtro === 'Semana' ? 7 : filtro === 'Mes' ? 30 : 90;
  const cutoff = new Date(today);
  cutoff.setDate(today.getDate() - days);
  return series.filter(s => new Date(s.fecha) >= cutoff);
}

export function formatCOP(value: number): string {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(value);
}

export function formatNum(value: number): string {
  return new Intl.NumberFormat('es-CO').format(value);
}
// ─── AGENTES CCN ─────────────────────────────────────────────────────────────
export interface AgenteNacional {
  id: string;
  nombre: string;
  ciudad: Ciudad;
  secretaria: string;
  estado: 'ACTIVO' | 'INACTIVO';
  turno: string;
  ultimoTurno: string;
  escaneosTotal: number;
  soatDetectado: number;
  rtmDetectado: number;
  infracciones: number;
  turnos: number;
  horasUso: number;
  precisionOCR: number;
  usoVoz: number;
  tasaAlerta: number;
  ranking: number;
  rankingInfr: number;
}

const _rngAgentes = seededRng(777);
const NOMBRES_BASE = [
  'Rodríguez','García','Martínez','López','González','Hernández','Pérez','Torres',
  'Vargas','Sánchez','Morales','Jiménez','Castro','Romero','Díaz','Reyes',
  'Muñoz','Álvarez','Ramos','Suárez','Medina','Gómez','Ortiz','Silva',
  'Rojas','Guerrero','Navarro','Ríos','Mendoza','Flores','Cruz','Rubio',
  'Molina','Serrano','Blanco','Herrera','Mora','Aguilar','Vega','Delgado',
];

function buildAgentes(): AgenteNacional[] {
  const lista: AgenteNacional[] = [];
  let idx = 0;
  CIUDADES.forEach(ciudad => {
    const m = METRICS_POR_CIUDAD[ciudad];
    const cfg = CIUDAD_CONFIG[ciudad];
    for (let i = 0; i < 10; i++) {
      const apellido = NOMBRES_BASE[idx % NOMBRES_BASE.length];
      const num = 100 + Math.floor(_rngAgentes() * 900);
      const activo = _rngAgentes() > 0.15;
      const escaneosBase = Math.round(m.escaneosDia * (0.08 + _rngAgentes() * 0.12));
      const soat = Math.round(escaneosBase * 0.03 * (0.7 + _rngAgentes() * 0.6));
      const rtm  = Math.round(escaneosBase * 0.02 * (0.7 + _rngAgentes() * 0.6));
      const turnos = 18 + Math.floor(_rngAgentes() * 14);
      lista.push({
        id: `AGT-${String(lista.length + 1).padStart(3,'0')}`,
        nombre: `${apellido}${num}`,
        ciudad,
        secretaria: cfg.secretaria,
        estado: activo ? 'ACTIVO' : 'INACTIVO',
        turno: activo ? (['Mañana','Tarde','Noche'][Math.floor(_rngAgentes() * 3)]) : '—',
        ultimoTurno: '2026-10-15',
        escaneosTotal: escaneosBase,
        soatDetectado: soat,
        rtmDetectado: rtm,
        infracciones: soat + rtm,
        turnos,
        horasUso: Math.round(turnos * (3.5 + _rngAgentes() * 1.5)),
        precisionOCR: Math.round(94 + _rngAgentes() * 5.5),
        usoVoz: Math.round(10 + _rngAgentes() * 40),
        tasaAlerta: parseFloat((((soat + rtm) / escaneosBase) * 100).toFixed(1)),
        ranking: 0,
        rankingInfr: 0,
      });
      idx++;
    }
  });
  const byEsc = [...lista].sort((a, b) => b.escaneosTotal - a.escaneosTotal);
  byEsc.forEach((a, i) => { lista.find(x => x.id === a.id)!.ranking = i + 1; });
  const byInfr = [...lista].sort((a, b) => b.infracciones - a.infracciones);
  byInfr.forEach((a, i) => { lista.find(x => x.id === a.id)!.rankingInfr = i + 1; });
  return lista;
}

export const AGENTES_CCN: AgenteNacional[] = buildAgentes();