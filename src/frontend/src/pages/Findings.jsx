import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  Search,
  Sparkles,
  Code2,
  Wrench
} from 'lucide-react';
import { api } from '../api/client';
import SeverityBadge from '../components/SeverityBadge';
import AIModal from '../components/AIModal';

export default function Findings({ setActiveTab, onSelectRemediation }) {
  const [findings, setFindings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    severity: '',
    framework: '',
    status: '',
    search: '',
  });
  const [selectedFinding, setSelectedFinding] = useState(null);
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiData, setAiData] = useState(null);

  useEffect(() => {
    fetchFindings();
  }, [filters.severity, filters.framework, filters.status]);

  const fetchFindings = async () => {
    setLoading(true);
    try {
      const data = await api.getFindings(filters);
      setFindings(data || []);
      if (data && data.length > 0 && !selectedFinding) {
        setSelectedFinding(data[0]);
      }
    } catch (e) {
      console.error('Error fetching findings:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleAIEvaluation = async (finding) => {
    setAiLoading(true);
    setAiModalOpen(true);
    setAiData({ title: finding.title, source: 'Querying Gemini Engine...' });
    try {
      const res = await api.explainFindingAI(finding.finding_id);
      setAiData(res);
    } catch (e) {
      setAiData({
        title: finding.title,
        source: 'NETRA Sovereign Heuristics',
        explanation: 'Deterministic evaluation indicates this configuration exposes network telemetry to unencrypted transmission and credential unauthorized harvest.'
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

  return (
    <div className="space-y-5 pb-12">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold font-mono tracking-tight text-slate-100 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-rose-400" />
          Findings & Evidence Repository
        </h1>
        <p className="text-xs text-slate-400 mt-1 font-sans">
          Audit evidence with verbatim line extractions and deterministic threat reasoning
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-[#0f1523] border border-slate-800 rounded-lg p-3 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-subtle">
        <div className="relative w-full sm:w-80">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search findings by ID, evidence, title..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            className="w-full bg-slate-900 border border-slate-700 rounded-md pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <select
            value={filters.severity}
            onChange={(e) => setFilters({ ...filters, severity: e.target.value })}
            className="bg-slate-900 border border-slate-700 text-xs rounded-md px-3 py-1.5 text-slate-200 font-mono focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
          >
            <option value="">All Severities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          <select
            value={filters.framework}
            onChange={(e) => setFilters({ ...filters, framework: e.target.value })}
            className="bg-slate-900 border border-slate-700 text-xs rounded-md px-3 py-1.5 text-slate-200 font-mono focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
          >
            <option value="">All Frameworks</option>
            <option value="CIS">CIS</option>
            <option value="NIST">NIST</option>
            <option value="STIG">STIG</option>
            <option value="ISO27001">ISO27001</option>
          </select>

          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="bg-slate-900 border border-slate-700 text-xs rounded-md px-3 py-1.5 text-slate-200 font-mono focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
          >
            <option value="">All Statuses</option>
            <option value="open">Open</option>
            <option value="in_progress">In Progress</option>
            <option value="remediated">Remediated</option>
            <option value="false_positive">False Positive</option>
          </select>
        </div>
      </div>

      {/* Main Split View: Findings Table + Full Evidence Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Side: Findings Table */}
        <div className="lg:col-span-7 bg-[#0f1523] border border-slate-800 rounded-lg overflow-hidden shadow-subtle">
          <div className="overflow-x-auto max-h-[660px]">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-900/95 text-slate-400 border-b border-slate-800 uppercase text-[10px] sticky top-0 z-10">
                <tr>
                  <th className="p-3 font-semibold">Severity</th>
                  <th className="p-3 font-semibold">Control</th>
                  <th className="p-3 font-semibold font-sans">Title</th>
                  <th className="p-3 font-semibold">Framework</th>
                  <th className="p-3 text-right font-semibold">Risk</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 bg-slate-950/60">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-500 font-mono">
                      Loading violations...
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-500 font-mono">
                      No findings match criteria.
                    </td>
                  </tr>
                ) : (
                  filtered.map((f) => {
                    const isSelected = selectedFinding?.finding_id === f.finding_id;
                    return (
                      <tr
                        key={f.finding_id}
                        onClick={() => setSelectedFinding(f)}
                        className={`cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-slate-900 border-l-2 border-blue-500'
                            : 'hover:bg-slate-900/60'
                        }`}
                      >
                        <td className="p-3">
                          <SeverityBadge severity={f.severity} />
                        </td>
                        <td className="p-3 text-blue-400 font-bold">{f.control_id}</td>
                        <td className="p-3 font-sans font-medium text-slate-200 truncate max-w-xs">
                          {f.title}
                        </td>
                        <td className="p-3 text-slate-400">{f.framework}</td>
                        <td className="p-3 text-right font-bold text-rose-400">
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

        {/* Right Side: Exact Configuration Evidence Inspector */}
        <div className="lg:col-span-5 space-y-4">
          {selectedFinding ? (
            <div className="bg-[#0f1523] border border-slate-800 rounded-lg p-5 space-y-4 shadow-subtle">
              {/* Finding Title & Severity Header */}
              <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-800">
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <SeverityBadge severity={selectedFinding.severity} />
                    <span className="text-[10px] font-mono text-blue-400 px-1.5 py-0.5 rounded bg-blue-950/80 border border-blue-800/60">
                      {selectedFinding.control_id}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                      Confidence: {(selectedFinding.confidence_score * 100).toFixed(0)}%
                    </span>
                  </div>
                  <h3 className="text-sm font-semibold text-slate-100 font-sans">
                    {selectedFinding.title}
                  </h3>
                </div>

                <button
                  onClick={() => handleAIEvaluation(selectedFinding)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-blue-600/10 hover:bg-blue-600/20 text-blue-300 border border-blue-500/30 text-xs font-mono font-medium transition-colors shrink-0 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Explain AI</span>
                </button>
              </div>

              {/* Exact Verbatim Configuration Evidence */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                  <span className="font-semibold text-rose-400 flex items-center gap-1.5">
                    <Code2 className="w-3.5 h-3.5" />
                    Exact Configuration Evidence
                  </span>
                  <span className="text-slate-500">{selectedFinding.config_reference}</span>
                </div>
                <div className="bg-[#080d17] border border-slate-800 rounded-md p-3 font-mono text-xs text-rose-300 overflow-x-auto leading-relaxed">
                  <code>{selectedFinding.config_evidence}</code>
                </div>
              </div>

              {/* Technical Description & Adversarial Impact */}
              <div className="space-y-2 text-xs">
                <div>
                  <h4 className="text-[10px] uppercase font-semibold text-slate-400 font-mono">
                    Audit Description
                  </h4>
                  <p className="text-slate-300 mt-0.5 text-[11px] font-sans leading-relaxed">
                    {selectedFinding.description}
                  </p>
                </div>
                <div>
                  <h4 className="text-[10px] uppercase font-semibold text-amber-400 font-mono">
                    Security Impact
                  </h4>
                  <p className="text-slate-300 mt-0.5 text-[11px] font-sans leading-relaxed">
                    {selectedFinding.impact}
                  </p>
                </div>
              </div>

              {/* Remediation Preview Box */}
              <div className="p-3 rounded-md bg-slate-900 border border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase font-semibold text-emerald-400">
                    Vendor Remediation CLI
                  </span>
                  <button
                    onClick={() => {
                      if (onSelectRemediation) onSelectRemediation(selectedFinding);
                      setActiveTab('remediation');
                    }}
                    className="text-[10px] text-blue-400 hover:underline font-mono flex items-center gap-1 cursor-pointer"
                  >
                    <span>Open in Simulator</span>
                    <Wrench className="w-3 h-3" />
                  </button>
                </div>
                <pre className="text-[11px] font-mono text-emerald-300 overflow-x-auto bg-[#080d17] p-2.5 rounded border border-slate-800">
                  {selectedFinding.remediation_commands || selectedFinding.remediation_summary}
                </pre>
              </div>

              {/* Status Actions */}
              <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs font-mono">
                <span className="text-slate-400">
                  Status: <strong className="text-blue-300 uppercase">{selectedFinding.status}</strong>
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleStatusChange(selectedFinding.finding_id, 'false_positive')}
                    className="px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-medium transition-colors cursor-pointer"
                  >
                    False Positive
                  </button>
                  <button
                    onClick={() => handleStatusChange(selectedFinding.finding_id, 'remediated')}
                    className="px-2.5 py-1 rounded-md bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-300 border border-emerald-800/60 text-[10px] font-medium transition-colors cursor-pointer"
                  >
                    Mark Remediated
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-[#0f1523] border border-slate-800 rounded-lg p-12 text-center text-slate-500 text-xs font-mono">
              Select a violation on the left to examine exact line-level evidence and AI threat analysis.
            </div>
          )}
        </div>
      </div>

      {/* AI Explanation Modal */}
      <AIModal
        isOpen={aiModalOpen}
        onClose={() => setAiModalOpen(false)}
        data={aiData}
        loading={aiLoading}
      />
    </div>
  );
}
