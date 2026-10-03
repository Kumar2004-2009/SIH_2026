import React, { useState, useEffect } from 'react';
import {
  FileCheck2,
  Search,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { api } from '../api/client';
import SeverityBadge from '../components/SeverityBadge';

export default function ComplianceExplorer() {
  const [rules, setRules] = useState([]);
  const [frameworkStats, setFrameworkStats] = useState({});
  const [selectedFramework, setSelectedFramework] = useState('');
  const [selectedSeverity, setSelectedSeverity] = useState('');
  const [search, setSearch] = useState('');
  const [expandedRule, setExpandedRule] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRules();
    api.getFrameworkStats()
      .then((data) => setFrameworkStats(data || {}))
      .catch((err) => console.warn('Stats err:', err));
  }, [selectedFramework, selectedSeverity]);

  const fetchRules = async () => {
    setLoading(true);
    try {
      const res = await api.getComplianceRules(selectedFramework, selectedSeverity);
      setRules(res.rules || []);
    } catch (e) {
      console.error('Failed to load rules:', e);
    } finally {
      setLoading(false);
    }
  };

  const filteredRules = rules.filter((r) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      r.title?.toLowerCase().includes(q) ||
      r.control_id?.toLowerCase().includes(q) ||
      r.description?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-5 pb-12">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold font-mono tracking-tight text-slate-100 flex items-center gap-2">
          <FileCheck2 className="w-5 h-5 text-blue-400" />
          Deterministic Compliance Explorer & Framework Policies
        </h1>
        <p className="text-xs text-slate-400 mt-1 font-sans">
          Formal rule catalog mapped to CIS Benchmark, NIST SP 800-53, DISA STIG, and ISO/IEC 27001
        </p>
      </div>

      {/* Framework Scorecards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {Object.entries(frameworkStats).map(([name, data]) => {
          const isSelected = selectedFramework === name;
          return (
            <div
              key={name}
              onClick={() => setSelectedFramework(isSelected ? '' : name)}
              className={`rounded-lg p-3.5 cursor-pointer transition-colors border shadow-subtle ${
                isSelected
                  ? 'border-blue-500 bg-slate-900'
                  : 'bg-[#0f1523] border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex justify-between items-center text-xs font-mono">
                <span className="font-bold text-slate-100">{name}</span>
                <span
                  className={`text-[10px] font-semibold font-mono px-1.5 py-0.2 rounded border ${
                    data.status === 'Compliant'
                      ? 'bg-emerald-950/50 text-emerald-300 border-emerald-800/50'
                      : 'bg-amber-950/50 text-amber-300 border-amber-800/50'
                  }`}
                >
                  {data.compliance_pct}%
                </span>
              </div>
              <div className="mt-2 text-[11px] text-slate-400 font-sans">
                {data.findings_count} active deviations
              </div>
            </div>
          );
        })}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-[#0f1523] border border-slate-800 rounded-lg p-3 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-subtle">
        <div className="relative w-full sm:w-80">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search control ID, title, or keywords..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-md pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {/* Framework Filter */}
          <select
            value={selectedFramework}
            onChange={(e) => setSelectedFramework(e.target.value)}
            className="bg-slate-900 border border-slate-700 text-xs rounded-md px-3 py-1.5 text-slate-200 font-mono focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
          >
            <option value="">All Frameworks</option>
            <option value="CIS">CIS Benchmark</option>
            <option value="NIST">NIST SP 800-53</option>
            <option value="STIG">DISA STIG</option>
            <option value="ISO27001">ISO/IEC 27001</option>
            <option value="PCI-DSS">PCI-DSS v4.0</option>
          </select>

          {/* Severity Filter */}
          <select
            value={selectedSeverity}
            onChange={(e) => setSelectedSeverity(e.target.value)}
            className="bg-slate-900 border border-slate-700 text-xs rounded-md px-3 py-1.5 text-slate-200 font-mono focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
          >
            <option value="">All Severities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          {(selectedFramework || selectedSeverity || search) && (
            <button
              onClick={() => {
                setSelectedFramework('');
                setSelectedSeverity('');
                setSearch('');
              }}
              className="text-xs text-blue-400 hover:underline px-2 font-mono cursor-pointer"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Rules Catalog Table */}
      <div className="bg-[#0f1523] border border-slate-800 rounded-lg overflow-hidden shadow-subtle">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-900/90 text-slate-400 border-b border-slate-800 uppercase text-[10px]">
              <tr>
                <th className="p-3.5 font-semibold">Control ID</th>
                <th className="p-3.5 font-semibold">Severity</th>
                <th className="p-3.5 font-semibold font-sans">Standard Title & Rationale</th>
                <th className="p-3.5 font-semibold">Framework</th>
                <th className="p-3.5 font-semibold">Fabric</th>
                <th className="p-3.5 text-right font-semibold">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 bg-slate-950/60">
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500 font-mono">
                    Loading compliance rules...
                  </td>
                </tr>
              ) : filteredRules.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500 font-mono">
                    No compliance controls match the selected filters.
                  </td>
                </tr>
              ) : (
                filteredRules.map((rule) => {
                  const isExp = expandedRule === rule.control_id;
                  return (
                    <React.Fragment key={rule.control_id}>
                      <tr
                        onClick={() => setExpandedRule(isExp ? null : rule.control_id)}
                        className="hover:bg-slate-900/60 cursor-pointer transition-colors"
                      >
                        <td className="p-3.5 font-bold text-blue-400 font-mono">
                          {rule.control_id}
                        </td>
                        <td className="p-3.5">
                          <SeverityBadge severity={rule.severity} />
                        </td>
                        <td className="p-3.5 font-sans">
                          <div className="font-medium text-slate-200">{rule.title}</div>
                          <div className="text-[11px] text-slate-400 mt-0.5 line-clamp-1 font-sans">
                            {rule.description}
                          </div>
                        </td>
                        <td className="p-3.5">
                          <span className="px-2 py-0.5 rounded bg-slate-800/90 border border-slate-700/60 text-slate-300 font-medium text-[10px] font-mono">
                            {rule.framework}
                          </span>
                        </td>
                        <td className="p-3.5 text-slate-400 capitalize">
                          {rule.vendor_applicability?.replace('_', ' ')}
                        </td>
                        <td className="p-3.5 text-right">
                          <button className="text-slate-400 hover:text-white p-1">
                            {isExp ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </button>
                        </td>
                      </tr>

                      {/* Expanded Rule Details */}
                      {isExp && (
                        <tr className="bg-slate-900/90 border-b border-slate-800">
                          <td colSpan={6} className="p-5 space-y-3.5 font-sans text-xs">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-1">
                                <h4 className="font-semibold text-blue-400 font-mono uppercase text-[10px]">
                                  Technical Description
                                </h4>
                                <p className="text-slate-300 leading-relaxed font-sans text-xs">
                                  {rule.description}
                                </p>
                              </div>
                              <div className="space-y-1">
                                <h4 className="font-semibold text-rose-400 font-mono uppercase text-[10px]">
                                  Adversarial Impact
                                </h4>
                                <p className="text-slate-300 leading-relaxed font-sans text-xs">
                                  {rule.impact}
                                </p>
                              </div>
                            </div>

                            <div className="p-3 rounded-md bg-[#080d17] border border-slate-800 space-y-1">
                              <h4 className="font-semibold text-emerald-400 font-mono uppercase text-[10px]">
                                Recommended Hardening Strategy
                              </h4>
                              <p className="text-slate-300 font-mono text-[11px] leading-relaxed">
                                {rule.remediation_summary}
                              </p>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
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
