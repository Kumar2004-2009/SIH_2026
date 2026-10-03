import React from 'react';

const SEVERITY_STYLES = {
  critical: 'bg-rose-950/50 text-rose-300 border-rose-800/60',
  high: 'bg-amber-950/50 text-amber-300 border-amber-800/60',
  medium: 'bg-yellow-950/40 text-yellow-300 border-yellow-800/50',
  low: 'bg-blue-950/40 text-blue-300 border-blue-800/50',
  info: 'bg-slate-800/60 text-slate-300 border-slate-700/60'
};

const DOT_COLORS = {
  critical: 'bg-rose-400',
  high: 'bg-amber-400',
  medium: 'bg-yellow-400',
  low: 'bg-blue-400',
  info: 'bg-slate-400'
};

export default function SeverityBadge({ severity, className = '' }) {
  const norm = (severity || 'info').toLowerCase();
  const style = SEVERITY_STYLES[norm] || SEVERITY_STYLES.info;
  const dotColor = DOT_COLORS[norm] || DOT_COLORS.info;

  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono font-semibold uppercase tracking-wider border ${style} ${className}`}>
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotColor}`} />
      <span>{severity}</span>
    </span>
  );
}
