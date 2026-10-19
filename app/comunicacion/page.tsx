'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, MessageCircle, Circle } from 'lucide-react';
import { MENSAJES_COMUNICACION, CIUDAD_CONFIG, CIUDADES, type Ciudad } from '@/lib/mock-data';

const AUTO_REPLIES: Record<Ciudad, string[]> = {
  Bogotá: [
    'Confirmado Director Nacional. Operativo activo, reportaremos al cierre.',
    'Recibido. Zona norte reforzada con 20 agentes adicionales.',
    'Entendido. Enviando reporte de comparendos en los próximos minutos.',
    'Sí señor Director, protocolo activado para el fin de semana.',
    'Dispositivos actualizados a v2.4.1 confirmados. Sin novedades.',
  ],
  Cali: [
    'Confirmado Dirección Nacional. Coordinando con terreno.',
    'Recibido. Zona Aguablanca bajo control, refuerzo técnico en camino.',
    'Reporte de comparendos en preparación, disponible en 15 minutos.',
    'Protocolo fin de semana activado. 183 agentes en alerta.',
    'Actualización de firmware recibida. 3 dispositivos en mantenimiento.',
  ],
  Medellín: [
    'Acuse de recibo Director. Operativos en curso en El Poblado y Laureles.',
    'Confirmado. Redistribución de agentes evaluada con secretaría.',
    'Reporte diario listo para envío. Resultados dentro del rango esperado.',
    'Protocolo activado. Coordinando con la Secretaría de Movilidad.',
    'Firmware 2.4.1 instalado en todos los dispositivos operativos.',
  ],
  Barranquilla: [
    'Confirmado Dirección Nacional. 51 agentes activos sin novedades.',
    'Zona portuaria controlada. Coordinación con Policía en progreso.',
    'Reporte de turno en preparación. Resultados favorables hoy.',
    'Protocolo especial activado para el fin de semana.',
    'Actualización de firmware en proceso. Sin interrupciones operativas.',
  ],
};

type Hilo = Ciudad;

interface Mensaje {
  id: string;
  de: string;
  contenido: string;
  timestamp: string;
  enviado: boolean; // true = del nacional (derecha), false = de la ciudad (izquierda)
}

function formatHora(ts: string): string {
  const d = new Date(ts);
  return d.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
}

export default function ComunicacionPage() {
  const [hiloActivo, setHiloActivo] = useState<Hilo>('Bogotá');
  const [mensajesPorCiudad, setMensajesPorCiudad] = useState<Record<Ciudad, Mensaje[]>>(() => {
    const result: Record<Ciudad, Mensaje[]> = {} as Record<Ciudad, Mensaje[]>;
    for (const c of CIUDADES) {
      result[c] = MENSAJES_COMUNICACION
        .filter(m => m.de === c || m.para === c)
        .map((m) => ({
          id: m.id,
          de: m.de,
          contenido: m.contenido,
          timestamp: m.timestamp,
          enviado: m.de === 'nacional',
        }));
    }
    return result;
  });
  const [texto, setTexto] = useState('');
  const [escribiendo, setEscribiendo] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const replyIdx = useRef<Record<Ciudad, number>>({ Bogotá: 0, Cali: 0, Medellín: 0, Barranquilla: 0 });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [mensajesPorCiudad, hiloActivo]);

  function enviar() {
    if (!texto.trim()) return;
    const now = new Date();
    const nuevoMsg: Mensaje = {
      id: `MSG-NEW-${Date.now()}`,
      de: 'nacional',
      contenido: texto.trim(),
      timestamp: now.toISOString(),
      enviado: true,
    };
    setMensajesPorCiudad(prev => ({
      ...prev,
      [hiloActivo]: [...prev[hiloActivo], nuevoMsg],
    }));
    setTexto('');

    // Auto-respuesta simulada
    setEscribiendo(true);
    const delay = 1500 + Math.random() * 2000;
    setTimeout(() => {
      const replies = AUTO_REPLIES[hiloActivo];
      const idx = replyIdx.current[hiloActivo] % replies.length;
      replyIdx.current[hiloActivo]++;
      const reply: Mensaje = {
        id: `MSG-REPLY-${Date.now()}`,
        de: hiloActivo,
        contenido: replies[idx],
        timestamp: new Date().toISOString(),
        enviado: false,
      };
      setMensajesPorCiudad(prev => ({
        ...prev,
        [hiloActivo]: [...prev[hiloActivo], reply],
      }));
      setEscribiendo(false);
    }, delay);
  }

  const mensajesActivos = mensajesPorCiudad[hiloActivo];
  const config = CIUDAD_CONFIG[hiloActivo];

  return (
    <div className="h-[calc(100vh-160px)] flex gap-4" style={{ minHeight: 600 }}>
      {/* Sidebar — hilos por ciudad */}
      <div className="w-64 shrink-0 rounded-xl flex flex-col gap-1 p-3" style={{ backgroundColor: '#112236', border: '1px solid #1E3A55' }}>
        <p className="font-orbitron text-xs font-bold px-2 py-2 mb-1" style={{ color: '#64748B' }}>SECRETARÍAS</p>
        {CIUDADES.map(c => {
          const unread = mensajesPorCiudad[c].filter(m => !m.enviado).length;
          const lastMsg = mensajesPorCiudad[c][mensajesPorCiudad[c].length - 1];
          return (
            <button
              key={c}
              onClick={() => setHiloActivo(c)}
              className="w-full text-left rounded-lg p-3 transition-colors"
              style={{
                backgroundColor: hiloActivo === c ? 'rgba(0,180,216,0.1)' : 'transparent',
                border: `1px solid ${hiloActivo === c ? 'rgba(0,180,216,0.3)' : 'transparent'}`,
              }}
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: CIUDAD_CONFIG[c].color }} />
                  <span className="text-xs font-semibold" style={{ color: hiloActivo === c ? '#E2E8F0' : '#94A3B8' }}>{c}</span>
                </div>
                {unread > 0 && (
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full" style={{ backgroundColor: '#E87C2B', color: 'white' }}>
                    {unread}
                  </span>
                )}
              </div>
              <p className="text-[10px] truncate" style={{ color: '#64748B' }}>
                {lastMsg ? lastMsg.contenido.slice(0, 45) + (lastMsg.contenido.length > 45 ? '…' : '') : 'Sin mensajes'}
              </p>
              {lastMsg && <p className="text-[9px] mt-0.5" style={{ color: '#374151' }}>{formatHora(lastMsg.timestamp)}</p>}
            </button>
          );
        })}

        {/* Info director */}
        <div className="mt-auto pt-3" style={{ borderTop: '1px solid #1E3A55' }}>
          <p className="text-[10px] px-2" style={{ color: '#374151' }}>Director Nacional</p>
          <p className="text-xs px-2 font-semibold mt-0.5" style={{ color: '#64748B' }}>Gral. Roberto Cifuentes</p>
          <div className="flex items-center gap-1.5 px-2 mt-1">
            <Circle size={7} fill="#22C55E" style={{ color: '#22C55E' }} />
            <span className="text-[9px]" style={{ color: '#22C55E' }}>En línea</span>
          </div>
        </div>
      </div>

      {/* Chat window */}
      <div className="flex-1 flex flex-col rounded-xl overflow-hidden" style={{ backgroundColor: '#112236', border: '1px solid #1E3A55' }}>
        {/* Header */}
        <div className="px-5 py-3 flex items-center justify-between shrink-0" style={{ borderBottom: '1px solid #1E3A55', backgroundColor: '#0A1628' }}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm"
              style={{ backgroundColor: config.color + '30', color: config.color }}>
              {hiloActivo.charAt(0)}
            </div>
            <div>
              <p className="font-orbitron text-sm font-bold" style={{ color: '#E2E8F0' }}>{hiloActivo}</p>
              <p className="text-[10px]" style={{ color: '#64748B' }}>{config.director} · {config.secretaria}</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <Circle size={8} fill="#22C55E" style={{ color: '#22C55E' }} />
            <span className="text-[10px]" style={{ color: '#22C55E' }}>En línea</span>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          {mensajesActivos.map(m => (
            <div key={m.id} className={`flex ${m.enviado ? 'justify-end' : 'justify-start'}`}>
              {!m.enviado && (
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold mr-2 mt-1 shrink-0"
                  style={{ backgroundColor: config.color + '30', color: config.color }}>
                  {hiloActivo.charAt(0)}
                </div>
              )}
              <div className="max-w-[65%]">
                <div
                  className="rounded-2xl px-4 py-2.5 text-xs leading-relaxed"
                  style={{
                    backgroundColor: m.enviado ? 'rgba(0,180,216,0.2)' : '#0A1628',
                    color: '#E2E8F0',
                    borderBottomRightRadius: m.enviado ? 4 : undefined,
                    borderBottomLeftRadius: !m.enviado ? 4 : undefined,
                    border: `1px solid ${m.enviado ? 'rgba(0,180,216,0.3)' : '#1E3A55'}`,
                  }}
                >
                  {m.contenido}
                </div>
                <p className={`text-[9px] mt-1 ${m.enviado ? 'text-right' : ''}`} style={{ color: '#374151' }}>
                  {m.enviado ? 'Dirección Nacional · ' : (hiloActivo + ' · ')}{formatHora(m.timestamp)}
                </p>
              </div>
            </div>
          ))}

          {escribiendo && (
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0"
                style={{ backgroundColor: config.color + '30', color: config.color }}>
                {hiloActivo.charAt(0)}
              </div>
              <div className="px-4 py-2.5 rounded-2xl" style={{ backgroundColor: '#0A1628', border: '1px solid #1E3A55' }}>
                <div className="flex items-center gap-1">
                  {[0,1,2].map(i => (
                    <span key={i} className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ backgroundColor: '#64748B', animationDelay: `${i * 0.2}s` }} />
                  ))}
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="px-5 py-3 shrink-0" style={{ borderTop: '1px solid #1E3A55', backgroundColor: '#0A1628' }}>
          <div className="flex items-center gap-3">
            <div className="flex-1 flex items-center gap-3 px-4 py-2.5 rounded-xl" style={{ backgroundColor: '#112236', border: '1px solid #1E3A55' }}>
              <MessageCircle size={14} style={{ color: '#64748B' }} />
              <input
                type="text"
                placeholder={`Mensaje a ${hiloActivo}...`}
                value={texto}
                onChange={e => setTexto(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && enviar()}
                className="flex-1 bg-transparent text-xs outline-none"
                style={{ color: '#E2E8F0' }}
              />
            </div>
            <button
              onClick={enviar}
              disabled={!texto.trim()}
              className="px-4 py-2.5 rounded-xl flex items-center gap-2 text-xs font-semibold transition-all disabled:opacity-40"
              style={{ backgroundColor: '#00B4D8', color: 'white' }}
            >
              <Send size={13} />
              Enviar
            </button>
          </div>
          <p className="text-[9px] mt-1.5 text-center" style={{ color: '#374151' }}>
            Canal cifrado HAIX Secure · Mensajes guardados en servidor SIMIT
          </p>
        </div>
      </div>
    </div>
  );
}
