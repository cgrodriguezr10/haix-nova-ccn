'use client';

import { useState, useRef, useEffect } from 'react';
import { Brain, Send, Download, FileText, Sparkles, ChevronRight, Loader2, Copy, Check } from 'lucide-react';
import { SectionHeader } from '@/components/shared/SectionHeader';
import { generateResponse, QUICK_QUERIES, type NovaXMessage, type TableData } from '@/lib/novax-engine';

// ─── GENERADOR DE IDs ────────────────────────────────────────────────────────
let _id = 0;
const uid = () => `msg-${Date.now()}-${_id++}`;

// ─── MENSAJE INICIAL ──────────────────────────────────────────────────────────
const WELCOME: NovaXMessage = {
  id: 'welcome',
  role: 'novax',
  content: `¡Bienvenido al motor de inteligencia **NovaX**!\n\nEstoy conectado con los datos operativos en tiempo real de las **4 ciudades** del sistema HAIX Nova. Puedo analizar comparendos, zonas críticas, eficiencia de agentes, recaudo y generar predicciones.\n\nUsa las sugerencias rápidas de abajo o escribe tu consulta directamente.`,
  timestamp: new Date(),
};

// ─── RENDERER DE TABLA ────────────────────────────────────────────────────────
function DataTable({ table }: { table: TableData }) {
  return (
    <div className="overflow-x-auto mt-3 rounded-lg" style={{ border: '1px solid rgba(0,180,216,0.2)' }}>
      <table className="w-full text-xs">
        <thead>
          <tr style={{ backgroundColor: 'rgba(0,180,216,0.08)', borderBottom: '1px solid rgba(0,180,216,0.2)' }}>
            {table.headers.map((h, i) => (
              <th key={i} className="px-3 py-2 text-left font-semibold font-orbitron tracking-wide whitespace-nowrap" style={{ color: '#00B4D8' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {table.rows.map((row, ri) => (
            <tr key={ri} style={{ borderBottom: ri < table.rows.length - 1 ? '1px solid rgba(30,58,85,0.6)' : 'none', backgroundColor: ri % 2 === 0 ? 'rgba(10,22,40,0.4)' : 'transparent' }}>
              {row.map((cell, ci) => (
                <td key={ci} className="px-3 py-2 whitespace-nowrap" style={{ color: ci === 0 ? '#E2E8F0' : '#94A3B8' }}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── RENDERER DE MARKDOWN SIMPLE ─────────────────────────────────────────────
function MarkdownText({ text }: { text: string }) {
  const lines = text.split('\n');
  return (
    <div className="text-sm leading-relaxed space-y-1" style={{ color: '#CBD5E1' }}>
      {lines.map((line, i) => {
        if (!line.trim()) return <div key={i} className="h-1" />;
        const parts = line.split(/\*\*(.*?)\*\*/g);
        const rendered = parts.map((p, j) =>
          j % 2 === 1
            ? <span key={j} className="font-semibold" style={{ color: '#E2E8F0' }}>{p}</span>
            : <span key={j}>{p}</span>
        );
        if (line.startsWith('•') || line.startsWith('-')) {
          return <div key={i} className="flex gap-2 items-start"><span style={{ color: '#00B4D8' }}>•</span><span className="flex-1">{rendered}</span></div>;
        }
        if (line.startsWith('|')) return null;
        return <div key={i}>{rendered}</div>;
      })}
    </div>
  );
}

// ─── EXPORTAR COMO TEXTO ─────────────────────────────────────────────────────
function exportMessage(msg: NovaXMessage) {
  const now = new Date();
  const fecha = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
  const hora = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
  const lines: string[] = [
    '═══════════════════════════════════════════════════',
    '     HAIX NOVA — REPORTE NovaX AI',
    '═══════════════════════════════════════════════════',
    `Generado: ${fecha} ${hora}`,
    '',
    '--- ANÁLISIS ---',
    msg.content.replace(/\*\*/g, ''),
    '',
  ];
  if (msg.table) {
    lines.push('--- DATOS DETALLADOS ---');
    lines.push(msg.table.headers.join(' | '));
    lines.push(msg.table.headers.map(() => '--------').join('-|-'));
    msg.table.rows.forEach(row => lines.push(row.join(' | ')));
    lines.push('');
  }
  lines.push('═══════════════════════════════════════════════════');
  lines.push('HAIX Technologies · Datos simulados para demo');
  lines.push('Sistema HAIX Nova v2.4.1 · SIMIT Colombia');

  const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `NovaX-Reporte-${fecha}.txt`;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── BURBUJA DE MENSAJE ───────────────────────────────────────────────────────
function MessageBubble({ msg }: { msg: NovaXMessage }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(msg.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (msg.role === 'user') {
    return (
      <div className="flex justify-end mb-4">
        <div className="max-w-[80%] px-4 py-3 rounded-2xl rounded-tr-sm text-sm"
          style={{ backgroundColor: 'rgba(0,180,216,0.15)', border: '1px solid rgba(0,180,216,0.3)', color: '#E2E8F0' }}>
          {msg.content}
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-3 mb-5">
      <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-1"
        style={{ background: 'linear-gradient(135deg, rgba(0,180,216,0.3), rgba(167,139,250,0.3))', border: '1px solid rgba(0,180,216,0.4)' }}>
        <Brain size={14} style={{ color: '#00B4D8' }} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs font-orbitron font-bold" style={{ color: '#00B4D8' }}>NovaX</span>
          <span className="text-[10px]" style={{ color: '#374151' }}>
            {String(msg.timestamp.getHours()).padStart(2, '0')}:{String(msg.timestamp.getMinutes()).padStart(2, '0')}
          </span>
        </div>

        <div className="rounded-2xl rounded-tl-sm p-4" style={{ backgroundColor: '#112236', border: '1px solid #1E3A55' }}>
          <MarkdownText text={msg.content} />
          {msg.table && <DataTable table={msg.table} />}
        </div>

        {msg.exportable && (
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <button onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all hover:scale-105"
              style={{ backgroundColor: 'rgba(100,116,139,0.1)', border: '1px solid rgba(100,116,139,0.2)', color: '#94A3B8' }}>
              {copied ? <Check size={11} /> : <Copy size={11} />}
              {copied ? 'Copiado' : 'Copiar'}
            </button>
            <button onClick={() => exportMessage(msg)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all hover:scale-105"
              style={{ backgroundColor: 'rgba(0,180,216,0.08)', border: '1px solid rgba(0,180,216,0.2)', color: '#00B4D8' }}>
              <FileText size={11} />
              Exportar reporte
            </button>
            <button onClick={() => exportMessage(msg)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all hover:scale-105"
              style={{ backgroundColor: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)', color: '#A78BFA' }}>
              <Download size={11} />
              Descargar datos
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── TYPING INDICATOR ─────────────────────────────────────────────────────────
function TypingIndicator() {
  return (
    <div className="flex gap-3 mb-5">
      <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
        style={{ background: 'linear-gradient(135deg, rgba(0,180,216,0.3), rgba(167,139,250,0.3))', border: '1px solid rgba(0,180,216,0.4)' }}>
        <Loader2 size={14} style={{ color: '#00B4D8' }} className="animate-spin" />
      </div>
      <div className="rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1.5"
        style={{ backgroundColor: '#112236', border: '1px solid #1E3A55' }}>
        {[0, 1, 2].map(i => (
          <div key={i} className="w-1.5 h-1.5 rounded-full animate-bounce"
            style={{ backgroundColor: '#00B4D8', animationDelay: `${i * 0.15}s` }} />
        ))}
      </div>
    </div>
  );
}

// ─── PÁGINA PRINCIPAL ─────────────────────────────────────────────────────────
export default function NovaXPage() {
  const [messages, setMessages] = useState<NovaXMessage[]>([WELCOME]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const sendMessage = (text: string) => {
    if (!text.trim() || isTyping) return;

    const userMsg: NovaXMessage = {
      id: uid(),
      role: 'user',
      content: text.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    const delay = 800 + Math.random() * 600;
    setTimeout(() => {
      const response = generateResponse(text);
      const novaMsg: NovaXMessage = {
        id: uid(),
        role: 'novax',
        timestamp: new Date(),
        ...response,
      };
      setMessages(prev => [...prev, novaMsg]);
      setIsTyping(false);
    }, delay);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-5rem)]" style={{ maxHeight: 'calc(100vh - 80px)' }}>

      <div className="shrink-0 mb-4">
        <SectionHeader
          title="NovaX AI"
          subtitle="Motor de inteligencia analítica · Datos en tiempo real · 4 ciudades"
        />
      </div>

      <div className="shrink-0 rounded-xl px-5 py-3 mb-4 flex items-center gap-4"
        style={{ background: 'linear-gradient(90deg, rgba(0,180,216,0.08) 0%, rgba(167,139,250,0.08) 100%)', border: '1px solid rgba(0,180,216,0.2)' }}>
        <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: '#22C55E' }} />
        <span className="text-xs" style={{ color: '#22C55E' }}>Motor activo</span>
        <span className="text-xs" style={{ color: '#64748B' }}>·</span>
        <span className="text-xs" style={{ color: '#64748B' }}>Bogotá · Cali · Medellín · Barranquilla</span>
        <div className="ml-auto flex items-center gap-1.5">
          <Sparkles size={12} style={{ color: '#A78BFA' }} />
          <span className="text-[11px] font-orbitron" style={{ color: '#A78BFA' }}>NovaX v1.0</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto rounded-xl p-5 mb-4"
        style={{ backgroundColor: '#0A1628', border: '1px solid #1E3A55' }}>
        {messages.map(msg => (
          <MessageBubble key={msg.id} msg={msg} />
        ))}
        {isTyping && <TypingIndicator />}
        <div ref={bottomRef} />
      </div>

      <div className="shrink-0 mb-3">
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {QUICK_QUERIES.map((q, i) => (
            <button key={i}
              onClick={() => sendMessage(q.query)}
              disabled={isTyping}
              className="shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-lg text-[11px] font-medium whitespace-nowrap transition-all hover:scale-105 disabled:opacity-40"
              style={{ backgroundColor: 'rgba(17,34,54,0.8)', border: '1px solid #1E3A55', color: '#94A3B8' }}>
              {q.label}
              <ChevronRight size={10} style={{ color: '#374151' }} />
            </button>
          ))}
        </div>
      </div>

      <div className="shrink-0 rounded-xl p-3 flex gap-3 items-end"
        style={{ backgroundColor: '#112236', border: '1px solid #1E3A55' }}>
        <textarea
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Pregunta sobre zonas, comparendos, recaudo, predicciones… (Enter para enviar)"
          rows={1}
          className="flex-1 resize-none bg-transparent text-sm outline-none placeholder:text-slate-600"
          style={{ color: '#E2E8F0', maxHeight: '120px' }}
        />
        <button
          onClick={() => sendMessage(input)}
          disabled={!input.trim() || isTyping}
          className="p-2.5 rounded-xl transition-all hover:scale-105 disabled:opacity-30"
          style={{ backgroundColor: 'rgba(0,180,216,0.15)', border: '1px solid rgba(0,180,216,0.3)' }}>
          <Send size={16} style={{ color: '#00B4D8' }} />
        </button>
      </div>

    </div>
  );
}