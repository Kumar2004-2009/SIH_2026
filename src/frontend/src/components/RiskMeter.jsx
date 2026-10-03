import React from 'react';

export default function RiskMeter({ score = 0, max = 10, size = 'md' }) {
  const normalized = Math.min(Math.max(score, 0), max);
  const percentage = (normalized / max) * 100;

  const getColorConfig = () => {
    if (normalized >= 7.5) {
      return { bar: 'bg-rose-500', text: 'text-rose-400', badge: 'bg-rose-950/60 text-rose-300 border-rose-800/60', label: 'Critical' };
    }
    if (normalized >= 5.0) {
      return { bar: 'bg-amber-500', text: 'text-amber-400', badge: 'bg-amber-950/60 text-amber-300 border-amber-800/60', label: 'High' };
    }
    if (normalized >= 2.5) {
      return { bar: 'bg-yellow-400', text: 'text-yellow-300', badge: 'bg-yellow-950/50 text-yellow-300 border-yellow-800/50', label: 'Elevated' };
    }
    return { bar: 'bg-emerald-500', text: 'text-emerald-400', badge: 'bg-emerald-950/50 text-emerald-300 border-emerald-800/50', label: 'Nominal' };
  };

  const config = getColorConfig();

  return (
    <div className="flex flex-col gap-1.5 w-full">
      <div className="flex justify-between items-center text-xs">
        <span className="font-medium text-slate-400 font-mono uppercase tracking-wider text-[11px]">
          Risk Index
        </span>
        <div className="flex items-center gap-1.5 font-mono">
          <span className="font-bold text-slate-200">
            {normalized.toFixed(1)} <span className="text-slate-500 text-[10px]">/ {max}</span>
          </span>
          <span className={`text-[9px] uppercase font-semibold px-1.5 py-0.2 rounded border ${config.badge}`}>
            {config.label}
          </span>
        </div>
      </div>
      <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${config.bar} transition-all duration-300`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
