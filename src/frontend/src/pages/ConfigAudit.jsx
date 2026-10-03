import React, { useState, useEffect } from 'react';
import {
  Upload,
  FileCode2,
  Cpu,
  CheckCircle2,
  ShieldCheck,
  Terminal,
  ArrowRight
} from 'lucide-react';
import { api } from '../api/client';
import SeverityBadge from '../components/SeverityBadge';
import RiskMeter from '../components/RiskMeter';
import ComplianceRing from '../components/ComplianceRing';

export default function ConfigAudit({ setActiveTab }) {
  const [configText, setConfigText] = useState('');
  const [samples, setSamples] = useState([]);
  const [selectedSample, setSelectedSample] = useState('');
  const [vendorDetection, setVendorDetection] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [auditResult, setAuditResult] = useState(null);

  useEffect(() => {
    // Fetch preloaded vendor sample configs
    api.getSampleConfigs()
      .then((data) => {
        setSamples(data || []);
        if (data && data.length > 0) {
          setSelectedSample(data[0].filename);
          setConfigText(data[0].content);
          handleDetect(data[0].content);
        }
      })
      .catch((err) => console.warn('Sample load warning:', err));
  }, []);

  const handleDetect = async (text) => {
    if (!text.trim()) {
      setVendorDetection(null);
      return;
    }
    try {
      const res = await api.detectVendor(text);
      setVendorDetection(res);
    } catch (e) {
      console.warn('Detection failed:', e);
    }
  };

  const handleSampleChange = (e) => {
    const filename = e.target.value;
    setSelectedSample(filename);
    const chosen = samples.find((s) => s.filename === filename);
    if (chosen) {
      setConfigText(chosen.content);
      handleDetect(chosen.content);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const res = await api.uploadConfigFile(file);
      setConfigText(res.raw_config);
      setVendorDetection({
        vendor: res.vendor,
        vendor_name: res.vendor_name,
        line_count: res.line_count,
        redactions_applied: res.redactions_applied,
      });
    } catch (err) {
      alert('Upload failed: ' + err.message);
    }
  };

  const handleRunAudit = async () => {
    if (!configText.trim()) {
      alert('Please enter or select a network configuration');
      return;
    }
    setAnalyzing(true);
    setAuditResult(null);

    try {
      const res = await api.executeAudit({
        raw_config: configText,
        vendor: vendorDetection?.vendor || 'auto',
        filename: selectedSample || 'uploaded_config.cfg',
        frameworks: ['CIS', 'NIST', 'STIG', 'ISO27001'],
      });
      const fullDetails = await api.getAuditDetails(res.audit_id);
      setAuditResult(fullDetails);
    } catch (err) {
      alert('Audit execution error: ' + err.message);
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="space-y-5 pb-12">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold font-mono tracking-tight text-slate-100 flex items-center gap-2">
          <FileCode2 className="w-5 h-5 text-blue-400" />
          Autonomous Multi-Vendor Configuration Audit Pipeline
        </h1>
        <p className="text-xs text-slate-400 mt-1 font-sans">
          Ingestion → Credential Sanitization → Vendor Detection → NSIR Normalization → Rule-based Compliance & Risk Calculation
        </p>
      </div>

      {/* Input Section: Paste/Upload & Quick Samples */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-8 space-y-4">
          <div className="bg-[#0f1523] border border-slate-800 rounded-lg p-5 space-y-4 shadow-subtle">
            <div className="flex flex-wrap items-center justify-between gap-3">
              {/* Sample Selector */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-slate-400 font-mono">
                  Preset:
                </span>
                <select
                  value={selectedSample}
                  onChange={handleSampleChange}
                  className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-md px-3 py-1.5 font-mono focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                >
                  {samples.map((s) => (
                    <option key={s.filename} value={s.filename}>
                      {s.vendor_name} ({s.filename})
                    </option>
                  ))}
                </select>
              </div>

              {/* Upload Button */}
              <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 cursor-pointer transition-colors">
                <Upload className="w-3.5 h-3.5" />
                <span>Upload Device Config</span>
                <input
                  type="file"
                  onChange={handleFileUpload}
                  className="hidden"
                  accept=".cfg,.txt,.conf,.json,.xml"
                />
              </label>
            </div>

            {/* Config Editor Textarea */}
            <div className="relative">
              <textarea
                value={configText}
                onChange={(e) => {
                  setConfigText(e.target.value);
                  handleDetect(e.target.value);
                }}
                rows={14}
                placeholder="Paste running-configuration from Cisco, Juniper, Fortinet, Palo Alto, Arista, or SONiC here..."
                className="w-full bg-[#080d17] border border-slate-800 rounded-md p-3.5 font-mono text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 leading-relaxed selection:bg-blue-600/30 selection:text-blue-100"
                spellCheck={false}
              />
              <div className="absolute bottom-3 right-3 text-[10px] font-mono text-slate-500 bg-slate-900/90 border border-slate-800 px-2 py-0.5 rounded">
                {configText.split('\n').length} lines • {configText.length} bytes
              </div>
            </div>

            {/* Ingestion Security & Execution Button */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
              <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Auto-Sanitizer Active: Secrets, keys & credentials redacted</span>
              </div>

              <button
                onClick={handleRunAudit}
                disabled={analyzing}
                className="flex items-center justify-center gap-2 px-5 py-2 rounded-md bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-medium text-xs font-mono tracking-wide shadow-sm disabled:opacity-50 cursor-pointer transition-colors shrink-0"
              >
                {analyzing ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Auditing Pipeline...</span>
                  </>
                ) : (
                  <>
                    <Cpu className="w-3.5 h-3.5" />
                    <span>Run Full Audit Pipeline</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Vendor Detection & Pipeline Specs */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-[#0f1523] border border-slate-800 rounded-lg p-5 space-y-4 shadow-subtle">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300 font-mono flex items-center gap-2">
              <Terminal className="w-4 h-4 text-blue-400" />
              Vendor Detection & Sanitization
            </h3>

            {vendorDetection ? (
              <div className="space-y-3 font-mono text-xs">
                <div className="p-3.5 rounded-md bg-slate-900 border border-slate-800">
                  <div className="text-[10px] text-blue-400 uppercase tracking-wider font-semibold">
                    Detected Vendor Fabric
                  </div>
                  <div className="text-sm font-bold text-slate-100 mt-0.5">
                    {vendorDetection.vendor_name}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">
                    Internal Identifier: <code className="text-blue-300">{vendorDetection.vendor}</code>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-center text-xs">
                  <div className="p-2.5 rounded-md bg-slate-900 border border-slate-800">
                    <div className="text-[10px] text-slate-400 uppercase font-medium">Lines Parsed</div>
                    <div className="text-sm font-bold text-slate-200 mt-0.5">
                      {vendorDetection.line_count}
                    </div>
                  </div>
                  <div className="p-2.5 rounded-md bg-slate-900 border border-slate-800">
                    <div className="text-[10px] text-slate-400 uppercase font-medium">Redactions</div>
                    <div className="text-sm font-bold text-emerald-400 mt-0.5">
                      {vendorDetection.redactions_applied} Protected
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-6 text-center text-slate-400 text-xs font-mono border border-dashed border-slate-800 rounded-md">
                Input or select configuration to run real-time vendor detection.
              </div>
            )}

            <div className="pt-3 border-t border-slate-800 text-[11px] text-slate-400 space-y-2">
              <div className="font-semibold text-slate-300 font-mono text-xs">NSIR Normalization Pipeline:</div>
              <ul className="space-y-1 text-slate-400 text-[11px] font-sans">
                <li className="flex items-start gap-1.5">
                  <span className="text-blue-400">•</span>
                  <span>Vendor syntax translated into uniform NSIR</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-blue-400">•</span>
                  <span>Evaluated against CIS & NIST control baselines</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-blue-400">•</span>
                  <span>Topology reachability and lateral movement updated</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-blue-400">•</span>
                  <span>Deterministic CLI remediation synthesized</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Audit Result Display */}
      {auditResult && (
        <div className="bg-[#0f1523] border border-slate-800 rounded-lg p-5 space-y-5 shadow-subtle">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-2 text-emerald-400 text-xs font-mono font-bold">
                <CheckCircle2 className="w-4 h-4" />
                <span>Audit Execution Successfully Completed in {auditResult.audit.duration_ms}ms</span>
              </div>
              <h2 className="text-base font-bold text-slate-100 font-mono mt-1">
                Audit Summary: {auditResult.audit.hostname_detected} ({auditResult.audit.vendor_detected})
              </h2>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                onClick={() => setActiveTab('findings')}
                className="px-3 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-blue-300 text-xs font-mono font-medium transition-colors cursor-pointer"
              >
                Inspect {auditResult.findings?.length || 0} Findings →
              </button>
              <button
                onClick={() => setActiveTab('graph')}
                className="px-3 py-1.5 rounded-md bg-blue-600 hover:bg-blue-500 text-white text-xs font-mono font-medium transition-colors cursor-pointer"
              >
                View Attack Paths →
              </button>
            </div>
          </div>

          {/* Scores Overview */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-slate-900 border border-slate-800 rounded-md p-4 flex items-center gap-4">
              <ComplianceRing score={auditResult.audit.compliance_score} size={76} strokeWidth={7} />
              <div>
                <span className="text-[10px] font-mono text-slate-400 uppercase">Compliance</span>
                <div className="text-xl font-bold text-slate-100 font-mono">
                  {auditResult.audit.compliance_score}%
                </div>
                <span className="text-[10px] text-emerald-400 font-mono">CIS / NIST Baseline</span>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-md p-4 flex flex-col justify-center">
              <RiskMeter score={auditResult.audit.risk_score} />
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-md p-4 flex items-center justify-around text-center">
              <div>
                <span className="text-[10px] font-mono text-rose-400 font-bold block">CRITICAL</span>
                <span className="text-xl font-bold font-mono text-slate-100">
                  {auditResult.audit.critical_count}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-mono text-amber-400 font-bold block">HIGH</span>
                <span className="text-xl font-bold font-mono text-slate-100">
                  {auditResult.audit.high_count}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-mono text-yellow-400 font-bold block">MEDIUM</span>
                <span className="text-xl font-bold font-mono text-slate-100">
                  {auditResult.audit.medium_count}
                </span>
              </div>
            </div>
          </div>

          {/* Findings Table Preview */}
          <div className="space-y-2.5">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300 font-mono">
              Generated Compliance Findings ({auditResult.findings?.length || 0})
            </h3>
            <div className="overflow-x-auto rounded-md border border-slate-800">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-900/90 text-slate-400 border-b border-slate-800 uppercase text-[10px]">
                  <tr>
                    <th className="p-3 font-semibold">Severity</th>
                    <th className="p-3 font-semibold">Control ID</th>
                    <th className="p-3 font-semibold font-sans">Title</th>
                    <th className="p-3 font-semibold">Framework</th>
                    <th className="p-3 font-semibold">Evidence Preview</th>
                    <th className="p-3 text-right font-semibold">Risk Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80 bg-slate-950/60">
                  {auditResult.findings?.map((f) => (
                    <tr key={f.finding_id} className="hover:bg-slate-900/50 transition-colors">
                      <td className="p-3">
                        <SeverityBadge severity={f.severity} />
                      </td>
                      <td className="p-3 text-blue-400 font-semibold">{f.control_id}</td>
                      <td className="p-3 text-slate-200 font-sans font-medium">{f.title}</td>
                      <td className="p-3 text-slate-400">{f.framework}</td>
                      <td className="p-3 text-slate-400 max-w-xs truncate text-[11px]">
                        <code>{f.config_evidence?.split('\n')[0]}</code>
                      </td>
                      <td className="p-3 text-right font-bold text-rose-400">
                        {f.risk_score?.toFixed(1)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
