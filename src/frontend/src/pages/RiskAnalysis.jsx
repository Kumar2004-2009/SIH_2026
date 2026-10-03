import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Target
} from 'lucide-react';
import { api } from '../api/client';

export default function RiskAnalysis({ setActiveTab }) {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getDevices()
      .then((data) => setDevices(data || []))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-5 pb-12">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold font-mono tracking-tight text-slate-100 flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-amber-400" />
          Risk Analysis & Attack Exposure Modeling
        </h1>
        <p className="text-xs text-slate-400 mt-1 font-sans">
          Dynamic risk prioritization formula: <code className="text-blue-300 font-mono">Risk = (Asset Criticality × Reachability × Misconfiguration Severity)</code>
        </p>
      </div>

      {/* Risk Dimension Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#0f1523] border border-slate-800 rounded-lg p-5 shadow-subtle">
          <span className="text-[10px] font-mono uppercase font-semibold text-rose-400 tracking-wider">
            Critical Assets
          </span>
          <div className="text-2xl font-bold font-mono text-slate-100 mt-1">
            {devices.filter((d) => d.criticality === 'critical').length} Assets
          </div>
          <p className="text-[11px] text-slate-400 mt-1 font-sans">
            Border routers & firewalls carrying sovereign traffic
          </p>
        </div>

        <div className="bg-[#0f1523] border border-slate-800 rounded-lg p-5 shadow-subtle">
          <span className="text-[10px] font-mono uppercase font-semibold text-amber-400 tracking-wider">
            High Exposure Nodes
          </span>
          <div className="text-2xl font-bold font-mono text-slate-100 mt-1">
            {devices.filter((d) => d.risk_score >= 7.0).length} Systems
          </div>
          <p className="text-[11px] text-slate-400 mt-1 font-sans">
            Reachable from external peerings with active vulnerabilities
          </p>
        </div>

        <div className="bg-[#0f1523] border border-slate-800 rounded-lg p-5 shadow-subtle">
          <span className="text-[10px] font-mono uppercase font-semibold text-emerald-400 tracking-wider">
            Remediation Urgency
          </span>
          <div className="text-2xl font-bold font-mono text-slate-100 mt-1">Tier-1 Immediate</div>
          <p className="text-[11px] text-slate-400 mt-1 font-sans">
            Automated remediation plans ready for staging
          </p>
        </div>
      </div>

      {/* Prioritized Device Risk Queue Table */}
      <div className="bg-[#0f1523] border border-slate-800 rounded-lg p-5 space-y-4 shadow-subtle">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-200 font-mono flex items-center gap-2">
            <Target className="w-4 h-4 text-blue-400" />
            Asset Criticality & Exposure Matrix
          </h2>
          <span className="text-[10px] font-mono text-slate-400">
            Sorted by composite risk impact
          </span>
        </div>

        <div className="overflow-x-auto rounded-md border border-slate-800">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-900/90 text-slate-400 border-b border-slate-800 uppercase text-[10px]">
              <tr>
                <th className="p-3 font-semibold">Device Hostname</th>
                <th className="p-3 font-semibold">Vendor / Role</th>
                <th className="p-3 font-semibold">Criticality</th>
                <th className="p-3 font-semibold">Active Violations</th>
                <th className="p-3 font-semibold">Compliance</th>
                <th className="p-3 text-right font-semibold">Composite Risk</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 bg-slate-950/60">
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500 font-mono">
                    Loading asset risk matrix...
                  </td>
                </tr>
              ) : devices.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500 font-mono">
                    No monitored assets found.
                  </td>
                </tr>
              ) : (
                devices.map((dev) => (
                  <tr key={dev.device_id} className="hover:bg-slate-900/50 transition-colors">
                    <td className="p-3">
                      <div className="font-bold text-slate-100">{dev.hostname}</div>
                      <div className="text-[10px] text-slate-400">{dev.management_ip || '10.0.0.1'}</div>
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 uppercase text-[10px]">
                        {dev.vendor?.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] uppercase font-semibold border ${
                          dev.criticality === 'critical'
                            ? 'bg-rose-950/50 text-rose-300 border-rose-800/50'
                            : dev.criticality === 'high'
                            ? 'bg-amber-950/50 text-amber-300 border-amber-800/50'
                            : 'bg-blue-950/50 text-blue-300 border-blue-800/50'
                        }`}
                      >
                        {dev.criticality}
                      </span>
                    </td>
                    <td className="p-3 text-rose-400 font-bold">{dev.total_findings || 0}</td>
                    <td className="p-3 text-emerald-400 font-bold">
                      {dev.compliance_score?.toFixed(0) || 0}%
                    </td>
                    <td className="p-3 text-right">
                      <span className="font-bold text-rose-400 text-sm">
                        {dev.risk_score?.toFixed(1) || '0.0'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
