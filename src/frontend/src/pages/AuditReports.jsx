import React, { useState, useEffect } from 'react';
import {
  FileText,
  Printer,
  Sparkles,
  Calendar
} from 'lucide-react';
import { api } from '../api/client';

export default function AuditReports() {
  const [reports, setReports] = useState([]);
  const [selectedReport, setSelectedReport] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const data = await api.getReports();
      setReports(data || []);
      if (data && data.length > 0) {
        setSelectedReport(data[0]);
      }
    } catch (e) {
      console.error('Failed to load reports:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateReport = async () => {
    setGenerating(true);
    try {
      const newReport = await api.generateReport(
        `NETRA Comprehensive Multi-Vendor Audit Report — ${new Date().toLocaleDateString()}`,
        'executive'
      );
      setReports([newReport, ...reports]);
      setSelectedReport(newReport);
    } catch (e) {
      alert('Report generation failed: ' + e.message);
    } finally {
      setGenerating(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-5 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold font-mono tracking-tight text-slate-100 flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-400" />
            Audit Reports & Executive Compliance Scorecards
          </h1>
          <p className="text-xs text-slate-400 mt-1 font-sans">
            Formal technical & executive compliance documentation for NTRO CISO and SIH review boards
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono font-medium border border-slate-700 transition-colors cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print / PDF</span>
          </button>

          <button
            onClick={handleGenerateReport}
            disabled={generating}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-md bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-mono text-xs font-medium shadow-sm disabled:opacity-50 cursor-pointer transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{generating ? 'Compiling...' : 'Compile Executive Report'}</span>
          </button>
        </div>
      </div>

      {/* Main Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Side: Report Archives */}
        <div className="lg:col-span-4 bg-[#0f1523] border border-slate-800 rounded-lg p-4 space-y-3 shadow-subtle">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-300 font-mono">
            Generated Audits ({reports.length})
          </h2>

          <div className="space-y-2 max-h-[640px] overflow-y-auto">
            {reports.map((r) => {
              const isSelected = selectedReport?.report_id === r.report_id;
              return (
                <div
                  key={r.report_id}
                  onClick={() => setSelectedReport(r)}
                  className={`p-3 rounded-md border text-xs font-mono cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-slate-900 border-blue-500'
                      : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="font-semibold text-slate-100 font-sans text-xs truncate">
                    {r.title}
                  </div>
                  <div className="flex justify-between items-center text-[10px] text-slate-400 mt-2 font-mono">
                    <span>{new Date(r.created_at).toLocaleDateString()}</span>
                    <span className="text-emerald-400 font-semibold">{r.compliance_percentage}% Compliant</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Side: Formal Report Document View */}
        <div className="lg:col-span-8">
          {selectedReport ? (
            <div className="bg-[#0f1523] border border-slate-800 rounded-lg p-6 space-y-5 shadow-subtle text-slate-200">
              {/* Report Header */}
              <div className="border-b border-slate-800 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span className="text-[10px] font-mono uppercase font-bold tracking-wider text-blue-400 px-2 py-0.5 rounded bg-blue-950/80 border border-blue-800/60">
                    OFFICIAL TECHNICAL AUDIT REPORT • NTRO
                  </span>
                  <h2 className="text-lg font-bold font-mono text-slate-100 mt-2">
                    {selectedReport.title}
                  </h2>
                  <div className="flex items-center gap-2 text-xs text-slate-400 font-mono mt-1">
                    <span>Generated by: {selectedReport.generated_by}</span>
                    <span>•</span>
                    <span>Date: {new Date(selectedReport.created_at).toUTCString()}</span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] uppercase font-mono text-slate-400">Posture Score</span>
                  <div className="text-2xl font-bold font-mono text-blue-400">
                    {selectedReport.compliance_percentage}%
                  </div>
                </div>
              </div>

              {/* Metrics Summary Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                <div className="p-3 rounded-md bg-slate-900 border border-slate-800">
                  <span className="text-[10px] font-mono text-slate-400 uppercase">Total Nodes</span>
                  <div className="text-lg font-bold font-mono text-slate-100 mt-0.5">
                    {selectedReport.total_devices} Assets
                  </div>
                </div>
                <div className="p-3 rounded-md bg-slate-900 border border-slate-800">
                  <span className="text-[10px] font-mono text-slate-400 uppercase">Violations</span>
                  <div className="text-lg font-bold font-mono text-rose-400 mt-0.5">
                    {selectedReport.total_findings}
                  </div>
                </div>
                <div className="p-3 rounded-md bg-slate-900 border border-slate-800">
                  <span className="text-[10px] font-mono text-slate-400 uppercase">Mean Risk</span>
                  <div className="text-lg font-bold font-mono text-amber-400 mt-0.5">
                    {selectedReport.overall_risk_score} / 10
                  </div>
                </div>
                <div className="p-3 rounded-md bg-slate-900 border border-slate-800">
                  <span className="text-[10px] font-mono text-slate-400 uppercase">Critical Tier</span>
                  <div className="text-lg font-bold font-mono text-rose-400 mt-0.5">
                    {selectedReport.severity_breakdown?.critical || 0}
                  </div>
                </div>
              </div>

              {/* Executive Summary */}
              <div className="space-y-1.5">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-blue-400 font-mono">
                  1. Executive Summary
                </h3>
                <p className="text-xs font-sans text-slate-300 leading-relaxed bg-[#080d17] p-3.5 rounded-md border border-slate-800">
                  {selectedReport.executive_summary}
                </p>
              </div>

              {/* Framework Compliance Scorecard */}
              <div className="space-y-1.5">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-blue-400 font-mono">
                  2. Standards Alignment Scorecard
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {Object.entries(selectedReport.framework_breakdown || {}).map(([fw, val]) => (
                    <div key={fw} className="p-2.5 rounded-md bg-slate-900 border border-slate-800 text-center font-mono">
                      <div className="text-[11px] text-slate-400">{fw}</div>
                      <div className="text-base font-bold text-slate-100 mt-0.5">{val}%</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Priority Remediation Action Items */}
              <div className="space-y-1.5">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-blue-400 font-mono">
                  3. Priority Remediation Action Items
                </h3>
                <div className="space-y-2">
                  {(selectedReport.recommendations || []).map((rec, i) => (
                    <div
                      key={i}
                      className="p-3 rounded-md bg-[#080d17] border border-slate-800 text-xs font-mono flex items-start gap-2.5"
                    >
                      <span className="w-4 h-4 rounded bg-blue-950/80 text-blue-400 border border-blue-800/60 flex items-center justify-center shrink-0 font-bold text-[10px]">
                        {i + 1}
                      </span>
                      <span className="text-slate-300 font-sans leading-relaxed">{rec}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-[#0f1523] border border-slate-800 rounded-lg p-12 text-center text-slate-500 text-xs font-mono">
              Select or compile a report to inspect the formal compliance dossier.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
