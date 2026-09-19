/**
 * BLACKBOX X — PHASE 4.0: INSTITUTIONAL RESEARCH WORKSPACE
 * Evidence Record Architecture & Structured Numerical Claims
 * 
 * Source of Truth: docs/INSTITUTIONAL-RESEARCH-ARCHITECTURE.md
 */

import {
  EvidenceRecord,
  ResearchClaim,
  SessionDataWindow,
} from './researchTypes';
import { generateEvidenceFingerprint } from './researchFingerprint';

export interface CreateEvidenceParams {
  experimentId: string;
  hypothesisId?: string;
  toolName: string;
  arguments: Record<string, any>;
  result: Record<string, any>;
  dataWindow: SessionDataWindow;
  directEvidence: string;
  interpretation: string;
  order: number;
}

/**
 * Creates an immutable EvidenceRecord with strict separation between
 * direct quantitative observations and analytical interpretations.
 */
export function createEvidenceRecord(
  params: CreateEvidenceParams,
  evidenceIdPrefix = 'EV'
): EvidenceRecord {
  const {
    experimentId,
    hypothesisId,
    toolName,
    arguments: toolArgs,
    result,
    dataWindow,
    directEvidence,
    interpretation,
    order,
  } = params;

  if (!directEvidence || !directEvidence.trim()) {
    throw new Error('EvidenceRecord creation rejected: directEvidence must not be empty.');
  }

  if (!interpretation || !interpretation.trim()) {
    throw new Error('EvidenceRecord creation rejected: interpretation must not be empty.');
  }

  // Enforce distinct content between direct evidence and interpretation
  if (directEvidence.trim().toLowerCase() === interpretation.trim().toLowerCase()) {
    throw new Error(
      'EvidenceRecord creation rejected: directEvidence and interpretation must not be identical. ' +
      'Direct evidence represents factual quantitative metrics; interpretation represents analytical deductions.'
    );
  }

  const evidenceId = `${evidenceIdPrefix}-${String(order).padStart(3, '0')}`;
  const timestamp = Date.now();
  const fingerprint = generateEvidenceFingerprint(experimentId, toolName, result);

  return {
    evidenceId,
    experimentId,
    hypothesisId,
    toolName,
    arguments: toolArgs,
    result,
    dataWindow,
    directEvidence: directEvidence.trim(),
    interpretation: interpretation.trim(),
    order,
    timestamp,
    fingerprint,
  };
}

/**
 * Validates that a ResearchClaim is structurally bound to verified EvidenceRecords
 * and contains factual quantitative backing.
 */
export function validateClaim(
  claim: ResearchClaim,
  evidenceRecords: EvidenceRecord[]
): { valid: boolean; reason?: string } {
  if (!claim.evidenceIds || claim.evidenceIds.length === 0) {
    return {
      valid: false,
      reason: `Claim ${claim.claimId} has zero bound evidenceIds. Every numeric claim must reference at least one verified EvidenceRecord.`,
    };
  }

  const evidenceMap = new Map(evidenceRecords.map(e => [e.evidenceId, e]));

  for (const evId of claim.evidenceIds) {
    if (!evidenceMap.has(evId)) {
      return {
        valid: false,
        reason: `Claim ${claim.claimId} references non-existent or unverified evidenceId "${evId}".`,
      };
    }
  }

  if (claim.value === undefined || claim.value === null || (typeof claim.value === 'number' && isNaN(claim.value))) {
    return {
      valid: false,
      reason: `Claim ${claim.claimId} specifies an invalid or NaN numerical value.`,
    };
  }

  return { valid: true };
}

/**
 * Validates an array of claims against collected evidence records.
 * Throws error if any claim is ungrounded.
 */
export function validateAllClaims(
  claims: ResearchClaim[],
  evidenceRecords: EvidenceRecord[]
): void {
  for (const claim of claims) {
    const result = validateClaim(claim, evidenceRecords);
    if (!result.valid) {
      throw new Error(`UNBOUND_NUMERICAL_ASSERTION_ERROR: ${result.reason}`);
    }
  }
}

/**
 * Extracts verifiable direct evidence and analytical interpretation from quantitative tool results.
 */
export function formatDirectEvidenceAndInterpretation(
  toolName: string,
  result: any,
  args: Record<string, any>
): { directEvidence: string; interpretation: string; keyMetric: string; keyValue: number | string } {
  switch (toolName) {
    case 'get_strategy_metrics': {
      const ret = (result.totalReturn ?? 0).toFixed(2);
      const mdd = (result.maxDrawdown ?? 0).toFixed(2);
      const trades = result.tradeCount ?? 0;
      const winRate = ((result.winRate ?? 0) * 100).toFixed(1);
      const directEvidence = `Strategy executed ${trades} trades with total return of ${ret}%, max drawdown of ${mdd}%, and win rate of ${winRate}%.`;
      const interpretation = `Historical execution indicates a total return of ${ret}% with max drawdown of ${mdd}%, reflecting strategy behavior over the evaluation window.`;
      return { directEvidence, interpretation, keyMetric: 'totalReturn', keyValue: Number(ret) };
    }
    case 'get_benchmark_metrics': {
      const bhRet = (result.benchmarkReturn ?? result.totalReturn ?? 0).toFixed(2);
      const bhMdd = (result.maxDrawdown ?? 0).toFixed(2);
      const directEvidence = `Buy & Hold benchmark for ${args.asset ?? 'asset'} realized total return of ${bhRet}% with max drawdown of ${bhMdd}%.`;
      const interpretation = `Passive holding provided a benchmark performance baseline of ${bhRet}% total return against which active strategy alpha is evaluated.`;
      return { directEvidence, interpretation, keyMetric: 'benchmarkReturn', keyValue: Number(bhRet) };
    }
    case 'get_asset_metrics': {
      const cagr = (result.annualizedReturn ?? 0).toFixed(2);
      const vol = (result.annualizedVolatility ?? 0).toFixed(2);
      const sharpe = (result.sharpeRatio ?? 0).toFixed(2);
      const directEvidence = `Asset realized CAGR of ${cagr}%, annualized volatility of ${vol}%, and Sharpe ratio of ${sharpe}.`;
      const interpretation = `Baseline asset performance parameters establish risk-adjusted return characteristics of ${sharpe} Sharpe across the observation window.`;
      return { directEvidence, interpretation, keyMetric: 'annualizedReturn', keyValue: Number(cagr) };
    }
    case 'get_regime_performance': {
      const dominant = result.dominantRegime || 'BULL';
      const breakdown = Array.isArray(result.regimeBreakdown)
        ? result.regimeBreakdown.map((r: any) => `${r.regime}: ${Number(r.strategyReturn ?? 0).toFixed(1)}%`).join(', ')
        : 'N/A';
      const directEvidence = `Regime decomposition shows dominant regime as ${dominant}; sub-period strategy returns were: ${breakdown}.`;
      const interpretation = `Performance divergence across regimes indicates regime sensitivity, with ${dominant} representing the dominant market environment.`;
      return { directEvidence, interpretation, keyMetric: 'dominantRegime', keyValue: dominant };
    }
    case 'get_drawdown_analysis': {
      const mdd = (result.maxDrawdown ?? 0).toFixed(2);
      const dur = result.maxDrawdownDurationDays ?? result.durationDays ?? 0;
      const directEvidence = `Drawdown analysis recorded peak-to-trough decline of ${mdd}% lasting ${dur} trading days.`;
      const interpretation = `Capital preservation stress is evidenced by an extended drawdown duration of ${dur} days and ${mdd}% maximum peak loss.`;
      return { directEvidence, interpretation, keyMetric: 'maxDrawdown', keyValue: Number(mdd) };
    }
    case 'get_robustness_analysis': {
      const zeroFee = result.performanceAtZeroFee ?? result.zeroCostReturn ?? 0;
      const baseFee = result.baselineReturn ?? 0;
      const delta = (zeroFee - baseFee).toFixed(2);
      const directEvidence = `Zero-fee backtest return is ${Number(zeroFee).toFixed(2)}% compared to baseline ${Number(baseFee).toFixed(2)}%, a delta of ${delta} percentage points.`;
      const interpretation = `Transaction cost drag accounts for ${delta} percentage points of return delta between 0 bps and standard friction.`;
      return { directEvidence, interpretation, keyMetric: 'frictionDeltaPct', keyValue: Number(delta) };
    }
    case 'get_portfolio_metrics': {
      const cagr = (result.cagr ?? 0).toFixed(2);
      const vol = (result.annualizedVol ?? 0).toFixed(2);
      const sharpe = (result.sharpeRatio ?? 0).toFixed(2);
      const directEvidence = `Synchronized portfolio realized annualized return of ${cagr}%, volatility of ${vol}%, and Sharpe ratio of ${sharpe}.`;
      const interpretation = `Multi-asset portfolio configuration provides diversification metrics with annualized volatility of ${vol}%.`;
      return { directEvidence, interpretation, keyMetric: 'portfolioCAGR', keyValue: Number(cagr) };
    }
    case 'get_monte_carlo_risk': {
      const p50 = (result.summary?.p50Wealth ?? result.medianWealth ?? 100000).toFixed(0);
      const var95 = (result.riskMetrics?.horizonVaR95 ?? result.var95 ?? 0).toFixed(2);
      const directEvidence = `Monte Carlo simulation (${result.simulations ?? 1000} paths) produced median terminal wealth of $${p50} and horizon VaR95 of ${var95}%.`;
      const interpretation = `Probabilistic trajectory distribution exhibits a median outcome of $${p50} with tail loss risk bounded by VaR95 of ${var95}%.`;
      return { directEvidence, interpretation, keyMetric: 'medianWealth', keyValue: Number(p50) };
    }
    case 'get_regime_monte_carlo_risk': {
      const reg = result.startingRegime || 'BULL';
      const p50 = (result.summary?.p50Wealth ?? 100000).toFixed(0);
      const mddP95 = (result.summary?.p95MaxDrawdown ?? 0).toFixed(2);
      const directEvidence = `Regime-conditioned simulation starting in ${reg} resulted in median wealth $${p50} and P95 max drawdown of ${mddP95}%.`;
      const interpretation = `Conditioning simulated forward trajectories on initial ${reg} regime associates with a P95 max drawdown of ${mddP95}%.`;
      return { directEvidence, interpretation, keyMetric: 'regimeP95MDD', keyValue: Number(mddP95) };
    }
    default: {
      const directEvidence = `Tool ${toolName} completed with output keys: ${Object.keys(result || {}).join(', ')}.`;
      const interpretation = `Quantitative engine executed deterministic evaluation for ${toolName}.`;
      return { directEvidence, interpretation, keyMetric: 'status', keyValue: 'SUCCESS' };
    }
  }
}
