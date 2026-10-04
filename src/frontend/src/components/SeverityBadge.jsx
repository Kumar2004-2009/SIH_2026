import React from 'react';

const BADGE_CLASS = {
  critical: 'badge badge-critical',
  high:     'badge badge-high',
  medium:   'badge badge-medium',
  low:      'badge badge-low',
  info:     'badge badge-info',
};

const DOT_CLASS = {
  critical: 'bg-[#e54d2e]',
  high:     'bg-[#e0813a]',
  medium:   'bg-[#c4a030]',
  low:      'bg-[#5b9e6e]',
  info:     'bg-[#6b6b68]',
};

export default function SeverityBadge({ severity, className = '' }) {
  const norm = (severity || 'info').toLowerCase();
  const cls = BADGE_CLASS[norm] || BADGE_CLASS.info;
  const dot = DOT_CLASS[norm] || DOT_CLASS.info;

  return (
    <span className={`${cls} ${className}`}>
      <span className={`status-dot ${dot}`} />
      {severity}
    </span>
  );
}
