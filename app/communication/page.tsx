'use client';

import { useState, useMemo, useRef } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { CIUDADES, Ciudad } from '@/lib/mock-data';
import {
  Mail, Send, Inbox, Eye, EyeOff, Plus, Paperclip, X,
  Search, ChevronDown, MessageSquare, Clock, CheckCheck,
  Check, MailOpen, Filter, User, Building2, AtSign
} from 'lucide-react';

const SECRETARIOS: Record<Ciudad, { nombre: string; cargo: string; email: string; avatar: string }> = {
  'Bogotá':       { nombre: 'Dr. Hernando Vargas Ruiz',    cargo: 'Secretario de Movilidad',          email: 'hvargas@movilidadbogota.gov.co',    avatar: 'HV' },
  'Cali':         { nombre: 'Dra. Marcela Ospina Torres',  cargo: 'Secretaria de Tránsito y Transporte', email: 'mospina@transitocali.gov.co',       avatar: 'MO' },
  'Medellín':     { nombre: 'Dr. Camilo Restrepo Arias',   cargo: 'Secretario de Movilidad',          email: 'crestrepo@movilidadmedellin.gov.co', avatar: 'CR' },
  'Barranquilla': { nombre: 'Dra. Sandra Meza Fonseca',    cargo: 'Directora de Tránsito',            email: 'smeza@transitobarranquilla.gov.co',  avatar: 'SM' },
};

const HAIX_REMITENTE = { nombre: 'HAIX Nova CCN', email: 'ccn@haix.com.co' };

type TipoAdjunto = 'PDF' | 'JPG' | 'EXCEL' | 'CSV' | 'WORD' | 'PNG';
interface Adjunto { nombre: string; tipo: TipoAdjunto; tamaño: string; }
interface Mensaje {
  id: string; tipo: 'enviado' | 'recibido'; ciudad: Ciudad;
  asunto: string; cuerpo: string; fecha: string; leido: boolean;
  adjuntos: Adjunto[]; cc?: string;
}

const MENSAJES_MOCK: Mensaje[] = [
  { id: 'MSG-001', tipo: 'recibido', ciudad: 'Bogotá', asunto: 'Solicitud reporte mensual escaneos — Octubre 2026', cuerpo: 'Estimados,\n\nLes solicito el reporte consolidado de escaneos y comparendos del mes de octubre para presentar al Concejo Distrital. Requiero los datos segmentados por zona y hora.\n\nQuedo atento.\n\nDr. Hernando Vargas Ruiz\nSecretaría de Movilidad de Bogotá', fecha: '2026-10-15T09:14:00', leido: true, adjuntos: [] },
  { id: 'MSG-002', tipo: 'enviado', ciudad: 'Bogotá', asunto: 'RE: Solicitud reporte mensual escaneos — Octubre 2026', cuerpo: 'Dr. Vargas,\n\nAdjunto encontrará el reporte consolidado de octubre con los datos solicitados. El archivo Excel incluye segmentación por zona, hora y tipo de infracción.\n\nQuedamos atentos a cualquier consulta.\n\nHAIX Nova CCN', fecha: '2026-10-15T10:30:00', leido: true, adjuntos: [{ nombre: 'Reporte_Escaneos_Oct2026_Bogota.xlsx', tipo: 'EXCEL', tamaño: '2.4 MB' }, { nombre: 'Resumen_Ejecutivo_Oct2026.pdf', tipo: 'PDF', tamaño: '890 KB' }] },
  { id: 'MSG-003', tipo: 'recibido', ciudad: 'Cali', asunto: 'Consulta sobre dispositivos DHNa3 asignados', cuerpo: 'Buenos días,\n\nNecesito claridad sobre el estado actual de los dispositivos asignados a la ciudad. Hay reportes de algunos agentes con problemas de conectividad.\n\nDra. Marcela Ospina\nSecretaría de Tránsito Cali', fecha: '2026-10-14T14:22:00', leido: false, adjuntos: [] },
  { id: 'MSG-004', tipo: 'enviado', ciudad: 'Medellín', asunto: 'Informe operativo — Semana 41/2026', cuerpo: 'Dr. Restrepo,\n\nEnviamos el informe operativo de la semana 41 correspondiente al operativo en Medellín. Se adjuntan capturas del sistema y el CSV de infracciones detectadas.\n\nHAIX Nova CCN', fecha: '2026-10-13T08:00:00', leido: true, adjuntos: [{ nombre: 'Infracciones_Sem41_Medellin.csv', tipo: 'CSV', tamaño: '1.1 MB' }, { nombre: 'Captura_HUD_Medellin.png', tipo: 'PNG', tamaño: '340 KB' }] },
  { id: 'MSG-005', tipo: 'recibido', ciudad: 'Barranquilla', asunto: 'Falla firmware dispositivo DHNa3-0441', cuerpo: 'Equipo HAIX,\n\nUno de nuestros agentes reporta que el dispositivo DHNa3-0441 quedó en modo recovery tras una actualización. ¿Pueden asistir de forma remota?\n\nDra. Sandra Meza\nDirección de Tránsito Barranquilla', fecha: '2026-10-12T16:45:00', leido: false, adjuntos: [{ nombre: 'Foto_Dispositivo_Falla.jpg', tipo: 'JPG', tamaño: '220 KB' }] },
  { id: 'MSG-006', tipo: 'enviado', ciudad: 'Barranquilla', asunto: 'RE: Falla firmware dispositivo DHNa3-0441', cuerpo: 'Dra. Meza,\n\nHemos tomado control remoto del dispositivo. La recuperación del firmware tomará aproximadamente 20 minutos. Le notificaremos cuando el dispositivo vuelva a estado Operativo.\n\nHAIX Nova CCN', fecha: '2026-10-12T17:10:00', leido: true, adjuntos: [] },
  { id: 'MSG-007', tipo: 'recibido', ciudad: 'Medellín', asunto: 'Ampliación de cobertura — Sector El Poblado', cuerpo: 'Buenos días,\n\nEl Alcalde ha solicitado ampliar la cobertura del operativo al sector de El Poblado. ¿Es posible reasignar agentes para la próxima semana?\n\nDr. Camilo Restrepo\nSecretaría de Movilidad Medellín', fecha: '2026-10-11T11:30:00', leido: true, adjuntos: [] },
  { id: 'MSG-008', tipo: 'recibido', ciudad: 'Cali', asunto: 'Reporte de rendimiento Q3 — pendiente', cuerpo: 'HAIX Nova,\n\nAún no hemos recibido el reporte de rendimiento del Q3. Por favor enviar a la brevedad para el cierre presupuestal.\n\nDra. Marcela Ospina', fecha: '2026-10-10T09:00:00', leido: false, adjuntos: [] },
];

interface ChatMsg { id: string; de: 'yo' | 'secretario'; texto: string; hora: string; adjuntos?: Adjunto[]; }
const CHAT_INIT: Record<Ciudad, ChatMsg[]> = {
  'Bogotá': [
    { id: 'c1', de: 'secretario', texto: 'Buenos días, ¿tienen disponible el reporte de hoy?', hora: '09:05' },
    { id: 'c2', de: 'yo', texto: 'Sí Dr. Vargas, lo estamos generando. En 10 minutos lo tendrá.', hora: '09:07' },
  ],
  'Cali': [{ id: 'c1', de: 'secretario', texto: 'Hola, ¿cuántos dispositivos activos tenemos hoy en Cali?', hora: '08:30' }],
  'Medellín': [],
  'Barranquilla': [
    { id: 'c1', de: 'secretario', texto: '¿Ya quedó solucionado el tema del DHNa3-0441?', hora: '17:15' },
    { id: 'c2', de: 'yo', texto: 'Sí Dra. Meza, el dispositivo está nuevamente Operativo.', hora: '17:22' },
  ],
};

const TIPO_COLORS: Record<TipoAdjunto, string> = { PDF: '#EF4444', JPG: '#F59E0B', EXCEL: '#22C55E', CSV: '#10B981', WORD: '#3B82F6', PNG: '#A855F7' };
const CIUDAD_COLORS: Record<Ciudad, string> = { 'Bogotá': '#00B4D8', 'Cali': '#A855F7', 'Medellín': '#22C55E', 'Barranquilla': '#F59E0B' };

function fmtFecha(iso: string) {
  const d = new Date(iso);
  const months = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
  return `${String(d.getDate()).padStart(2,'0')} ${months[d.getMonth()]}, ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
}

const ADJUNTOS_DISPONIBLES: Adjunto[] = [
  { nombre: 'Reporte_Escaneos.xlsx', tipo: 'EXCEL', tamaño: '2.1 MB' },
  { nombre: 'Informe_Operativo.pdf', tipo: 'PDF', tamaño: '1.3 MB' },
  { nombre: 'Infracciones.csv', tipo: 'CSV', tamaño: '880 KB' },
  { nombre: 'Captura_Sistema.png', tipo: 'PNG', tamaño: '410 KB' },
  { nombre: 'Reporte_Comparendos.docx', tipo: 'WORD', tamaño: '560 KB' },
  { nombre: 'Foto_Operativo.jpg', tipo: 'JPG', tamaño: '290 KB' },
];
export default function ComunicacionPage() {
  const { filtroCiudad } = useAppStore();
  const [tab, setTab] = useState<'recibidos' | 'enviados'>('recibidos');
  const [msgSel, setMsgSel] = useState<string | null>('MSG-001');
  const [busqueda, setBusqueda] = useState('');
  const [mensajes, setMensajes] = useState<Mensaje[]>(MENSAJES_MOCK);
  const [showCompose, setShowCompose] = useState(false);
  const [composeTo, setComposeTo] = useState<Ciudad>('Bogotá');
  const [composeCC, setComposeCC] = useState('');
  const [composeAsunto, setComposeAsunto] = useState('');
  const [composeCuerpo, setComposeCuerpo] = useState('');
  const [composeAdj, setComposeAdj] = useState<Adjunto[]>([]);
  const [showAdjMenu, setShowAdjMenu] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [chatCiudad, setChatCiudad] = useState<Ciudad>('Bogotá');
  const [chats, setChats] = useState<Record<Ciudad, ChatMsg[]>>(CHAT_INIT);
  const [chatInput, setChatInput] = useState('');
  const [chatAdj, setChatAdj] = useState<Adjunto[]>([]);
  const [showChatAdjMenu, setShowChatAdjMenu] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const ciudadActiva = filtroCiudad === 'Todas' ? null : filtroCiudad as Ciudad;

  const mensajesFiltrados = useMemo(() => {
    const tipoFiltro = tab === 'recibidos' ? 'recibido' : 'enviado';
    return mensajes
      .filter(m => m.tipo === tipoFiltro)
      .filter(m => !ciudadActiva || m.ciudad === ciudadActiva)
      .filter(m => !busqueda || m.asunto.toLowerCase().includes(busqueda.toLowerCase()))
      .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
  }, [mensajes, tab, ciudadActiva, busqueda]);

  const msgSelObj = mensajes.find(m => m.id === msgSel) ?? null;
  const totalRecibidos = mensajes.filter(m => m.tipo === 'recibido' && (!ciudadActiva || m.ciudad === ciudadActiva)).length;
  const totalEnviados  = mensajes.filter(m => m.tipo === 'enviado'  && (!ciudadActiva || m.ciudad === ciudadActiva)).length;
  const totalVistos    = mensajes.filter(m => m.tipo === 'recibido' && m.leido && (!ciudadActiva || m.ciudad === ciudadActiva)).length;
  const totalSinLeer   = mensajes.filter(m => m.tipo === 'recibido' && !m.leido && (!ciudadActiva || m.ciudad === ciudadActiva)).length;

  function abrirMensaje(id: string) {
    setMsgSel(id);
    setMensajes(prev => prev.map(m => m.id === id ? { ...m, leido: true } : m));
  }

  function enviarMensaje() {
    if (!composeAsunto || !composeCuerpo) return;
    const nuevo: Mensaje = {
      id: `MSG-${String(mensajes.length + 1).padStart(3,'0')}`, tipo: 'enviado', ciudad: composeTo,
      asunto: composeAsunto, cuerpo: composeCuerpo, fecha: new Date().toISOString(),
      leido: true, adjuntos: composeAdj, cc: composeCC || undefined,
    };
    setMensajes(prev => [nuevo, ...prev]);
    setShowCompose(false); setComposeAsunto(''); setComposeCuerpo(''); setComposeCC(''); setComposeAdj([]);
    setTab('enviados'); setMsgSel(nuevo.id);
  }

  function enviarChat() {
    if (!chatInput.trim() && chatAdj.length === 0) return;
    const nuevo: ChatMsg = {
      id: `cm-${Date.now()}`, de: 'yo', texto: chatInput,
      hora: `${String(new Date().getHours()).padStart(2,'0')}:${String(new Date().getMinutes()).padStart(2,'0')}`,
      adjuntos: chatAdj.length > 0 ? [...chatAdj] : undefined,
    };
    setChats(prev => ({ ...prev, [chatCiudad]: [...(prev[chatCiudad] || []), nuevo] }));
    setChatInput(''); setChatAdj([]);
    setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '12px' }}>
        {[
          { label: 'Recibidos', val: totalRecibidos, icon: Inbox,   color: '#00B4D8', bg: 'rgba(0,180,216,0.08)' },
          { label: 'Enviados',  val: totalEnviados,  icon: Send,    color: '#22C55E', bg: 'rgba(34,197,94,0.08)' },
          { label: 'Vistos',    val: totalVistos,    icon: MailOpen,color: '#A855F7', bg: 'rgba(168,85,247,0.08)' },
          { label: 'Sin leer',  val: totalSinLeer,   icon: EyeOff,  color: '#EF4444', bg: 'rgba(239,68,68,0.08)' },
        ].map(({ label, val, icon: Icon, color, bg }) => (
          <div key={label} style={{ backgroundColor: '#112236', border: '1px solid #1E3A55', borderRadius: '12px', padding: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: 36, height: 36, borderRadius: 8, backgroundColor: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon size={16} style={{ color }} />
              </div>
              <div>
                <p style={{ fontSize: 22, fontWeight: 700, color, fontFamily: 'var(--font-orbitron, monospace)', lineHeight: 1 }}>{val}</p>
                <p style={{ fontSize: 10, color: '#64748B', marginTop: 2 }}>{label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Panel principal */}
      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '12px', minHeight: '600px' }}>
        {/* Lista */}
        <div style={{ backgroundColor: '#112236', border: '1px solid #1E3A55', borderRadius: '12px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ padding: '12px', borderBottom: '1px solid #1E3A55', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setShowCompose(true)} style={{ flex: 1, backgroundColor: '#00B4D8', color: '#0D1B2A', border: 'none', borderRadius: 8, padding: '8px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                <Plus size={14}/> Nuevo mensaje
              </button>
              <button onClick={() => { setShowChat(true); setChatCiudad(ciudadActiva ?? 'Bogotá'); }} style={{ backgroundColor: 'rgba(168,85,247,0.15)', color: '#A855F7', border: '1px solid rgba(168,85,247,0.3)', borderRadius: 8, padding: '8px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 600 }}>
                <MessageSquare size={13}/> Chat
              </button>
            </div>
            <div style={{ position: 'relative' }}>
              <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#64748B' }}/>
              <input value={busqueda} onChange={e => setBusqueda(e.target.value)} placeholder="Buscar mensajes..." style={{ width: '100%', backgroundColor: '#0A1628', border: '1px solid #1E3A55', borderRadius: 8, padding: '7px 10px 7px 30px', fontSize: 12, color: '#E2E8F0', outline: 'none', boxSizing: 'border-box' }}/>
            </div>
            <div style={{ display: 'flex', backgroundColor: '#0A1628', borderRadius: 8, padding: 3 }}>
              {(['recibidos','enviados'] as const).map(t => (
                <button key={t} onClick={() => setTab(t)} style={{ flex: 1, padding: '5px 0', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 600, backgroundColor: tab === t ? '#1E3A55' : 'transparent', color: tab === t ? '#E2E8F0' : '#64748B', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                  {t === 'recibidos' ? <Inbox size={12}/> : <Send size={12}/>}
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                  {t === 'recibidos' && totalSinLeer > 0 && <span style={{ backgroundColor: '#EF4444', color: '#fff', borderRadius: 10, fontSize: 9, fontWeight: 700, padding: '1px 5px' }}>{totalSinLeer}</span>}
                </button>
              ))}
            </div>
          </div>
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {mensajesFiltrados.map(msg => (
              <div key={msg.id} onClick={() => abrirMensaje(msg.id)} style={{ padding: '12px 14px', borderBottom: '1px solid rgba(30,58,85,0.5)', cursor: 'pointer', backgroundColor: msgSel === msg.id ? 'rgba(0,180,216,0.08)' : 'transparent', borderLeft: msgSel === msg.id ? '3px solid #00B4D8' : '3px solid transparent' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {msg.tipo === 'recibido' && !msg.leido && <div style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#00B4D8', flexShrink: 0 }}/>}
                    <span style={{ fontSize: 10, fontWeight: 700, color: CIUDAD_COLORS[msg.ciudad], backgroundColor: `${CIUDAD_COLORS[msg.ciudad]}15`, padding: '1px 6px', borderRadius: 4 }}>{msg.ciudad}</span>
                  </div>
                  <span style={{ fontSize: 10, color: '#64748B' }}>{fmtFecha(msg.fecha)}</span>
                </div>
                <p style={{ fontSize: 12, fontWeight: msg.tipo === 'recibido' && !msg.leido ? 700 : 500, color: '#E2E8F0', marginBottom: 3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{msg.asunto}</p>
                <p style={{ fontSize: 11, color: '#64748B', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {msg.tipo === 'recibido' ? SECRETARIOS[msg.ciudad].nombre : `Para: ${SECRETARIOS[msg.ciudad].nombre}`}
                </p>
                {msg.adjuntos.length > 0 && <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}><Paperclip size={10} style={{ color: '#64748B' }}/><span style={{ fontSize: 10, color: '#64748B' }}>{msg.adjuntos.length} adjunto{msg.adjuntos.length > 1 ? 's' : ''}</span></div>}
              </div>
            ))}
          </div>
        </div>

        {/* Detalle */}
        <div style={{ backgroundColor: '#112236', border: '1px solid #1E3A55', borderRadius: '12px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {!msgSelObj ? (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12 }}>
              <Mail size={40} style={{ color: '#1E3A55' }}/><p style={{ color: '#64748B', fontSize: 13 }}>Selecciona un mensaje</p>
            </div>
          ) : (<>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #1E3A55' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <h2 style={{ fontSize: 16, fontWeight: 700, color: '#E2E8F0' }}>{msgSelObj.asunto}</h2>
                <span style={{ fontSize: 10, fontWeight: 700, color: CIUDAD_COLORS[msgSelObj.ciudad], backgroundColor: `${CIUDAD_COLORS[msgSelObj.ciudad]}15`, padding: '3px 8px', borderRadius: 6 }}>{msgSelObj.ciudad}</span>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, fontSize: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <User size={12} style={{ color: '#64748B' }}/>
                  <span style={{ color: '#E2E8F0', fontWeight: 600 }}>{msgSelObj.tipo === 'recibido' ? SECRETARIOS[msgSelObj.ciudad].nombre : HAIX_REMITENTE.nombre}</span>
                  <span style={{ color: '#64748B' }}>&lt;{msgSelObj.tipo === 'recibido' ? SECRETARIOS[msgSelObj.ciudad].email : HAIX_REMITENTE.email}&gt;</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 'auto' }}>
                  <Clock size={12} style={{ color: '#64748B' }}/><span style={{ color: '#64748B' }}>{fmtFecha(msgSelObj.fecha)}</span>
                </div>
              </div>
              {msgSelObj.cc && <p style={{ fontSize: 11, color: '#64748B', marginTop: 6 }}>CC: {msgSelObj.cc}</p>}
            </div>
            <div style={{ flex: 1, padding: '20px 24px', overflowY: 'auto' }}>
              <pre style={{ fontFamily: 'inherit', fontSize: 13, color: '#CBD5E1', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{msgSelObj.cuerpo}</pre>
            </div>
            {msgSelObj.adjuntos.length > 0 && (
              <div style={{ padding: '12px 24px', borderTop: '1px solid #1E3A55' }}>
                <p style={{ fontSize: 11, color: '#64748B', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 4 }}><Paperclip size={11}/> {msgSelObj.adjuntos.length} adjunto{msgSelObj.adjuntos.length > 1 ? 's':''}</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {msgSelObj.adjuntos.map((adj, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, backgroundColor: '#0A1628', border: '1px solid #1E3A55', borderRadius: 8, padding: '6px 10px' }}>
                      <span style={{ fontSize: 9, fontWeight: 700, color: '#fff', backgroundColor: TIPO_COLORS[adj.tipo], padding: '2px 5px', borderRadius: 4 }}>{adj.tipo}</span>
                      <span style={{ fontSize: 11, color: '#CBD5E1' }}>{adj.nombre}</span>
                      <span style={{ fontSize: 10, color: '#64748B' }}>{adj.tamaño}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div style={{ padding: '12px 24px', borderTop: '1px solid #1E3A55', display: 'flex', gap: 8 }}>
              <button onClick={() => { setShowCompose(true); setComposeTo(msgSelObj.ciudad); setComposeAsunto(`RE: ${msgSelObj.asunto}`); }} style={{ backgroundColor: 'rgba(0,180,216,0.1)', color: '#00B4D8', border: '1px solid rgba(0,180,216,0.25)', borderRadius: 8, padding: '7px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>↩ Responder</button>
              <button onClick={() => { setShowChat(true); setChatCiudad(msgSelObj.ciudad); }} style={{ backgroundColor: 'rgba(168,85,247,0.1)', color: '#A855F7', border: '1px solid rgba(168,85,247,0.25)', borderRadius: 8, padding: '7px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}><MessageSquare size={13}/> Chat directo</button>
            </div>
          </>)}
        </div>
      </div>

      {/* COMPOSE MODAL */}
      {showCompose && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ backgroundColor: '#0A1628', border: '1px solid #1E3A55', borderRadius: 16, width: '100%', maxWidth: 620, maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #1E3A55', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: '#E2E8F0', display: 'flex', alignItems: 'center', gap: 8 }}><Mail size={15} style={{ color: '#00B4D8' }}/> Nuevo mensaje</h3>
              <button onClick={() => setShowCompose(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}><X size={16}/></button>
            </div>
            <div style={{ padding: '16px 20px', flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ fontSize: 11, color: '#64748B', marginBottom: 4, display: 'block' }}>Para (Secretario)</label>
                {CIUDADES.map(c => (
                  <label key={c} onClick={() => setComposeTo(c)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderRadius: 8, cursor: 'pointer', marginBottom: 4, backgroundColor: composeTo === c ? 'rgba(0,180,216,0.1)' : '#112236', border: `1px solid ${composeTo === c ? 'rgba(0,180,216,0.3)' : '#1E3A55'}` }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: composeTo === c ? '#00B4D8' : 'transparent', border: composeTo === c ? 'none' : '2px solid #1E3A55' }}/>
                    <span style={{ fontSize: 12, fontWeight: 600, color: '#E2E8F0' }}>{SECRETARIOS[c].nombre}</span>
                    <span style={{ fontSize: 11, color: '#64748B' }}>&lt;{SECRETARIOS[c].email}&gt;</span>
                    <span style={{ marginLeft: 'auto', fontSize: 10, fontWeight: 700, color: CIUDAD_COLORS[c] }}>{c}</span>
                  </label>
                ))}
              </div>
              <div>
                <label style={{ fontSize: 11, color: '#64748B', marginBottom: 4, display: 'block' }}>Con copia (CC)</label>
                <input value={composeCC} onChange={e => setComposeCC(e.target.value)} placeholder="correo@ejemplo.gov.co" style={{ width: '100%', backgroundColor: '#112236', border: '1px solid #1E3A55', borderRadius: 8, padding: '8px 12px', fontSize: 12, color: '#E2E8F0', outline: 'none', boxSizing: 'border-box' }}/>
              </div>
              <div>
                <label style={{ fontSize: 11, color: '#64748B', marginBottom: 4, display: 'block' }}>Asunto</label>
                <input value={composeAsunto} onChange={e => setComposeAsunto(e.target.value)} placeholder="Asunto del mensaje..." style={{ width: '100%', backgroundColor: '#112236', border: '1px solid #1E3A55', borderRadius: 8, padding: '8px 12px', fontSize: 12, color: '#E2E8F0', outline: 'none', boxSizing: 'border-box' }}/>
              </div>
              <div>
                <label style={{ fontSize: 11, color: '#64748B', marginBottom: 4, display: 'block' }}>Mensaje</label>
                <textarea value={composeCuerpo} onChange={e => setComposeCuerpo(e.target.value)} rows={6} placeholder="Escribe tu mensaje aquí..." style={{ width: '100%', backgroundColor: '#112236', border: '1px solid #1E3A55', borderRadius: 8, padding: '10px 12px', fontSize: 12, color: '#E2E8F0', outline: 'none', resize: 'vertical', boxSizing: 'border-box', fontFamily: 'inherit' }}/>
              </div>
              {composeAdj.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {composeAdj.map((a, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, backgroundColor: '#112236', border: '1px solid #1E3A55', borderRadius: 6, padding: '4px 8px' }}>
                      <span style={{ fontSize: 9, fontWeight: 700, color: '#fff', backgroundColor: TIPO_COLORS[a.tipo], padding: '1px 4px', borderRadius: 3 }}>{a.tipo}</span>
                      <span style={{ fontSize: 11, color: '#CBD5E1' }}>{a.nombre}</span>
                      <button onClick={() => setComposeAdj(prev => prev.filter((_,j)=>j!==i))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B', padding: 0 }}><X size={11}/></button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div style={{ padding: '12px 20px', borderTop: '1px solid #1E3A55', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ position: 'relative' }}>
                <button onClick={() => setShowAdjMenu(v=>!v)} style={{ backgroundColor: '#112236', color: '#94A3B8', border: '1px solid #1E3A55', borderRadius: 8, padding: '7px 12px', fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}><Paperclip size={13}/> Adjuntar</button>
                {showAdjMenu && (
                  <div style={{ position: 'absolute', bottom: '110%', left: 0, backgroundColor: '#0A1628', border: '1px solid #1E3A55', borderRadius: 10, padding: 6, minWidth: 260, zIndex: 10 }}>
                    {ADJUNTOS_DISPONIBLES.map((a,i) => (
                      <div key={i} onClick={() => { setComposeAdj(prev=>[...prev,a]); setShowAdjMenu(false); }} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', borderRadius: 6, cursor: 'pointer' }} onMouseEnter={e=>(e.currentTarget.style.backgroundColor='#112236')} onMouseLeave={e=>(e.currentTarget.style.backgroundColor='transparent')}>
                        <span style={{ fontSize: 9, fontWeight: 700, color: '#fff', backgroundColor: TIPO_COLORS[a.tipo], padding: '2px 5px', borderRadius: 4 }}>{a.tipo}</span>
                        <span style={{ fontSize: 12, color: '#CBD5E1' }}>{a.nombre}</span>
                        <span style={{ fontSize: 10, color: '#64748B', marginLeft: 'auto' }}>{a.tamaño}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => setShowCompose(false)} style={{ backgroundColor: 'transparent', color: '#64748B', border: '1px solid #1E3A55', borderRadius: 8, padding: '7px 16px', fontSize: 12, cursor: 'pointer' }}>Cancelar</button>
                <button onClick={enviarMensaje} style={{ backgroundColor: '#00B4D8', color: '#0D1B2A', border: 'none', borderRadius: 8, padding: '7px 20px', fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}><Send size={13}/> Enviar</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CHAT MODAL */}
      {showChat && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ backgroundColor: '#0A1628', border: '1px solid #1E3A55', borderRadius: 16, width: '100%', maxWidth: 520, height: '75vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ padding: '14px 18px', borderBottom: '1px solid #1E3A55', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 34, height: 34, borderRadius: '50%', backgroundColor: CIUDAD_COLORS[chatCiudad], display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#0D1B2A' }}>{SECRETARIOS[chatCiudad].avatar}</div>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 700, color: '#E2E8F0' }}>{SECRETARIOS[chatCiudad].nombre}</p>
                  <p style={{ fontSize: 10, color: '#64748B' }}>{SECRETARIOS[chatCiudad].cargo} · {chatCiudad}</p>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ display: 'flex', gap: 4 }}>
                  {CIUDADES.map(c => (
                    <button key={c} onClick={() => setChatCiudad(c)} style={{ fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 6, border: 'none', cursor: 'pointer', backgroundColor: chatCiudad === c ? CIUDAD_COLORS[c] : 'rgba(255,255,255,0.05)', color: chatCiudad === c ? '#0D1B2A' : '#64748B' }}>{c.slice(0,3)}</button>
                  ))}
                </div>
                <button onClick={() => setShowChat(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}><X size={16}/></button>
              </div>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {(chats[chatCiudad] || []).length === 0 && <div style={{ textAlign: 'center', color: '#64748B', fontSize: 12, marginTop: 40 }}>Inicia la conversación con {SECRETARIOS[chatCiudad].nombre}</div>}
              {(chats[chatCiudad] || []).map(msg => (
                <div key={msg.id} style={{ display: 'flex', flexDirection: msg.de === 'yo' ? 'row-reverse' : 'row', gap: 8, alignItems: 'flex-end' }}>
                  {msg.de === 'secretario' && <div style={{ width: 26, height: 26, borderRadius: '50%', backgroundColor: CIUDAD_COLORS[chatCiudad], display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700, color: '#0D1B2A', flexShrink: 0 }}>{SECRETARIOS[chatCiudad].avatar}</div>}
                  <div style={{ maxWidth: '75%' }}>
                    {msg.texto && <div style={{ backgroundColor: msg.de === 'yo' ? '#00B4D8' : '#112236', color: msg.de === 'yo' ? '#0D1B2A' : '#E2E8F0', padding: '8px 12px', borderRadius: msg.de === 'yo' ? '12px 12px 4px 12px' : '12px 12px 12px 4px', fontSize: 13 }}>{msg.texto}</div>}
                    {msg.adjuntos?.map((a,i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, backgroundColor: msg.de === 'yo' ? 'rgba(0,180,216,0.15)' : '#112236', border: `1px solid ${msg.de === 'yo' ? 'rgba(0,180,216,0.3)' : '#1E3A55'}`, borderRadius: 8, padding: '5px 10px', marginTop: 4 }}>
                        <span style={{ fontSize: 9, fontWeight: 700, color: '#fff', backgroundColor: TIPO_COLORS[a.tipo], padding: '1px 4px', borderRadius: 3 }}>{a.tipo}</span>
                        <span style={{ fontSize: 11, color: '#CBD5E1' }}>{a.nombre}</span>
                      </div>
                    ))}
                    <p style={{ fontSize: 9, color: '#64748B', marginTop: 2, textAlign: msg.de === 'yo' ? 'right' : 'left' }}>{msg.hora}</p>
                  </div>
                </div>
              ))}
              <div ref={chatEndRef}/>
            </div>
            <div style={{ padding: '12px 16px', borderTop: '1px solid #1E3A55' }}>
              {chatAdj.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 8 }}>
                  {chatAdj.map((a,i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 5, backgroundColor: '#112236', border: '1px solid #1E3A55', borderRadius: 6, padding: '3px 7px' }}>
                      <span style={{ fontSize: 9, fontWeight: 700, color: '#fff', backgroundColor: TIPO_COLORS[a.tipo], padding: '1px 4px', borderRadius: 3 }}>{a.tipo}</span>
                      <span style={{ fontSize: 10, color: '#CBD5E1' }}>{a.nombre}</span>
                      <button onClick={() => setChatAdj(prev=>prev.filter((_,j)=>j!==i))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B', padding: 0 }}><X size={10}/></button>
                    </div>
                  ))}
                </div>
              )}
              <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
                <div style={{ position: 'relative', flexShrink: 0 }}>
                  <button onClick={() => setShowChatAdjMenu(v=>!v)} style={{ backgroundColor: '#112236', color: '#64748B', border: '1px solid #1E3A55', borderRadius: 8, padding: '9px 10px', cursor: 'pointer' }}><Paperclip size={14}/></button>
                  {showChatAdjMenu && (
                    <div style={{ position: 'absolute', bottom: '110%', left: 0, backgroundColor: '#0A1628', border: '1px solid #1E3A55', borderRadius: 10, padding: 6, minWidth: 250, zIndex: 10 }}>
                      {ADJUNTOS_DISPONIBLES.map((a,i) => (
                        <div key={i} onClick={() => { setChatAdj(prev=>[...prev,a]); setShowChatAdjMenu(false); }} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', borderRadius: 6, cursor: 'pointer' }} onMouseEnter={e=>(e.currentTarget.style.backgroundColor='#112236')} onMouseLeave={e=>(e.currentTarget.style.backgroundColor='transparent')}>
                          <span style={{ fontSize: 9, fontWeight: 700, color: '#fff', backgroundColor: TIPO_COLORS[a.tipo], padding: '2px 5px', borderRadius: 4 }}>{a.tipo}</span>
                          <span style={{ fontSize: 12, color: '#CBD5E1' }}>{a.nombre}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <input value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && !e.shiftKey && enviarChat()} placeholder={`Mensaje para ${SECRETARIOS[chatCiudad].nombre.split(' ')[1]}...`} style={{ flex: 1, backgroundColor: '#112236', border: '1px solid #1E3A55', borderRadius: 8, padding: '9px 12px', fontSize: 13, color: '#E2E8F0', outline: 'none' }}/>
                <button onClick={enviarChat} style={{ backgroundColor: '#00B4D8', color: '#0D1B2A', border: 'none', borderRadius: 8, padding: '9px 14px', cursor: 'pointer' }}><Send size={14}/></button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}