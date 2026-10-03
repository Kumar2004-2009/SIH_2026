import React, { useState, useEffect } from 'react';
import { ShieldCheck, Cpu, Sparkles, Activity, RefreshCw } from 'lucide-react';
import { api } from '../api/client';

export default function Navbar({ onQuickAuditClick }) {
  const [health, setHealth] = useState({ status: 'checking', ai_enabled: false });
  const [time, setTime] = useState(new Date().toUTCString());

  useEffect(() => {
    const check = async () => {
      try {
        const res = await api.getHealth();
        setHealth(res);
      } catch (e) {
        setHealth({ status: 'offline', ai_enabled: false });
      }
    };
    check();
    const interval = setInterval(() => {
      setTime(new Date().toUTCString());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="h-14 border-b border-slate-800 bg-[#0b0f19] px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 select-none">
      {/* Brand Identity */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-md bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400 shadow-sm">
          <ShieldCheck className="w-4 h-4" />
        </div>
        <div className="flex items-center gap-2.5">
          <span className="font-bold text-sm tracking-wider text-slate-100 font-mono">NETRA</span>
          <span className="h-3.5 w-px bg-slate-800 hidden sm:block" />
          <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-slate-800/90 text-slate-300 border border-slate-700/70">
            NTRO • SIH26155
          </span>
          <span className="text-xs text-slate-400 hidden xl:inline-block font-normal ml-1">
            Network Security Compliance Auditor
          </span>
        </div>
      </div>

      {/* Operational Status & Action */}
      <div className="flex items-center gap-2.5 sm:gap-3">
        {/* UTC Clock */}
        <div className="hidden lg:flex items-center gap-1.5 text-xs font-mono text-slate-400 bg-slate-900/90 border border-slate-800 px-2.5 py-1 rounded-md">
          <Activity className="w-3 h-3 text-blue-400" />
          <span>{time.slice(17, 25)} UTC</span>
        </div>

        {/* AI Engine Status */}
        <div className="hidden sm:flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-md border border-slate-800 bg-slate-900/90">
          <Sparkles className={`w-3 h-3 ${health.ai_enabled ? 'text-blue-400' : 'text-slate-500'}`} />
          <span className="text-slate-300 text-[11px] font-medium font-mono">
            {health.ai_enabled ? 'Gemini 1.5' : 'Deterministic Engine'}
          </span>
        </div>

        {/* Backend Connectivity Status */}
        <div className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-md border border-slate-800 bg-slate-900/90">
          <span className={`w-1.5 h-1.5 rounded-full ${health.status === 'healthy' ? 'bg-emerald-400 ring-2 ring-emerald-500/20' : 'bg-amber-400'}`} />
          <span className="text-slate-300 text-[11px] font-mono capitalize">
            {health.status === 'healthy' ? 'Online' : health.status}
          </span>
        </div>

        {/* Quick Action Button */}
        <button
          onClick={onQuickAuditClick}
          className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white text-xs font-medium px-3 py-1.5 rounded-md shadow-sm transition-colors cursor-pointer"
        >
          <Cpu className="w-3.5 h-3.5" />
          <span>Audit Config</span>
        </button>
      </div>
    </header>
  );
}
