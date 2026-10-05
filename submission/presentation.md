# CyberRisk — SIH 2026 Final Presentation

> **Presentation File:** [`CyberRisk_SIH2026_PS26105.pptx`](./CyberRisk_SIH2026_PS26105.pptx)  
> **View Online:** [CyberRisk – SIH 2026 Presentation (Google Slides)](https://docs.google.com/presentation/d/1kFNdOnq_58WXc2N5U5vAFDqcPCg7GH4K/edit?usp=drive_link&ouid=107789024506582723682&rtpof=true&sd=true)

---

## Submission Metadata

| Field | Value |
|---|---|
| **Project Title** | CyberRisk – FAIR-Based Cyber Risk Quantification & Investment Optimization Platform |
| **PS ID** | 26105 |
| **PS Title** | AI-Powered Continuous Cyber Risk Quantification and Investment Optimization Platform |
| **Theme** | Blockchain & Cybersecurity |
| **Category** | Software |
| **Team Name** | Private Keys |

---

## Slide Outline

The presentation follows the official SIH 2026 idea-presentation format across **6 slides**.

---

### Slide 1 — Title Slide

| Field | Value |
|---|---|
| PS ID | 26105 |
| PS Title | AI-Powered Continuous Cyber Risk Quantification and Investment Optimization Platform |
| Theme | Blockchain & Cybersecurity |
| Category | Software |
| Team Name | Private Keys |

---

### Slide 2 — Idea Title / Proposed Solution

#### The Problem

Modern organizations face a fundamental disconnect between cybersecurity and financial decision-making. Security teams rely on qualitative severity ratings (High / Medium / Low) that fail to communicate **monetary risk** to executives, boards, and audit committees. This leads to:

- Arbitrary, gut-feel security budget allocations.
- Inability to justify ROI on security investments.
- Compliance frameworks (RBI, SEBI, ISO 27001, NIST CSF) demanding quantifiable risk posture — which organizations cannot provide.
- Critical vulnerabilities deprioritized because their financial impact is invisible.

#### The Proposed Solution

**CyberRisk** is an AI-powered, continuous cyber risk quantification and investment optimization platform built on three pillars:

1. **FAIR (Factor Analysis of Information Risk)** — Translates threat scenarios into probabilistic monetary loss distributions, replacing qualitative labels with dollar-denominated risk.
2. **Monte Carlo Simulation** — Runs tens of thousands of stochastic simulations per threat scenario to model the full loss exceedance curve (5th–95th percentile), capturing tail risk that deterministic scores miss.
3. **Integer Linear Programming (ILP)** — Solves the security investment allocation problem as a constrained optimization: maximize risk reduction per dollar spent, subject to budget limits, control dependencies, and regulatory mandates.

#### How It Addresses the Problem

| Problem | CyberRisk Solution |
|---|---|
| Qualitative risk scores | FAIR-based ALE (Annualized Loss Expectancy) in USD |
| No ROI visibility | ILP-optimized control portfolio with explicit risk reduction per dollar |
| Compliance gaps | Pre-mapped controls to RBI, SEBI, ISO 27001, NIST CSF |
| Static point-in-time assessments | Continuous telemetry ingestion → real-time risk score updates |
| Board-level communication gap | Executive dashboards with financial loss projections, not severity heat maps |

#### Innovation & Uniqueness

- **First platform** to combine FAIR + Monte Carlo + ILP in a unified, automated pipeline — no manual spreadsheets.
- **EPSS integration** — Uses Exploit Prediction Scoring System probabilities as live threat event frequency inputs, replacing static assumptions.
- **AI-driven narrative layer** — LLM generates board-ready natural language risk summaries from raw simulation outputs.
- **Continuous, not periodic** — Ingests SIEM telemetry, CVE feeds, and asset inventory in real time to keep risk models current.

---

### Slide 3 — Technical Approach

#### System Architecture

```
Raw Telemetry & Feeds
        │
        ▼
┌───────────────────────────────────────────────────┐
│  Ingestion Layer                                  │
│  SIEM events · CVE/NVD feeds · EPSS scores        │
│  Asset inventory · CMDB · Threat intel            │
└───────────────┬───────────────────────────────────┘
                │
                ▼
┌───────────────────────────────────────────────────┐
│  FAIR Risk Model Engine                           │
│  TEF · VULN · LEF · LM → Loss Distribution       │
└───────────────┬───────────────────────────────────┘
                │
                ▼
┌───────────────────────────────────────────────────┐
│  Monte Carlo Simulation (10,000+ iterations)      │
│  Annualized Loss Expectancy · Percentile curves   │
│  Value-at-Risk (95th pct) · Tail risk modeling    │
└───────────────┬───────────────────────────────────┘
                │
                ▼
┌───────────────────────────────────────────────────┐
│  ILP Investment Optimizer                         │
│  Maximize risk reduction subject to:              │
│    • Budget constraints                           │
│    • Control dependency graph                     │
│    • Regulatory mandates (RBI / SEBI / ISO 27001) │
└───────────────┬───────────────────────────────────┘
                │
                ▼
┌───────────────────────────────────────────────────┐
│  Presentation Layer                               │
│  Executive Dashboard · CISO Reports               │
│  Board-Ready AI Narratives · Compliance Export    │
└───────────────────────────────────────────────────┘
```

#### Implementation Process

1. **Data Ingestion** — Normalize SIEM logs, CVE feeds, EPSS scores, and asset data into a unified risk data model.
2. **FAIR Parameterization** — Auto-populate FAIR input distributions (TEF, Vulnerability, Loss Magnitude) from telemetry and threat intel.
3. **Simulation** — Run Monte Carlo simulations per threat scenario; compute ALE, VaR, and loss exceedance curves.
4. **Optimization** — Feed simulation outputs into the ILP solver with the current control inventory and budget as constraints.
5. **Reporting** — Generate financial risk statements, investment recommendation reports, and compliance gap analyses.

#### Technology Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18, Vite, Tailwind CSS, Recharts / D3.js |
| **Backend** | Python 3.11+, FastAPI, Pydantic v2 |
| **Simulation Engine** | NumPy, SciPy (Monte Carlo), PuLP / OR-Tools (ILP) |
| **Database** | MongoDB (risk scenarios, simulation results, audit logs) |
| **AI / NLP Layer** | Google Gemini 1.5 Flash (narrative generation) |
| **Data Feeds** | NVD/CVE API, EPSS API, MITRE ATT&CK |
| **Compliance Mapping** | RBI Cybersecurity Framework, SEBI CSCRF, ISO/IEC 27001, NIST CSF |

---

### Slide 4 — Feasibility and Viability

#### Technical Feasibility

| Aspect | Assessment |
|---|---|
| FAIR methodology | Open standard; well-documented by the FAIR Institute; implementation is deterministic |
| Monte Carlo simulation | Mature Python ecosystem (NumPy/SciPy); 10,000 iterations run in < 2 seconds per scenario |
| ILP optimization | PuLP / OR-Tools are production-grade solvers; problems of realistic scale (hundreds of controls) solve in milliseconds |
| LLM integration | Gemini API is production-ready; offline fallback via deterministic templates |
| Real-time telemetry | Standard SIEM webhook/API integration patterns |

#### Data Feasibility

| Data Source | Availability |
|---|---|
| CVE / NVD feeds | Public API — free, real-time |
| EPSS scores | Public API (FIRST.org) — daily updates |
| MITRE ATT&CK | Public knowledge base — machine-readable STIX format |
| Asset inventory | Customer-provided (CMDB export or agent-based discovery) |
| Historical loss data | Open-source datasets (Advisen, ORX); FAIR community benchmarks |

#### Deployment Feasibility

- **SaaS model:** Cloud-hosted with tenant isolation — no on-premises hardware required.
- **On-premises option:** Docker Compose or Kubernetes deployment for air-gapped, sovereign environments.
- **Regulatory compliance:** Data residency options available for RBI/SEBI-regulated entities.

#### Potential Challenges & Mitigation

| Challenge | Mitigation Strategy |
|---|---|
| FAIR input data quality | Guided elicitation wizard with SME interviews; EPSS as automated TEF proxy |
| Organizational resistance to probabilistic risk | Executive training module; side-by-side comparison with legacy CVSS scoring |
| ILP solver scalability at enterprise scale | Decomposition heuristics; scenario prioritization by business unit |
| LLM hallucination in risk narratives | All narratives are grounded in simulation outputs; citations to source data included |
| Regulatory acceptance of quantitative risk | Aligned with RBI 2023 circular and SEBI CSCRF mandating quantified risk posture |

---

### Slide 5 — Impact and Benefits

#### Impact on CISOs & Security Teams

- **Prioritization clarity:** Replace "fix all Criticals" with "fix the $2.3M ALE scenario first."
- **Resource optimization:** ILP output provides an evidence-based control portfolio — no more gut-feel budget splits.
- **Continuous posture:** Real-time simulation updates when new CVEs or incidents are detected.
- **Scenario planning:** Model the financial impact of a ransomware attack, data breach, or supply-chain compromise before it happens.

#### Impact on Management & Boards

- **Language they understand:** Risk expressed as dollar loss ranges (e.g., "85th percentile loss: $4.7M") not traffic-light heat maps.
- **Investment ROI:** Each recommended security control comes with an explicit **Risk Reduction per Dollar** metric.
- **Fiduciary confidence:** Documented, auditable methodology satisfies due-diligence requirements.
- **Strategic planning:** 3-year security investment roadmap aligned to risk reduction targets.

#### Impact on Compliance & Audit Functions

- **Automated compliance mapping:** Control gaps automatically mapped to RBI, SEBI, ISO 27001, and NIST CSF requirements.
- **Audit-ready reports:** One-click generation of quantified risk dossiers for regulatory submissions.
- **Evidence trail:** Every simulation run is versioned and archived for audit defensibility.

#### Quantified Benefits

| Benefit | Expected Outcome |
|---|---|
| Budget efficiency | 20–35% improvement in risk reduction per rupee spent (ILP vs. ad-hoc allocation) |
| Incident response speed | Risk-ranked asset inventory reduces triage time by ~40% |
| Regulatory preparedness | Continuous compliance monitoring vs. point-in-time audits |
| Board reporting time | Automated narrative generation reduces CISO prep time from days to minutes |

---

### Slide 6 — Research and References

#### Standards & Frameworks

| Standard / Framework | Relevance to CyberRisk |
|---|---|
| **FAIR (Factor Analysis of Information Risk)** | Core risk quantification methodology; Open FAIR standard from The FAIR Institute |
| **EPSS (Exploit Prediction Scoring System)** | Live exploit probability scores used as automated Threat Event Frequency inputs |
| **CVSS (Common Vulnerability Scoring System)** | Baseline vulnerability severity; supplemented (not replaced) by FAIR financial modeling |
| **ISO/IEC 27001:2022** | Information security management controls mapped to investment optimizer |
| **NIST Cybersecurity Framework (CSF) 2.0** | Control library and maturity tiers used in ILP constraint modeling |
| **RBI Cybersecurity Framework (2023)** | Indian banking sector regulatory requirements; compliance gap auto-detection |
| **SEBI CSCRF** | Securities sector cyber resilience requirements; mapped to control portfolio |
| **MITRE ATT&CK** | Threat scenario library for FAIR Threat Event Frequency parameterization |

#### Academic & Industry References

- Freund, J., & Jones, J. (2014). *Measuring and Managing Information Risk: A FAIR Approach.* Butterworth-Heinemann.
- Jacobs, J., et al. (2021). *EPSS: A Data-Driven Approach to Vulnerability Prioritization.* IEEE S&P.
- Gordon, L. A., & Loeb, M. P. (2002). *The Economics of Information Security Investment.* ACM TISSEC.
- NIST SP 800-30 Rev. 1 — Guide for Conducting Risk Assessments.
- NIST SP 800-53 Rev. 5 — Security and Privacy Controls for Information Systems.
- The FAIR Institute — [fairinstitute.org](https://www.fairinstitute.org)
- FIRST EPSS — [first.org/epss](https://www.first.org/epss)
- MITRE ATT&CK — [attack.mitre.org](https://attack.mitre.org)
- RBI Cybersecurity Framework — [rbi.org.in](https://www.rbi.org.in)
- SEBI CSCRF — [sebi.gov.in](https://www.sebi.gov.in)

#### Repository

- **GitHub / Source Code:** Available in this repository under `src/`
- **Documentation:** [`docs/architecture.md`](../docs/architecture.md)
- **Presentation File:** [`submission/CyberRisk_SIH2026_PS26105.pptx`](./CyberRisk_SIH2026_PS26105.pptx)
- **Online Slides:** [Google Slides Link](https://docs.google.com/presentation/d/1mU76mtoaP6jzHIRCLFi07CtqIeqJ1lCu/edit?usp=sharing&ouid=107789024506582723682&rtpof=true&sd=true)

---

*CyberRisk — Team Private Keys | SIH 2026 | PS ID: 26105*
