import React, { useState, useEffect } from 'react';
import { Shield, Cpu, Activity, Zap } from 'lucide-react';
import { api } from '../api/client';

export default function Navbar({ onQuickAuditClick }) {
  const [health, setHealth] = useState({ status: 'checking', ai_enabled: false });
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const check = async () => {
      try {
        const res = await api.getHealth();
        setHealth(res);
      } catch {
        setHealth({ status: 'offline', ai_enabled: false });
      }
    };
    check();

    const tick = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(tick);
  }, []);

  const utc = time.toISOString().slice(11, 19);

  return (
    <header
      className="h-11 border-b border-[var(--border)] bg-[var(--bg-raised)] px-4 flex items-center justify-between sticky top-0 z-30 select-none shrink-0"
      role="banner"
    >
      {/* Brand */}
      <div className="flex items-center gap-3">
        <Shield className="w-4 h-4 text-[var(--accent-text)] shrink-0" aria-hidden="true" />
        <div className="flex items-center gap-2">
          <span className="cursor-pointer font-mono text-[13px] font-bold tracking-widest text-[var(--text-primary)] uppercase"
            onClick={() => { window.location.href = "/"; }}>
            NETRA
          </span>
          <span className="h-3 w-px bg-[var(--border)]" />
          <span className="text-[11px] font-mono text-[var(--text-muted)] hidden sm:inline">
            Network Security Auditor
          </span>
        </div>
      </div>

      {/* Status strip */}
      <div className="flex items-center gap-2">
        {/* UTC clock */}
        <div className="hidden lg:flex items-center gap-1.5 text-[11px] font-mono text-[var(--text-muted)] border border-[var(--border)] px-2 py-1 rounded-sm bg-[var(--bg-base)]">
          <Activity className="w-3 h-3" aria-hidden="true" />
          <span>{utc} UTC</span>
        </div>

        {/* Engine indicator */}
        <div className="hidden sm:flex items-center gap-1.5 text-[11px] font-mono text-[var(--text-muted)] border border-[var(--border)] px-2 py-1 rounded-sm bg-[var(--bg-base)]">
          <Zap className="w-3 h-3" aria-hidden="true" />
          <span>{health.ai_enabled ? 'Gemini 1.5' : 'Deterministic'}</span>
        </div>

        {/* Backend status */}
        <div className="flex items-center gap-1.5 text-[11px] font-mono text-[var(--text-muted)] border border-[var(--border)] px-2 py-1 rounded-sm bg-[var(--bg-base)]">
          <span
            className={`status-dot ${health.status === 'healthy' ? 'dot-online' : health.status === 'checking' ? 'dot-warn' : 'dot-offline'}`}
            aria-label={health.status}
          />
          <span className="capitalize">{health.status === 'healthy' ? 'Online' : health.status}</span>
        </div>

        {/* Action */}
        <button
          id="nav-audit-btn"
          onClick={onQuickAuditClick}
          className="btn btn-primary"
        >
          <Cpu className="w-3.5 h-3.5" aria-hidden="true" />
          <span>Audit</span>
        </button>
      </div>
    </header>
  );
}
