import React from 'react';

export default function MetricsCard({ title, value, subtitle, icon: Icon, trend, color = 'cyan' }) {
  const colorMap = {
    cyan: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
    rose: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
    amber: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    emerald: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    indigo: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
  };

  const accent = colorMap[color] || colorMap.cyan;

  return (
    <div className="bg-[#0f1523] border border-slate-800 rounded-lg p-4 hover:border-slate-700 transition-colors shadow-subtle">
      <div className="flex items-center justify-between mb-2.5">
        <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider font-mono">
          {title}
        </span>
        {Icon && (
          <div className={`p-1.5 rounded border ${accent}`}>
            <Icon className="w-3.5 h-3.5" />
          </div>
        )}
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-bold font-mono tracking-tight text-slate-100">
          {value}
        </span>
        {trend && (
          <span className={`text-xs font-mono font-semibold ${trend > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
            {trend > 0 ? `+${trend}` : trend}
          </span>
        )}
      </div>
      {subtitle && <p className="mt-1.5 text-xs text-slate-400 font-sans">{subtitle}</p>}
    </div>
  );
}
