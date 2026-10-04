import React, { useState, useEffect } from 'react';
import { Play, CheckCircle2, AlertTriangle, ShieldCheck, FileCode, ArrowRight } from 'lucide-react';
import { api } from '../api/client';

const STATUS_BADGE = {
  approved:  { color: '#5b9e6e', border: '#1e6035', label: 'Approved'  },
  validated: { color: '#4ecdc4', border: '#0f7a72', label: 'Validated' },
  simulated: { color: '#c4a030', border: '#7a6020', label: 'Simulated' },
  pending:   { color: '#6b6b68', border: '#38383c', label: 'Pending'   },
};

const PIPELINE_STEPS = [
  'Violation detected',
  'Vendor fix preview',
  'Dry-run simulation',
  'Policy validation',
  'Manual sign-off',
];

export default function RemediationSimulator({ selectedFindingFromOtherTab }) {
  const [plans, setPlans] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [simulating, setSimulating] = useState(false);
  const [validating, setValidating] = useState(false);
  const [approving, setApproving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchPlans(); }, []);

  const fetchPlans = async () => {
    setLoading(true);
    try {
      const data = await api.getRemediations();
      setPlans(data || []);
      if (data?.length > 0) setSelectedPlan(data[0]);
    } catch {
      /* no-op */
    } finally {
      setLoading(false);
    }
  };

  const handleSimulate = async () => {
    if (!selectedPlan) return;
    setSimulating(true);
    try {
      const res = await api.simulateRemediation(selectedPlan.remediation_id);
      setSelectedPlan({ ...selectedPlan, status: 'simulated', simulation_result: res.simulation_output });
      fetchPlans();
    } catch (e) { alert('Simulation error: ' + e.message); }
    finally { setSimulating(false); }
  };

  const handleValidate = async () => {
    if (!selectedPlan) return;
    setValidating(true);
    try {
      const res = await api.validateRemediation(selectedPlan.remediation_id);
      setSelectedPlan({ ...selectedPlan, status: 'validated', validation_result: res.validation_output });
      fetchPlans();
    } catch (e) { alert('Validation error: ' + e.message); }
    finally { setValidating(false); }
  };

  const handleApprove = async () => {
    if (!selectedPlan) return;
    setApproving(true);
    try {
      await api.approveRemediation(selectedPlan.remediation_id, 'SOC-Lead-Auditor');
      setSelectedPlan({ ...selectedPlan, status: 'approved', approved_by: 'SOC-Lead-Auditor' });
      alert('Remediation plan approved for staged deployment.');
      fetchPlans();
    } catch (e) { alert('Approval error: ' + e.message); }
    finally { setApproving(false); }
  };

  const currentStep = selectedPlan
    ? selectedPlan.status === 'approved'  ? 5
    : selectedPlan.status === 'validated' ? 4
    : selectedPlan.status === 'simulated' ? 3
    : 2
    : 1;

  return (
    <div className="space-y-4 pb-10">
      {/* Header */}
      <div>
        <h1 className="text-[20px] font-bold text-[var(--text-primary)] tracking-tight">Remediation Simulator</h1>
        <p className="text-[12px] text-[var(--text-muted)] mt-0.5 font-mono">
          Finding → fix preview → simulation → validation → approval
        </p>
      </div>

      {/* Pipeline indicator */}
      <div className="panel p-3 flex items-center gap-1 overflow-x-auto">
        {PIPELINE_STEPS.map((step, i) => {
          const stepNum = i + 1;
          const done = currentStep > stepNum;
          const active = currentStep === stepNum;
          return (
            <React.Fragment key={step}>
              <div className={[
                'flex items-center gap-1.5 text-[11px] font-mono whitespace-nowrap px-2 py-1 rounded-sm',
                done   ? 'text-[#5b9e6e]' :
                active ? 'text-[var(--text-primary)] bg-[var(--bg-overlay)]' :
                         'text-[var(--text-muted)]',
              ].join(' ')}>
                <span className={[
                  'w-4 h-4 rounded-sm flex items-center justify-center text-[10px] font-bold border shrink-0',
                  done   ? 'border-[#1e6035] text-[#5b9e6e]' :
                  active ? 'border-[var(--accent)] text-[var(--accent-text)]' :
                           'border-[var(--border)] text-[var(--text-muted)]',
                ].join(' ')}>
                  {done ? '✓' : stepNum}
                </span>
                {step}
              </div>
              {i < PIPELINE_STEPS.length - 1 && (
                <ArrowRight className="w-3 h-3 text-[var(--border-muted)] shrink-0" aria-hidden="true" />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Split: catalog + inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
        {/* Plans list */}
        <div className="lg:col-span-5 panel p-4 space-y-2">
          <span className="section-label">Remediation catalog ({plans.length})</span>
          <div className="space-y-1.5 max-h-[600px] overflow-y-auto mt-2">
            {loading ? (
              [...Array(4)].map((_, i) => (
                <div key={i} className="panel-nested p-3">
                  <div className="skeleton h-3 w-3/4 mb-2" />
                  <div className="skeleton h-2.5 w-1/2" />
                </div>
              ))
            ) : plans.length === 0 ? (
              <div className="py-6 text-center text-[12px] font-mono text-[var(--text-muted)]">
                No remediation plans. Run an audit first.
              </div>
            ) : (
              plans.map((p) => {
                const sel = selectedPlan?.remediation_id === p.remediation_id;
                const badge = STATUS_BADGE[p.status] || STATUS_BADGE.pending;
                return (
                  <button
                    key={p.remediation_id}
                    onClick={() => setSelectedPlan(p)}
                    className={[
                      'w-full text-left panel-nested p-3 transition-colors cursor-pointer',
                      sel ? 'border-[var(--accent)]' : 'hover:border-[var(--border-muted)]',
                    ].join(' ')}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-[12px] font-medium text-[var(--text-primary)] truncate">{p.title}</span>
                      <span
                        className="text-[9px] font-mono font-bold uppercase border px-1.5 py-0.5 rounded-sm shrink-0"
                        style={{ color: badge.color, borderColor: badge.border }}
                      >
                        {badge.label}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[10px] font-mono text-[var(--text-muted)]">
                      <span className="capitalize">{p.vendor?.replace(/_/g, ' ')}</span>
                      <span style={{ color: p.implementation_risk === 'high' ? '#e54d2e' : '#c4a030' }}>
                        risk: {p.implementation_risk}
                      </span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Inspector */}
        <div className="lg:col-span-7">
          {selectedPlan ? (
            <div className="panel p-4 space-y-4">
              {/* Plan header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[var(--border)]">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1 font-mono text-[11px]">
                    <span
                      className="border px-1.5 py-0.5 rounded-sm uppercase font-bold"
                      style={{ color: '#4ecdc4', borderColor: '#0f7a72' }}
                    >
                      {selectedPlan.vendor?.toUpperCase()}
                    </span>
                    <span className="text-[var(--text-muted)]">
                      impl. risk:{' '}
                      <strong style={{
                        color: selectedPlan.implementation_risk === 'high' ? '#e54d2e' : '#c4a030',
                      }}>
                        {selectedPlan.implementation_risk}
                      </strong>
                    </span>
                  </div>
                  <h3 className="text-[14px] font-bold text-[var(--text-primary)]">{selectedPlan.title}</h3>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button onClick={handleSimulate} disabled={simulating} className="btn btn-secondary">
                    <Play className="w-3.5 h-3.5" aria-hidden="true" />
                    {simulating ? 'Simulating…' : 'Simulate'}
                  </button>
                  <button onClick={handleValidate} disabled={validating} className="btn btn-secondary">
                    <ShieldCheck className="w-3.5 h-3.5" aria-hidden="true" />
                    {validating ? 'Validating…' : 'Validate'}
                  </button>
                  <button
                    onClick={handleApprove}
                    disabled={approving || selectedPlan.status === 'approved'}
                    className="btn btn-primary"
                    style={{ background: '#1e6035', borderColor: '#1e6035' }}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                    {selectedPlan.status === 'approved' ? 'Approved' : 'Approve'}
                  </button>
                </div>
              </div>

              {/* Before / after diff */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <FileCode className="w-3.5 h-3.5 text-[var(--text-muted)]" aria-hidden="true" />
                  <span className="section-label">Config before vs. after</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <div>
                    <div className="section-label mb-1.5" style={{ color: '#e54d2e' }}>Before (misconfigured)</div>
                    <pre className="code-block text-[#f07050] h-32 overflow-auto">
                      {selectedPlan.config_before || '# No baseline specified'}
                    </pre>
                  </div>
                  <div>
                    <div className="section-label mb-1.5" style={{ color: '#5b9e6e' }}>After (remediated)</div>
                    <pre className="code-block text-[#4db878] h-32 overflow-auto">
                      {selectedPlan.config_after || '# No fix specified'}
                    </pre>
                  </div>
                </div>
              </div>

              {/* Steps */}
              {selectedPlan.steps?.length > 0 && (
                <div>
                  <div className="section-label mb-2">Step-by-step commands</div>
                  <div className="space-y-2">
                    {selectedPlan.steps.map((st, i) => (
                      <div key={i} className="panel-nested p-3">
                        <div className="flex justify-between items-center text-[11px] font-mono mb-1.5">
                          <span className="text-[var(--accent-text)] font-semibold">
                            step {st.step_number}: {st.description}
                          </span>
                          <span className="text-[var(--text-muted)] uppercase">[{st.mode || 'global'}]</span>
                        </div>
                        <pre className="code-block text-[11px]">{st.commands}</pre>
                        {st.warning && (
                          <div className="flex items-center gap-1.5 mt-1.5 text-[10px] font-mono" style={{ color: '#c4a030' }}>
                            <AlertTriangle className="w-3 h-3" aria-hidden="true" />
                            {st.warning}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Simulation / validation output */}
              {(selectedPlan.simulation_result || selectedPlan.validation_result) && (
                <div>
                  <div className="section-label mb-1.5">Simulation output</div>
                  <div className="code-block whitespace-pre-wrap">
                    {selectedPlan.simulation_result || selectedPlan.validation_result}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="panel p-10 text-center text-[12px] font-mono text-[var(--text-muted)]">
              Select a remediation plan to preview commands, simulate, and approve.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
