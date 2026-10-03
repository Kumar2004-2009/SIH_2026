import React, { useState, useEffect } from 'react';
import {
  Wrench,
  CheckCircle2,
  AlertTriangle,
  Play,
  ShieldCheck,
  FileCode,
  ArrowRight,
  Cpu
} from 'lucide-react';
import { api } from '../api/client';

export default function RemediationSimulator({ selectedFindingFromOtherTab }) {
  const [plans, setPlans] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [simulating, setSimulating] = useState(false);
  const [validating, setValidating] = useState(false);
  const [approving, setApproving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    setLoading(true);
    try {
      const data = await api.getRemediations();
      setPlans(data || []);
      if (data && data.length > 0) {
        setSelectedPlan(data[0]);
      }
    } catch (e) {
      console.error('Failed to load remediation plans:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSimulate = async () => {
    if (!selectedPlan) return;
    setSimulating(true);
    try {
      const res = await api.simulateRemediation(selectedPlan.remediation_id);
      setSelectedPlan({
        ...selectedPlan,
        status: 'simulated',
        simulation_result: res.simulation_output,
      });
      fetchPlans();
    } catch (e) {
      alert('Simulation error: ' + e.message);
    } finally {
      setSimulating(false);
    }
  };

  const handleValidate = async () => {
    if (!selectedPlan) return;
    setValidating(true);
    try {
      const res = await api.validateRemediation(selectedPlan.remediation_id);
      setSelectedPlan({
        ...selectedPlan,
        status: 'validated',
        validation_result: res.validation_output,
      });
      fetchPlans();
    } catch (e) {
      alert('Validation error: ' + e.message);
    } finally {
      setValidating(false);
    }
  };

  const handleApprove = async () => {
    if (!selectedPlan) return;
    setApproving(true);
    try {
      await api.approveRemediation(selectedPlan.remediation_id, 'SOC-Lead-Auditor');
      setSelectedPlan({
        ...selectedPlan,
        status: 'approved',
        approved_at: new Date().toISOString(),
        approved_by: 'SOC-Lead-Auditor',
      });
      alert('Remediation plan approved for staged maintenance deployment window.');
      fetchPlans();
    } catch (e) {
      alert('Approval error: ' + e.message);
    } finally {
      setApproving(false);
    }
  };

  return (
    <div className="space-y-5 pb-12">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold font-mono tracking-tight text-slate-100 flex items-center gap-2">
          <Wrench className="w-5 h-5 text-emerald-400" />
          Remediation Simulator & Staged Change Control
        </h1>
        <p className="text-xs text-slate-400 mt-1 font-sans">
          Zero-Disruption Assurance Pipeline: <code className="text-blue-300 font-mono">Finding → Fix Preview → Simulation → Validation → Human Approval</code>
        </p>
      </div>

      {/* Workflow Indicator */}
      <div className="bg-[#0f1523] border border-slate-800 rounded-lg p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs font-mono shadow-subtle">
        <div className="flex items-center gap-2">
          <span className="w-5 h-5 rounded bg-blue-950/80 text-blue-400 border border-blue-800/60 flex items-center justify-center font-bold text-[10px]">1</span>
          <span className="text-slate-300 font-medium font-sans">Violation Detected</span>
        </div>
        <ArrowRight className="w-3.5 h-3.5 text-slate-600 hidden sm:block" />
        <div className="flex items-center gap-2">
          <span className="w-5 h-5 rounded bg-blue-950/80 text-blue-400 border border-blue-800/60 flex items-center justify-center font-bold text-[10px]">2</span>
          <span className="text-slate-300 font-medium font-sans">Vendor Fix Preview</span>
        </div>
        <ArrowRight className="w-3.5 h-3.5 text-slate-600 hidden sm:block" />
        <div className="flex items-center gap-2">
          <span className="w-5 h-5 rounded bg-blue-950/80 text-blue-400 border border-blue-800/60 flex items-center justify-center font-bold text-[10px]">3</span>
          <span className="text-slate-300 font-medium font-sans">Dry-Run Simulation</span>
        </div>
        <ArrowRight className="w-3.5 h-3.5 text-slate-600 hidden sm:block" />
        <div className="flex items-center gap-2">
          <span className="w-5 h-5 rounded bg-blue-950/80 text-blue-400 border border-blue-800/60 flex items-center justify-center font-bold text-[10px]">4</span>
          <span className="text-slate-300 font-medium font-sans">Policy Validation</span>
        </div>
        <ArrowRight className="w-3.5 h-3.5 text-slate-600 hidden sm:block" />
        <div className="flex items-center gap-2">
          <span className="w-5 h-5 rounded bg-emerald-950/80 text-emerald-400 border border-emerald-800/60 flex items-center justify-center font-bold text-[10px]">5</span>
          <span className="text-emerald-400 font-medium font-sans">Manual Sign-Off</span>
        </div>
      </div>

      {/* Main Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Side: Plans Queue */}
        <div className="lg:col-span-5 bg-[#0f1523] border border-slate-800 rounded-lg p-4 space-y-3 shadow-subtle">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-300 font-mono">
            Remediation Catalog ({plans.length})
          </h2>

          <div className="space-y-2 max-h-[640px] overflow-y-auto">
            {plans.map((p) => {
              const isSelected = selectedPlan?.remediation_id === p.remediation_id;
              return (
                <div
                  key={p.remediation_id}
                  onClick={() => setSelectedPlan(p)}
                  className={`p-3 rounded-md border text-xs font-mono cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-slate-900 border-blue-500/80'
                      : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="font-semibold text-slate-100 font-sans truncate">{p.title}</span>
                    <span
                      className={`text-[9px] px-1.5 py-0.2 rounded uppercase font-semibold border ${
                        p.status === 'approved'
                          ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800/60'
                          : p.status === 'validated'
                          ? 'bg-blue-950/60 text-blue-300 border-blue-800/60'
                          : 'bg-slate-800 text-slate-400 border-slate-700'
                      }`}
                    >
                      {p.status}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-[10px] text-slate-400 mt-1 font-mono">
                    <span className="capitalize">{p.vendor?.replace('_', ' ')}</span>
                    <span className="text-amber-400 uppercase font-medium">
                      Risk: {p.implementation_risk}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Side: Active Remediation Inspector & Simulator */}
        <div className="lg:col-span-7 space-y-4">
          {selectedPlan ? (
            <div className="bg-[#0f1523] border border-slate-800 rounded-lg p-5 space-y-5 shadow-subtle">
              {/* Header Info */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-slate-800">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-blue-950 text-blue-400 border border-blue-800">
                      {selectedPlan.vendor?.toUpperCase()}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                      Implementation Risk: <strong className="text-amber-400 capitalize">{selectedPlan.implementation_risk}</strong>
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-100 font-sans">
                    {selectedPlan.title}
                  </h3>
                </div>

                {/* Workflow Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={handleSimulate}
                    disabled={simulating}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-blue-300 border border-slate-700 text-xs font-mono font-medium transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    <Play className="w-3.5 h-3.5" />
                    <span>{simulating ? 'Simulating...' : 'Simulate'}</span>
                  </button>

                  <button
                    onClick={handleValidate}
                    disabled={validating}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-blue-600 hover:bg-blue-500 text-white text-xs font-mono font-medium transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>{validating ? 'Validating...' : 'Validate'}</span>
                  </button>

                  <button
                    onClick={handleApprove}
                    disabled={approving || selectedPlan.status === 'approved'}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-mono font-bold tracking-wide transition-colors shadow-sm disabled:opacity-40 cursor-pointer"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{selectedPlan.status === 'approved' ? 'Approved' : 'Approve Plan'}</span>
                  </button>
                </div>
              </div>

              {/* Before vs After Configuration Diff Comparison */}
              <div className="space-y-2">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-300 font-mono flex items-center gap-2">
                  <FileCode className="w-4 h-4 text-blue-400" />
                  Configuration Before vs After Hardening
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* Before */}
                  <div className="space-y-1">
                    <span className="text-[10px] font-mono font-semibold text-rose-400 uppercase">
                      Current Misconfiguration (Before)
                    </span>
                    <pre className="bg-[#080d17] border border-slate-800 rounded-md p-3 font-mono text-xs text-rose-300 overflow-x-auto h-36 leading-relaxed">
                      {selectedPlan.config_before || '# No before config specified'}
                    </pre>
                  </div>

                  {/* After */}
                  <div className="space-y-1">
                    <span className="text-[10px] font-mono font-semibold text-emerald-400 uppercase">
                      Remediated Configuration (After)
                    </span>
                    <pre className="bg-[#080d17] border border-slate-800 rounded-md p-3 font-mono text-xs text-emerald-300 overflow-x-auto h-36 leading-relaxed">
                      {selectedPlan.config_after || '# No after config specified'}
                    </pre>
                  </div>
                </div>
              </div>

              {/* Step-by-Step Vendor Commands */}
              {selectedPlan.steps && selectedPlan.steps.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-300 font-mono">
                    Step-by-Step Command Sequence
                  </h4>
                  <div className="space-y-2">
                    {selectedPlan.steps.map((st, i) => (
                      <div key={i} className="p-3 rounded-md bg-slate-900 border border-slate-800 text-xs font-mono space-y-1">
                        <div className="flex justify-between text-slate-400 text-[10px]">
                          <span className="text-blue-400 font-semibold">STEP {st.step_number}: {st.description}</span>
                          <span className="uppercase text-slate-500 font-mono">[{st.mode || 'global'}]</span>
                        </div>
                        <pre className="text-slate-200 bg-[#080d17] p-2.5 rounded text-[11px] overflow-x-auto border border-slate-800/80">
                          {st.commands}
                        </pre>
                        {st.warning && (
                          <div className="text-[10px] text-amber-400 flex items-center gap-1 mt-1">
                            <AlertTriangle className="w-3 h-3" />
                            <span>Warning: {st.warning}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Simulation / Validation Results Terminal */}
              {(selectedPlan.simulation_result || selectedPlan.validation_result) && (
                <div className="p-4 rounded-md bg-[#080d17] border border-slate-800 font-mono text-xs space-y-1.5">
                  <div className="text-[10px] text-blue-400 uppercase font-semibold tracking-wider flex items-center gap-1.5">
                    <Cpu className="w-3.5 h-3.5" />
                    Simulation & Verification Results
                  </div>
                  <pre className="text-slate-300 text-[11px] whitespace-pre-wrap leading-relaxed">
                    {selectedPlan.simulation_result || selectedPlan.validation_result}
                  </pre>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-[#0f1523] border border-slate-800 rounded-lg p-12 text-center text-slate-500 text-xs font-mono">
              Select a remediation plan on the left to preview commands, run simulated validation, and approve safe changes.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
