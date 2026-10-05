# CyberRisk — SIH 2026 Demo Video

> **Demo Video:** [Watch Demo Video](https://youtu.be/K6duj_CVVWc?si=js-F1sHZp3jwm33M)  


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
| **Demo Type** | Software prototype — screen-recorded walkthrough (no hardware) |
| **Duration** | 3–5 minutes |

---

## Demo Video Overview

The demo is a 3–5 minute screen-recorded walkthrough of the live **CyberRisk** application — not slides. It demonstrates the end-to-end FAIR + Monte Carlo + ILP pipeline on a working prototype.

---

## Walkthrough Breakdown

### Part 1 — The Problem *(≈ 30 sec)*

Enterprises today rate cyber risk as **"Low / Medium / High"** — qualitative labels that cannot answer two critical questions:

- *How much money is actually at stake?*
- *Is current security spend going to the right place?*

CISOs and boards are making multi-million-rupee security investment decisions with no financial grounding, leading to inefficient spend, missed exposures, and inability to satisfy regulatory obligations (RBI, SEBI, ISO 27001).

---

### Part 2 — The Proposed Solution *(≈ 30 sec)*

**CyberRisk** replaces qualitative labels with a rigorous, quantitative pipeline:

1. **FAIR (Factor Analysis of Information Risk)** — Decomposes each threat scenario into probabilistic inputs (Threat Event Frequency, Vulnerability, Loss Magnitude).
2. **Monte Carlo Simulation** — Runs 10,000+ iterations per scenario to produce an **Expected Annual Loss (EAL)** and **Value at Risk (VaR)** in USD/INR.
3. **Integer Linear Programming (ILP)** — Mathematically optimizes the security control portfolio to maximize risk reduction under a defined budget constraint.

The result: a financially grounded, board-ready risk posture with an evidence-backed investment action plan.

---

### Part 3 — Main Features / Workflow *(≈ 90 sec)*

#### Dataset Upload
- Drag-and-drop upload of **5 CSVs, a ZIP archive, or a JSON bundle** covering assets, vulnerabilities, threats, controls, and business units.
- Live **schema validation** with field-level error feedback — no silent failures.
- One-click **demo dataset** to instantly populate the platform without any file preparation.

#### Executive Dashboard
- Organization-wide **EAL and VaR** displayed as financial figures, not severity counts.
- **Risk by Business Unit** — bar/treemap breakdown showing which units carry the most financial exposure.
- **Controls ranked by ROSI (Return on Security Investment)** — immediately surfaces the highest-leverage mitigations.

#### Asset Portfolio Drill-Down
- Tabular view of all assets with per-asset EAL, VaR, and criticality score.
- Click any asset to render its **Loss Exceedance Curve** — a probability-vs-loss-amount chart showing the full tail-risk profile.

#### Investment Optimizer
- Interactive **budget slider** — drag to set the available security budget.
- Live side-by-side **ILP vs. Greedy algorithm comparison** — demonstrates why mathematical optimization outperforms heuristic "fix-the-most-critical-first" approaches.
- Output: a **recommended action plan** listing specific controls to implement, their cost, and their projected ALE reduction.

#### AI Risk Copilot
- Natural-language interface backed by **Google Gemini 1.5 Flash**.
- Live demonstration: a real question about current risk posture is asked and answered in plain English, grounded in the simulation outputs — no hallucinated generalities.

---

### Part 4 — Actual Working Prototype *(≈ 60–90 sec)*

A continuous, uncut screen recording of the live application demonstrating:

```
Upload / Demo Dataset
        ↓
Dashboard loads with real EAL & VaR figures
        ↓
Asset drill-down → Loss Exceedance Curve rendered
        ↓
Investment Optimizer → Set budget → Run ILP solver → Action plan generated
        ↓
AI Risk Copilot → Ask live question → Grounded answer returned
```

> **Note:** All data shown is either a preloaded demo dataset or synthetic data — no production/sensitive information is used in the recording.

---

### Part 5 — Hardware Demonstration

**Not applicable.** CyberRisk is a **software-only platform**. No physical hardware, embedded systems, or IoT devices are involved.

---

## Technical Notes

| Aspect | Detail |
|---|---|
| **Simulation engine** | NumPy / SciPy Monte Carlo — 10,000 iterations per scenario in < 2 seconds |
| **Optimization solver** | PuLP / OR-Tools ILP — solves control portfolio problems in milliseconds |
| **AI backend** | Google Gemini 1.5 Flash with deterministic fallback when no API key is present |
| **Frontend** | React 18 + Vite + Tailwind CSS + Recharts / D3.js |
| **Backend** | Python 3.11+, FastAPI, Pydantic v2, MongoDB |
| **Deployment** | Local dev server (Vite :5173 + Uvicorn :8000); Docker-ready for cloud deployment |

---

## Related Resources

| Resource | Link |
|---|---|
| Demo Video | [Google Drive](https://drive.google.com/file/d/1LIEY0VBkyzE3DaTQHrNVV1_O5LAYs7R6/view?usp=drive_link) |
| Presentation (PPTX) | [`CyberRisk_SIH2026_PS26105.pptx`](./CyberRisk_SIH2026_PS26105.pptx) |
| Presentation (Google Slides) | [View Online](https://docs.google.com/presentation/d/1kFNdOnq_58WXc2N5U5vAFDqcPCg7GH4K/edit?usp=drive_link&ouid=107789024506582723682&rtpof=true&sd=true) |
| Presentation Notes | [`presentation.md`](./presentation.md) |
| System Architecture | [`docs/architecture.md`](../docs/architecture.md) |
| Source Code | [`src/`](../src/) |

---

*CyberRisk — Team Private Keys | SIH 2026 | PS ID: 26105*
