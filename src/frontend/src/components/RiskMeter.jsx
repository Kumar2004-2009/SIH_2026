import React from 'react';

// Horizontal risk bar — no rounded pill track, no glow
export default function RiskMeter({ score = 0, max = 10 }) {
  const normalized = Math.min(Math.max(score, 0), max);
  const pct = (normalized / max) * 100;

  const color =
    normalized >= 7.5 ? '#e54d2e' :
    normalized >= 5.0 ? '#e0813a' :
    normalized >= 2.5 ? '#c4a030' :
    '#5b9e6e';

  const label =
    normalized >= 7.5 ? 'Critical' :
    normalized >= 5.0 ? 'High' :
    normalized >= 2.5 ? 'Elevated' :
    'Low';

  return (
    <div className="w-full space-y-1.5">
      <div className="flex justify-between items-center">
        <span className="section-label">Risk index</span>
        <span className="font-mono text-[12px] font-semibold" style={{ color }}>
          {normalized.toFixed(1)}<span className="text-[var(--text-muted)] font-normal">/{max}</span>
          {' '}<span className="text-[10px] uppercase">{label}</span>
        </span>
      </div>
      <div className="progress-track">
        <div className="progress-fill" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}
