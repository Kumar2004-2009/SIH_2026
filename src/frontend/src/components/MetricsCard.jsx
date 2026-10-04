import React from 'react';

// Stat tile — a minimal labeled number, no icon-in-circle, no glow
export default function MetricsCard({ title, value, subtitle, trend }) {
  return (
    <div className="stat-tile">
      <div className="section-label mb-2">{title}</div>
      <div className="flex items-baseline gap-2">
        <span className="text-[28px] font-bold font-mono leading-none text-[var(--text-primary)] tracking-tight">
          {value}
        </span>
        {trend != null && (
          <span className={`text-xs font-mono font-semibold ${trend > 0 ? 'text-[#e54d2e]' : 'text-[#5b9e6e]'}`}>
            {trend > 0 ? `+${trend}` : trend}
          </span>
        )}
      </div>
      {subtitle && (
        <p className="mt-1 text-[12px] text-[var(--text-muted)]">{subtitle}</p>
      )}
    </div>
  );
}
