'use client';
import { SectionHeader } from '@/components/shared/SectionHeader';
export default function Page() {
  return (
    <div>
      <SectionHeader title="Vehicles" subtitle="En construcción — disponible en próxima entrega" />
      <div className="rounded-xl p-8 text-center" style={{ backgroundColor: '#112236', border: '1px solid #1E3A55' }}>
        <p className="font-orbitron text-sm" style={{ color: '#64748B' }}>Módulo Vehicles</p>
      </div>
    </div>
  );
}
