import React, { useState, useEffect } from 'react';
import { Search, ChevronDown, ChevronUp } from 'lucide-react';
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
      .then((d) => setFrameworkStats(d || {}))
      .catch(() => {});
  }, [selectedFramework, selectedSeverity]);

  const fetchRules = async () => {
    setLoading(true);
    try {
      const res = await api.getComplianceRules(selectedFramework, selectedSeverity);
      setRules(res.rules || []);
    } catch {
      /* no-op */
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
    <div className="space-y-4 pb-10">
      {/* Header */}
      <div>
        <h1 className="text-[20px] font-bold text-[var(--text-primary)] tracking-tight">Compliance Explorer</h1>
        <p className="text-[12px] text-[var(--text-muted)] mt-0.5">
          Control catalog — CIS Benchmark, NIST SP 800-53, DISA STIG, ISO/IEC 27001
        </p>
      </div>

      {/* Framework score row */}
      <div className="flex flex-wrap gap-2">
        {Object.entries(frameworkStats).map(([name, data]) => {
          const active = selectedFramework === name;
          const color = data.status === 'Compliant' ? '#5b9e6e' : '#c4a030';
          return (
            <button
              key={name}
              id={`compliance-fw-${name}`}
              onClick={() => setSelectedFramework(active ? '' : name)}
              className={[
                'panel px-3 py-2 text-left transition-colors cursor-pointer',
                active ? 'border-[var(--accent)]' : 'hover:border-[var(--border-muted)]',
              ].join(' ')}
            >
              <div className="flex items-center justify-between gap-4">
                <span className="text-[12px] font-mono font-bold text-[var(--text-primary)]">{name}</span>
                <span className="text-[12px] font-mono font-bold" style={{ color }}>
                  {data.compliance_pct}%
                </span>
              </div>
              <div className="text-[11px] text-[var(--text-muted)] mt-0.5 font-mono">
                {data.findings_count} deviations
              </div>
            </button>
          );
        })}
      </div>

      {/* Filters */}
      <div className="panel p-2.5 flex flex-col sm:flex-row items-start sm:items-center gap-2">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-[var(--text-muted)] absolute left-2.5 top-2.5" aria-hidden="true" />
          <input
            id="compliance-search"
            type="text"
            placeholder="Control ID, title, keywords…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="form-control pl-8 w-64"
          />
        </div>
        <div className="flex gap-2">
          <select
            id="compliance-fw-filter"
            value={selectedFramework}
            onChange={(e) => setSelectedFramework(e.target.value)}
            className="form-control"
          >
            <option value="">All frameworks</option>
            <option value="CIS">CIS Benchmark</option>
            <option value="NIST">NIST SP 800-53</option>
            <option value="STIG">DISA STIG</option>
            <option value="ISO27001">ISO/IEC 27001</option>
            <option value="PCI-DSS">PCI-DSS v4.0</option>
          </select>
          <select
            id="compliance-sev-filter"
            value={selectedSeverity}
            onChange={(e) => setSelectedSeverity(e.target.value)}
            className="form-control"
          >
            <option value="">All severities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
          {(selectedFramework || selectedSeverity || search) && (
            <button
              onClick={() => { setSelectedFramework(''); setSelectedSeverity(''); setSearch(''); }}
              className="btn btn-ghost text-[11px] font-mono"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Rules table */}
      <div className="panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Control</th>
                <th>Sev</th>
                <th>Title &amp; description</th>
                <th>Framework</th>
                <th>Fabric</th>
                <th className="text-right w-8"></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(8)].map((_, i) => (
                  <tr key={i}>
                    <td><div className="skeleton h-3 w-20" /></td>
                    <td><div className="skeleton h-4 w-16" /></td>
                    <td><div className="skeleton h-3 w-56" /></td>
                    <td><div className="skeleton h-3 w-14" /></td>
                    <td><div className="skeleton h-3 w-16" /></td>
                    <td />
                  </tr>
                ))
              ) : filteredRules.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-[var(--text-muted)] font-mono">
                    No controls match the current filters.
                  </td>
                </tr>
              ) : (
                filteredRules.map((rule) => {
                  const expanded = expandedRule === rule.control_id;
                  return (
                    <React.Fragment key={rule.control_id}>
                      <tr
                        onClick={() => setExpandedRule(expanded ? null : rule.control_id)}
                        className="cursor-pointer"
                      >
                        <td className="font-mono text-[var(--accent-text)] font-bold">{rule.control_id}</td>
                        <td><SeverityBadge severity={rule.severity} /></td>
                        <td>
                          <div className="font-medium text-[var(--text-primary)]">{rule.title}</div>
                          <div className="text-[11px] text-[var(--text-muted)] mt-0.5 line-clamp-1">
                            {rule.description}
                          </div>
                        </td>
                        <td>
                          <span className="text-[10px] font-mono text-[var(--text-muted)] border border-[var(--border)] px-1.5 py-0.5 rounded-sm">
                            {rule.framework}
                          </span>
                        </td>
                        <td className="text-[var(--text-muted)] capitalize">
                          {rule.vendor_applicability?.replace('_', ' ')}
                        </td>
                        <td className="text-right">
                          <button className="btn btn-ghost p-1">
                            {expanded
                              ? <ChevronUp className="w-3.5 h-3.5" aria-hidden="true" />
                              : <ChevronDown className="w-3.5 h-3.5" aria-hidden="true" />}
                          </button>
                        </td>
                      </tr>

                      {expanded && (
                        <tr className="bg-[var(--bg-base)]">
                          <td colSpan={6} className="p-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[12px]">
                              <div>
                                <div className="section-label mb-1.5">Technical description</div>
                                <p className="text-[var(--text-secondary)] leading-relaxed">{rule.description}</p>
                              </div>
                              <div>
                                <div className="section-label mb-1.5" style={{ color: '#e54d2e' }}>Adversarial impact</div>
                                <p className="text-[var(--text-secondary)] leading-relaxed">{rule.impact}</p>
                              </div>
                            </div>
                            <div className="mt-3 code-block">
                              <div className="section-label mb-1.5" style={{ color: '#5b9e6e' }}>Hardening strategy</div>
                              <p className="font-mono text-[11px] text-[var(--text-secondary)] leading-relaxed">
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
