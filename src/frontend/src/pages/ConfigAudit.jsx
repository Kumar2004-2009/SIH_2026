import React, { useState, useEffect } from 'react';
import { Upload, Cpu, CheckCircle2, ShieldCheck, Terminal, Copy, Check } from 'lucide-react';
import { api } from '../api/client';
import SeverityBadge from '../components/SeverityBadge';
import RiskMeter from '../components/RiskMeter';
import ComplianceRing from '../components/ComplianceRing';

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(text || '');
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
      className="btn btn-ghost p-1"
      title="Copy config"
    >
      {copied ? <Check className="w-3.5 h-3.5 text-[#5b9e6e]" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  );
}

export default function ConfigAudit({ setActiveTab }) {
  const [configText, setConfigText] = useState('');
  const [samples, setSamples] = useState([]);
  const [selectedSample, setSelectedSample] = useState('');
  const [vendorDetection, setVendorDetection] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [auditResult, setAuditResult] = useState(null);

  useEffect(() => {
    api.getSampleConfigs()
      .then((data) => {
        setSamples(data || []);
        if (data?.length > 0) {
          setSelectedSample(data[0].filename);
          setConfigText(data[0].content);
          handleDetect(data[0].content);
        }
      })
      .catch(() => {});
  }, []);

  const handleDetect = async (text) => {
    if (!text.trim()) { setVendorDetection(null); return; }
    try {
      const res = await api.detectVendor(text);
      setVendorDetection(res);
    } catch {}
  };

  const handleSampleChange = (e) => {
    const filename = e.target.value;
    setSelectedSample(filename);
    const chosen = samples.find((s) => s.filename === filename);
    if (chosen) { setConfigText(chosen.content); handleDetect(chosen.content); }
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
    if (!configText.trim()) { alert('Paste or select a configuration first'); return; }
    setAnalyzing(true);
    setAuditResult(null);
    try {
      const res = await api.executeAudit({
        raw_config: configText,
        vendor: vendorDetection?.vendor || 'auto',
        filename: selectedSample || 'uploaded_config.cfg',
        frameworks: ['CIS', 'NIST', 'STIG', 'ISO27001'],
      });
      const full = await api.getAuditDetails(res.audit_id);
      setAuditResult(full);
    } catch (err) {
      alert('Audit failed: ' + err.message);
    } finally {
      setAnalyzing(false);
    }
  };

  const lineCount = configText.split('\n').length;

  return (
    <div className="space-y-4 pb-10">
      {/* Header */}
      <div>
        <h1 className="text-[20px] font-bold text-[var(--text-primary)] tracking-tight">Config Audit</h1>
        <p className="text-[12px] text-[var(--text-muted)] mt-0.5">
          Ingestion → credential sanitization → vendor detection → NSIR normalization → rule evaluation
        </p>
      </div>

      {/* Input + sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
        <div className="lg:col-span-8 panel p-4 space-y-3">
          {/* Controls row */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-[12px] text-[var(--text-muted)] font-mono">Preset:</span>
              <select
                id="audit-sample-select"
                value={selectedSample}
                onChange={handleSampleChange}
                className="form-control"
              >
                {samples.map((s) => (
                  <option key={s.filename} value={s.filename}>
                    {s.vendor_name} — {s.filename}
                  </option>
                ))}
              </select>
            </div>
            <label className="btn btn-secondary cursor-pointer">
              <Upload className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Upload .cfg</span>
              <input
                type="file"
                onChange={handleFileUpload}
                className="hidden"
                accept=".cfg,.txt,.conf,.json,.xml"
              />
            </label>
          </div>

          {/* Editor */}
          <div className="relative">
            <textarea
              id="audit-config-input"
              value={configText}
              onChange={(e) => { setConfigText(e.target.value); handleDetect(e.target.value); }}
              rows={14}
              placeholder="Paste running-configuration from Cisco IOS, Juniper JunOS, Fortinet FortiOS, Palo Alto PAN-OS, Arista EOS, or SONiC…"
              className="w-full bg-[var(--bg-base)] border border-[var(--border)] rounded-sm p-3 font-mono text-[11px] text-[var(--text-secondary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)] leading-relaxed resize-y"
              spellCheck={false}
            />
            <div className="absolute bottom-2 right-2 text-[10px] font-mono text-[var(--text-muted)] bg-[var(--bg-overlay)] border border-[var(--border)] px-2 py-0.5 rounded-sm">
              {lineCount} lines · {configText.length} bytes
            </div>
          </div>

          {/* Footer row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-[11px] text-[var(--text-muted)] font-mono">
              <ShieldCheck className="w-3.5 h-3.5 text-[#5b9e6e]" aria-hidden="true" />
              <span>Auto-sanitizer: secrets and credentials redacted before analysis</span>
            </div>
            <button
              id="audit-run-btn"
              onClick={handleRunAudit}
              disabled={analyzing}
              className="btn btn-primary"
            >
              {analyzing ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Running…</span>
                </>
              ) : (
                <>
                  <Cpu className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Run audit pipeline</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Detection panel */}
        <div className="lg:col-span-4 panel p-4 space-y-4">
          <div className="flex items-center gap-2">
            <Terminal className="w-3.5 h-3.5 text-[var(--text-muted)]" aria-hidden="true" />
            <span className="section-label">Vendor detection</span>
          </div>

          {vendorDetection ? (
            <div className="space-y-3 font-mono text-[12px]">
              <div className="panel-nested p-3">
                <div className="section-label mb-1">Detected fabric</div>
                <div className="text-[14px] font-bold text-[var(--text-primary)]">{vendorDetection.vendor_name}</div>
                <div className="text-[11px] text-[var(--text-muted)] mt-0.5">
                  id: <code className="text-[var(--accent-text)]">{vendorDetection.vendor}</code>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="panel-nested p-2.5 text-center">
                  <div className="section-label">Lines parsed</div>
                  <div className="text-[16px] font-bold text-[var(--text-primary)] mt-1">{vendorDetection.line_count}</div>
                </div>
                <div className="panel-nested p-2.5 text-center">
                  <div className="section-label">Redactions</div>
                  <div className="text-[16px] font-bold mt-1" style={{ color: '#5b9e6e' }}>
                    {vendorDetection.redactions_applied}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="border border-dashed border-[var(--border-muted)] rounded-sm p-5 text-center text-[11px] font-mono text-[var(--text-muted)]">
              Paste or select a config to detect vendor
            </div>
          )}

          <div className="pt-3 border-t border-[var(--border)] space-y-1.5">
            <div className="section-label mb-1.5">NSIR normalization steps</div>
            {[
              'Vendor syntax translated to uniform IR',
              'Evaluated against CIS / NIST baselines',
              'Topology reachability & lateral movement mapped',
              'Deterministic CLI remediation synthesized',
            ].map((step, i) => (
              <div key={i} className="flex items-start gap-2 text-[11px] text-[var(--text-muted)]">
                <span className="font-mono text-[var(--accent-text)] shrink-0">{i + 1}.</span>
                <span>{step}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Audit result */}
      {auditResult && (
        <div className="panel p-4 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[var(--border)]">
            <div>
              <div className="flex items-center gap-2 text-[12px] font-mono mb-1" style={{ color: '#5b9e6e' }}>
                <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
                <span>Completed in {auditResult.audit.duration_ms}ms</span>
              </div>
              <h2 className="text-[16px] font-bold text-[var(--text-primary)] font-mono">
                {auditResult.audit.hostname_detected}
                <span className="text-[var(--text-muted)] font-normal ml-2 text-[13px]">
                  ({auditResult.audit.vendor_detected})
                </span>
              </h2>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setActiveTab('findings')}
                className="btn btn-secondary"
              >
                {auditResult.findings?.length} findings →
              </button>
              <button
                onClick={() => setActiveTab('graph')}
                className="btn btn-primary"
              >
                Attack paths →
              </button>
            </div>
          </div>

          {/* Score strip */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="panel-nested p-3 flex items-center gap-4">
              <ComplianceRing score={auditResult.audit.compliance_score} size={72} strokeWidth={6} />
              <div>
                <div className="section-label">Compliance</div>
                <div className="text-[20px] font-bold font-mono text-[var(--text-primary)] leading-none mt-1">
                  {auditResult.audit.compliance_score}%
                </div>
                <div className="text-[10px] text-[var(--text-muted)] mt-1">CIS / NIST baseline</div>
              </div>
            </div>
            <div className="panel-nested p-3 flex items-center">
              <RiskMeter score={auditResult.audit.risk_score} />
            </div>
            <div className="panel-nested p-3 flex items-center justify-around text-center">
              {[
                { label: 'Critical', count: auditResult.audit.critical_count, color: '#e54d2e' },
                { label: 'High',     count: auditResult.audit.high_count,     color: '#e0813a' },
                { label: 'Medium',   count: auditResult.audit.medium_count,   color: '#c4a030' },
              ].map(({ label, count, color }) => (
                <div key={label}>
                  <div className="text-[10px] font-mono uppercase font-bold" style={{ color }}>{label}</div>
                  <div className="text-[20px] font-bold font-mono text-[var(--text-primary)]">{count}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Findings table */}
          <div>
            <div className="section-label mb-2">
              Generated findings ({auditResult.findings?.length || 0})
            </div>
            <div className="overflow-x-auto rounded-sm border border-[var(--border)]">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Sev</th>
                    <th>Control</th>
                    <th>Title</th>
                    <th>Framework</th>
                    <th>Evidence preview</th>
                    <th className="text-right">Risk</th>
                  </tr>
                </thead>
                <tbody>
                  {auditResult.findings?.map((f) => (
                    <tr key={f.finding_id}>
                      <td><SeverityBadge severity={f.severity} /></td>
                      <td className="font-mono text-[var(--accent-text)] font-semibold">{f.control_id}</td>
                      <td className="text-[var(--text-primary)] font-medium">{f.title}</td>
                      <td className="font-mono text-[var(--text-muted)]">{f.framework}</td>
                      <td className="font-mono text-[var(--text-muted)] max-w-[200px] truncate text-[11px]">
                        {f.config_evidence?.split('\n')[0]}
                      </td>
                      <td className="text-right font-mono font-bold" style={{
                        color: f.risk_score >= 7.5 ? '#e54d2e' : f.risk_score >= 5 ? '#e0813a' : '#c4a030',
                      }}>
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
