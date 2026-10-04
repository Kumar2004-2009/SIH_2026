import React, { useState, useEffect } from 'react';
import { Target } from 'lucide-react';
import { api } from '../api/client';

export default function RiskAnalysis({ setActiveTab }) {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState({ col: 'risk_score', dir: 'desc' });

  useEffect(() => {
    api.getDevices()
      .then((d) => setDevices(d || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const sorted = [...devices].sort((a, b) => {
    const dir = sortBy.dir === 'asc' ? 1 : -1;
    const va = a[sortBy.col] ?? 0;
    const vb = b[sortBy.col] ?? 0;
    return va < vb ? -dir : va > vb ? dir : 0;
  });

  const toggleSort = (col) => setSortBy((p) => ({
    col,
    dir: p.col === col && p.dir === 'desc' ? 'asc' : 'desc',
  }));

  const SortArrow = ({ col }) => {
    if (sortBy.col !== col) return <span className="ml-1 opacity-20">↕</span>;
    return <span className="ml-1">{sortBy.dir === 'asc' ? '↑' : '↓'}</span>;
  };

  const criticalCount = devices.filter((d) => d.criticality === 'critical').length;
  const highRiskCount = devices.filter((d) => d.risk_score >= 7.0).length;

  return (
    <div className="space-y-4 pb-10">
      {/* Header */}
      <div>
        <h1 className="text-[20px] font-bold text-[var(--text-primary)] tracking-tight">Risk Analysis</h1>
        <p className="text-[12px] text-[var(--text-muted)] mt-0.5 font-mono">
          Risk = Asset Criticality × Reachability × Misconfiguration Severity
        </p>
      </div>

      {/* Summary row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="stat-tile">
          <div className="section-label mb-2" style={{ color: '#e54d2e' }}>Critical assets</div>
          <div className="text-[28px] font-bold font-mono text-[var(--text-primary)] leading-none">
            {loading ? '—' : criticalCount}
          </div>
          <p className="text-[12px] text-[var(--text-muted)] mt-1">Border routers &amp; firewalls</p>
        </div>
        <div className="stat-tile">
          <div className="section-label mb-2" style={{ color: '#e0813a' }}>High-exposure nodes</div>
          <div className="text-[28px] font-bold font-mono text-[var(--text-primary)] leading-none">
            {loading ? '—' : highRiskCount}
          </div>
          <p className="text-[12px] text-[var(--text-muted)] mt-1">Risk ≥ 7.0, reachable externally</p>
        </div>
        <div className="stat-tile">
          <div className="section-label mb-2" style={{ color: '#5b9e6e' }}>Remediation plans ready</div>
          <div className="text-[28px] font-bold font-mono text-[var(--text-primary)] leading-none">
            {loading ? '—' : devices.length}
          </div>
          <p className="text-[12px] text-[var(--text-muted)] mt-1">
            <button
              onClick={() => setActiveTab('remediation')}
              className="text-[var(--accent-text)] hover:underline font-mono"
            >
              Open simulator →
            </button>
          </p>
        </div>
      </div>

      {/* Device risk table */}
      <div className="panel">
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
          <div className="flex items-center gap-2">
            <Target className="w-3.5 h-3.5 text-[var(--text-muted)]" aria-hidden="true" />
            <span className="text-[13px] font-semibold text-[var(--text-primary)]">Asset risk matrix</span>
          </div>
          <span className="text-[11px] font-mono text-[var(--text-muted)]">
            {loading ? 'Loading…' : `${devices.length} devices`}
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th
                  className="cursor-pointer hover:text-[var(--text-primary)]"
                  onClick={() => toggleSort('hostname')}
                >
                  Hostname <SortArrow col="hostname" />
                </th>
                <th>Vendor</th>
                <th
                  className="cursor-pointer hover:text-[var(--text-primary)]"
                  onClick={() => toggleSort('criticality')}
                >
                  Criticality <SortArrow col="criticality" />
                </th>
                <th
                  className="cursor-pointer hover:text-[var(--text-primary)]"
                  onClick={() => toggleSort('total_findings')}
                >
                  Violations <SortArrow col="total_findings" />
                </th>
                <th
                  className="cursor-pointer hover:text-[var(--text-primary)]"
                  onClick={() => toggleSort('compliance_score')}
                >
                  Compliance <SortArrow col="compliance_score" />
                </th>
                <th
                  className="text-right cursor-pointer hover:text-[var(--text-primary)]"
                  onClick={() => toggleSort('risk_score')}
                >
                  Risk score <SortArrow col="risk_score" />
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(6)].map((_, i) => (
                  <tr key={i}>
                    {[...Array(6)].map((_, j) => (
                      <td key={j}><div className="skeleton h-3 w-full" /></td>
                    ))}
                  </tr>
                ))
              ) : sorted.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center font-mono text-[var(--text-muted)]">
                    No devices found. Run an audit to populate the matrix.
                  </td>
                </tr>
              ) : (
                sorted.map((dev) => {
                  const critColor =
                    dev.criticality === 'critical' ? '#e54d2e' :
                    dev.criticality === 'high'     ? '#e0813a' : '#4ecdc4';
                  return (
                    <tr key={dev.device_id}>
                      <td>
                        <div className="font-mono font-semibold text-[var(--text-primary)]">{dev.hostname}</div>
                        <div className="text-[10px] font-mono text-[var(--text-muted)]">{dev.management_ip}</div>
                      </td>
                      <td>
                        <span className="text-[10px] font-mono text-[var(--text-muted)] border border-[var(--border)] px-1.5 py-0.5 rounded-sm uppercase">
                          {dev.vendor?.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td>
                        <span
                          className="text-[10px] font-mono font-semibold uppercase border px-1.5 py-0.5 rounded-sm"
                          style={{ color: critColor, borderColor: critColor + '60' }}
                        >
                          {dev.criticality}
                        </span>
                      </td>
                      <td className="font-mono font-bold" style={{ color: '#e54d2e' }}>
                        {dev.total_findings || 0}
                      </td>
                      <td className="font-mono font-bold" style={{ color: '#5b9e6e' }}>
                        {dev.compliance_score?.toFixed(1)}%
                      </td>
                      <td className="text-right">
                        <span
                          className="font-mono font-bold text-[14px]"
                          style={{
                            color: dev.risk_score >= 7.5 ? '#e54d2e' :
                                   dev.risk_score >= 5.0 ? '#e0813a' : '#5b9e6e',
                          }}
                        >
                          {dev.risk_score?.toFixed(1)}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
