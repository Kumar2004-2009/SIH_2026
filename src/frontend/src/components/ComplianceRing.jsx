import React from 'react';

export default function ComplianceRing({ score = 0, size = 110, strokeWidth = 8 }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const normalized = Math.min(Math.max(score, 0), 100);
  const offset = circumference - (normalized / 100) * circumference;

  const getColor = () => {
    if (normalized >= 85) return '#10b981'; // emerald
    if (normalized >= 65) return '#3b82f6'; // blue
    if (normalized >= 50) return '#f59e0b'; // amber
    return '#f43f5e'; // rose
  };

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#1e293b"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={getColor()}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          fill="transparent"
          style={{ transition: 'stroke-dashoffset 0.6s ease-out' }}
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center text-center">
        <span className="text-xl font-bold font-mono tracking-tight text-slate-100">
          {normalized.toFixed(0)}%
        </span>
        <span className="text-[9px] uppercase tracking-wider text-slate-400 font-semibold font-mono">
          Compliant
        </span>
      </div>
    </div>
  );
}
