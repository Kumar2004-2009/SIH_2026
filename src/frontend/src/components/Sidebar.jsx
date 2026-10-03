import React from 'react';
import {
  LayoutDashboard,
  FileCode2,
  FileCheck2,
  AlertTriangle,
  Network,
  ShieldCheck,
  Wrench,
  GitCompare,
  FileText
} from 'lucide-react';

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, badge: null },
  { id: 'audit', label: 'Configuration Audit', icon: FileCode2, badge: 'Pipeline' },
  { id: 'compliance', label: 'Compliance Explorer', icon: FileCheck2, badge: 'CIS/NIST' },
  { id: 'findings', label: 'Findings & Evidence', icon: AlertTriangle, badge: 'Active' },
  { id: 'graph', label: 'Security Graph', icon: Network, badge: 'Attack Paths' },
  { id: 'risk', label: 'Risk Analysis', icon: ShieldCheck, badge: null },
  { id: 'remediation', label: 'Remediation Simulator', icon: Wrench, badge: 'Safe Fix' },
  { id: 'drift', label: 'Configuration Drift', icon: GitCompare, badge: null },
  { id: 'reports', label: 'Audit Reports', icon: FileText, badge: 'Export' },
];

export default function Sidebar({ activeTab, setActiveTab }) {
  return (
    <aside className="w-60 border-r border-slate-800 bg-[#0b0f19] flex flex-col justify-between p-3 shrink-0 h-[calc(100vh-3.5rem)] sticky top-14 select-none">
      {/* Navigation Links */}
      <div className="space-y-1">
        <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500 font-mono">
          Security Operations
        </div>

        <nav className="space-y-0.5">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-xs font-medium transition-colors group cursor-pointer ${
                  isActive
                    ? 'bg-slate-800 text-slate-100 font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/80'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Icon
                    className={`w-4 h-4 shrink-0 transition-colors ${
                      isActive ? 'text-blue-400' : 'text-slate-400 group-hover:text-slate-300'
                    }`}
                  />
                  <span className="truncate">{item.label}</span>
                </div>

                {item.badge && (
                  <span
                    className={`text-[9px] font-mono px-1.5 py-0.5 rounded shrink-0 ${
                      isActive
                        ? 'bg-blue-950/80 text-blue-300 border border-blue-800/60'
                        : 'bg-slate-900 text-slate-400 border border-slate-800'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Multi-Vendor Compatibility Footer */}
      <div className="border border-slate-800/90 bg-slate-900/50 rounded-md p-3 mt-3">
        <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider font-mono mb-2 flex items-center justify-between">
          <span>Supported Fabrics</span>
          <span className="text-slate-500 text-[9px]">v1.0.0</span>
        </div>
        <div className="flex flex-wrap gap-1 text-[10px] font-mono text-slate-400">
          <span className="px-1.5 py-0.5 rounded bg-slate-800/80 border border-slate-700/50">Cisco IOS</span>
          <span className="px-1.5 py-0.5 rounded bg-slate-800/80 border border-slate-700/50">JunOS</span>
          <span className="px-1.5 py-0.5 rounded bg-slate-800/80 border border-slate-700/50">FortiOS</span>
          <span className="px-1.5 py-0.5 rounded bg-slate-800/80 border border-slate-700/50">PAN-OS</span>
          <span className="px-1.5 py-0.5 rounded bg-slate-800/80 border border-slate-700/50">Arista</span>
          <span className="px-1.5 py-0.5 rounded bg-slate-800/80 border border-slate-700/50">SONiC</span>
        </div>
      </div>
    </aside>
  );
}
