# BLACKBOX X — Visual Design System 2.0 Specification

## 1. Design Philosophy

BLACKBOX X is an institutional-grade quantitative research instrument. Its visual architecture departs from standard consumer financial SaaS (blue tints, card grids, generic dashboards) in favor of an **editorial, deterministic, and precise instrument experience**.

### Core Tenets
1. **Instrument, Not Dashboard**: Every display is an empirical measurement device with explicit tolerances and data provenance.
2. **Editorial Gravitas**: High-impact condensed grotesk typography (`Barlow Condensed`) paired with institutional sans (`Inter`) and tabular monospace (`JetBrains Mono`).
3. **Crimson Authority**: Primary brand accent `#B40023` (Crimson) on warm ivory (`#FAF8F4`) and deep graphite (`#171615`), evoking archival research journals and high-precision financial terminal hardware.
4. **Zero Fabrication**: Clear visual demarcation for deterministic research datasets vs. simulated path distributions.

---

## 2. Color Palette & Design Tokens

### Primary Spectrum
| Token | Hex | Role |
|-------|-----|------|
| `ivory` | `#FAF8F4` | Primary platform canvas background |
| `ivory-100` | `#FAF8F4` | Light container surface |
| `ivory-200` | `#F5F1E8` | Metric callout surfaces, subtle pill backgrounds |
| `ivory-300` | `#EDE7D8` | Active borders and dividers |
| `cream` | `#FCF0D6` | Highlight panels, hero glow accents |
| `graphite` | `#171615` | Primary text, primary CTA buttons, dark mode sections |
| `graphite-600`| `#2E2A26` | Dark surface elevated borders |
| `graphite-400`| `#6B6560` | Secondary copy, metric labels, subtitles |
| `taupe` | `#9E978E` | Inactive borders, muted indicators |

### Brand Accent: Crimson
| Token | Hex | Usage |
|-------|-----|-------|
| `crimson-50` | `#FDF0F2` | Subtle active item backgrounds |
| `crimson-100`| `#FCE0E5` | Active pill badges |
| `crimson-500`| `#B40023` | **Primary Brand Accent**: Active states, focus rings, primary highlights |
| `crimson-600`| `#9E001F` | Hover state for accent buttons |
| `crimson-700`| `#87001A` | Dark borders, active press states |
| `burgundy` | `#520010` | Deep contrast badge background |

### Multi-Asset Palette
| Asset | Hex | Symbol | Role |
|-------|-----|--------|------|
| **Gold** | `#C9A84C` | XAU | Safe haven anchor |
| **Bitcoin** | `#F7931A` | BTC | High-volatility regime driver |
| **NVIDIA** | `#76B900` | NVDA | Alpha momentum vector |

---

## 3. Typography Architecture

### Font Families
- **Display**: `'Barlow Condensed', 'Inter', sans-serif` — Used for uppercase editorial headlines, stage numbers, and section labels.
- **Sans**: `'Inter', system-ui, sans-serif` — Used for body copy, analytical interpretations, and explanatory text.
- **Monospace**: `'JetBrains Mono', monospace` — Used for financial numbers, fingerprints, timestamps, and parameters.

### Hierarchy Classes
- `.display-xl`: 6rem–10rem, bold, uppercase, tracking-tight, leading-none
- `.display-lg`: 3.5rem–5.5rem, bold, uppercase, tracking-tight
- `.display-md`: 2rem–3rem, semibold, uppercase, tracking-tight
- `.bx-eyebrow`: 11px, font-mono, tracking-[0.28em], uppercase, crimson
- `.bx-section-label`: 12px, font-mono, tracking-[0.25em], uppercase, graphite-400
- `.mono-metric`: tabular figures with tight tracking for numerical instrument readouts

---

## 4. Component Library (`src/components/bx/`)

1. **`BxLogo`**: SVG-based geometric mark with crimson diagonal slash and optional sub-label.
2. **`BxMetric`**: Standardized instrument readout with label, value, delta, and semantic polarity.
3. **`BxStatus`**: Monospace research status badges (`SEALED`, `VERIFIED`, `ACTIVE`, `MISMATCH`).
4. **`BxDataBadge`**: Mandatory provenance badge (`DETERMINISTIC RESEARCH DATA` or `SIMULATED DATA · NOT A FORECAST`).
5. **`BxSectionLabel`**: Standardized section header with eyebrow, title, optional badge, and action slot.
6. **`BxPanel`**: Unified card surface with optional crimson left-border accent (`border-l-4 border-l-accent`).
7. **`BxResearchPipeline`**: 6-stage interactive horizontal timeline:
   - `01 QUESTION` → `02 HYPOTHESIS` → `03 EXPERIMENT` → `04 EVIDENCE` → `05 CHALLENGE` → `06 CONCLUSION`

---

## 5. 3D Visualization Experience (`BxKnowledgeCore`)

Replaces generic floating spheres with a **topological knowledge core**:
- **Central Icosahedron**: Pulsing Crimson `#B40023` lattice with inner octahedron and `BX CORE` billboard tag.
- **Peripheral Spoke Nodes**:
  - Asset nodes: Gold (`#C9A84C`), Bitcoin (`#F7931A`), NVIDIA (`#76B900`)
  - Capability nodes: Market Context, Strategy Lab, Stress & Risk, Regimes, Evidence Graph
- **Interactive Connectivity**: Hovering and clicking highlights connecting crimson spoke beams and reveals a live telemetry card.
- **Graceful Fallback**: Elegant 2D SVG graph renders if WebGL is unavailable.

---

## 6. Workspace Navigation Restructure

- **Previous**: 15 equal-weight unorganized tabs in a crowded top bar with duplicated sidebar list.
- **Redesign 2.0**: 6 grouped primary functional domains:
  1. **RESEARCH**: Observatory, Quant Agent, Research Notebook, Ghost Mode
  2. **MARKETS**: Market Context, Quant Analysis, Correlation, Regimes
  3. **STRATEGIES**: Strategy Lab, Robustness Lab, Strategy Genome
  4. **PORTFOLIO**: Portfolio Cockpit
  5. **RISK**: Stress Lab, Risk Committee
  6. **INTELLIGENCE**: BLACKBOX AI (Command + K)
- **Persistent Header Controls**:
  - Direct 1-click Asset Switcher (`GOLD (XAU)`, `BTC`, `NVDA`)
  - 3D Visualizer Toggle
  - Global `[⌘K]` Search & Assistant trigger
  - Active Data Provenance Badge

---

## 7. Accessibility & Motion

- **Reduced Motion**: System honors `prefers-reduced-motion: reduce`, dropping animation durations to `0.01ms` and suppressing spring physics.
- **Color Contrast**: All text pairings meet WCAG AA standards (minimum 4.5:1 ratio for body copy).
- **Focus Rings**: Crimson 2px focus rings with offset for keyboard navigation.
