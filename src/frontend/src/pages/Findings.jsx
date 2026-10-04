import React, { useState, useEffect } from 'react';
import { Search, Brain, Code2, Wrench, Copy, Check } from 'lucide-react';
import { api } from '../api/client';
import SeverityBadge from '../components/SeverityBadge';
import AIModal from '../components/AIModal';

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text || '').then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  return (
    <button onClick={handleCopy} className="btn btn-ghost p-1" title="Copy to clipboard">
      {copied ? <Check className="w-3.5 h-3.5 text-[#5b9e6e]" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  );
}

export default function Findings({ setActiveTab, onSelectRemediation }) {
  const [findings, setFindings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ severity: '', framework: '', status: '', search: '' });
  const [selectedFinding, setSelectedFinding] = useState(null);
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiData, setAiData] = useState(null);
  const [sortBy, setSortBy] = useState({ col: 'risk_score', dir: 'desc' });

  useEffect(() => {
    fetchFindings();
  }, [filters.severity, filters.framework, filters.status]);

  const fetchFindings = async () => {
    setLoading(true);
    try {
      const data = await api.getFindings(filters);
      setFindings(data || []);
      if (data?.length > 0 && !selectedFinding) setSelectedFinding(data[0]);
    } catch {
      /* no-op */
    } finally {
      setLoading(false);
    }
  };

  const handleAIEval = async (finding) => {
    setAiLoading(true);
    setAiModalOpen(true);
    setAiData({ title: finding.title, source: 'Querying engine…' });
    try {
      const res = await api.explainFindingAI(finding.finding_id);
      setAiData(res);
    } catch {
      setAiData({
        title: finding.title,
        source: 'NETRA Deterministic',
        explanation: 'Deterministic evaluation: this configuration exposes the device to credential harvest and lateral movement via unencrypted management plane access.',
      });
    } finally {
      setAiLoading(false);
    }
  };

  const handleStatusChange = async (findingId, newStatus) => {
    try {
      await api.updateFinding(findingId, { status: newStatus });
      fetchFindings();
    } catch (e) {
      alert('Status update failed: ' + e.message);
    }
  };

  const filtered = findings.filter((f) => {
    if (!filters.search) return true;
    const q = filters.search.toLowerCase();
    return (
      f.title?.toLowerCase().includes(q) ||
      f.control_id?.toLowerCase().includes(q) ||
      f.config_evidence?.toLowerCase().includes(q)
    );
  });

  const sorted = [...filtered].sort((a, b) => {
    const dir = sortBy.dir === 'asc' ? 1 : -1;
    const va = a[sortBy.col] ?? '';
    const vb = b[sortBy.col] ?? '';
    return va < vb ? -dir : va > vb ? dir : 0;
  });

  const toggleSort = (col) => {
    setSortBy((prev) => ({
      col,
      dir: prev.col === col && prev.dir === 'desc' ? 'asc' : 'desc',
    }));
  };

  const SortArrow = ({ col }) => {
    if (sortBy.col !== col) return <span className="ml-1 opacity-20">↕</span>;
    return <span className="ml-1">{sortBy.dir === 'asc' ? '↑' : '↓'}</span>;
  };

  return (
    <div className="space-y-3 pb-10">
      {/* Header */}
      <div>
        <h1 className="text-[20px] font-bold text-[var(--text-primary)] tracking-tight">Findings</h1>
        <p className="text-[12px] text-[var(--text-muted)] mt-0.5">
          {loading ? 'Loading…' : `${filtered.length} violations · verbatim config evidence`}
        </p>
      </div>

      {/* Filters */}
      <div className="panel p-2.5 flex flex-col sm:flex-row items-start sm:items-center gap-2">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-[var(--text-muted)] absolute left-2.5 top-2.5" aria-hidden="true" />
          <input
            id="findings-search"
            type="text"
            placeholder="Search title, control ID, evidence…"
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            className="form-control pl-8 w-72"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <select
            id="findings-filter-severity"
            value={filters.severity}
            onChange={(e) => setFilters({ ...filters, severity: e.target.value })}
            className="form-control"
          >
            <option value="">All severities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
          <select
            id="findings-filter-framework"
            value={filters.framework}
            onChange={(e) => setFilters({ ...filters, framework: e.target.value })}
            className="form-control"
          >
            <option value="">All frameworks</option>
            <option value="CIS">CIS</option>
            <option value="NIST">NIST SP 800-53</option>
            <option value="STIG">DISA STIG</option>
            <option value="ISO27001">ISO 27001</option>
          </select>
          <select
            id="findings-filter-status"
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="form-control"
          >
            <option value="">All statuses</option>
            <option value="open">Open</option>
            <option value="in_progress">In progress</option>
            <option value="remediated">Remediated</option>
            <option value="false_positive">False positive</option>
          </select>
        </div>
      </div>

      {/* Split: table + inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
        {/* Table */}
        <div className="lg:col-span-7 panel overflow-hidden">
          <div className="overflow-x-auto" style={{ maxHeight: 640 }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Sev</th>
                  <th
                    className="cursor-pointer hover:text-[var(--text-primary)]"
                    onClick={() => toggleSort('control_id')}
                  >
                    Control <SortArrow col="control_id" />
                  </th>
                  <th>Title</th>
                  <th>Framework</th>
                  <th
                    className="text-right cursor-pointer hover:text-[var(--text-primary)]"
                    onClick={() => toggleSort('risk_score')}
                  >
                    Risk <SortArrow col="risk_score" />
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  [...Array(6)].map((_, i) => (
                    <tr key={i}>
                      <td><div className="skeleton h-4 w-16" /></td>
                      <td><div className="skeleton h-3 w-20" /></td>
                      <td><div className="skeleton h-3 w-48" /></td>
                      <td><div className="skeleton h-3 w-14" /></td>
                      <td className="text-right"><div className="skeleton h-3 w-8 ml-auto" /></td>
                    </tr>
                  ))
                ) : sorted.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-10 text-center text-[var(--text-muted)] font-mono">
                      No findings match the current filters.
                    </td>
                  </tr>
                ) : (
                  sorted.map((f) => {
                    const sel = selectedFinding?.finding_id === f.finding_id;
                    return (
                      <tr
                        key={f.finding_id}
                        onClick={() => setSelectedFinding(f)}
                        className={`cursor-pointer ${sel ? 'row-selected' : ''}`}
                      >
                        <td><SeverityBadge severity={f.severity} /></td>
                        <td className="font-mono text-[var(--accent-text)] font-semibold">{f.control_id}</td>
                        <td className="text-[var(--text-primary)] font-medium max-w-xs truncate">{f.title}</td>
                        <td className="font-mono text-[var(--text-muted)]">{f.framework}</td>
                        <td className="text-right font-mono font-bold" style={{
                          color: f.risk_score >= 7.5 ? '#e54d2e' : f.risk_score >= 5 ? '#e0813a' : '#c4a030',
                        }}>
                          {f.risk_score?.toFixed(1)}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Inspector */}
        <div className="lg:col-span-5">
          {selectedFinding ? (
            <div className="panel p-4 space-y-4">
              {/* Header */}
              <div className="flex items-start justify-between gap-3 pb-3 border-b border-[var(--border)]">
                <div className="min-w-0">
                  <div className="flex items-center flex-wrap gap-1.5 mb-1.5">
                    <SeverityBadge severity={selectedFinding.severity} />
                    <span className="text-[10px] font-mono text-[var(--accent-text)] border border-[var(--border)] px-1.5 py-0.5 rounded-sm">
                      {selectedFinding.control_id}
                    </span>
                    <span className="text-[10px] font-mono text-[var(--text-muted)]">
                      confidence {(selectedFinding.confidence_score * 100).toFixed(0)}%
                    </span>
                  </div>
                  <h3 className="text-[13px] font-semibold text-[var(--text-primary)]">
                    {selectedFinding.title}
                  </h3>
                </div>
                <button
                  onClick={() => handleAIEval(selectedFinding)}
                  className="btn btn-secondary shrink-0"
                  title="Get analysis"
                >
                  <Brain className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Explain</span>
                </button>
              </div>

              {/* Config evidence */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <Code2 className="w-3.5 h-3.5 text-[#e54d2e]" aria-hidden="true" />
                    <span className="section-label">Config evidence</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] font-mono text-[var(--text-muted)]">
                      {selectedFinding.config_reference}
                    </span>
                    <CopyButton text={selectedFinding.config_evidence} />
                  </div>
                </div>
                <pre className="code-block text-[#f07050] text-[11px] max-h-36 overflow-auto">
                  {selectedFinding.config_evidence}
                </pre>
              </div>

              {/* Description + impact */}
              <div className="space-y-2 text-[12px]">
                <div>
                  <div className="section-label mb-1">Description</div>
                  <p className="text-[var(--text-secondary)] leading-relaxed">{selectedFinding.description}</p>
                </div>
                <div>
                  <div className="section-label mb-1" style={{ color: '#c4a030' }}>Impact</div>
                  <p className="text-[var(--text-secondary)] leading-relaxed">{selectedFinding.impact}</p>
                </div>
              </div>

              {/* Remediation */}
              <div className="panel-nested p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="section-label" style={{ color: '#5b9e6e' }}>Vendor CLI fix</span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        if (onSelectRemediation) onSelectRemediation(selectedFinding);
                        setActiveTab('remediation');
                      }}
                      className="text-[10px] font-mono text-[var(--accent-text)] hover:underline flex items-center gap-1"
                    >
                      <Wrench className="w-3 h-3" aria-hidden="true" />
                      Open simulator
                    </button>
                    <CopyButton text={selectedFinding.remediation_commands || selectedFinding.remediation_summary} />
                  </div>
                </div>
                <pre className="code-block text-[#4db878] text-[11px] max-h-28 overflow-auto">
                  {selectedFinding.remediation_commands || selectedFinding.remediation_summary}
                </pre>
              </div>

              {/* Status actions */}
              <div className="pt-2 border-t border-[var(--border)] flex items-center justify-between text-[12px] font-mono">
                <span className="text-[var(--text-muted)]">
                  Status: <strong className="text-[var(--text-secondary)] uppercase">{selectedFinding.status}</strong>
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleStatusChange(selectedFinding.finding_id, 'false_positive')}
                    className="btn btn-secondary text-[11px]"
                  >
                    False positive
                  </button>
                  <button
                    onClick={() => handleStatusChange(selectedFinding.finding_id, 'remediated')}
                    className="btn btn-primary text-[11px]"
                    style={{ background: '#1e6035', borderColor: '#1e6035' }}
                  >
                    Mark remediated
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="panel p-10 text-center text-[12px] font-mono text-[var(--text-muted)]">
              Select a finding to inspect evidence and remediation.
            </div>
          )}
        </div>
      </div>

      <AIModal isOpen={aiModalOpen} onClose={() => setAiModalOpen(false)} data={aiData} loading={aiLoading} />
    </div>
  );
}
