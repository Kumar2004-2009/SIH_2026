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
  FileText,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

const NAV_ITEMS = [
  { id: 'dashboard',   label: 'Dashboard',            icon: LayoutDashboard },
  { id: 'audit',       label: 'Config Audit',          icon: FileCode2       },
  { id: 'compliance',  label: 'Compliance Explorer',   icon: FileCheck2      },
  { id: 'findings',    label: 'Findings',              icon: AlertTriangle   },
  { id: 'graph',       label: 'Security Graph',        icon: Network         },
  { id: 'risk',        label: 'Risk Analysis',         icon: ShieldCheck     },
  { id: 'remediation', label: 'Remediation Simulator', icon: Wrench          },
  { id: 'drift',       label: 'Config Drift',          icon: GitCompare      },
  { id: 'reports',     label: 'Audit Reports',         icon: FileText        },
];

const VENDORS = ['Cisco IOS', 'Juniper JunOS', 'Fortinet FortiOS', 'Palo Alto PAN-OS', 'Arista EOS', 'SONiC'];

export default function Sidebar({ activeTab, setActiveTab, collapsed, onToggle }) {
  const width = collapsed ? 44 : 224; // px values: w-11 vs w-56

  return (
    <aside
      className="border-r border-[var(--border)] bg-[var(--bg-raised)] flex flex-col shrink-0 overflow-hidden"
      style={{
        width,
        minWidth: width,
        height: 'calc(100vh - 44px)',
        transition: 'width 150ms ease, min-width 150ms ease',
      }}
      role="navigation"
      aria-label="Primary navigation"
    >
      {/* Toggle button at the top */}
      <div className="flex items-center justify-end px-2 py-1.5 border-b border-[var(--border)]">
        <button
          onClick={onToggle}
          className="btn btn-ghost p-1.5 rounded-sm"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed
            ? <ChevronRight className="w-3.5 h-3.5 text-[var(--text-muted)]" aria-hidden="true" />
            : <ChevronLeft  className="w-3.5 h-3.5 text-[var(--text-muted)]" aria-hidden="true" />}
        </button>
      </div>

      {/* Nav items */}
      <div className="flex-1 py-2 overflow-y-auto overflow-x-hidden">
        {!collapsed && (
          <div className="px-3 mb-1 section-label">Modules</div>
        )}
        <nav>
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                id={`nav-${item.id}`}
                onClick={() => setActiveTab(item.id)}
                title={collapsed ? item.label : undefined}
                className={[
                  'w-full flex items-center gap-2.5 py-1.5 text-[12px] font-medium transition-colors',
                  collapsed ? 'justify-center px-2' : 'px-3',
                  active
                    ? 'bg-[var(--bg-overlay)] text-[var(--text-primary)] border-l-2 border-[var(--accent)]'
                    : 'text-[var(--text-secondary)] hover:bg-[var(--bg-overlay)] hover:text-[var(--text-primary)] border-l-2 border-transparent',
                ].join(' ')}
                style={collapsed ? { paddingLeft: active ? 9 : 11 } : {}}
              >
                <Icon
                  className="w-3.5 h-3.5 shrink-0"
                  style={{ color: active ? 'var(--accent-text)' : undefined }}
                  aria-hidden="true"
                />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer — only shown when expanded */}
      {!collapsed && (
        <div className="border-t border-[var(--border)] p-3">
          <div className="section-label mb-2">Supported vendors</div>
          <div className="flex flex-wrap gap-1">
            {VENDORS.map((v) => (
              <span
                key={v}
                className="text-[10px] font-mono text-[var(--text-muted)] border border-[var(--border)] px-1.5 py-0.5 rounded-sm bg-[var(--bg-base)]"
              >
                {v}
              </span>
            ))}
          </div>
          <p className="text-[10px] font-mono text-[var(--text-muted)] mt-2">v1.0.0</p>
        </div>
      )}
    </aside>
  );
}
