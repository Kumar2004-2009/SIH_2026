import React, { useState, useEffect } from 'react';
import { Printer, FileText } from 'lucide-react';
import { api } from '../api/client';

export default function AuditReports() {
  const [reports, setReports] = useState([]);
  const [selectedReport, setSelectedReport] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchReports(); }, []);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const data = await api.getReports();
      setReports(data || []);
      if (data?.length > 0) setSelectedReport(data[0]);
    } catch {
      /* no-op */
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateReport = async () => {
    setGenerating(true);
    try {
      const r = await api.generateReport(
        `NETRA Audit Report — ${new Date().toLocaleDateString()}`,
        'executive'
      );
      setReports([r, ...reports]);
      setSelectedReport(r);
    } catch (e) {
      alert('Report generation failed: ' + e.message);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-4 pb-10">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-[20px] font-bold text-[var(--text-primary)] tracking-tight">Audit Reports</h1>
          <p className="text-[12px] text-[var(--text-muted)] mt-0.5">
            Formal compliance documentation for NTRO CISO review
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <button onClick={() => window.print()} className="btn btn-secondary">
            <Printer className="w-3.5 h-3.5" aria-hidden="true" />
            Print / PDF
          </button>
          <button
            id="reports-generate-btn"
            onClick={handleGenerateReport}
            disabled={generating}
            className="btn btn-primary"
          >
            <FileText className="w-3.5 h-3.5" aria-hidden="true" />
            {generating ? 'Compiling…' : 'Compile report'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
        {/* Archive list */}
        <div className="lg:col-span-4 panel p-4 space-y-2">
          <div className="section-label mb-2">Generated ({reports.length})</div>
          <div className="space-y-1.5 max-h-[640px] overflow-y-auto">
            {loading ? (
              [...Array(3)].map((_, i) => (
                <div key={i} className="panel-nested p-3">
                  <div className="skeleton h-3 w-4/5 mb-2" />
                  <div className="skeleton h-2.5 w-3/5" />
                </div>
              ))
            ) : reports.length === 0 ? (
              <div className="py-6 text-center text-[12px] font-mono text-[var(--text-muted)]">
                No reports yet. Compile one above.
              </div>
            ) : (
              reports.map((r) => {
                const sel = selectedReport?.report_id === r.report_id;
                return (
                  <button
                    key={r.report_id}
                    onClick={() => setSelectedReport(r)}
                    className={[
                      'w-full text-left panel-nested p-3 transition-colors cursor-pointer',
                      sel ? 'border-[var(--accent)]' : 'hover:border-[var(--border-muted)]',
                    ].join(' ')}
                  >
                    <div className="text-[12px] font-medium text-[var(--text-primary)] truncate">{r.title}</div>
                    <div className="flex justify-between items-center mt-1.5 text-[10px] font-mono text-[var(--text-muted)]">
                      <span>{new Date(r.created_at).toLocaleDateString()}</span>
                      <span style={{ color: '#5b9e6e' }} className="font-semibold">
                        {r.compliance_percentage}% compliant
                      </span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Report view */}
        <div className="lg:col-span-8">
          {selectedReport ? (
            <div className="panel p-5 space-y-5 text-[var(--text-secondary)]">
              {/* Report header */}
              <div className="pb-4 border-b border-[var(--border)] flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div>
                  <div className="text-[10px] font-mono uppercase font-bold tracking-wider text-[var(--text-muted)] border border-[var(--border)] px-2 py-0.5 rounded-sm inline-block mb-2">
                    Official audit report · NTRO
                  </div>
                  <h2 className="text-[16px] font-bold font-mono text-[var(--text-primary)]">{selectedReport.title}</h2>
                  <div className="text-[11px] font-mono text-[var(--text-muted)] mt-1 space-x-2">
                    <span>By: {selectedReport.generated_by}</span>
                    <span>·</span>
                    <span>{new Date(selectedReport.created_at).toUTCString()}</span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-[10px] font-mono text-[var(--text-muted)]">Posture score</div>
                  <div className="text-[28px] font-bold font-mono text-[var(--accent-text)] leading-none mt-0.5">
                    {selectedReport.compliance_percentage}%
                  </div>
                </div>
              </div>

              {/* Metric strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { label: 'Devices',    value: selectedReport.total_devices,    color: null },
                  { label: 'Violations', value: selectedReport.total_findings,   color: '#e54d2e' },
                  { label: 'Mean risk',  value: `${selectedReport.overall_risk_score}/10`, color: '#e0813a' },
                  { label: 'Critical',   value: selectedReport.severity_breakdown?.critical || 0, color: '#e54d2e' },
                ].map(({ label, value, color }) => (
                  <div key={label} className="panel-nested p-3 text-center">
                    <div className="section-label">{label}</div>
                    <div
                      className="text-[16px] font-bold font-mono mt-1"
                      style={{ color: color || 'var(--text-primary)' }}
                    >
                      {value}
                    </div>
                  </div>
                ))}
              </div>

              {/* Executive summary */}
              <div>
                <div className="section-label mb-2">1. Executive summary</div>
                <div className="code-block text-[12px] leading-relaxed text-[var(--text-secondary)]">
                  {selectedReport.executive_summary}
                </div>
              </div>

              {/* Framework scorecard */}
              <div>
                <div className="section-label mb-2">2. Standards alignment</div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {Object.entries(selectedReport.framework_breakdown || {}).map(([fw, val]) => (
                    <div key={fw} className="panel-nested p-2.5 text-center font-mono">
                      <div className="text-[11px] text-[var(--text-muted)]">{fw}</div>
                      <div
                        className="text-[16px] font-bold mt-0.5"
                        style={{ color: val >= 75 ? '#5b9e6e' : val >= 60 ? '#4ecdc4' : '#c4a030' }}
                      >
                        {val}%
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recommendations */}
              <div>
                <div className="section-label mb-2">3. Priority remediation items</div>
                <div className="space-y-1.5">
                  {(selectedReport.recommendations || []).map((rec, i) => (
                    <div key={i} className="panel-nested p-3 text-[12px] flex items-start gap-3">
                      <span
                        className="w-5 h-5 rounded-sm border flex items-center justify-center shrink-0 font-mono font-bold text-[10px]"
                        style={{ color: 'var(--accent-text)', borderColor: 'var(--accent)' }}
                      >
                        {i + 1}
                      </span>
                      <span className="text-[var(--text-secondary)] leading-relaxed">{rec}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="panel p-10 text-center text-[12px] font-mono text-[var(--text-muted)]">
              Select a report to view the compliance dossier.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
