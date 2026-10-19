'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Column<T> {
  key: keyof T | string;
  label: string;
  render?: (row: T) => React.ReactNode;
  width?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  pageSize?: number;
  searchable?: boolean;
  searchKeys?: (keyof T)[];
}

export function DataTable<T extends Record<string, unknown>>({
  columns,
  data,
  pageSize = 10,
  searchable = false,
  searchKeys = [],
}: DataTableProps<T>) {
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');

  const filtered = searchable && search
    ? data.filter(row =>
        searchKeys.some(k =>
          String(row[k] ?? '').toLowerCase().includes(search.toLowerCase())
        )
      )
    : data;

  const totalPages = Math.ceil(filtered.length / pageSize);
  const paged = filtered.slice(page * pageSize, (page + 1) * pageSize);

  return (
    <div className="flex flex-col gap-3">
      {searchable && (
        <input
          type="text"
          placeholder="Buscar..."
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(0); }}
          className="px-3 py-2 text-sm rounded-lg w-64 outline-none"
          style={{
            backgroundColor: '#0A1628',
            border: '1px solid #1E3A55',
            color: '#E2E8F0',
          }}
        />
      )}
      <div className="rounded-xl overflow-hidden" style={{ border: '1px solid #1E3A55' }}>
        <table className="w-full text-xs">
          <thead>
            <tr style={{ backgroundColor: '#0A1628', borderBottom: '1px solid #1E3A55' }}>
              {columns.map(col => (
                <th
                  key={String(col.key)}
                  className="px-4 py-3 text-left font-medium font-orbitron tracking-wide"
                  style={{ color: '#64748B', width: col.width }}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paged.map((row, ri) => (
              <tr
                key={ri}
                className="transition-colors hover:bg-white/[0.02]"
                style={{
                  borderBottom: ri < paged.length - 1 ? '1px solid #1E3A55' : 'none',
                  backgroundColor: ri % 2 === 0 ? 'rgba(17,34,54,0.5)' : 'transparent',
                }}
              >
                {columns.map(col => (
                  <td key={String(col.key)} className="px-4 py-3" style={{ color: '#CBD5E1' }}>
                    {col.render
                      ? col.render(row)
                      : String(row[col.key as keyof T] ?? '')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-1">
          <p className="text-[10px]" style={{ color: '#64748B' }}>
            {filtered.length} registros · Página {page + 1} de {totalPages}
          </p>
          <div className="flex gap-1">
            <button
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
              className="p-1 rounded hover:bg-white/5 disabled:opacity-30"
              style={{ color: '#64748B' }}
            >
              <ChevronLeft size={14} />
            </button>
            <button
              onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
              disabled={page === totalPages - 1}
              className="p-1 rounded hover:bg-white/5 disabled:opacity-30"
              style={{ color: '#64748B' }}
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
