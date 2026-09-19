/**
 * BLACKBOX X — Phase 3.7
 * Non-Parametric Historical Value at Risk (VaR) & Conditional VaR (CVaR)
 *
 * Source of Truth: docs/PORTFOLIO-ARCHITECTURE.md
 *
 * SIGN CONVENTION:
 * BLACKBOX X strictly uses the POSITIVE LOSS MAGNITUDE convention (L = -R).
 * A VaR 95% of 2.35% indicates a 5% empirical probability of a single-day loss
 * exceeding 2.35% of portfolio equity.
 * Tail invariant: CVaR_99 >= CVaR_95 >= VaR_95 > 0 on empirical loss distributions.
 */

export interface VaRResult {
  confidence: number;           // 0.95 or 0.99
  horizon: string;              // '1-day'
  observationCount: number;
  var: number;                  // Positive loss magnitude % (e.g. 2.35)
  cvar: number;                 // Positive loss magnitude % (Expected Shortfall, e.g. 3.65)
  signConvention: string;       // 'Positive loss magnitude (L = -R)'
}

export interface PortfolioVaRReport {
  var95: number;                // %
  var99: number;                // %
  cvar95: number;               // %
  cvar99: number;               // %
  observationCount: number;
  horizon: '1-day';
  signConvention: 'Positive loss magnitude (L = -R)';
  method: 'Historical Non-Parametric Empirical Percentile';
}

/**
 * Computes non-parametric historical VaR and CVaR for a given confidence level.
 *
 * @param dailyReturns Array of daily portfolio simple returns (decimal form, e.g. 0.012 for +1.2%)
 * @param confidence Confidence level (default 0.95)
 */
export function computeHistoricalVaR(
  dailyReturns: number[],
  confidence: 0.95 | 0.99 = 0.95
): VaRResult {
  const T = dailyReturns.length;
  if (T === 0) {
    return {
      confidence,
      horizon: '1-day',
      observationCount: 0,
      var: 0,
      cvar: 0,
      signConvention: 'Positive loss magnitude (L = -R)',
    };
  }

  // Sort returns in ascending order: R_(1) <= R_(2) <= ... <= R_(T)
  const sorted = [...dailyReturns].sort((a, b) => a - b);

  const alpha = 1 - confidence; // 0.05 for 95%, 0.01 for 99%
  // Rank index k = max(1, floor(alpha * T))
  const k = Math.max(1, Math.floor(alpha * T));

  // The return at rank k (0-indexed k-1)
  const cutoffReturn = sorted[k - 1];

  // VaR is positive loss magnitude: -cutoffReturn * 100%
  // If the return at cutoff is negative (e.g. -0.0235), VaR is +2.35%
  const varPct = parseFloat((-cutoffReturn * 100).toFixed(2));

  // CVaR (Expected Shortfall): average of all returns from 0 to k-1
  const tailReturns = sorted.slice(0, k);
  const tailMean = tailReturns.reduce((sum, r) => sum + r, 0) / tailReturns.length;
  const cvarPct = parseFloat((-tailMean * 100).toFixed(2));

  return {
    confidence,
    horizon: '1-day',
    observationCount: T,
    var: varPct,
    cvar: cvarPct,
    signConvention: 'Positive loss magnitude (L = -R)',
  };
}

/**
 * Computes complete historical VaR and CVaR report (95% and 99%).
 */
export function computePortfolioVaRReport(dailyReturns: number[]): PortfolioVaRReport {
  const r95 = computeHistoricalVaR(dailyReturns, 0.95);
  const r99 = computeHistoricalVaR(dailyReturns, 0.99);

  return {
    var95: r95.var,
    var99: r99.var,
    cvar95: r95.cvar,
    cvar99: r99.cvar,
    observationCount: dailyReturns.length,
    horizon: '1-day',
    signConvention: 'Positive loss magnitude (L = -R)',
    method: 'Historical Non-Parametric Empirical Percentile',
  };
}
