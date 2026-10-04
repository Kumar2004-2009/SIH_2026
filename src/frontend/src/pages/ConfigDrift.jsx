import React, { useState, useEffect } from 'react';
import { Play, PlusCircle, MinusCircle } from 'lucide-react';
import { api } from '../api/client';

const DEFAULT_BASELINE = `hostname Core-RTR-01
service password-encryption
enable secret 5 $1$mERr$hx5rVt7rPNoS4wqbXKX7m0
ip ssh version 2
line vty 0 4
 transport input ssh
 login local`;

const DEFAULT_CURRENT = `hostname Core-RTR-01
no service password-encryption
enable password unencrypted_secret123
line vty 0 4
 transport input telnet
 login
line vty 5 15
 transport input telnet`;

export default function ConfigDrift() {
  const [driftHistory, setDriftHistory] = useState([]);
  const [selectedDrift, setSelectedDrift] = useState(null);
  const [baselineInput, setBaselineInput] = useState(DEFAULT_BASELINE);
  const [currentInput, setCurrentInput] = useState(DEFAULT_CURRENT);
  const [comparing, setComparing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchDrift(); }, []);

  const fetchDrift = async () => {
    setLoading(true);
    try {
      const data = await api.getDriftEntries();
      setDriftHistory(data || []);
      if (data?.length > 0) setSelectedDrift(data[0]);
    } catch {
      /* no-op */
    } finally {
      setLoading(false);
    }
  };

  const handleCompare = async () => {
    setComparing(true);
    try {
      const res = await api.compareConfigs('demo-device-01', baselineInput, currentInput);
      setSelectedDrift(res);
      fetchDrift();
    } catch (e) {
      alert('Comparison failed: ' + e.message);
    } finally {
      setComparing(false);
    }
  };

  return (
    <div className="space-y-4 pb-10">
      {/* Header */}
      <div>
        <h1 className="text-[20px] font-bold text-[var(--text-primary)] tracking-tight">Config Drift</h1>
        <p className="text-[12px] text-[var(--text-muted)] mt-0.5">
          Detect unauthorized changes and security posture regressions against certified baselines
        </p>
      </div>

      {/* Interactive comparison */}
      <div className="panel p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[13px] font-semibold text-[var(--text-primary)]">Configuration comparison</span>
          <button
            id="drift-compare-btn"
            onClick={handleCompare}
            disabled={comparing}
            className="btn btn-primary"
          >
            <Play className="w-3.5 h-3.5" aria-hidden="true" />
            {comparing ? 'Analyzing…' : 'Compare'}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <div className="section-label mb-1.5">Certified baseline</div>
            <textarea
              id="drift-baseline-input"
              rows={8}
              value={baselineInput}
              onChange={(e) => setBaselineInput(e.target.value)}
              className="w-full bg-[var(--bg-base)] border border-[var(--border)] rounded-sm p-3 font-mono text-[11px] text-[var(--text-secondary)] focus:outline-none focus:border-[var(--accent)] leading-relaxed resize-y"
              spellCheck={false}
            />
          </div>
          <div>
            <div className="section-label mb-1.5" style={{ color: '#e54d2e' }}>Audited candidate config</div>
            <textarea
              id="drift-current-input"
              rows={8}
              value={currentInput}
              onChange={(e) => setCurrentInput(e.target.value)}
              className="w-full bg-[var(--bg-base)] border border-[var(--border)] rounded-sm p-3 font-mono text-[11px] text-[var(--text-secondary)] focus:outline-none focus:border-[var(--accent)] leading-relaxed resize-y"
              spellCheck={false}
            />
          </div>
        </div>
      </div>

      {/* Drift result */}
      {selectedDrift && (
        <div className="panel p-4 space-y-4">
          <div className="flex flex-wrap items-center gap-3 pb-3 border-b border-[var(--border)]">
            <span
              className="text-[10px] font-mono font-bold uppercase border px-1.5 py-0.5 rounded-sm"
              style={{
                color: selectedDrift.security_impact === 'negative' ? '#e54d2e' : '#5b9e6e',
                borderColor: selectedDrift.security_impact === 'negative' ? '#8c2519' : '#1e6035',
              }}
            >
              {selectedDrift.security_impact} impact
            </span>
            <span className="text-[12px] font-mono text-[var(--text-muted)]">
              Drift score: <strong className="text-[var(--text-primary)]">{selectedDrift.drift_score}%</strong>
            </span>
            <span className="text-[11px] font-mono text-[var(--text-muted)]">
              {new Date(selectedDrift.created_at).toLocaleString()}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Added */}
            <div>
              <div className="flex items-center gap-1.5 mb-1.5">
                <PlusCircle className="w-3.5 h-3.5" style={{ color: '#5b9e6e' }} aria-hidden="true" />
                <span className="section-label" style={{ color: '#5b9e6e' }}>
                  Added ({selectedDrift.added_lines?.length || 0})
                </span>
              </div>
              <div className="code-block max-h-56 overflow-y-auto">
                {selectedDrift.added_lines?.length > 0 ? (
                  selectedDrift.added_lines.map((l, i) => (
                    <div key={i} style={{ color: '#4db878' }}>+ {l}</div>
                  ))
                ) : (
                  <span className="text-[var(--text-muted)]">No added lines.</span>
                )}
              </div>
            </div>

            {/* Removed */}
            <div>
              <div className="flex items-center gap-1.5 mb-1.5">
                <MinusCircle className="w-3.5 h-3.5" style={{ color: '#e54d2e' }} aria-hidden="true" />
                <span className="section-label" style={{ color: '#e54d2e' }}>
                  Removed ({selectedDrift.removed_lines?.length || 0})
                </span>
              </div>
              <div className="code-block max-h-56 overflow-y-auto">
                {selectedDrift.removed_lines?.length > 0 ? (
                  selectedDrift.removed_lines.map((l, i) => (
                    <div key={i} style={{ color: '#f07050' }}>- {l}</div>
                  ))
                ) : (
                  <span className="text-[var(--text-muted)]">No removed lines.</span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* History */}
      {driftHistory.length > 0 && (
        <div className="panel p-4">
          <div className="section-label mb-2">Drift history ({driftHistory.length})</div>
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Device</th>
                  <th>Impact</th>
                  <th className="text-right">Drift score</th>
                </tr>
              </thead>
              <tbody>
                {driftHistory.slice(0, 10).map((d, i) => (
                  <tr
                    key={i}
                    onClick={() => setSelectedDrift(d)}
                    className={`cursor-pointer ${selectedDrift === d ? 'row-selected' : ''}`}
                  >
                    <td className="font-mono text-[11px]">{new Date(d.created_at).toLocaleString()}</td>
                    <td className="font-mono">{d.device_id}</td>
                    <td>
                      <span
                        className="text-[10px] font-mono font-semibold uppercase"
                        style={{ color: d.security_impact === 'negative' ? '#e54d2e' : '#5b9e6e' }}
                      >
                        {d.security_impact}
                      </span>
                    </td>
                    <td className="text-right font-mono font-bold text-[var(--text-primary)]">
                      {d.drift_score}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
