/**
 * BLACKBOX X — Research Hypothesis Engine
 * 
 * Analyzes research questions, classifies research intent, and generates
 * bounded, testable hypotheses directly investigable via registered BLACKBOX tools.
 */

import { Asset } from '../data';
import { StrategyType } from '../strategies';
import { ResearchIntent, ResearchQuestion, ResearchHypothesis } from './researchTypes';

/**
 * Classifies research intent and extracts target quantitative entities.
 */
export function classifyResearchQuestion(
  query: string,
  context?: { asset?: Asset; strategy?: StrategyType }
): ResearchQuestion {
  const normalized = query.toLowerCase().trim();

  // 1. Detect Asset
  let targetAsset: Asset = 'BTC';
  if (normalized.includes('btc') || normalized.includes('bitcoin')) targetAsset = 'BTC';
  else if (normalized.includes('nvda') || normalized.includes('nvidia')) targetAsset = 'NVDA';
  else if (normalized.includes('gold') || normalized.includes('xau')) targetAsset = 'GOLD';
  else if (context?.asset) targetAsset = context.asset;

  // 2. Detect Strategy
  let targetStrategy: StrategyType | undefined = undefined;
  if (normalized.includes('ema trend') || normalized.includes('ema_trend') || normalized.includes('ema')) {
    targetStrategy = 'EMA_TREND';
  } else if (normalized.includes('sma crossover') || normalized.includes('sma_crossover') || normalized.includes('sma')) {
    targetStrategy = 'SMA_CROSSOVER';
  } else if (normalized.includes('momentum')) {
    targetStrategy = 'MOMENTUM';
  } else if (normalized.includes('mean reversion') || normalized.includes('mean_reversion') || normalized.includes('reversion')) {
    targetStrategy = 'MEAN_REVERSION';
  } else if (context?.strategy) {
    targetStrategy = context.strategy;
  } else if (normalized.includes('strategy') || normalized.includes('underperform') || normalized.includes('outperform')) {
    targetStrategy = 'EMA_TREND';
  }

  // 3. Classify Intent
  let intent: ResearchIntent = 'GENERAL_QUANT_INQUIRY';
  if (normalized.includes('underperform') || normalized.includes('outperform') || normalized.includes('vs buy & hold') || normalized.includes('vs benchmark') || normalized.includes('compare to')) {
    intent = 'PERFORMANCE_DISCREPANCY';
  } else if (normalized.includes('drawdown') || normalized.includes('crash') || normalized.includes('max loss') || normalized.includes('trough')) {
    intent = 'DRAWDOWN_INVESTIGATION';
  } else if (normalized.includes('cost') || normalized.includes('robust') || normalized.includes('slippage') || normalized.includes('parameter') || normalized.includes('sensitive')) {
    intent = 'ROBUSTNESS_EVALUATION';
  } else if (normalized.includes('regime') || normalized.includes('bull') || normalized.includes('bear') || normalized.includes('transition')) {
    intent = 'REGIME_BEHAVIOR';
  } else if (normalized.includes('correlation') || normalized.includes('co-movement') || normalized.includes('stress') || normalized.includes('covid') || normalized.includes('gfc')) {
    intent = 'CORRELATION_STRESS';
  }

  const questionId = `RQ-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

  return {
    id: questionId,
    query,
    intent,
    targetAsset,
    targetStrategy,
    benchmarkAsset: targetAsset,
    startDate: '2020-01-01',
    endDate: '2023-12-31',
    timestamp: Date.now(),
  };
}

/**
 * Generates testable, bounded hypotheses grounded in BLACKBOX quantitative capabilities.
 */
export function generateHypotheses(question: ResearchQuestion): ResearchHypothesis[] {
  const { id: qId, intent, targetAsset, targetStrategy = 'EMA_TREND' } = question;
  const assetName = targetAsset;
  const stratName = targetStrategy.replace('_', ' ');

  switch (intent) {
    case 'PERFORMANCE_DISCREPANCY':
      return [
        {
          id: 'H1',
          questionId: qId,
          statement: `Regime-dependent performance contributed to ${stratName} underperformance on ${assetName} relative to Buy & Hold.`,
          rationale: 'Trend-following models frequently experience whipsaws and negative alpha during sideways, mean-reverting, or abrupt bear market regimes.',
          primaryTool: 'get_regime_performance',
          expectedEvidence: 'Strategy Sharpe and returns in Bear or Chop regimes significantly lag benchmark Buy & Hold.',
          status: 'PENDING',
        },
        {
          id: 'H2',
          questionId: qId,
          statement: `Transaction friction and turnover costs materially eroded ${stratName} return relative to buy-and-hold.`,
          rationale: 'Frequent position flipping under default transaction costs (10 bps per trade) can systematically degrade net performance.',
          primaryTool: 'get_strategy_metrics',
          expectedEvidence: 'Zero-cost strategy returns match or exceed the benchmark, confirming cost sensitivity as the primary driver.',
          status: 'PENDING',
        },
        {
          id: 'H3',
          questionId: qId,
          statement: `Drawdown episodes introduced recovery and compounding drag for ${stratName} relative to the benchmark.`,
          rationale: 'Deep peak-to-trough drawdowns require asymmetric recovery returns, causing the strategy to lag buy-and-hold accumulation.',
          primaryTool: 'get_drawdown_analysis',
          expectedEvidence: 'Strategy max drawdown duration and depth exceeded Buy & Hold recovery windows.',
          status: 'PENDING',
        },
      ];

    case 'DRAWDOWN_INVESTIGATION':
      return [
        {
          id: 'H1',
          questionId: qId,
          statement: `${assetName} experienced structural regime collapse during its largest drawdown window.`,
          rationale: 'Macro volatility shifts and rapid liquidity contractions drive tail drawdowns in high-beta assets.',
          primaryTool: 'get_drawdown_analysis',
          expectedEvidence: 'Drawdown peaks correlate with high-volatility bear regime transitions.',
          status: 'PENDING',
        },
        {
          id: 'H2',
          questionId: qId,
          statement: `Macro shock vulnerability (e.g. COVID liquidity crash or Rate Hike cycle) triggered unprecedented asset drawdown.`,
          rationale: 'Historical stress shocks provide quantitative benchmarks for systemic drawdown susceptibility.',
          primaryTool: 'get_stress_result',
          expectedEvidence: 'Simulated shock drawdowns align closely with empirical maximum drawdown magnitude.',
          status: 'PENDING',
        },
      ];

    case 'ROBUSTNESS_EVALUATION':
      return [
        {
          id: 'H1',
          questionId: qId,
          statement: `${stratName} on ${assetName} displays high parameter stability across neighboring window configurations.`,
          rationale: 'A viable strategy must maintain positive Sharpe without steep cliffs when parameters shift.',
          primaryTool: 'get_robustness_analysis',
          expectedEvidence: 'Sharpe ratio variation across parameter grid remains bounded and above zero.',
          status: 'PENDING',
        },
        {
          id: 'H2',
          questionId: qId,
          statement: `Transaction costs create a sharp performance cliff exceeding 50% net Sharpe degradation.`,
          rationale: 'High turnover strategies often collapse under institutional execution slippage.',
          primaryTool: 'get_strategy_metrics',
          expectedEvidence: 'Sharpe ratio drops below 0 when transaction cost increases to 0.20%.',
          status: 'PENDING',
        },
      ];

    case 'REGIME_BEHAVIOR':
      return [
        {
          id: 'H1',
          questionId: qId,
          statement: `${assetName} risk-adjusted performance is structurally asymmetric across Bull vs Bear regimes.`,
          rationale: 'Asset volatility and risk premia compress or expand predictably across macroeconomic regimes.',
          primaryTool: 'get_regime_performance',
          expectedEvidence: 'Sharpe ratio shows statistical divergence across Bull, Bear, and Chop clusters.',
          status: 'PENDING',
        },
        {
          id: 'H2',
          questionId: qId,
          statement: `${assetName} volatility expands significantly during bear transitions, depressing Sharpe.`,
          rationale: 'Downside volatility expansion degrades risk-adjusted return ratios.',
          primaryTool: 'get_asset_metrics',
          expectedEvidence: 'Annualized volatility in stressful windows is over 1.5x tranquil baseline volatility.',
          status: 'PENDING',
        },
      ];

    case 'CORRELATION_STRESS':
      return [
        {
          id: 'H1',
          questionId: qId,
          statement: `Cross-asset correlation spikes toward 1.0 during exogenous liquidity stress.`,
          rationale: 'Diversification benefits often evaporate during systemic shocks as all risky assets sell off in tandem.',
          primaryTool: 'get_rolling_correlation',
          expectedEvidence: 'Rolling 60-day correlation reaches elevated levels during market distress periods.',
          status: 'PENDING',
        },
        {
          id: 'H2',
          questionId: qId,
          statement: `Pairwise asset correlation remains decoupled in steady-state regimes.`,
          rationale: 'Asset idiosyncratic factors dominate during non-crisis macroeconomic conditions.',
          primaryTool: 'get_correlation_matrix',
          expectedEvidence: 'Baseline multi-year correlation is significantly lower than crisis-spike correlation.',
          status: 'PENDING',
        },
      ];

    case 'GENERAL_QUANT_INQUIRY':
    default:
      return [
        {
          id: 'H1',
          questionId: qId,
          statement: `${assetName} displays distinct historical risk-return dynamics compared to benchmark Buy & Hold.`,
          rationale: 'Baseline empirical metrics establish risk, return, and drawdown profiles.',
          primaryTool: 'get_asset_metrics',
          expectedEvidence: 'Annualized return, volatility, and Sharpe ratio characterize the asset profile.',
          status: 'PENDING',
        },
        {
          id: 'H2',
          questionId: qId,
          statement: `Systemic shock testing reveals distinct tail risk profiles for ${assetName}.`,
          rationale: 'Stress simulation evaluates potential drawdowns under historical crises.',
          primaryTool: 'get_stress_result',
          expectedEvidence: 'Drawdown under COVID_2020 or Rate Hike scenarios highlights tail vulnerability.',
          status: 'PENDING',
        },
      ];
  }
}
