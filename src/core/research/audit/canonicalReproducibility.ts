/**
 * BLACKBOX X — PHASE 4.1: RESEARCH REPRODUCIBILITY & DECISION AUDIT LAYER
 * Canonical-Output Reproducibility Contract & Numerical Comparison Policy
 * 
 * Authoritative Source: docs/RESEARCH-AUDIT-ARCHITECTURE.md (Sections 7.1, 7.2)
 */

import { computeDeterministicHash } from '../../researchPack';
import { ComparisonClass, MetricToleranceSpec } from './auditTypes';

// ============================================================================
// 1. METRIC-SPECIFIC NUMERICAL TOLERANCE MATRIX (PATCH 2)
// ============================================================================

export const METRIC_TOLERANCE_CATALOG: Record<string, MetricToleranceSpec> = {
  correlation: {
    metric: 'correlation',
    comparisonClass: 'NUMERICAL_TOLERANCE',
    tolerance: 1e-4, // ± 0.0001
    rationale:
      'Covariance divided by product of standard deviations across daily series; accounts for pairwise summation ordering differences.',
  },
  portfolio_weights: {
    metric: 'portfolio_weights',
    comparisonClass: 'NUMERICAL_TOLERANCE',
    tolerance: 1e-6, // ± 0.000001
    rationale:
      'Optimization unit simplex constraint sum(w_i) = 1.0; strict threshold accommodates solver convergence limits without allocation drift.',
  },
  returns: {
    metric: 'returns',
    comparisonClass: 'NUMERICAL_TOLERANCE',
    tolerance: 1e-6, // ± 0.000001
    rationale:
      'Cumulative compound return multiplication prod(1 + r_t) - 1; absorbs minor floating-point rounding over long historical windows.',
  },
  volatility: {
    metric: 'volatility',
    comparisonClass: 'NUMERICAL_TOLERANCE',
    tolerance: 1e-6, // ± 0.000001
    rationale:
      'Annualized sample standard deviation sqrt(252) * sigma incorporating squared deviations and square-root evaluation.',
  },
  sharpe_ratio: {
    metric: 'sharpe_ratio',
    comparisonClass: 'NUMERICAL_TOLERANCE',
    tolerance: 1e-4, // ± 0.0001
    rationale:
      'Composite quotient (mu - rf)/sigma; small volatility variations in denominator propagate non-linearly into ratio precision.',
  },
  sortino_ratio: {
    metric: 'sortino_ratio',
    comparisonClass: 'NUMERICAL_TOLERANCE',
    tolerance: 1e-4, // ± 0.0001
    rationale:
      'Downside semi-deviation quotient; small threshold absorbs downside return slicing boundary variations.',
  },
  drawdown: {
    metric: 'drawdown',
    comparisonClass: 'NUMERICAL_TOLERANCE',
    tolerance: 1e-5, // ± 0.00001
    rationale:
      'High-water mark tracking and peak division (1 - P_t / HWM_t); fine-grained precision prevents misidentifying peak and trough dates.',
  },
  monte_carlo_percentiles: {
    metric: 'monte_carlo_percentiles',
    comparisonClass: 'NUMERICAL_TOLERANCE',
    tolerance: 1e-4, // ± 0.0001
    rationale:
      'Empirical CDF quantile rank interpolation across 1,000 to 10,000 simulated paths.',
  },
  euler_risk_contributions: {
    metric: 'euler_risk_contributions',
    comparisonClass: 'NUMERICAL_TOLERANCE',
    tolerance: 1e-5, // ± 0.00001
    rationale:
      'Marginal risk decomposition w_i * (Sigma w)_i / sigma_p involving matrix-vector products with the covariance matrix.',
  },
  regime_transition_frequencies: {
    metric: 'regime_transition_frequencies',
    comparisonClass: 'NUMERICAL_TOLERANCE',
    tolerance: 1e-5, // ± 0.00001
    rationale:
      'Empirical transition probabilities derived from transition count matrix divided by state dwell counts.',
  },
};

/**
 * Maps any arbitrary metric identifier to its standardized tolerance specification.
 */
export function resolveMetricTolerance(metricName: string): MetricToleranceSpec {
  const normalized = metricName.toLowerCase().replace(/[\s\-_]/g, '');

  if (normalized.includes('corr')) return METRIC_TOLERANCE_CATALOG.correlation;
  if (normalized.includes('weight')) return METRIC_TOLERANCE_CATALOG.portfolio_weights;
  if (normalized.includes('sharpe')) return METRIC_TOLERANCE_CATALOG.sharpe_ratio;
  if (normalized.includes('sortino')) return METRIC_TOLERANCE_CATALOG.sortino_ratio;
  if (normalized.includes('drawdown') || normalized.includes('mdd')) return METRIC_TOLERANCE_CATALOG.drawdown;
  if (normalized.includes('vol') || normalized.includes('std')) return METRIC_TOLERANCE_CATALOG.volatility;
  if (normalized.includes('percentile') || normalized.includes('p5') || normalized.includes('p50') || normalized.includes('p95')) {
    return METRIC_TOLERANCE_CATALOG.monte_carlo_percentiles;
  }
  if (normalized.includes('euler') || normalized.includes('riskcontribution')) {
    return METRIC_TOLERANCE_CATALOG.euler_risk_contributions;
  }
  if (normalized.includes('transition') || normalized.includes('regimefreq')) {
    return METRIC_TOLERANCE_CATALOG.regime_transition_frequencies;
  }
  if (normalized.includes('return') || normalized.includes('cagr') || normalized.includes('alpha')) {
    return METRIC_TOLERANCE_CATALOG.returns;
  }

  // Fallback default tolerance for unspecified floating-point metrics
  return {
    metric: metricName,
    comparisonClass: 'NUMERICAL_TOLERANCE',
    tolerance: 1e-5,
    rationale: 'Default conservative numerical tolerance budget for financial floating-point indicators.',
  };
}

// ============================================================================
// 2. CANONICAL SERIALIZATION & NORMALIZATION (PATCH 1)
// ============================================================================

/**
 * Formats a floating-point number to fixed 8 decimal places to eliminate
 * cross-runtime floating point stringification variance.
 */
export function canonicalNormalizeFloat(n: number): string {
  if (isNaN(n)) return '"NaN"';
  if (!isFinite(n)) return n > 0 ? '"Infinity"' : '"-Infinity"';
  return Number.isInteger(n) ? n.toString() : n.toFixed(8);
}

/**
 * Recursively serializes objects with sorted keys and normalized floating-point numbers.
 */
export function canonicalStringify(obj: any): string {
  if (obj === null || obj === undefined) {
    return 'null';
  }
  if (typeof obj === 'number') {
    return canonicalNormalizeFloat(obj);
  }
  if (typeof obj === 'boolean') {
    return obj ? 'true' : 'false';
  }
  if (typeof obj === 'string') {
    return JSON.stringify(obj);
  }
  if (Array.isArray(obj)) {
    return '[' + obj.map(item => canonicalStringify(item)).join(',') + ']';
  }
  if (typeof obj === 'object') {
    const keys = Object.keys(obj)
      .filter(
        k =>
          k !== 'executionDurationMs' &&
          k !== 'executionLatencyMs' &&
          k !== 'latencyMs' &&
          k !== 'runtimeMs' &&
          k !== 'generatedTimestamp' &&
          k !== 'timestamp' &&
          k !== 'replayedAt' &&
          k !== 'executedAt'
      )
      .sort();
    return (
      '{' +
      keys
        .map(k => `${JSON.stringify(k)}:${canonicalStringify(obj[k])}`)
        .join(',') +
      '}'
    );
  }
  return JSON.stringify(obj);
}

/**
 * Computes deterministic SHA-256 / FNV-1a canonical fingerprint of any object.
 */
export function computeCanonicalFingerprint(obj: any, prefix = 'bx'): string {
  const serialized = canonicalStringify(obj);
  return computeDeterministicHash(`${prefix}:${serialized}`);
}

// ============================================================================
// 3. THREE-TIER VALUE COMPARISON ENGINE
// ============================================================================

export interface ComparisonEvaluation {
  matches: boolean;
  delta: number;
  relativeDeltaPct: number;
  tolerance: number;
  comparisonClass: ComparisonClass;
  rationale: string;
}

/**
 * Compares two values according to the specified comparison class and metric tolerance policy.
 */
export function compareValues(
  metricName: string,
  originalVal: any,
  replayVal: any,
  overrideClass?: ComparisonClass
): ComparisonEvaluation {
  // If either value is null or undefined
  if (originalVal === null || originalVal === undefined || replayVal === null || replayVal === undefined) {
    const matches = originalVal === replayVal;
    return {
      matches,
      delta: matches ? 0 : 1,
      relativeDeltaPct: matches ? 0 : 100,
      tolerance: 0,
      comparisonClass: 'EXACT',
      rationale: 'Null/undefined exact equality check.',
    };
  }

  // Determine comparison class
  const toleranceSpec = resolveMetricTolerance(metricName);
  const comparisonClass = overrideClass ?? toleranceSpec.comparisonClass;

  // 1. EXACT CLASS (IDs, dates, ordering vectors, seeds, configurations)
  if (comparisonClass === 'EXACT' || typeof originalVal === 'string' || typeof originalVal === 'boolean') {
    const matches = JSON.stringify(originalVal) === JSON.stringify(replayVal);
    return {
      matches,
      delta: matches ? 0 : 1,
      relativeDeltaPct: matches ? 0 : 100,
      tolerance: 0,
      comparisonClass: 'EXACT',
      rationale: 'Exact equality required for deterministic configurations, seeds, dates, or identifiers.',
    };
  }

  // 2. CANONICAL EXACT CLASS (Serialized payloads normalized to fixed 8 decimals)
  if (comparisonClass === 'CANONICAL_EXACT') {
    const canonicalOrig = canonicalStringify(originalVal);
    const canonicalReplay = canonicalStringify(replayVal);
    const matches = canonicalOrig === canonicalReplay;
    return {
      matches,
      delta: matches ? 0 : 1,
      relativeDeltaPct: matches ? 0 : 100,
      tolerance: 0,
      comparisonClass: 'CANONICAL_EXACT',
      rationale: 'Canonical exact identity after float normalization and key sorting.',
    };
  }

  // 3. NUMERICAL TOLERANCE CLASS (Metric-specific tolerances)
  const numOrig = typeof originalVal === 'number' ? originalVal : parseFloat(String(originalVal));
  const numReplay = typeof replayVal === 'number' ? replayVal : parseFloat(String(replayVal));

  if (isNaN(numOrig) || isNaN(numReplay)) {
    const bothNaN = isNaN(numOrig) && isNaN(numReplay);
    return {
      matches: bothNaN,
      delta: bothNaN ? 0 : 1,
      relativeDeltaPct: bothNaN ? 0 : 100,
      tolerance: toleranceSpec.tolerance,
      comparisonClass: 'NUMERICAL_TOLERANCE',
      rationale: 'NaN numerical evaluation.',
    };
  }

  const delta = Math.abs(numReplay - numOrig);
  const denom = Math.abs(numOrig) > 1e-12 ? Math.abs(numOrig) : 1.0;
  const relativeDeltaPct = (delta / denom) * 100;
  const matches = delta <= toleranceSpec.tolerance;

  return {
    matches,
    delta,
    relativeDeltaPct,
    tolerance: toleranceSpec.tolerance,
    comparisonClass: 'NUMERICAL_TOLERANCE',
    rationale: toleranceSpec.rationale,
  };
}
