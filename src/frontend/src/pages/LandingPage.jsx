import React from 'react';
import {
  Shield,
  FileCode2,
  FileCheck2,
  AlertTriangle,
  Network,
  GitCompare,
  Wrench,
  ArrowRight,
  Terminal,
  Lock,
} from 'lucide-react';


const FEATURES = [
  {
    icon: FileCode2,
    title: 'Multi-vendor config audit',
    desc: 'Parse Cisco IOS, Juniper JunOS, Fortinet FortiOS, Palo Alto PAN-OS, Arista EOS and SONiC through a unified IR. Rules evaluated deterministically — no LLM hallucination.',
  },
  {
    icon: FileCheck2,
    title: 'CIS / NIST / STIG / ISO 27001',
    desc: '247 mapped controls across four frameworks. Every finding links to the verbatim config line that triggered it, a confidence score, and a vendor-specific CLI fix.',
  },
  {
    icon: AlertTriangle,
    title: 'Evidence-anchored findings',
    desc: 'Violations carry the exact extracted config block, control ID, risk score (0–10), and a diff-ready remediation command. No summary sentences — raw evidence only.',
  },
  {
    icon: Network,
    title: 'Topological attack-path modeling',
    desc: 'NetworkX graph calculates cross-domain lateral movement, perimeter exposure, and crown-jewel reachability from the live device graph.',
  },
  {
    icon: GitCompare,
    title: 'Config drift detection',
    desc: 'Line-level diff between any two config snapshots. Drift score, security-impact classification, and added/removed directive breakdown per comparison.',
  },
  {
    icon: Wrench,
    title: 'Staged remediation simulator',
    desc: 'Finding → fix preview → dry-run simulation → policy validation → manual approval. Zero-disruption assurance before any change touches production.',
  },
];

const VENDORS = ['Cisco IOS', 'Juniper JunOS', 'Fortinet FortiOS', 'Palo Alto PAN-OS', 'Arista EOS', 'SONiC'];

const STATS = [
  { value: '247', label: 'Compliance controls' },
  { value: '6', label: 'Supported vendors' },
  { value: '4', label: 'Security frameworks' },
  { value: '100%', label: 'Deterministic engine' },
];

export default function LandingPage({ onEnter }) {
  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: 'var(--bg-base)', color: 'var(--text-primary)' }}
    >
      {/* Top bar */}
      <header
        className="h-11 border-b border-[var(--border)] bg-[var(--bg-raised)] px-6 flex items-center justify-between select-none shrink-0"
        role="banner"
      >
        <div className="flex items-center gap-2.5">
          <Shield className="w-4 h-4 text-[var(--accent-text)]" aria-hidden="true" />
          <span className="font-mono text-[13px] font-bold tracking-widest uppercase text-[var(--text-primary)]">
            NETRA
          </span>
          <span className="h-3 w-px bg-[var(--border)] mx-1" />

        </div>
        <button
          id="landing-enter-btn"
          onClick={onEnter}
          className="btn btn-primary"
        >
          <span>Open dashboard</span>
          <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
        </button>
      </header>

      {/* Main content */}
      <main className="flex-1 flex flex-col">

        {/* Hero — two-column: copy + mock terminal */}
        <section className="border-b border-[var(--border)] px-8 py-12 flex flex-col lg:flex-row items-start gap-10">

          {/* Left: copy */}
          <div className="flex-none max-w-[480px]">
            <h1 className="text-[40px] font-bold tracking-tight leading-tight text-[var(--text-primary)] mb-4">
              Network Security<br />
              Compliance Auditor
            </h1>

            <p className="text-[15px] text-[var(--text-secondary)] leading-relaxed mb-8">
              NETRA audits heterogeneous network device configurations against CIS Benchmark,
              NIST SP 800-53, DISA STIG, and ISO/IEC 27001 — producing verbatim config evidence,
              risk scores, and vendor-specific remediation commands without leaving your network perimeter.
            </p>

            <div className="flex flex-wrap items-center gap-3">
              <button
                id="landing-launch-btn"
                onClick={onEnter}
                className="btn btn-primary"
                style={{ padding: '8px 20px', fontSize: 13 }}
              >
                Launch dashboard
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </button>
              <div className="flex items-center gap-1.5 text-[11px] font-mono text-[var(--text-muted)]">
                <Lock className="w-3 h-3" aria-hidden="true" />
                All processing is local — no config data leaves your environment
              </div>
            </div>
          </div>

          {/* Right: mock audit terminal */}
          <div className="flex-1 min-w-0 w-full lg:max-w-none">
            <div
              className="border border-[var(--border)] rounded-sm overflow-hidden"
              style={{ background: 'var(--bg-base)' }}
            >
              {/* Terminal title bar */}
              <div className="flex items-center justify-between px-4 py-2 border-b border-[var(--border)] bg-[var(--bg-raised)]">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10px] text-[var(--text-muted)] uppercase tracking-wide">
                    Audit · cisco_ios · core-rtr-01.cfg
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[10px] font-mono">
                  <span className="status-dot dot-online" />
                  <span className="text-[var(--text-muted)]">3 findings</span>
                </div>
              </div>

              {/* Config lines with inline annotations */}
              <div className="p-4 font-mono text-[11px] leading-[1.8] overflow-x-auto space-y-0">

                {/* normal lines */}
                <div className="text-[var(--text-muted)]">hostname Core-RTR-01</div>
                <div className="text-[var(--text-muted)]">version 15.7</div>
                <div className="text-[var(--text-muted)]">service timestamps debug datetime msec</div>

                {/* finding 1 — critical */}
                <div className="flex items-start gap-3 -mx-4 px-4 py-0.5 bg-[#3b1712]">
                  <span className="text-[#f07050] select-all whitespace-nowrap">no service password-encryption</span>
                  <span className="text-[#8c2519] text-[10px] shrink-0 ml-auto whitespace-nowrap">
                    ↑ CRITICAL · CIS-1.1.1 · risk 9.2
                  </span>
                </div>

                <div className="text-[var(--text-muted)]">!</div>

                {/* finding 2 — critical */}
                <div className="flex items-start gap-3 -mx-4 px-4 py-0.5 bg-[#3b1712]">
                  <span className="text-[#f07050] whitespace-nowrap">enable password c1sc0unencrypted</span>
                  <span className="text-[#8c2519] text-[10px] shrink-0 ml-auto whitespace-nowrap">
                    ↑ CRITICAL · CIS-1.1.3 · risk 9.7
                  </span>
                </div>

                <div className="text-[var(--text-muted)]">!</div>
                <div className="text-[var(--text-muted)]">interface GigabitEthernet0/0</div>
                <div className="text-[var(--text-muted)] pl-4">ip address 203.0.113.1 255.255.255.0</div>
                <div className="text-[var(--text-muted)] pl-4">no shutdown</div>
                <div className="text-[var(--text-muted)]">!</div>

                {/* finding 3 — high */}
                <div className="flex items-start gap-3 -mx-4 px-4 py-0.5 bg-[#381a10]">
                  <span className="text-[#e09050] whitespace-nowrap">line vty 0 4</span>
                  <span className="text-[#8b4015] text-[10px] shrink-0 ml-auto whitespace-nowrap">
                    ↑ HIGH · NIST-AC-17 · risk 7.8
                  </span>
                </div>
                <div className="flex items-start gap-3 -mx-4 px-4 py-0.5 bg-[#381a10]">
                  <span className="text-[#e09050] pl-4 whitespace-nowrap"> transport input telnet</span>
                  <span className="text-[#8b4015] text-[10px] shrink-0 ml-auto whitespace-nowrap">
                    unencrypted mgmt plane
                  </span>
                </div>

                <div className="text-[var(--text-muted)]">!</div>
                <div className="text-[var(--text-muted)]">ip ssh version 2</div>
                <div className="text-[var(--text-muted)]">ip ssh time-out 60</div>
                <div className="text-[var(--text-muted)]">ip ssh authentication-retries 3</div>
              </div>

              {/* Summary footer */}
              <div className="border-t border-[var(--border)] px-4 py-2.5 bg-[var(--bg-raised)] flex items-center justify-between text-[10px] font-mono">
                <div className="flex items-center gap-4 text-[var(--text-muted)]">
                  <span>
                    <span className="text-[#f07050] font-bold">2 critical</span>
                    {' · '}
                    <span className="text-[#e09050] font-bold">1 high</span>
                    {' · compliance 61.4%'}
                  </span>
                </div>
                <span className="text-[var(--text-muted)]">Cisco IOS 15.7 · 142 lines · 4 redactions</span>
              </div>
            </div>
          </div>

        </section>


        {/* Stats row */}
        <section className="border-b border-[var(--border)] px-8 py-6">
          <div className="flex flex-wrap gap-8">
            {STATS.map(({ value, label }) => (
              <div key={label}>
                <div className="text-[28px] font-bold font-mono text-[var(--text-primary)] leading-none">
                  {value}
                </div>
                <div className="text-[11px] text-[var(--text-muted)] mt-1">{label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Feature grid — 2-col, asymmetric */}
        <section className="px-8 py-10 border-b border-[var(--border)]">
          <h2 className="text-[13px] font-semibold text-[var(--text-primary)] mb-6 uppercase tracking-wider font-mono">
            Capabilities
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-0 border border-[var(--border)] rounded-sm overflow-hidden">
            {FEATURES.map(({ icon: Icon, title, desc }, i) => (
              <div
                key={title}
                className="p-5 border-r border-b border-[var(--border)] last:border-r-0 hover:bg-[var(--bg-raised)] transition-colors"
                style={{
                  borderRight: (i + 1) % 3 === 0 ? 'none' : undefined,
                }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <Icon className="w-4 h-4 shrink-0" style={{ color: 'var(--accent-text)' }} aria-hidden="true" />
                  <span className="text-[13px] font-semibold text-[var(--text-primary)]">{title}</span>
                </div>
                <p className="text-[12px] text-[var(--text-muted)] leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Supported vendors + pipeline */}
        <section className="px-8 py-8 grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Vendors */}
          <div>
            <h2 className="section-label mb-3">Supported network fabrics</h2>
            <div className="flex flex-wrap gap-2">
              {VENDORS.map((v) => (
                <span
                  key={v}
                  className="text-[11px] font-mono text-[var(--text-secondary)] border border-[var(--border)] px-2.5 py-1 rounded-sm bg-[var(--bg-raised)]"
                >
                  {v}
                </span>
              ))}
            </div>
            <p className="text-[11px] text-[var(--text-muted)] mt-3">
              Vendor syntax is translated to a Normalized Security IR (NSIR) before rule evaluation,
              so control logic is identical regardless of device OS.
            </p>
          </div>

          {/* Pipeline */}
          <div>
            <h2 className="section-label mb-3">Audit pipeline</h2>
            <div className="space-y-2">
              {[
                ['01', 'Ingestion', 'Raw config paste or file upload'],
                ['02', 'Sanitization', 'Secrets, keys and credentials redacted'],
                ['03', 'Vendor detection', 'Signature-based OS fingerprinting'],
                ['04', 'NSIR normalization', 'Vendor syntax → uniform IR'],
                ['05', 'Rule evaluation', '247 controls across CIS / NIST / STIG / ISO'],
                ['06', 'Risk scoring', 'Composite formula: criticality × reachability × severity'],
                ['07', 'Remediation', 'Vendor-specific CLI fix generated per finding'],
              ].map(([num, step, detail]) => (
                <div key={num} className="flex items-start gap-3 text-[12px]">
                  <span className="font-mono text-[var(--text-muted)] shrink-0 w-5">{num}</span>
                  <div>
                    <span className="font-semibold text-[var(--text-primary)]">{step}</span>
                    <span className="text-[var(--text-muted)] ml-2">— {detail}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA bar */}
        <section className="mt-auto border-t border-[var(--border)] px-8 py-5 flex items-center justify-between bg-[var(--bg-raised)]">
          <div className="flex items-center gap-2 text-[11px] font-mono text-[var(--text-muted)]">
            <Terminal className="w-3.5 h-3.5" aria-hidden="true" />
            <span>NETRA v1.0.0 · Deterministic engine · No cloud dependencies</span>
          </div>
          <button
            onClick={onEnter}
            className="btn btn-primary"
          >
            Open dashboard →
          </button>
        </section>
      </main>
    </div>
  );
}
