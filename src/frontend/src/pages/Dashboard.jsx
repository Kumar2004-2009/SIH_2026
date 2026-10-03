import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Server,
  AlertTriangle,
  FileCheck2,
  ChevronRight,
  RefreshCw,
  ArrowUpRight
} from 'lucide-react';
import { api } from '../api/client';
import MetricsCard from '../components/MetricsCard';
import SeverityBadge from '../components/SeverityBadge';
import RiskMeter from '../components/RiskMeter';
import ComplianceRing from '../components/ComplianceRing';

export default function Dashboard({ setActiveTab }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const data = await api.getDashboardStats();
      setStats(data);
    } catch (e) {
      console.error('Error fetching dashboard stats:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading && !stats) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <div className="w-7 h-7 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-mono text-slate-400">Loading central telemetry & posture data...</span>
      </div>
    );
  }

  const s = stats || {
    total_devices: 6,
    total_audits: 6,
    total_findings: 26,
    critical_count: 6,
    high_count: 9,
    medium_count: 8,
    low_count: 3,
    overall_compliance_score: 68.5,
    overall_risk_score: 7.2,
    vendor_breakdown: { cisco_ios: 2, juniper_junos: 1, fortinet_fortios: 1, palo_alto: 1, arista_eos: 1 },
    top_risky_devices: [],
    recent_findings: [],
    recent_audits: [],
    framework_compliance: { CIS: 64.0, NIST: 71.2, STIG: 58.0, ISO27001: 78.4, 'PCI-DSS': 69.0 }
  };

  return (
    <div className="space-y-5 pb-12">
      {/* Top Executive Header */}
      <div className="bg-[#0f1523] border border-slate-800 rounded-lg p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-subtle">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-blue-400 font-mono">
              National Technical Research Organisation (NTRO)
            </span>
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-slate-100 font-mono">
            NETRA Cyber Defense & Compliance Oversight
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl font-sans">
            Deterministic multi-vendor intermediate representation (NSIR) analysis across border, core, and datacenter fabrics.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={fetchStats}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Sync</span>
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-md bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white text-xs font-medium shadow-sm transition-colors cursor-pointer"
          >
            <span>Execute Audit</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricsCard
          title="Monitored Assets"
          value={s.total_devices}
          subtitle="6 Heterogeneous Fabrics"
          icon={Server}
          color="cyan"
        />
        <MetricsCard
          title="Active Violations"
          value={s.total_findings}
          subtitle={`${s.critical_count} Critical • ${s.high_count} High`}
          icon={AlertTriangle}
          color="rose"
        />
        <MetricsCard
          title="Audits Completed"
          value={s.total_audits}
          subtitle="100% Deterministic Engine"
          icon={FileCheck2}
          color="emerald"
        />
        <MetricsCard
          title="Mean Network Risk"
          value={`${s.overall_risk_score} / 10`}
          subtitle="Weighted Attack Surface"
          icon={ShieldAlert}
          color="amber"
        />
      </div>

      {/* Posture Gauges & Severity Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Compliance Gauge Card */}
        <div className="bg-[#0f1523] border border-slate-800 rounded-lg p-5 flex flex-col justify-between shadow-subtle">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-300 font-mono">
              Overall Security Posture
            </h2>
            <span className="text-[10px] text-blue-400 font-mono px-2 py-0.5 rounded bg-blue-950/60 border border-blue-800/40">
              Aggregated
            </span>
          </div>

          <div className="flex items-center justify-center py-2">
            <ComplianceRing score={s.overall_compliance_score} size={130} strokeWidth={9} />
          </div>

          <div className="mt-4 pt-3.5 border-t border-slate-800">
            <RiskMeter score={s.overall_risk_score} />
          </div>
        </div>

        {/* Severity Breakdown Card */}
        <div className="bg-[#0f1523] border border-slate-800 rounded-lg p-5 flex flex-col justify-between shadow-subtle">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-300 font-mono">
              Findings Distribution by Severity
            </h2>
            <button
              onClick={() => setActiveTab('findings')}
              className="text-[11px] text-blue-400 hover:text-blue-300 flex items-center gap-1 font-medium cursor-pointer"
            >
              <span>View All</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3 my-auto">
            {[
              { label: 'Critical', count: s.critical_count, color: 'bg-rose-500', text: 'text-rose-400' },
              { label: 'High', count: s.high_count, color: 'bg-amber-500', text: 'text-amber-400' },
              { label: 'Medium', count: s.medium_count, color: 'bg-yellow-400', text: 'text-yellow-300' },
              { label: 'Low', count: s.low_count, color: 'bg-blue-400', text: 'text-blue-300' },
            ].map((item) => (
              <div key={item.label} className="space-y-1">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-slate-400">{item.label}</span>
                  <span className={`font-bold ${item.text}`}>{item.count}</span>
                </div>
                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${item.color} rounded-full`}
                    style={{ width: `${Math.min(100, (item.count / 15) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-400 flex justify-between font-mono">
            <span>Remediation required</span>
            <span className="text-rose-400 font-bold">{s.critical_count + s.high_count} Priority Actions</span>
          </div>
        </div>

        {/* Framework Compliance Scores */}
        <div className="bg-[#0f1523] border border-slate-800 rounded-lg p-5 flex flex-col justify-between shadow-subtle">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-300 font-mono">
              Framework Baselines
            </h2>
            <button
              onClick={() => setActiveTab('compliance')}
              className="text-[11px] text-blue-400 hover:text-blue-300 flex items-center gap-1 font-medium cursor-pointer"
            >
              <span>Explore</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3 my-auto">
            {Object.entries(s.framework_compliance || {}).map(([fw, val]) => (
              <div key={fw} className="space-y-1">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-slate-300 font-semibold">{fw}</span>
                  <span className={`${val >= 75 ? 'text-emerald-400' : val >= 60 ? 'text-blue-400' : 'text-amber-400'} font-bold`}>
                    {val}%
                  </span>
                </div>
                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      val >= 75 ? 'bg-emerald-500' : val >= 60 ? 'bg-blue-500' : 'bg-amber-500'
                    }`}
                    style={{ width: `${val}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-400 font-sans">
            Mandated under NTRO National Critical Infrastructure Policy
          </div>
        </div>
      </div>

      {/* Dual Column: Top Risky Assets & Recent Findings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Top Risky Assets */}
        <div className="bg-[#0f1523] border border-slate-800 rounded-lg p-5 shadow-subtle">
          <div className="flex items-center justify-between mb-3.5">
            <div className="flex items-center gap-2">
              <Server className="w-4 h-4 text-blue-400" />
              <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-200 font-mono">
                Top Risky Network Assets
              </h2>
            </div>
            <button
              onClick={() => setActiveTab('risk')}
              className="text-[11px] text-blue-400 hover:text-blue-300 flex items-center gap-1 font-medium cursor-pointer"
            >
              <span>Prioritization</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-slate-800/80">
            {(s.top_risky_devices || []).slice(0, 4).map((dev) => (
              <div key={dev.device_id} className="py-2.5 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-100 font-mono">{dev.hostname}</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 font-mono uppercase">
                      {dev.vendor?.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                    IP: {dev.management_ip || '10.0.0.1'} • {dev.total_findings || 0} findings
                  </p>
                </div>

                <div className="text-right">
                  <span className={`text-xs font-mono font-bold ${
                    dev.risk_score >= 7.5 ? 'text-rose-400' : dev.risk_score >= 5.0 ? 'text-amber-400' : 'text-emerald-400'
                  }`}>
                    Risk: {dev.risk_score?.toFixed(1) || '0.0'}
                  </span>
                  <div className="text-[10px] text-slate-400 font-mono">
                    Comp: {dev.compliance_score?.toFixed(0) || '0'}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Critical Findings */}
        <div className="bg-[#0f1523] border border-slate-800 rounded-lg p-5 shadow-subtle">
          <div className="flex items-center justify-between mb-3.5">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400" />
              <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-200 font-mono">
                Recent Security Violations
              </h2>
            </div>
            <button
              onClick={() => setActiveTab('findings')}
              className="text-[11px] text-blue-400 hover:text-blue-300 flex items-center gap-1 font-medium cursor-pointer"
            >
              <span>Investigation</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2">
            {(s.recent_findings || []).slice(0, 4).map((f) => (
              <div
                key={f.finding_id}
                onClick={() => setActiveTab('findings')}
                className="p-3 rounded-md bg-slate-900/70 border border-slate-800 hover:border-slate-700 cursor-pointer transition-colors"
              >
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="text-xs font-medium text-slate-200 truncate">{f.title}</span>
                  <SeverityBadge severity={f.severity} />
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono mt-1">
                  <span className="text-blue-400 font-semibold">{f.control_id}</span>
                  <span>{f.framework}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
