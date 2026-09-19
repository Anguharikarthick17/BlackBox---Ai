/**
 * BLACKBOX X — Assistant Request Router
 * 
 * Classifies research queries with strict tool and context isolation:
 * - GENERAL: Conceptual & educational definitions (ZERO tools, strict context isolation)
 * - BLACKBOX: Deterministic quantitative engines (registered quant tools only)
 * - WEB: Current news & external market intelligence (web_search only)
 * - HYBRID: Cross-context synthesis combining BLACKBOX calculations with web research
 */

import { AssistantMode } from '../services/ai/types';

export interface RoutingDecision {
  mode: AssistantMode;
  reason: string;
  recommendedTools: string[];
  inferredAsset?: 'GOLD' | 'BTC' | 'NVDA';
  inferredStrategy?: 'SMA_CROSSOVER' | 'EMA_TREND' | 'MOMENTUM' | 'MEAN_REVERSION';
  requiresWebSearch: boolean;
  requiresBlackboxTools: boolean;
}

const WEB_TRIGGER_TERMS = [
  'today', 'news', 'latest', 'current', 'recent', 'yesterday',
  'announcement', 'reported', 'earnings', 'conference', 'press release',
  'sec filing', 'headline', 'breaking', 'ft', 'reuters', 'bloomberg',
  'this week', 'market today', 'what happened', "what's happening",
];

const BLACKBOX_PLATFORM_TERMS = [
  'blackbox', 'black box', 'blackbox x', 'in blackbox', 'using blackbox',
];

const BLACKBOX_QUANT_TERMS = [
  'backtest', 'stress test', 'macro shock', 'shock lab', 'strategy genome',
  'genome', 'ghost mode', 'research trail', 'risk committee', 'cro brief',
  'robustness', 'parameter cliff', 'correlation matrix', 'rolling correlation',
  'drawdown analysis', 'regime performance', 'dominant regime',
];

const GENERAL_CONCEPTUAL_TERMS = [
  'what is', 'what does', 'what are', 'explain', 'define', 'definition of',
  'how do you calculate', 'how does', 'how to calculate', 'how work',
  'formula for', 'difference between', 'theory of', 'academic definition',
  'meaning of', 'concept of', 'tell me about',
];

/**
 * Deterministically analyzes the user query to determine optimal execution mode,
 * enforcing strict tool and context isolation.
 */
export function routeAssistantRequest(
  query: string,
  context?: { asset?: string; strategy?: string }
): RoutingDecision {
  const normalized = query.toLowerCase().trim();

  // 1. Explicit asset mention in query text ONLY
  let explicitAsset: 'GOLD' | 'BTC' | 'NVDA' | undefined = undefined;
  if (normalized.includes('btc') || normalized.includes('bitcoin')) explicitAsset = 'BTC';
  else if (normalized.includes('nvda') || normalized.includes('nvidia')) explicitAsset = 'NVDA';
  else if (normalized.includes('gold') || normalized.includes('xau')) explicitAsset = 'GOLD';

  // 2. Explicit strategy mention in query text ONLY
  let explicitStrategy: 'SMA_CROSSOVER' | 'EMA_TREND' | 'MOMENTUM' | 'MEAN_REVERSION' | undefined = undefined;
  if (normalized.includes('sma crossover') || normalized.includes('sma_crossover')) explicitStrategy = 'SMA_CROSSOVER';
  else if (normalized.includes('ema trend') || normalized.includes('ema_trend')) explicitStrategy = 'EMA_TREND';
  else if (normalized.includes('momentum')) explicitStrategy = 'MOMENTUM';
  else if (normalized.includes('mean reversion') || normalized.includes('mean_reversion') || normalized.includes('reversion')) explicitStrategy = 'MEAN_REVERSION';
  else if (normalized.includes('sma')) explicitStrategy = 'SMA_CROSSOVER';
  else if (normalized.includes('ema')) explicitStrategy = 'EMA_TREND';

  // Trigger checks
  const hasWebTrigger = WEB_TRIGGER_TERMS.some(t => normalized.includes(t));
  const hasBlackboxExplicit = BLACKBOX_PLATFORM_TERMS.some(t => normalized.includes(t));
  const hasBlackboxQuantTerms = BLACKBOX_QUANT_TERMS.some(t => normalized.includes(t));
  const hasConceptualTrigger = GENERAL_CONCEPTUAL_TERMS.some(t => normalized.includes(t));
  const isPersonalOrPortfolio = normalized.includes('my ') || normalized.includes('our ') || normalized.includes('in my') || normalized.includes('my strategy') || normalized.includes('my backtest');
  const isArithmeticOrSimple = /^\s*(\d+\s*[\+\-\*\/]\s*\d+|what\s+is\s+\d+\s*[\+\-\*\/]\s*\d+|hello|hi|hey|help)\s*$/i.test(normalized);

  // PRIORITY 0: Basic math / conversational greetings -> Pure GENERAL
  if (isArithmeticOrSimple) {
    return {
      mode: 'GENERAL',
      reason: 'General inquiry or arithmetic; no quantitative tools or external search required.',
      recommendedTools: [],
      inferredAsset: undefined,
      inferredStrategy: undefined,
      requiresWebSearch: false,
      requiresBlackboxTools: false,
    };
  }

  // PRIORITY 4 (in prompt): HYBRID Mode
  // Explicitly asking for both: BLACKBOX evidence + current external news/sentiment
  // e.g. "Use BLACKBOX X to analyze BTC's risk and compare it with recent Bitcoin market news."
  // e.g. "Search today's NVIDIA news and compare with historical volatility in my high-volatility regime"
  if (hasWebTrigger && (hasBlackboxExplicit || hasBlackboxQuantTerms || (normalized.includes('compare') && (isPersonalOrPortfolio || explicitAsset)))) {
    const asset = explicitAsset || (context?.asset as any) || 'BTC';
    const strategy = explicitStrategy || (context?.strategy as any) || 'EMA_TREND';
    const tools: string[] = ['web_search'];
    if (normalized.includes('regime')) tools.push('get_regime_performance');
    if (normalized.includes('volatility') || normalized.includes('metric') || normalized.includes('risk') || normalized.includes('sharpe')) tools.push('get_asset_metrics');
    if (normalized.includes('strategy') || normalized.includes('backtest')) tools.push('get_strategy_metrics');
    if (tools.length === 1) tools.push('get_asset_metrics');

    return {
      mode: 'HYBRID',
      reason: 'Hybrid inquiry synthesizing verified BLACKBOX calculations with live external web developments.',
      recommendedTools: tools,
      inferredAsset: asset,
      inferredStrategy: strategy,
      requiresWebSearch: true,
      requiresBlackboxTools: true,
    };
  }

  // PRIORITY 2: Explicit current/external research request -> WEB tools only
  // e.g. "What's happening with Bitcoin today?", "What is the latest news and earnings announcement regarding NVIDIA today?"
  if (hasWebTrigger && !hasBlackboxExplicit && !isPersonalOrPortfolio && !hasBlackboxQuantTerms) {
    return {
      mode: 'WEB',
      reason: 'Real-time external financial developments / current market intelligence requested via live web search.',
      recommendedTools: ['web_search'],
      inferredAsset: explicitAsset,
      inferredStrategy: explicitStrategy,
      requiresWebSearch: true,
      requiresBlackboxTools: false,
    };
  }

  // PRIORITY 1: BLACKBOX quantitative request
  // Direct calculations, backtest inspections, platform engines, or requests to analyze metrics on specific assets
  // e.g. "Analyze BTC using BLACKBOX X. Give me the annualized Sharpe, annualized volatility, and maximum drawdown."
  // e.g. "Why did my SMA Crossover strategy underperform on Bitcoin?"
  const isDirectQuantAction = normalized.startsWith('analyze') ||
    normalized.startsWith('calculate') ||
    normalized.startsWith('run backtest') ||
    normalized.includes('give me the annualized') ||
    normalized.includes('give me its annualized') ||
    normalized.includes('underperform') ||
    normalized.includes('outperform');

  if (hasBlackboxExplicit || isPersonalOrPortfolio || hasBlackboxQuantTerms || (explicitAsset && isDirectQuantAction)) {
    const asset = explicitAsset || (context?.asset as any) || 'BTC';
    const strategy = explicitStrategy || (context?.strategy as any) || 'EMA_TREND';

    const tools: string[] = [];
    if (normalized.includes('drawdown')) tools.push('get_drawdown_analysis');
    if (normalized.includes('regime')) tools.push('get_regime_performance');
    if (normalized.includes('correlation')) {
      if (normalized.includes('rolling')) tools.push('get_rolling_correlation');
      else tools.push('get_correlation_matrix');
    }
    if (normalized.includes('robustness') || normalized.includes('cliff') || normalized.includes('parameter')) tools.push('get_robustness_analysis');
    if (normalized.includes('stress') || normalized.includes('shock') || normalized.includes('crisis')) tools.push('get_stress_result');
    if (normalized.includes('genome') || normalized.includes('relationship network')) tools.push('get_strategy_genome');
    if (normalized.includes('risk brief') || normalized.includes('risk committee') || normalized.includes('cro')) tools.push('get_risk_brief');
    if (normalized.includes('ghost') || normalized.includes('trail') || normalized.includes('notebook')) tools.push('get_research_trail');
    if (normalized.includes('strategy') || normalized.includes('backtest') || normalized.includes('underperform') || normalized.includes('outperform') || normalized.includes('win rate')) {
      tools.push('get_strategy_metrics');
    }

    if (tools.length === 0 || normalized.includes('sharpe') || normalized.includes('volatility') || normalized.includes('metric') || normalized.includes('analyze')) {
      if (!tools.includes('get_asset_metrics')) tools.push('get_asset_metrics');
    }

    return {
      mode: 'BLACKBOX',
      reason: 'Verified deterministic quantitative calculations requested from BLACKBOX engines.',
      recommendedTools: tools,
      inferredAsset: asset,
      inferredStrategy: strategy,
      requiresWebSearch: false,
      requiresBlackboxTools: true,
    };
  }

  // PRIORITY 3: Conceptual / general educational request -> Featherless directly (NO TOOLS)
  // e.g. "What is the Sharpe ratio? Explain the concept without using any asset-specific data."
  // e.g. "What is the Sharpe ratio?"
  // e.g. "What is volatility?"
  // e.g. "What is maximum drawdown?"
  // e.g. "What is SMA?"
  // e.g. "What is EMA?"
  // e.g. "What is a bull market?"
  // e.g. "What does correlation mean?"
  // e.g. "Explain volatility."
  // e.g. "How does SMA crossover work?"
  // STRICT CONTEXT ISOLATION: Active UI asset is NEVER injected into conceptual questions.
  if (hasConceptualTrigger || normalized.length < 60) {
    return {
      mode: 'GENERAL',
      reason: 'Educational/theoretical conceptual inquiry. Strict context isolation enforced with ZERO tools.',
      recommendedTools: [],
      inferredAsset: undefined, // ISOLATE: Never inherit active UI asset into conceptual questions!
      inferredStrategy: undefined,
      requiresWebSearch: false,
      requiresBlackboxTools: false,
    };
  }

  // Default fallback: GENERAL mode with zero tools
  return {
    mode: 'GENERAL',
    reason: 'General conceptual inquiry evaluated with conversational quantitative knowledge; zero tools.',
    recommendedTools: [],
    inferredAsset: undefined,
    inferredStrategy: undefined,
    requiresWebSearch: false,
    requiresBlackboxTools: false,
  };
}

/**
 * Convenience helper matching the assistant prompt specification
 */
export function classifyIntent(query: string, context?: { asset?: string; strategy?: string }) {
  const decision = routeAssistantRequest(query, context);
  return {
    ...decision,
    tools: decision.recommendedTools,
  };
}
