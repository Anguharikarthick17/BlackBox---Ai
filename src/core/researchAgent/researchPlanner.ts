/**
 * BLACKBOX X — Research Planner
 * 
 * Translates hypotheses into a bounded, deterministic sequence of experiment steps.
 * Strict boundary: Maximum 8 quantitative tool executions per investigation.
 */

import { MAX_RESEARCH_TOOL_EXECUTIONS } from './researchPolicy';
import { ResearchPlan, ResearchQuestion, ResearchHypothesis, ExperimentStep } from './researchTypes';

/**
 * Builds a bounded experiment plan directly mapped to registered BLACKBOX tools.
 */
export function createResearchPlan(
  question: ResearchQuestion,
  hypotheses: ResearchHypothesis[]
): ResearchPlan {
  const steps: ExperimentStep[] = [];
  const { targetAsset, targetStrategy = 'EMA_TREND', startDate = '2020-01-01', endDate = '2023-12-31' } = question;

  let order = 1;

  switch (question.intent) {
    case 'PERFORMANCE_DISCREPANCY': {
      // Step 1: Baseline Strategy Metrics (default cost)
      steps.push({
        stepId: `STEP-${order}`,
        hypothesisId: 'H1',
        order: order++,
        toolName: 'get_strategy_metrics',
        arguments: {
          asset: targetAsset,
          strategy: targetStrategy,
          startDate,
          endDate,
          transactionCostPct: 0.001,
        },
        status: 'PLANNED',
        purpose: `Establish authoritative baseline metrics for ${targetStrategy} on ${targetAsset}.`,
      });

      // Step 2: Buy & Hold Benchmark Metrics
      steps.push({
        stepId: `STEP-${order}`,
        hypothesisId: 'H1',
        order: order++,
        toolName: 'get_benchmark_metrics',
        arguments: {
          asset: targetAsset,
          startDate,
          endDate,
        },
        status: 'PLANNED',
        purpose: `Measure Buy & Hold benchmark total return, Sharpe, and drawdown for empirical comparison.`,
      });

      // Step 3: Regime Performance Breakdown (Tests H1)
      steps.push({
        stepId: `STEP-${order}`,
        hypothesisId: 'H1',
        order: order++,
        toolName: 'get_regime_performance',
        arguments: {
          asset: targetAsset,
          strategy: targetStrategy,
          startDate,
          endDate,
        },
        status: 'PLANNED',
        purpose: `Decompose strategy alpha across Bull, Bear, and Chop regimes to evaluate regime drag.`,
      });

      // Step 4: Zero Transaction Cost Test (Tests H2 - Contradiction Check)
      steps.push({
        stepId: `STEP-${order}`,
        hypothesisId: 'H2',
        order: order++,
        toolName: 'get_strategy_metrics',
        arguments: {
          asset: targetAsset,
          strategy: targetStrategy,
          startDate,
          endDate,
          transactionCostPct: 0.0,
        },
        status: 'PLANNED',
        purpose: `Test zero-friction cost hypothesis (H2) to determine whether costs or structural mechanics drive underperformance.`,
      });

      // Step 5: Parameter Robustness Analysis (Secondary investigation)
      steps.push({
        stepId: `STEP-${order}`,
        hypothesisId: 'H1',
        order: order++,
        toolName: 'get_robustness_analysis',
        arguments: {
          asset: targetAsset,
          strategy: targetStrategy,
          startDate,
          endDate,
        },
        status: 'PLANNED',
        purpose: `Determine whether parameter sensitivity or overfitting contributed to underperformance.`,
      });

      // Step 6: Drawdown Analysis (Tests H3)
      steps.push({
        stepId: `STEP-${order}`,
        hypothesisId: 'H3',
        order: order++,
        toolName: 'get_drawdown_analysis',
        arguments: {
          asset: targetAsset,
          strategy: targetStrategy,
          startDate,
          endDate,
        },
        status: 'PLANNED',
        purpose: `Quantify maximum drawdown depth and recovery duration relative to asset buy-and-hold.`,
      });
      break;
    }

    case 'DRAWDOWN_INVESTIGATION': {
      // Step 1: Drawdown analysis
      steps.push({
        stepId: `STEP-${order}`,
        hypothesisId: 'H1',
        order: order++,
        toolName: 'get_drawdown_analysis',
        arguments: { asset: targetAsset, strategy: targetStrategy, startDate, endDate },
        status: 'PLANNED',
        purpose: `Identify peak drawdown, trough date, and recovery trajectory for ${targetAsset}.`,
      });

      // Step 2: Regime overlay
      steps.push({
        stepId: `STEP-${order}`,
        hypothesisId: 'H1',
        order: order++,
        toolName: 'get_regime_performance',
        arguments: { asset: targetAsset, strategy: targetStrategy, startDate, endDate },
        status: 'PLANNED',
        purpose: `Assess regime state transitions during maximum drawdown period.`,
      });

      // Step 3: Stress Shock: COVID_2020 (H2)
      steps.push({
        stepId: `STEP-${order}`,
        hypothesisId: 'H2',
        order: order++,
        toolName: 'get_stress_result',
        arguments: { asset: targetAsset, strategy: targetStrategy, scenarioId: 'COVID_2020' },
        status: 'PLANNED',
        purpose: `Simulate liquidity shock drawdown vulnerability under COVID-19 March 2020 conditions.`,
      });

      // Step 4: Stress Shock: RATE_HIKE_2022 (H2 secondary)
      steps.push({
        stepId: `STEP-${order}`,
        hypothesisId: 'H2',
        order: order++,
        toolName: 'get_stress_result',
        arguments: { asset: targetAsset, strategy: targetStrategy, scenarioId: 'RATE_HIKE_2022' },
        status: 'PLANNED',
        purpose: `Simulate duration tightening shock drawdown under 2022 rate hike regime.`,
      });
      break;
    }

    case 'ROBUSTNESS_EVALUATION': {
      // Step 1: Robustness sweep across parameter neighborhood
      steps.push({
        stepId: `STEP-${order}`,
        hypothesisId: 'H1',
        order: order++,
        toolName: 'get_robustness_analysis',
        arguments: { asset: targetAsset, strategy: targetStrategy, startDate, endDate },
        status: 'PLANNED',
        purpose: `Evaluate Sharpe ratio stability across parameter perturbations.`,
      });

      // Step 2: Baseline strategy metrics (standard cost)
      steps.push({
        stepId: `STEP-${order}`,
        hypothesisId: 'H2',
        order: order++,
        toolName: 'get_strategy_metrics',
        arguments: { asset: targetAsset, strategy: targetStrategy, startDate, endDate, transactionCostPct: 0.001 },
        status: 'PLANNED',
        purpose: `Measure baseline net performance at 10 bps transaction cost.`,
      });

      // Step 3: High cost friction test (Tests H2)
      steps.push({
        stepId: `STEP-${order}`,
        hypothesisId: 'H2',
        order: order++,
        toolName: 'get_strategy_metrics',
        arguments: { asset: targetAsset, strategy: targetStrategy, startDate, endDate, transactionCostPct: 0.0025 },
        status: 'PLANNED',
        purpose: `Stress test execution friction at elevated 25 bps cost to measure slippage cliff.`,
      });

      // Step 4: Regime breakdown
      steps.push({
        stepId: `STEP-${order}`,
        hypothesisId: 'H1',
        order: order++,
        toolName: 'get_regime_performance',
        arguments: { asset: targetAsset, strategy: targetStrategy, startDate, endDate },
        status: 'PLANNED',
        purpose: `Verify whether parameter stability holds across different market regimes.`,
      });
      break;
    }

    case 'REGIME_BEHAVIOR': {
      // Step 1: Regime performance
      steps.push({
        stepId: `STEP-${order}`,
        hypothesisId: 'H1',
        order: order++,
        toolName: 'get_regime_performance',
        arguments: { asset: targetAsset, strategy: targetStrategy, startDate, endDate },
        status: 'PLANNED',
        purpose: `Quantify return, Sharpe, and drawdown distribution across Bull, Bear, and Chop regimes.`,
      });

      // Step 2: Asset base metrics
      steps.push({
        stepId: `STEP-${order}`,
        hypothesisId: 'H2',
        order: order++,
        toolName: 'get_asset_metrics',
        arguments: { asset: targetAsset, startDate, endDate },
        status: 'PLANNED',
        purpose: `Measure aggregate annualized volatility and risk metrics for ${targetAsset}.`,
      });

      // Step 3: Strategy genome regime mapping
      steps.push({
        stepId: `STEP-${order}`,
        hypothesisId: 'H1',
        order: order++,
        toolName: 'get_strategy_genome',
        arguments: { asset: targetAsset, strategy: targetStrategy, mode: 'REGIME' },
        status: 'PLANNED',
        purpose: `Map regime topology nodes and interconnects in the Strategy Genome.`,
      });
      break;
    }

    case 'CORRELATION_STRESS': {
      const pairAsset = targetAsset === 'BTC' ? 'NVDA' : 'BTC';
      // Step 1: Static correlation matrix
      steps.push({
        stepId: `STEP-${order}`,
        hypothesisId: 'H2',
        order: order++,
        toolName: 'get_correlation_matrix',
        arguments: { startDate, endDate },
        status: 'PLANNED',
        purpose: `Compute full multi-year pairwise correlation baseline between assets.`,
      });

      // Step 2: Rolling 60-day correlation
      steps.push({
        stepId: `STEP-${order}`,
        hypothesisId: 'H1',
        order: order++,
        toolName: 'get_rolling_correlation',
        arguments: { assetA: targetAsset, assetB: pairAsset, window: '60', startDate, endDate },
        status: 'PLANNED',
        purpose: `Track correlation dynamics and spikes through historical stress windows.`,
      });

      // Step 3: COVID shock stress
      steps.push({
        stepId: `STEP-${order}`,
        hypothesisId: 'H1',
        order: order++,
        toolName: 'get_stress_result',
        arguments: { asset: targetAsset, strategy: targetStrategy, scenarioId: 'COVID_2020' },
        status: 'PLANNED',
        purpose: `Simulate drawdown co-movement during COVID-19 liquidity shock.`,
      });
      break;
    }

    case 'GENERAL_QUANT_INQUIRY':
    default: {
      steps.push({
        stepId: `STEP-${order}`,
        hypothesisId: 'H1',
        order: order++,
        toolName: 'get_asset_metrics',
        arguments: { asset: targetAsset, startDate, endDate },
        status: 'PLANNED',
        purpose: `Compute authoritative baseline risk and return metrics.`,
      });

      steps.push({
        stepId: `STEP-${order}`,
        hypothesisId: 'H1',
        order: order++,
        toolName: 'get_strategy_metrics',
        arguments: { asset: targetAsset, strategy: targetStrategy, startDate, endDate },
        status: 'PLANNED',
        purpose: `Run strategy backtest to establish trade count, return, and Sharpe.`,
      });

      steps.push({
        stepId: `STEP-${order}`,
        hypothesisId: 'H2',
        order: order++,
        toolName: 'get_stress_result',
        arguments: { asset: targetAsset, strategy: targetStrategy, scenarioId: 'COVID_2020' },
        status: 'PLANNED',
        purpose: `Test strategy resilience under historical macro stress scenario.`,
      });
      break;
    }
  }

  // Enforce ceiling of MAX_RESEARCH_TOOL_EXECUTIONS (8)
  const boundedSteps = steps.slice(0, MAX_RESEARCH_TOOL_EXECUTIONS);

  return {
    id: `PLAN-${Date.now().toString(36).toUpperCase()}`,
    question,
    hypotheses,
    steps: boundedSteps,
    maxSteps: MAX_RESEARCH_TOOL_EXECUTIONS,
  };
}
