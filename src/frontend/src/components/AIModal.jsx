import React from 'react';
import { X, Brain } from 'lucide-react';

// AI explanation modal — plain dialog, no glassmorphism or glow
export default function AIModal({ isOpen, onClose, data, loading }) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="panel w-full max-w-2xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
          <div>
            <div className="flex items-center gap-2">
              <Brain className="w-4 h-4 text-[var(--accent-text)]" aria-hidden="true" />
              <span className="text-[13px] font-semibold text-[var(--text-primary)]">
                Control analysis
              </span>
              <span className="text-[10px] font-mono text-[var(--text-muted)] border border-[var(--border)] px-1.5 py-0.5 rounded-sm">
                {data?.source || 'Deterministic engine'}
              </span>
            </div>
            {data?.title && (
              <p className="text-[11px] text-[var(--text-muted)] mt-0.5 truncate max-w-lg font-mono">
                {data.title}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="btn btn-ghost p-1.5"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 overflow-y-auto flex-1">
          {loading ? (
            <div className="space-y-2 py-4">
              <div className="skeleton h-3 w-full" />
              <div className="skeleton h-3 w-5/6" />
              <div className="skeleton h-3 w-4/6" />
              <div className="skeleton h-3 w-full mt-4" />
              <div className="skeleton h-3 w-3/4" />
            </div>
          ) : (
            <div className="code-block whitespace-pre-wrap">
              {data?.explanation || 'No explanation available.'}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-2.5 border-t border-[var(--border)]">
          <span className="text-[11px] text-[var(--text-muted)] font-mono">NTRO / NETRA deterministic engine</span>
          <button onClick={onClose} className="btn btn-secondary">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
