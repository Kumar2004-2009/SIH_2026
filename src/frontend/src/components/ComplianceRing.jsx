import React from 'react';

// SVG ring showing compliance percentage — no gradient fill, single color
export default function ComplianceRing({ score = 0, size = 110, strokeWidth = 7 }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const normalized = Math.min(Math.max(score, 0), 100);
  const offset = circumference - (normalized / 100) * circumference;

  const color =
    normalized >= 80 ? '#5b9e6e' :
    normalized >= 60 ? '#4ecdc4' :
    normalized >= 45 ? '#c4a030' :
    '#e54d2e';

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="transform -rotate-90" aria-hidden="true">
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          stroke="#2a2a2d" strokeWidth={strokeWidth} fill="none"
        />
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          stroke={color} strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="butt"
          fill="none"
          style={{ transition: 'stroke-dashoffset 400ms ease' }}
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center text-center">
        <span className="text-[20px] font-bold font-mono leading-none text-[var(--text-primary)]">
          {normalized.toFixed(0)}%
        </span>
        <span className="text-[10px] text-[var(--text-muted)] mt-0.5">compliant</span>
      </div>
    </div>
  );
}
