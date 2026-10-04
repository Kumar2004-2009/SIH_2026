import React, { useState, useEffect } from 'react';
import { RefreshCw, ChevronRight, Server, AlertTriangle } from 'lucide-react';
import { api } from '../api/client';
import MetricsCard from '../components/MetricsCard';
import SeverityBadge from '../components/SeverityBadge';
import RiskMeter from '../components/RiskMeter';
import ComplianceRing from '../components/ComplianceRing';

const FALLBACK = {
  total_devices: 6,
  total_audits: 6,
  total_findings: 26,
  critical_count: 6,
  high_count: 9,
  medium_count: 8,
  low_count: 3,
  overall_compliance_score: 68.5,
  overall_risk_score: 7.2,
  vendor_breakdown: {
    cisco_ios: 2, juniper_junos: 1,
    fortinet_fortios: 1, palo_alto: 1, arista_eos: 1,
  },
  top_risky_devices: [],
  recent_findings: [],
  recent_audits: [],
  framework_compliance: {
    CIS: 64.2, NIST: 71.7, STIG: 57.3, ISO27001: 78.1, 'PCI-DSS': 69.4,
  },
};

function SkeletonRow() {
  return (
    <div className="py-3 border-b border-[var(--border)] flex items-center justify-between">
      <div className="space-y-1.5 flex-1">
        <div className="skeleton h-3 w-2/5" />
        <div className="skeleton h-2.5 w-1/3" />
      </div>
      <div className="skeleton h-3 w-14 ml-4" />
    </div>
  );
}

export default function Dashboard({ setActiveTab }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastSync, setLastSync] = useState(null);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const data = await api.getDashboardStats();
      setStats(data);
      setLastSync(new Date());
    } catch {
      // use fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStats(); }, []);

  const s = stats || FALLBACK;

  return (
    <div className="space-y-4 pb-10">
      {/* Page header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-[20px] font-bold text-[var(--text-primary)] tracking-tight">
            Security Posture Overview
          </h1>
          <p className="text-[12px] text-[var(--text-muted)] mt-0.5">
            NTRO — {s.total_devices} audited devices · {s.total_findings} active violations
            {lastSync && (
              <span className="ml-2 font-mono">
                · synced {lastSync.toLocaleTimeString()}
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={fetchStats}
            className="btn btn-secondary"
            title="Refresh"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} aria-hidden="true" />
            <span>Sync</span>
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className="btn btn-primary"
          >
            <span>Run audit</span>
            <ChevronRight className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* KPI stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MetricsCard
          title="Monitored devices"
          value={loading ? '—' : s.total_devices}
          subtitle="6 vendors"
        />
        <MetricsCard
          title="Active violations"
          value={loading ? '—' : s.total_findings}
          subtitle={`${s.critical_count} critical · ${s.high_count} high`}
        />
        <MetricsCard
          title="Audits completed"
          value={loading ? '—' : s.total_audits}
          subtitle="Deterministic engine"
        />
        <MetricsCard
          title="Mean risk index"
          value={loading ? '—' : `${s.overall_risk_score}/10`}
          subtitle="Weighted attack surface"
        />
      </div>

      {/* Posture + severity + frameworks */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* Compliance ring + risk bar */}
        <div className="panel p-4 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <span className="section-label">Overall compliance</span>
            <span className="text-[10px] font-mono text-[var(--text-muted)]">aggregated</span>
          </div>
          {loading ? (
            <div className="flex justify-center py-4">
              <div className="skeleton" style={{ width: 110, height: 110, borderRadius: '50%' }} />
            </div>
          ) : (
            <div className="flex justify-center">
              <ComplianceRing score={s.overall_compliance_score} size={120} />
            </div>
          )}
          <RiskMeter score={s.overall_risk_score} />
        </div>

        {/* Severity breakdown */}
        <div className="panel p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="section-label">Violations by severity</span>
            <button
              onClick={() => setActiveTab('findings')}
              className="text-[11px] text-[var(--accent-text)] hover:underline font-mono"
            >
              View all →
            </button>
          </div>
          <div className="space-y-3 flex-1">
            {[
              { label: 'Critical', count: s.critical_count, color: '#e54d2e' },
              { label: 'High',     count: s.high_count,     color: '#e0813a' },
              { label: 'Medium',   count: s.medium_count,   color: '#c4a030' },
              { label: 'Low',      count: s.low_count,      color: '#5b9e6e' },
            ].map(({ label, count, color }) => {
              const total = s.total_findings || 1;
              return (
                <div key={label}>
                  <div className="flex justify-between text-[12px] font-mono mb-1">
                    <span className="text-[var(--text-secondary)]">{label}</span>
                    <span style={{ color }} className="font-semibold">{loading ? '—' : count}</span>
                  </div>
                  <div className="progress-track">
                    <div
                      className="progress-fill"
                      style={{
                        width: loading ? '0%' : `${Math.round((count / total) * 100)}%`,
                        backgroundColor: color,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
          <div className="pt-2 border-t border-[var(--border)] text-[11px] font-mono text-[var(--text-muted)] flex justify-between">
            <span>Priority actions</span>
            <span style={{ color: '#e54d2e' }} className="font-semibold">
              {loading ? '—' : s.critical_count + s.high_count}
            </span>
          </div>
        </div>

        {/* Framework baselines */}
        <div className="panel p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="section-label">Framework baselines</span>
            <button
              onClick={() => setActiveTab('compliance')}
              className="text-[11px] text-[var(--accent-text)] hover:underline font-mono"
            >
              Explore →
            </button>
          </div>
          <div className="space-y-3 flex-1">
            {Object.entries(s.framework_compliance || {}).map(([fw, val]) => {
              const color = val >= 75 ? '#5b9e6e' : val >= 60 ? '#4ecdc4' : '#c4a030';
              return (
                <div key={fw}>
                  <div className="flex justify-between text-[12px] font-mono mb-1">
                    <span className="text-[var(--text-secondary)] font-semibold">{fw}</span>
                    <span style={{ color }} className="font-semibold">
                      {loading ? '—' : `${val}%`}
                    </span>
                  </div>
                  <div className="progress-track">
                    <div
                      className="progress-fill"
                      style={{ width: loading ? '0%' : `${val}%`, backgroundColor: color }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
          <div className="pt-2 border-t border-[var(--border)] text-[10px] text-[var(--text-muted)]">
            Per NTRO National Critical Infrastructure Policy
          </div>
        </div>
      </div>

      {/* Risky devices + recent findings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* Top risky devices */}
        <div className="panel p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Server className="w-3.5 h-3.5 text-[var(--text-muted)]" aria-hidden="true" />
              <span className="text-[13px] font-semibold text-[var(--text-primary)]">Highest-risk devices</span>
            </div>
            <button
              onClick={() => setActiveTab('risk')}
              className="text-[11px] text-[var(--accent-text)] hover:underline font-mono"
            >
              Full matrix →
            </button>
          </div>

          {loading ? (
            <div className="divide-y divide-[var(--border)]">
              {[...Array(4)].map((_, i) => <SkeletonRow key={i} />)}
            </div>
          ) : (s.top_risky_devices || []).length === 0 ? (
            <div className="py-8 text-center text-[12px] text-[var(--text-muted)] font-mono">
              Run an audit to populate the risk matrix.
            </div>
          ) : (
            <div className="divide-y divide-[var(--border)]">
              {(s.top_risky_devices || []).slice(0, 5).map((dev) => (
                <div key={dev.device_id} className="py-2.5 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[12px] font-mono font-semibold text-[var(--text-primary)] truncate">
                        {dev.hostname}
                      </span>
                      <span className="text-[10px] font-mono text-[var(--text-muted)] border border-[var(--border)] px-1 py-0.5 rounded-sm uppercase shrink-0">
                        {dev.vendor?.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <p className="text-[11px] font-mono text-[var(--text-muted)] mt-0.5">
                      {dev.management_ip} · {dev.total_findings} violations
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <div
                      className="text-[12px] font-mono font-bold"
                      style={{ color: dev.risk_score >= 7.5 ? '#e54d2e' : dev.risk_score >= 5 ? '#e0813a' : '#5b9e6e' }}
                    >
                      {dev.risk_score?.toFixed(1)}
                    </div>
                    <div className="text-[10px] font-mono text-[var(--text-muted)]">
                      {dev.compliance_score?.toFixed(0)}% compliant
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent findings */}
        <div className="panel p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-3.5 h-3.5 text-[var(--text-muted)]" aria-hidden="true" />
              <span className="text-[13px] font-semibold text-[var(--text-primary)]">Recent violations</span>
            </div>
            <button
              onClick={() => setActiveTab('findings')}
              className="text-[11px] text-[var(--accent-text)] hover:underline font-mono"
            >
              Investigate →
            </button>
          </div>

          {loading ? (
            <div className="space-y-2">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="panel-nested p-3">
                  <div className="skeleton h-3 w-3/4 mb-2" />
                  <div className="skeleton h-2.5 w-1/2" />
                </div>
              ))}
            </div>
          ) : (s.recent_findings || []).length === 0 ? (
            <div className="py-8 text-center text-[12px] text-[var(--text-muted)] font-mono">
              No recent violations found.
            </div>
          ) : (
            <div className="space-y-1.5">
              {(s.recent_findings || []).slice(0, 5).map((f) => (
                <button
                  key={f.finding_id}
                  onClick={() => setActiveTab('findings')}
                  className="w-full text-left panel-nested p-3 hover:border-[var(--border-muted)] transition-colors cursor-pointer"
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-[12px] font-medium text-[var(--text-primary)] truncate">{f.title}</span>
                    <SeverityBadge severity={f.severity} />
                  </div>
                  <div className="flex items-center gap-3 text-[11px] font-mono text-[var(--text-muted)]">
                    <span className="text-[var(--accent-text)]">{f.control_id}</span>
                    <span>{f.framework}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
