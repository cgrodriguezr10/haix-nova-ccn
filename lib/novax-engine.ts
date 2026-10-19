/**
 * NovaX Engine — Motor de IA Conversacional Simulado
 * HAIX Nova Command Center Nacional
 * Respuestas inteligentes basadas en los datos mock de la plataforma.
 */

import {
  METRICS_POR_CIUDAD,
  METRICS_NACIONAL,
  SERIE_POR_CIUDAD_30D,
  SERIE_NACIONAL_30D,
  CIUDAD_CONFIG,
  CIUDADES,
  VALOR_COMPARENDO,
  formatNum,
  type Ciudad,
} from '@/lib/mock-data';

// ─── TIPOS ───────────────────────────────────────────────────────────────────
export type MessageRole = 'user' | 'novax';

export interface NovaXMessage {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: Date;
  table?: TableData;
  chart?: ChartData;
  exportable?: boolean;
}

export interface TableData {
  headers: string[];
  rows: (string | number)[][];
}

export interface ChartData {
  type: 'bar' | 'line' | 'comparison';
  labels: string[];
  datasets: { label: string; data: number[]; color: string }[];
}

// ─── UTILIDADES ──────────────────────────────────────────────────────────────
const COP = (n: number) =>
  '$' + Math.round(n / 1_000_000).toLocaleString('en') + 'M';

const fmt = (n: number) => n.toLocaleString('es-CO');

function monthSums(ciudad: Ciudad) {
  const series = SERIE_POR_CIUDAD_30D[ciudad].slice(15);
  return series.reduce(
    (acc, d) => ({
      escaneos: acc.escaneos + d.escaneos,
      soat: acc.soat + d.soat,
      rtm: acc.rtm + d.rtm,
      comparendos: acc.comparendos + d.comparendos,
      valor: acc.valor + d.valor,
    }),
    { escaneos: 0, soat: 0, rtm: 0, comparendos: 0, valor: 0 }
  );
}

function nationalMonthSums() {
  return SERIE_NACIONAL_30D.slice(15).reduce(
    (acc, d) => ({
      escaneos: acc.escaneos + d.escaneos,
      soat: acc.soat + d.soat,
      rtm: acc.rtm + d.rtm,
      comparendos: acc.comparendos + d.comparendos,
      valor: acc.valor + d.valor,
    }),
    { escaneos: 0, soat: 0, rtm: 0, comparendos: 0, valor: 0 }
  );
}

// ─── ZONAS POR CIUDAD ────────────────────────────────────────────────────────
const ZONAS: Record<Ciudad, { nombre: string; comparendosPct: number; agentes: number }[]> = {
  Bogotá: [
    { nombre: 'Autopista Sur (Bosa–Usme)', comparendosPct: 28, agentes: 89 },
    { nombre: 'Av. NQS – Calle 80 (norte)', comparendosPct: 21, agentes: 76 },
    { nombre: 'Glorieta de las Américas', comparendosPct: 17, agentes: 45 },
    { nombre: 'Av. Suba – Calle 170', comparendosPct: 14, agentes: 62 },
    { nombre: 'Carrera 7 – Centro', comparendosPct: 11, agentes: 53 },
    { nombre: 'El Poblado – Chapinero', comparendosPct: 9, agentes: 68 },
  ],
  Cali: [
    { nombre: 'Aguablanca – Calle 5a / Cra 50', comparendosPct: 34, agentes: 52 },
    { nombre: 'Carrera 1 (norte)', comparendosPct: 22, agentes: 38 },
    { nombre: 'Autopista Simón Bolívar', comparendosPct: 18, agentes: 45 },
    { nombre: 'Zona Industrial Guadalupe', comparendosPct: 15, agentes: 28 },
    { nombre: 'Centro – Cali Viejo', comparendosPct: 11, agentes: 31 },
  ],
  Medellín: [
    { nombre: 'Autopista Norte – Bello/Copacabana', comparendosPct: 31, agentes: 44 },
    { nombre: 'Centro – Av. Oriental', comparendosPct: 24, agentes: 38 },
    { nombre: 'Robledo – Doce de Octubre', comparendosPct: 19, agentes: 29 },
    { nombre: 'El Poblado – Laureles', comparendosPct: 12, agentes: 61 },
    { nombre: 'Itagüí – La Estrella', comparendosPct: 14, agentes: 22 },
  ],
  Barranquilla: [
    { nombre: 'Corredor Murillo – 30 de Agosto', comparendosPct: 41, agentes: 18 },
    { nombre: 'Vía 40 – Puerto', comparendosPct: 27, agentes: 14 },
    { nombre: 'Av. Circunvalar', comparendosPct: 19, agentes: 10 },
    { nombre: 'Soledad – zona sur', comparendosPct: 13, agentes: 8 },
  ],
};

const TIPOS_VEHICULO = ['Moto', 'Automóvil', 'Camión/Carga', 'Bus/Buseta', 'Taxi'];
const PCT_TIPO: Record<string, number[]> = {
  Bogotá:       [42, 33, 12, 8, 5],
  Cali:         [38, 36, 14, 7, 5],
  Medellín:     [45, 31, 11, 8, 5],
  Barranquilla: [51, 29, 10, 6, 4],
  Nacional:     [44, 32, 12, 7, 5],
};

const FRANJAS = ['06:00–08:00', '08:00–10:00', '10:00–12:00', '12:00–14:00', '14:00–16:00', '16:00–18:00', '18:00–20:00', '20:00–22:00'];
const FRANJA_DATA: Record<string, number[]> = {
  Bogotá:       [18, 14, 11, 10, 9, 17, 14, 7],
  Cali:         [15, 12, 13, 14, 10, 16, 13, 7],
  Medellín:     [19, 15, 10, 9, 8, 18, 14, 7],
  Barranquilla: [12, 10, 14, 17, 11, 14, 13, 9],
  Nacional:     [17, 13, 11, 11, 10, 16, 14, 8],
};

// ─── DETECTOR DE INTENCIÓN ────────────────────────────────────────────────────
type Intent =
  | 'zona_max_comparendos' | 'comparativo_ciudades' | 'tipo_vehiculo'
  | 'horario_pico' | 'resumen_ciudad' | 'resumen_nacional'
  | 'agentes_eficiencia' | 'prediccion' | 'recaudo' | 'dispositivos'
  | 'soat_rtm' | 'ranking_ciudades' | 'reporte' | 'proyeccion_recaudo' | 'reporte_ministerio' | 'ayuda' | 'saludo' | 'unknown';

function detectIntent(q: string): { intent: Intent; ciudad?: Ciudad; ciudad2?: Ciudad } {
  const t = q.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  const findCiudad = (): Ciudad | undefined => {
    if (t.includes('bogota')) return 'Bogotá';
    if (t.includes('cali')) return 'Cali';
    if (t.includes('medellin')) return 'Medellín';
    if (t.includes('barranquilla')) return 'Barranquilla';
    return undefined;
  };

  const findCiudad2 = (exclude?: Ciudad): Ciudad | undefined => {
    const names: [string, Ciudad][] = [
      ['bogota', 'Bogotá'], ['cali', 'Cali'],
      ['medellin', 'Medellín'], ['barranquilla', 'Barranquilla'],
    ];
    return names.find(([k, v]) => t.includes(k) && v !== exclude)?.[1];
  };

  const ciudad = findCiudad();
  const ciudad2 = findCiudad2(ciudad);
  const has = (...kw: string[]) => kw.some(k => t.includes(k));

  if (has('hola', 'buenos', 'buenas', 'saludos')) return { intent: 'saludo' };
  if (has('ayuda', 'que puedes', 'que sabes', 'comandos', 'opciones')) return { intent: 'ayuda' };
  if (has('reporte', 'informe', 'generar', 'exportar', 'pdf', 'word')) return { intent: 'reporte', ciudad };
  if (has('zona', 'sector', 'corredor', 'lugar', 'punto')) return { intent: 'zona_max_comparendos', ciudad };
  if ((ciudad && ciudad2) || has('compara', 'comparativo', 'versus', 'vs')) return { intent: 'comparativo_ciudades', ciudad, ciudad2 };
  if (has('tipo', 'vehiculo', 'moto', 'camion', 'bus', 'taxi', 'carro')) return { intent: 'tipo_vehiculo', ciudad };
  if (has('horario', 'hora', 'franja', 'pico', 'turno')) return { intent: 'horario_pico', ciudad };
  if (has('eficiencia', 'agente', 'rendimiento', 'productividad')) return { intent: 'agentes_eficiencia', ciudad };
  if (has('proyeccion', 'proyecta', 'proyectado') && has('recaudo', 'recaudacion', 'ingreso')) return { intent: 'proyeccion_recaudo', ciudad };
  if (has('ministerio', 'ejecutivo', 'presentar', 'presentacion', 'formal')) return { intent: 'reporte_ministerio' };
  if (has('prediccion', 'predice', 'proyeccion', 'futuro', 'proximo')) return { intent: 'prediccion', ciudad };
  if (has('recaudo', 'recaudacion', 'dinero', 'valor', 'millon', 'ingreso')) return { intent: 'recaudo', ciudad };
  if (has('dispositivo', 'gafa', 'lente')) return { intent: 'dispositivos', ciudad };
  if (has('soat', 'rtm', 'seguro', 'revision')) return { intent: 'soat_rtm', ciudad };
  if (has('ranking', 'mejor', 'peor', 'mayor', 'menor')) return { intent: 'ranking_ciudades' };
  if (ciudad && !ciudad2) return { intent: 'resumen_ciudad', ciudad };
  if (has('nacional', 'total', 'todo', 'general', 'colombia')) return { intent: 'resumen_nacional' };

  return { intent: 'unknown', ciudad };
}

// ─── GENERADOR DE RESPUESTAS ──────────────────────────────────────────────────
export function generateResponse(query: string): Omit<NovaXMessage, 'id' | 'role' | 'timestamp'> {
  const { intent, ciudad, ciudad2 } = detectIntent(query);

  switch (intent) {

    case 'saludo': return {
      content: `¡Buenas! Soy **NovaX**, el motor de inteligencia analítica de la plataforma HAIX Nova. Estoy conectado en tiempo real con los datos operativos de las 4 ciudades del sistema.\n\nPuedes preguntarme sobre:\n• **Zonas** con mayor número de comparendos por ciudad\n• **Comparativos** entre ciudades (infracciones, recaudo, eficiencia)\n• **Tipos de vehículo** con más infracciones\n• **Franjas horarias** de mayor actividad\n• **Predicciones** y proyecciones operativas\n• **Recaudo** y metas SIMIT\n• **Dispositivos** HAIX activos\n• **Generar reportes** con cualquier análisis\n\n¿En qué te puedo ayudar hoy?`,
    };

    case 'ayuda': return {
      content: `**NovaX puede responder consultas como estas:**\n\n🗺️ *"Dame la zona de Bogotá con más comparendos este mes"*\n📊 *"Comparativo entre Medellín y Cali: infractores por tipo de vehículo"*\n⏰ *"¿En qué horario se concentran más las infracciones en Barranquilla?"*\n💰 *"¿Cuánto ha recaudado el sistema esta semana?"*\n🔮 *"Predicción de infracciones para el puente festivo"*\n📋 *"Genera un reporte del análisis nacional de octubre"*\n🥽 *"¿Cuántos dispositivos HAIX están activos ahora?"*\n\nTambién puedes preguntarme por cualquier ciudad específica y te daré un resumen completo.`,
    };

    case 'zona_max_comparendos': {
      const c = ciudad || 'Bogotá';
      const zonas = ZONAS[c];
      const m = monthSums(c);
      const totalMes = m.comparendos;
      const zonaTop = zonas[0];
      const comparendosZona = Math.round(totalMes * zonaTop.comparendosPct / 100);
      return {
        content: `📍 **Zona con mayor actividad infractora — ${c} (octubre 2026)**\n\nEl sector **${zonaTop.nombre}** lidera con el **${zonaTop.comparendosPct}%** de todos los comparendos del mes, equivalente a **${fmt(comparendosZona)} infracciones** y un recaudo estimado de **${COP(comparendosZona * VALOR_COMPARENDO)}**.\n\nActualmente cuenta con **${zonaTop.agentes} agentes asignados**, lo que representa ${Math.round(comparendosZona / zonaTop.agentes)} comparendos/agente.\n\n**Recomendación NovaX:** Reforzar con 12–15 agentes adicionales en horario pico 07:00–09:00. Potencial adicional estimado: +18% en detección.`,
        table: {
          headers: ['Zona / Corredor', '% Comparendos', 'Comparendos mes', 'Agentes'],
          rows: zonas.map(z => [z.nombre, `${z.comparendosPct}%`, fmt(Math.round(totalMes * z.comparendosPct / 100)), z.agentes]),
        },
        exportable: true,
      };
    }

    case 'comparativo_ciudades': {
      const c1 = ciudad || 'Medellín';
      const c2 = ciudad2 || (c1 === 'Medellín' ? 'Cali' : 'Medellín');
      const m1 = monthSums(c1); const m2 = monthSums(c2);
      const cfg1 = CIUDAD_CONFIG[c1]; const cfg2 = CIUDAD_CONFIG[c2];
      const efic1 = METRICS_POR_CIUDAD[c1].eficiencia;
      const efic2 = METRICS_POR_CIUDAD[c2].eficiencia;
      const mejor = m1.comparendos > m2.comparendos ? c1 : c2;
      return {
        content: `📊 **Análisis comparativo: ${c1} vs ${c2} — Octubre 2026**\n\n**${c1}** lidera en volumen total con **${fmt(m1.comparendos)} comparendos** vs **${fmt(m2.comparendos)}** de ${c2}.\n\nEn eficiencia operativa, ${efic1 > efic2 ? c1 : c2} está por encima con un **${Math.max(efic1, efic2)}%** vs **${Math.min(efic1, efic2)}%**.\n\n**Predicción NovaX:** **${mejor}** mantendrá su ventaja en noviembre. ${c2} puede cerrar la brecha con redistribución de agentes en corredores críticos.`,
        table: {
          headers: ['Indicador', c1, c2, 'Diferencia'],
          rows: [
            ['Agentes totales', fmt(cfg1.agentes), fmt(cfg2.agentes), `${cfg1.agentes > cfg2.agentes ? '+' : ''}${fmt(cfg1.agentes - cfg2.agentes)}`],
            ['Comparendos (mes)', fmt(m1.comparendos), fmt(m2.comparendos), `${m1.comparendos > m2.comparendos ? '▲' : '▼'} ${fmt(Math.abs(m1.comparendos - m2.comparendos))}`],
            ['SOAT vencido', fmt(m1.soat), fmt(m2.soat), `${m1.soat > m2.soat ? '▲' : '▼'} ${fmt(Math.abs(m1.soat - m2.soat))}`],
            ['RTM vencido', fmt(m1.rtm), fmt(m2.rtm), `${m1.rtm > m2.rtm ? '▲' : '▼'} ${fmt(Math.abs(m1.rtm - m2.rtm))}`],
            ['Recaudo estimado', COP(m1.valor), COP(m2.valor), `${m1.valor > m2.valor ? '▲' : '▼'} ${COP(Math.abs(m1.valor - m2.valor))}`],
            ['Eficiencia operativa', `${efic1}%`, `${efic2}%`, `${efic1 > efic2 ? '+' : ''}${efic1 - efic2}pp`],
          ],
        },
        exportable: true,
      };
    }

    case 'tipo_vehiculo': {
      const c = ciudad || 'Nacional';
      const pcts = PCT_TIPO[c] || PCT_TIPO['Nacional'];
      const m = c === 'Nacional' ? nationalMonthSums() : monthSums(c as Ciudad);
      const total = m.comparendos;
      return {
        content: `🚗 **Infracciones por tipo de vehículo — ${c} (octubre 2026)**\n\nLas **motos** representan el mayor volumen infractor con el **${pcts[0]}%** del total (${fmt(Math.round(total * pcts[0] / 100))} comparendos). Son el segmento más crítico, especialmente en horas pico y zonas periféricas.\n\nLos **camiones y vehículos de carga** tienen la tasa de RTM vencida más alta proporcional a su flujo.\n\n**Recomendación NovaX:** Operativos especializados en motos generan 3,4x más comparendos por agente que patrullaje mixto.`,
        table: {
          headers: ['Tipo de vehículo', '% del total', 'Comparendos mes', 'Comparendos hoy'],
          rows: TIPOS_VEHICULO.map((tipo, i) => [tipo, `${pcts[i]}%`, fmt(Math.round(total * pcts[i] / 100)), fmt(Math.round(m.comparendos / 15 * pcts[i] / 100))]),
        },
        exportable: true,
      };
    }

    case 'horario_pico': {
      const c = ciudad || 'Nacional';
      const pcts = FRANJA_DATA[c] || FRANJA_DATA['Nacional'];
      const m = c === 'Nacional' ? nationalMonthSums() : monthSums(c as Ciudad);
      const maxIdx = pcts.indexOf(Math.max(...pcts));
      return {
        content: `⏰ **Análisis de franjas horarias — ${c} (octubre 2026)**\n\nLa franja de mayor concentración es **${FRANJAS[maxIdx]}** con el **${pcts[maxIdx]}%** del total diario.\n\nLas dos horas pico combinadas (mañana + tarde) concentran el **${pcts[0] + pcts[5]}%** del total de comparendos.\n\n**Recomendación NovaX:** Concentrar el **70% de los agentes** en las franjas 06:00–08:00 y 16:00–18:00 optimiza el recaudo por turno en un 28%.`,
        table: {
          headers: ['Franja horaria', '% comparendos', 'Comparendos/día est.', 'Prioridad'],
          rows: FRANJAS.map((franja, i) => [franja, `${pcts[i]}%`, fmt(Math.round(m.comparendos / 15 * pcts[i] / 100)), pcts[i] >= 16 ? '🔴 ALTA' : pcts[i] >= 11 ? '🟡 MEDIA' : '🟢 BAJA']),
        },
        exportable: true,
      };
    }

    case 'resumen_ciudad': {
      const c = ciudad!;
      const m = METRICS_POR_CIUDAD[c];
      const ms = monthSums(c);
      const cfg = CIUDAD_CONFIG[c];
      return {
        content: `🏙️ **Estado operativo — ${c} (15 oct 2026)**\n\n**${c}** opera con **${fmt(m.agentesActivos)} agentes activos** de **${fmt(cfg.agentes)}** registrados (**${m.eficiencia}% eficiencia**). Los **${m.dispositivosActivos} dispositivos HAIX Nova** han registrado **${fmt(m.escaneosDia)} escaneos hoy**.\n\nEn octubre: **${fmt(ms.comparendos)} comparendos** · **${COP(ms.valor)} en recaudo**. Zona crítica: **${ZONAS[c][0].nombre}** (${ZONAS[c][0].comparendosPct}% del total).\n\n**Director:** ${cfg.director} — ${cfg.secretaria}`,
        table: {
          headers: ['Indicador', 'Hoy', 'Mes (oct)', 'Tendencia'],
          rows: [
            ['Agentes activos', fmt(m.agentesActivos), '—', `${m.eficiencia}% eficiencia`],
            ['Dispositivos activos', fmt(m.dispositivosActivos), fmt(m.dispositivosTotal) + ' total', '—'],
            ['Escaneos', fmt(m.escaneosDia), fmt(ms.escaneos), '📈 +5.2%'],
            ['Comparendos SOAT', fmt(m.soatVencido), fmt(ms.soat), '📈 +3.1%'],
            ['Comparendos RTM', fmt(m.rtmVencido), fmt(ms.rtm), '📈 +2.8%'],
            ['Recaudo estimado', COP(m.valorRecaudado), COP(ms.valor), '📈 +4.7%'],
          ],
        },
        exportable: true,
      };
    }

    case 'resumen_nacional': {
      const mn = METRICS_NACIONAL;
      const ms = nationalMonthSums();
      return {
        content: `🇨🇴 **Estado operativo Nacional — 15 oct 2026**\n\nHAIX Nova opera en **4 ciudades** con **${fmt(mn.agentesActivos)} agentes activos** de ${fmt(mn.agentesTotal)} registrados (**${mn.eficienciaPromedio}% eficiencia**). Los **${fmt(mn.dispositivosActivos)} dispositivos activos** han generado **${fmt(mn.escaneosDia)} escaneos hoy**.\n\nOctubre: **${fmt(ms.comparendos)} comparendos** · **${COP(ms.valor)} en recaudo**. Proyección al cierre: supera meta SIMIT en **+14.7%**.\n\n**Ciudad líder:** Bogotá · **Mayor eficiencia:** Cali`,
        table: {
          headers: ['Ciudad', 'Agentes', 'Comparendos mes', 'Recaudo mes', 'Eficiencia'],
          rows: CIUDADES.map(c => { const ms2 = monthSums(c); return [c, fmt(CIUDAD_CONFIG[c].agentes), fmt(ms2.comparendos), COP(ms2.valor), `${METRICS_POR_CIUDAD[c].eficiencia}%`]; }),
        },
        exportable: true,
      };
    }

    case 'agentes_eficiencia': {
      const c = ciudad;
      if (c) {
        const m = METRICS_POR_CIUDAD[c];
        const cfg = CIUDAD_CONFIG[c];
        return {
          content: `👮 **Eficiencia de agentes — ${c}**\n\n${c} cuenta con **${fmt(cfg.agentes)} agentes registrados**, de los cuales **${fmt(m.agentesActivos)} están activos** (${m.eficiencia}% cobertura). Cada agente genera en promedio **${Math.round(m.soatVencido / m.agentesActivos)} comparendos SOAT** y **${Math.round(m.rtmVencido / m.agentesActivos)} RTM** por turno.\n\n**Top insight:** El 10% de agentes de alto rendimiento genera el 34% del total. Replicar su protocolo aumentaría el promedio en **+22%**.\n\n**Recomendación:** Redistribuir 15 agentes a ${ZONAS[c][0].nombre} aumentaría el recaudo semanal en ~${COP(Math.round(m.soatVencido * 0.18) * VALOR_COMPARENDO)}.`,
          exportable: true,
        };
      }
      return {
        content: `👮 **Eficiencia operativa Nacional**\n\nEl sistema opera con **${fmt(METRICS_NACIONAL.agentesActivos)} de ${fmt(METRICS_NACIONAL.agentesTotal)} agentes** activos (**${METRICS_NACIONAL.eficienciaPromedio}% promedio**).\n\nBogotá tiene el mayor volumen absoluto pero Cali lidera en eficiencia relativa por zona cubierta.`,
        table: {
          headers: ['Ciudad', 'Agentes', 'Activos', 'Eficiencia'],
          rows: CIUDADES.map(c => [c, fmt(CIUDAD_CONFIG[c].agentes), fmt(METRICS_POR_CIUDAD[c].agentesActivos), `${METRICS_POR_CIUDAD[c].eficiencia}%`]),
        },
        exportable: true,
      };
    }

    case 'prediccion': {
      const c = ciudad;
      if (c) {
        const m = monthSums(c);
        const proyMes = Math.round(m.comparendos * (30 / 15));
        const proyNov = Math.round(proyMes * 1.083);
        return {
          content: `🔮 **Predicción operativa — ${c}**\n\n**Proyección octubre:** ${c} cerrará el mes con **${fmt(proyMes)} comparendos** y **${COP(proyMes * VALOR_COMPARENDO)}** en recaudo.\n\n**Proyección noviembre:** +8.3% sobre octubre = **${fmt(proyNov)} comparendos** proyectados.\n\n**Alertas predictivas:**\n• 📈 Pico de SOAT vencido los viernes de fin de mes\n• ⚠️ Reducción del 61% en días de lluvia intensa\n• 🚛 +12% en infracciones de carga pesada en zona industrial\n\n**Confianza del modelo:** 87.3%`,
          exportable: true,
        };
      }
      return {
        content: `🔮 **Predicciones nacionales — Q4 2026**\n\n• **Octubre:** Supera meta SIMIT en +14.7% → ${COP(nationalMonthSums().valor * 2)} recaudo proyectado\n• **Noviembre:** +8.3% sobre octubre por vencimiento masivo de SOAT anuales\n• **Diciembre:** Pico festivo → +38% flujo vehicular, +29% documentos vencidos\n• **Carga pesada:** +12% en infracciones RTM en zonas industriales\n• **Motos reincidentes:** 4.200 placas proyectadas con 3+ detecciones en Q4\n\n**Recomendación:** Activar operativo reforzado en diciembre con 20% más agentes en turno festivo.\n\n**Confianza del modelo:** 85.1%`,
        exportable: true,
      };
    }

    case 'recaudo': {
      const c = ciudad;
      const ms = c ? monthSums(c) : nationalMonthSums();
      const nombre = c || 'Nacional';
      const proyeccion = ms.valor * 2;
      return {
        content: `💰 **Análisis de recaudo — ${nombre} (octubre 2026)**\n\nEn los primeros **15 días de octubre** el sistema ha generado **${COP(ms.valor)}** en comparendos.\n\n• **Promedio diario:** ${COP(Math.round(ms.valor / 15))}\n• **Proyección al cierre del mes:** ${COP(proyeccion)}\n• **Vs meta SIMIT:** Supera en **+14.7%** → ${COP(Math.round(proyeccion * 0.147))} adicionales\n• **Valor por comparendo:** $${fmt(VALOR_COMPARENDO)} COP\n\n**Desglose:**\n• SOAT vencido (60%): ${COP(Math.round(ms.valor * 0.6))}\n• RTM vencido (40%): ${COP(Math.round(ms.valor * 0.4))}\n\n**NovaX insight:** Operativos en carga pesada y motos reincidentes pueden sumar **+$1.200M** adicionales al mes.`,
        exportable: true,
      };
    }

    case 'dispositivos': {
      const mn = METRICS_NACIONAL;
      return {
        content: `🥽 **Estado de dispositivos HAIX Nova**\n\nEl sistema cuenta con **${fmt(mn.dispositivosTotal)} gafas HAIX Nova** en las 4 ciudades, de las cuales **${fmt(mn.dispositivosActivos)} están activas** (${Math.round(mn.dispositivosActivos / mn.dispositivosTotal * 100)}% uptime).\n\nCada dispositivo activo genera en promedio **${fmt(Math.round(mn.escaneosDia / mn.dispositivosActivos))} escaneos/día**.`,
        table: {
          headers: ['Ciudad', 'Total', 'Activos', 'Uptime', 'Escaneos/dispositivo/día'],
          rows: CIUDADES.map(c => { const m = METRICS_POR_CIUDAD[c]; return [c, fmt(m.dispositivosTotal), fmt(m.dispositivosActivos), `${Math.round(m.dispositivosActivos / m.dispositivosTotal * 100)}%`, fmt(Math.round(m.escaneosDia / m.dispositivosActivos))]; }),
        },
        exportable: true,
      };
    }

    case 'soat_rtm': {
      const c = ciudad;
      const ms = c ? monthSums(c) : nationalMonthSums();
      const nombre = c || 'Nacional';
      const pctSoat = Math.round(ms.soat / ms.comparendos * 100);
      return {
        content: `📋 **Análisis SOAT vs RTM — ${nombre} (octubre 2026)**\n\nDe los **${fmt(ms.comparendos)} comparendos** del mes:\n\n• **SOAT vencido (C02):** ${fmt(ms.soat)} — **${pctSoat}%** del total\n• **RTM vencido (C03):** ${fmt(ms.rtm)} — **${100 - pctSoat}%** del total\n\nLas motos son el 73% de los infractores SOAT en zonas periféricas.\n\n**Alerta:** Se proyecta +8.3% mensual en SOAT vencidos durante Q4 por vencimiento masivo de pólizas.\n\n**Recaudo:** SOAT ${COP(ms.soat * VALOR_COMPARENDO)} · RTM ${COP(ms.rtm * VALOR_COMPARENDO)}`,
        exportable: true,
      };
    }

    case 'ranking_ciudades': {
      return {
        content: `🏆 **Ranking nacional de ciudades — octubre 2026**\n\n**Bogotá** lidera en volumen total. En eficiencia relativa (comparendos por agente), Cali supera al promedio nacional.`,
        table: {
          headers: ['#', 'Ciudad', 'Comparendos mes', 'Recaudo mes', 'Comparendos/agente', 'Eficiencia'],
          rows: [...CIUDADES]
            .map(c => ({ c, ms: monthSums(c) }))
            .sort((a, b) => b.ms.comparendos - a.ms.comparendos)
            .map((item, i) => [`#${i + 1}`, item.c, fmt(item.ms.comparendos), COP(item.ms.valor), fmt(Math.round(item.ms.comparendos / CIUDAD_CONFIG[item.c].agentes)), `${METRICS_POR_CIUDAD[item.c].eficiencia}%`]),
        },
        exportable: true,
      };
    }

    case 'proyeccion_recaudo': {
      const c = ciudad;
      const ms = c ? monthSums(c) : nationalMonthSums();
      const nombre = c || 'Nacional';
      const proyCierre = ms.valor * 2;
      const proyNov = Math.round(proyCierre * 1.083);
      const proyDic = Math.round(proyNov * 1.29);
      const proyQ4 = proyCierre + proyNov + proyDic;
      return {
        content: `📈 **Proyección de recaudo — ${nombre}**\n\nBasado en el ritmo de los primeros 15 días de octubre, NovaX proyecta:\n\n• **Octubre 2026 (cierre):** ${COP(proyCierre)} — +14.7% vs meta SIMIT\n• **Noviembre 2026:** ${COP(proyNov)} — pico por vencimiento masivo de SOAT anuales\n• **Diciembre 2026:** ${COP(proyDic)} — pico festivo (+29% flujo vehicular)\n• **Total Q4 2026:** ${COP(proyQ4)}\n\n**Factores de riesgo:**\n• 🌧️ Temporada de lluvias reduce detección hasta -18%\n• 📅 Puentes festivos aumentan flujo +38% pero agentes -15%\n• 🚛 Carga pesada RTM: +12% proyectado en zonas industriales\n\n**Confianza del modelo:** 87.3%`,
        table: {
          headers: ['Mes', 'Comparendos proy.', 'Recaudo proy.', 'Vs meta SIMIT'],
          rows: [
            ['Octubre 2026', fmt(Math.round(ms.comparendos * 2)), COP(proyCierre), '+14.7%'],
            ['Noviembre 2026', fmt(Math.round(ms.comparendos * 2 * 1.083)), COP(proyNov), '+24.2%'],
            ['Diciembre 2026', fmt(Math.round(ms.comparendos * 2 * 1.083 * 1.29)), COP(proyDic), '+60.3%'],
            ['TOTAL Q4', fmt(Math.round(ms.comparendos * 2 * (1 + 1.083 + 1.083 * 1.29))), COP(proyQ4), '+28.4% prom.'],
          ],
        },
        exportable: true,
      };
    }

    case 'reporte_ministerio': {
      const ms = nationalMonthSums();
      const proyCierre = ms.valor * 2;
      const mn = METRICS_NACIONAL;
      return {
        content: `📄 **Reporte Ejecutivo — Ministerio de Transporte**\n**Sistema HAIX Nova · Octubre 2026**\n\n---\n\n**1. COBERTURA OPERATIVA**\n${fmt(mn.agentesActivos)} agentes activos en 4 ciudades (${mn.eficienciaPromedio}% eficiencia). ${fmt(mn.dispositivosActivos)} dispositivos DHNa3 operativos generando ${fmt(mn.escaneosDia)} escaneos diarios.\n\n**2. RESULTADOS OCTUBRE (al 15/oct)**\n• Escaneos realizados: ${fmt(ms.escaneos)}\n• Infracciones detectadas: ${fmt(ms.comparendos)} (SOAT C02 + RTM C03)\n• Recaudo generado: ${COP(ms.valor)}\n• Proyección cierre mes: ${COP(proyCierre)}\n\n**3. IMPACTO VS SIMIT REAL**\n• El sistema detecta 2× más infracciones SOAT+RTM que la media histórica\n• ROI estimado: por cada $1 invertido en HAIX Nova → $4.3 en recaudo adicional\n\n**4. CIUDADES DESTACADAS**\n• Mayor volumen: Bogotá (${COP(monthSums('Bogotá').valor)} / mes)\n• Mayor eficiencia: ${METRICS_POR_CIUDAD['Cali'].eficiencia}% — Cali\n\n**5. PROYECCIÓN Q4 2026**\n• Total estimado: ${COP(proyCierre * (1 + 1.083 + 1.083 * 1.29))}\n• Supera meta SIMIT en +28.4% promedio trimestral`,
        table: {
          headers: ['Ciudad', 'Agentes', 'Comparendos oct', 'Recaudo oct', 'Proyección Q4'],
          rows: CIUDADES.map(c => {
            const ms2 = monthSums(c);
            return [c, fmt(CIUDAD_CONFIG[c].agentes), fmt(ms2.comparendos * 2), COP(ms2.valor * 2), COP(ms2.valor * 2 * (1 + 1.083 + 1.083 * 1.29))];
          }),
        },
        exportable: true,
      };
    }

    case 'reporte': return {
      content: `📄 **Generando reporte — ${ciudad || 'Nacional'} (octubre 2026)**\n\nEl reporte incluirá:\n✅ Resumen ejecutivo de KPIs operativos\n✅ Análisis por zona y corredor crítico\n✅ Desglose SOAT vs RTM por tipo de vehículo\n✅ Comparativo con período anterior\n✅ Predicciones Q4 2026\n✅ Recomendaciones operativas NovaX\n\nUsa los botones de exportación para descargar en **PDF** o **Word**.`,
      exportable: true,
    };

    default: return {
      content: `No pude interpretar tu consulta. Intenta por ejemplo:\n\n• "dame un resumen de Bogotá"\n• "¿cuál ciudad tiene más comparendos?"\n• "analiza el horario pico en Barranquilla"\n• "comparativo Cali vs Medellín"\n\nO escribe **"ayuda"** para ver todos los comandos disponibles.`,
    };
  }
}

// ─── SUGERENCIAS RÁPIDAS ──────────────────────────────────────────────────────
export const QUICK_QUERIES = [
  { label: '📍 Zona crítica Bogotá',      query: '¿Cuál es la zona de Bogotá con más comparendos este mes?' },
  { label: '📊 Medellín vs Cali',         query: 'Análisis comparativo entre Medellín y Cali: comparendos, tipo de vehículo y predicción' },
  { label: '⏰ Horario pico nacional',    query: '¿En qué franja horaria se concentran más las infracciones a nivel nacional?' },
  { label: '🚗 Tipos de vehículo',        query: '¿Cuáles son los tipos de vehículo con más infracciones en el sistema?' },
  { label: '💰 Recaudo octubre',          query: '¿Cuánto ha recaudado el sistema en lo que va de octubre?' },
  { label: '🔮 Predicción Q4',            query: 'Dame las predicciones de infracciones para el resto del año' },
  { label: '🥽 Estado dispositivos',      query: '¿Cuántos dispositivos HAIX Nova están activos ahora?' },
  { label: '🏆 Ranking ciudades',         query: '¿Cuál ciudad tiene el mayor número de comparendos este mes?' },
  { label: '📋 Reporte nacional',         query: 'Genera un reporte ejecutivo del estado nacional del sistema' },
  { label: '📈 Proyección recaudo Q4',    query: 'Proyección de recaudo para el resto del año' },
  { label: '🏛️ Reporte Ministerio',       query: 'Genera reporte ejecutivo formal para presentar al Ministerio de Transporte' },
  { label: '📍 Zona crítica Barranquilla',query: '¿Cuál es la zona de Barranquilla con más infracciones?' },
];