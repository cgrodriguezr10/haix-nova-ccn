'use client';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export function SectionHeader({ title, subtitle, actions }: SectionHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-6">
      <div>
        <h1 className="font-orbitron font-bold text-xl" style={{ color: '#E2E8F0' }}>
          {title}
        </h1>
        {subtitle && (
          <p className="text-xs mt-1" style={{ color: '#64748B' }}>{subtitle}</p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
