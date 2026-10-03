import React, { useState, useEffect } from 'react';
import {
  GitCompare,
  PlusCircle,
  MinusCircle,
  Play
} from 'lucide-react';
import { api } from '../api/client';

export default function ConfigDrift() {
  const [driftHistory, setDriftHistory] = useState([]);
  const [selectedDrift, setSelectedDrift] = useState(null);
  const [baselineInput, setBaselineInput] = useState(`hostname Core-RTR-01
service password-encryption
enable secret 5 $1$mERr$hx5rVt7rPNoS4wqbXKX7m0
ip ssh version 2
line vty 0 4
 transport input ssh
 login local`);
  const [currentInput, setCurrentInput] = useState(`hostname Core-RTR-01
no service password-encryption
enable password unencrypted_secret123
line vty 0 4
 transport input telnet
 login
line vty 5 15
 transport input telnet`);
  const [comparing, setComparing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDrift();
  }, []);

  const fetchDrift = async () => {
    setLoading(true);
    try {
      const data = await api.getDriftEntries();
      setDriftHistory(data || []);
      if (data && data.length > 0) {
        setSelectedDrift(data[0]);
      }
    } catch (e) {
      console.error('Failed to fetch drift:', e);
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
    <div className="space-y-5 pb-12">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold font-mono tracking-tight text-slate-100 flex items-center gap-2">
          <GitCompare className="w-5 h-5 text-blue-400" />
          Configuration Drift & Integrity Monitor
        </h1>
        <p className="text-xs text-slate-400 mt-1 font-sans">
          Detect unauthorized changes, perimeter configuration decay, and security posture regressions against certified gold baselines
        </p>
      </div>

      {/* Interactive Drift Playground */}
      <div className="bg-[#0f1523] border border-slate-800 rounded-lg p-5 space-y-4 shadow-subtle">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-300 font-mono">
            Interactive Configuration Drift Evaluation
          </h2>
          <button
            onClick={handleCompare}
            disabled={comparing}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-md bg-blue-600 hover:bg-blue-500 text-white font-mono text-xs font-medium shadow-sm disabled:opacity-50 cursor-pointer transition-colors"
          >
            <Play className="w-3.5 h-3.5" />
            <span>{comparing ? 'Analyzing Drift...' : 'Analyze Configuration Drift'}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <span className="text-[10px] font-mono font-semibold text-slate-400 uppercase">
              Certified Golden Baseline Config
            </span>
            <textarea
              rows={7}
              value={baselineInput}
              onChange={(e) => setBaselineInput(e.target.value)}
              className="w-full bg-[#080d17] border border-slate-800 rounded-md p-3 font-mono text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 leading-relaxed selection:bg-blue-600/30 selection:text-blue-100"
              spellCheck={false}
            />
          </div>

          <div className="space-y-1.5">
            <span className="text-[10px] font-mono font-semibold text-rose-400 uppercase">
              Current / Audited Candidate Config
            </span>
            <textarea
              rows={7}
              value={currentInput}
              onChange={(e) => setCurrentInput(e.target.value)}
              className="w-full bg-[#080d17] border border-slate-800 rounded-md p-3 font-mono text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 leading-relaxed selection:bg-blue-600/30 selection:text-blue-100"
              spellCheck={false}
            />
          </div>
        </div>
      </div>

      {/* Drift Details & Diff Viewer */}
      {selectedDrift && (
        <div className="bg-[#0f1523] border border-slate-800 rounded-lg p-5 space-y-5 shadow-subtle">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span
                  className={`text-[10px] font-mono font-semibold px-1.5 py-0.2 rounded uppercase border ${
                    selectedDrift.security_impact === 'negative'
                      ? 'bg-rose-950/60 text-rose-300 border-rose-800/60'
                      : 'bg-emerald-950/60 text-emerald-300 border-emerald-800/60'
                  }`}
                >
                  Impact: {selectedDrift.security_impact}
                </span>
                <span className="text-[10px] font-mono text-slate-400">
                  Calculated Drift Score: <strong className="text-slate-100">{selectedDrift.drift_score}%</strong>
                </span>
              </div>
              <h3 className="text-sm font-bold text-slate-100 font-mono">
                Drift Analysis Report ({new Date(selectedDrift.created_at).toLocaleString()})
              </h3>
            </div>
          </div>

          {/* Additions and Removals */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Added Lines */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs font-mono font-semibold text-emerald-400">
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Added Directives ({selectedDrift.added_lines?.length || 0})</span>
              </div>
              <div className="bg-[#080d17] border border-slate-800 rounded-md p-3 font-mono text-xs space-y-1 max-h-60 overflow-y-auto leading-relaxed">
                {selectedDrift.added_lines?.length > 0 ? (
                  selectedDrift.added_lines.map((l, i) => (
                    <div key={i} className="text-emerald-400">
                      + {l}
                    </div>
                  ))
                ) : (
                  <div className="text-slate-500">No added directives.</div>
                )}
              </div>
            </div>

            {/* Removed Lines */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs font-mono font-semibold text-rose-400">
                <MinusCircle className="w-3.5 h-3.5" />
                <span>Removed Directives ({selectedDrift.removed_lines?.length || 0})</span>
              </div>
              <div className="bg-[#080d17] border border-slate-800 rounded-md p-3 font-mono text-xs space-y-1 max-h-60 overflow-y-auto leading-relaxed">
                {selectedDrift.removed_lines?.length > 0 ? (
                  selectedDrift.removed_lines.map((l, i) => (
                    <div key={i} className="text-rose-400">
                      - {l}
                    </div>
                  ))
                ) : (
                  <div className="text-slate-500">No removed directives.</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
