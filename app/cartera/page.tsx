'use client'

import { useState, useMemo } from 'react'
import { CARTERA_DATA, VehiculoCartera } from '@/lib/cartera-data'

const formatCOP = (v: number) => '$' + v.toLocaleString('es-CO')
const totalDeuda = (v: VehiculoCartera) => v.comparendos.reduce((s, c) => s + c.valor, 0)

const CIUDAD_COLOR: Record<string, string> = {
  Bogotá: '#00B4D8', Cali: '#E87C2B', Medellín: '#A78BFA', Barranquilla: '#34D399',
}
const ESTADO_COLOR: Record<string, string> = {
  'Sin gestión':         '#EF4444',
  'Notificado':          '#F59E0B',
  'En proceso jurídico': '#00B4D8',
}

export default function CarteraVialPage() {
  const [ciudadFiltro, setCiudadFiltro] = useState('Todas')
  const [estadoFiltro, setEstadoFiltro] = useState('Todos')
  const [ordenar, setOrdenar]           = useState<'deuda' | 'mora' | 'avistamientos'>('deuda')
  const [expandido, setExpandido]       = useState<string | null>(null)

  const datos = useMemo(() => {
    let d = [...CARTERA_DATA]
    if (ciudadFiltro !== 'Todas') d = d.filter(v => v.ciudad === ciudadFiltro)
    if (estadoFiltro !== 'Todos') d = d.filter(v => v.estadoGestion === estadoFiltro)
    if (ordenar === 'deuda')         d.sort((a, b) => totalDeuda(b) - totalDeuda(a))
    if (ordenar === 'mora')          d.sort((a, b) => b.diasMora - a.diasMora)
    if (ordenar === 'avistamientos') d.sort((a, b) => b.avistamientos30d - a.avistamientos30d)
    return d
  }, [ciudadFiltro, estadoFiltro, ordenar])

  const totalCartera  = CARTERA_DATA.reduce((s, v) => s + totalDeuda(v), 0)
  const totalFiltrado = datos.reduce((s, v) => s + totalDeuda(v), 0)
  const sinGestion    = CARTERA_DATA.filter(v => v.estadoGestion === 'Sin gestión').length
  const reincidentes  = CARTERA_DATA.filter(v => v.avistamientos30d >= 7).length

  const selectStyle: React.CSSProperties = {
    fontSize: '12px',
    padding: '6px 12px',
    borderRadius: '8px',
    border: '1px solid #1E3A55',
    backgroundColor: '#0D1B2A',
    color: '#E2E8F0',
    outline: 'none',
  }

  return (
    <div className="space-y-6">

      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-1">
          <span style={{ fontSize: '22px' }}>💰</span>
          <h1 className="font-orbitron font-bold text-xl" style={{ color: '#E2E8F0' }}>
            Cartera Vial
          </h1>
          <span style={{
            fontSize: '10px', fontWeight: 600, padding: '2px 10px', borderRadius: '999px',
            backgroundColor: 'rgba(239,68,68,0.12)', color: '#EF4444',
            border: '1px solid rgba(239,68,68,0.3)',
          }}>
            CARTERA RECUPERABLE
          </span>
        </div>
        <p className="text-sm ml-10" style={{ color: '#64748B' }}>
          Vehículos con SOAT y RTM vigentes detectados por DHNa3 con comparendos impagos activos
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Cartera total detectada', value: formatCOP(totalCartera), sub: 'período actual · 4 ciudades', color: '#EF4444' },
          { label: 'Vehículos identificados', value: String(CARTERA_DATA.length), sub: 'deudores localizados activamente', color: '#E2E8F0' },
          { label: 'Sin gestión de cobro',    value: String(sinGestion), sub: 'requieren acción inmediata', color: '#F59E0B' },
          { label: 'Reincidentes (≥7 avist.)',value: String(reincidentes), sub: 'alta frecuencia de circulación', color: '#00B4D8' },
        ].map(({ label, value, sub, color }) => (
          <div key={label} className="rounded-xl p-4" style={{ backgroundColor: '#112236', border: '1px solid #1E3A55' }}>
            <p className="text-[10px] font-semibold uppercase tracking-wider mb-1" style={{ color: '#64748B' }}>{label}</p>
            <p className="text-2xl font-bold font-mono" style={{ color }}>{value}</p>
            <p className="text-[10px] mt-1" style={{ color: '#64748B' }}>{sub}</p>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div className="rounded-xl p-4 flex flex-wrap gap-4 items-center" style={{ backgroundColor: '#112236', border: '1px solid #1E3A55' }}>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: '#64748B' }}>Ciudad</span>
          <select value={ciudadFiltro} onChange={e => setCiudadFiltro(e.target.value)} style={selectStyle}>
            <option value="Todas">Todas</option>
            <option>Bogotá</option><option>Medellín</option><option>Cali</option><option>Barranquilla</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: '#64748B' }}>Estado</span>
          <select value={estadoFiltro} onChange={e => setEstadoFiltro(e.target.value)} style={selectStyle}>
            <option value="Todos">Todos</option>
            <option>Sin gestión</option><option>Notificado</option><option>En proceso jurídico</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: '#64748B' }}>Ordenar por</span>
          <select value={ordenar} onChange={e => setOrdenar(e.target.value as 'deuda' | 'mora' | 'avistamientos')} style={selectStyle}>
            <option value="deuda">Mayor deuda</option>
            <option value="mora">Mayor antigüedad</option>
            <option value="avistamientos">Más avistamientos</option>
          </select>
        </div>
        <div className="ml-auto text-xs" style={{ color: '#64748B' }}>
          Mostrando <span style={{ color: '#E2E8F0', fontWeight: 600 }}>{datos.length}</span> vehículos ·{' '}
          <span style={{ color: '#EF4444', fontWeight: 600 }}>{formatCOP(totalFiltrado)}</span> en cartera
        </div>
      </div>

      {/* Tabla */}
      <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#112236', border: '1px solid #1E3A55' }}>
        <table style={{ width: '100%', fontSize: '12px', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #1E3A55', backgroundColor: '#0D1B2A' }}>
              {['Placa','Propietario','Ciudad avistada','Último avistamiento','Comp.','Total deuda','Días mora','Estado',''].map(h => (
                <th key={h} style={{ padding: '10px 14px', textAlign: h === 'Total deuda' ? 'right' : h === 'Comp.' || h === 'Días mora' || h === 'Estado' ? 'center' : 'left', fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748B', whiteSpace: 'nowrap' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {datos.map((v) => (
              <>
                <tr
                  key={v.id}
                  onClick={() => setExpandido(expandido === v.id ? null : v.id)}
                  style={{ borderBottom: '1px solid #1E3A55', cursor: 'pointer', transition: 'background 0.15s' }}
                  onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'rgba(0,180,216,0.05)')}
                  onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <td style={{ padding: '10px 14px' }}>
                    <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#00B4D8', letterSpacing: '0.1em' }}>{v.placa}</span>
                    {v.avistamientos30d >= 7 && (
                      <span style={{ marginLeft: 6, fontSize: '9px', fontWeight: 600, padding: '1px 6px', borderRadius: '999px', backgroundColor: 'rgba(239,68,68,0.12)', color: '#EF4444', border: '1px solid rgba(239,68,68,0.25)' }}>
                        🔁 ×{v.avistamientos30d}
                      </span>
                    )}
                  </td>
                  <td style={{ padding: '10px 14px' }}>
                    <div style={{ fontWeight: 500, color: '#E2E8F0' }}>{v.propietario}</div>
                    <div style={{ fontSize: '10px', color: '#64748B' }}>C.C. {v.cedula}</div>
                  </td>
                  <td style={{ padding: '10px 14px' }}>
                    <span style={{ fontSize: '10px', fontWeight: 600, padding: '2px 8px', borderRadius: '999px', backgroundColor: `${CIUDAD_COLOR[v.ciudad] ?? '#00B4D8'}18`, color: CIUDAD_COLOR[v.ciudad] ?? '#00B4D8' }}>
                      {v.ciudad}
                    </span>
                  </td>
                  <td style={{ padding: '10px 14px' }}>
                    <div style={{ color: '#94A3B8' }}>{v.fechaAvistamiento}</div>
                    <div style={{ fontSize: '10px', color: '#64748B' }}>{v.horaAvistamiento} · {v.zona}</div>
                  </td>
                  <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 24, height: 24, borderRadius: '50%', backgroundColor: 'rgba(245,158,11,0.12)', color: '#F59E0B', fontWeight: 700, fontSize: '11px', border: '1px solid rgba(245,158,11,0.25)' }}>
                      {v.comparendos.length}
                    </span>
                  </td>
                  <td style={{ padding: '10px 14px', textAlign: 'right', fontFamily: 'monospace', fontWeight: 700, color: '#EF4444' }}>
                    {formatCOP(totalDeuda(v))}
                  </td>
                  <td style={{ padding: '10px 14px', textAlign: 'center', fontWeight: 600, color: v.diasMora > 600 ? '#EF4444' : v.diasMora > 365 ? '#F59E0B' : '#94A3B8' }}>
                    {v.diasMora}d
                  </td>
                  <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                    <span style={{ fontSize: '10px', fontWeight: 600, padding: '2px 8px', borderRadius: '999px', backgroundColor: `${ESTADO_COLOR[v.estadoGestion]}18`, color: ESTADO_COLOR[v.estadoGestion], border: `1px solid ${ESTADO_COLOR[v.estadoGestion]}33` }}>
                      {v.estadoGestion}
                    </span>
                  </td>
                  <td style={{ padding: '10px 14px', textAlign: 'center', color: '#64748B', fontSize: '10px' }}>
                    {expandido === v.id ? '▲' : '▼'}
                  </td>
                </tr>

                {expandido === v.id && (
                  <tr key={v.id + '-det'}>
                    <td colSpan={9} style={{ padding: '16px 20px', backgroundColor: 'rgba(0,180,216,0.04)', borderBottom: '1px solid #1E3A55' }}>
                      <p style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#00B4D8', marginBottom: 10 }}>
                        Detalle de comparendos — {v.propietario}
                      </p>
                      <table style={{ width: '100%', fontSize: '11px', borderCollapse: 'collapse', borderRadius: 8, overflow: 'hidden' }}>
                        <thead>
                          <tr style={{ backgroundColor: '#0D1B2A', borderBottom: '1px solid #1E3A55' }}>
                            {['Código','Infracción','Fecha','Municipio acreedor','Valor'].map(h => (
                              <th key={h} style={{ padding: '8px 12px', textAlign: h === 'Valor' ? 'right' : 'left', fontSize: '9px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748B' }}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {v.comparendos.map((c, i) => (
                            <tr key={i} style={{ borderBottom: '1px solid #1E3A55', backgroundColor: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)' }}>
                              <td style={{ padding: '7px 12px', fontFamily: 'monospace', fontWeight: 700, color: '#00B4D8' }}>{c.codigo}</td>
                              <td style={{ padding: '7px 12px', color: '#94A3B8' }}>{c.descripcion}</td>
                              <td style={{ padding: '7px 12px', color: '#64748B' }}>{c.fecha}</td>
                              <td style={{ padding: '7px 12px' }}>
                                <span style={{ fontSize: '10px', fontWeight: 600, padding: '1px 7px', borderRadius: '999px', backgroundColor: `${CIUDAD_COLOR[c.municipioAcreedor] ?? '#00B4D8'}18`, color: CIUDAD_COLOR[c.municipioAcreedor] ?? '#00B4D8' }}>
                                  {c.municipioAcreedor}
                                </span>
                              </td>
                              <td style={{ padding: '7px 12px', textAlign: 'right', fontFamily: 'monospace', fontWeight: 700, color: '#EF4444' }}>{formatCOP(c.valor)}</td>
                            </tr>
                          ))}
                          <tr style={{ backgroundColor: '#0D1B2A' }}>
                            <td colSpan={4} style={{ padding: '8px 12px', fontWeight: 700, color: '#94A3B8', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total deuda</td>
                            <td style={{ padding: '8px 12px', textAlign: 'right', fontFamily: 'monospace', fontWeight: 700, color: '#EF4444' }}>{formatCOP(totalDeuda(v))}</td>
                          </tr>
                        </tbody>
                      </table>
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      </div>

      <p style={{ fontSize: '10px', color: '#64748B', textAlign: 'center' }}>
        Datos generados por escaneo DHNa3 · Localización georreferenciada en tiempo real · Fuente: SIMIT – Federación Colombiana de Municipios
      </p>
    </div>
  )
}