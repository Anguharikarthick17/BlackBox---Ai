/**
 * BLACKBOX X — PHASE 4.0: INSTITUTIONAL RESEARCH WORKSPACE
 * Central Quantitative Tool Registry & Allowlist
 * 
 * Source of Truth: docs/INSTITUTIONAL-RESEARCH-ARCHITECTURE.md
 */

import { ALL_BLACKBOX_TOOLS } from '../aiTools';
import { ResearchToolDefinition, ResearchExecutionClass } from './researchTypes';

interface ToolMeta {
  executionClass: ResearchExecutionClass;
  maxExecutions: number;
  provenance: string[];
}

const TOOL_METADATA_MAP: Record<string, ToolMeta> = {
  get_asset_metrics: {
    executionClass: 'LIGHTWEIGHT',
    maxExecutions: 8,
    provenance: ['dataset', 'asset', 'startDate', 'endDate'],
  },
  get_strategy_metrics: {
    executionClass: 'LIGHTWEIGHT',
    maxExecutions: 8,
    provenance: ['asset', 'strategy', 'friction', 'startDate', 'endDate'],
  },
  get_benchmark_metrics: {
    executionClass: 'LIGHTWEIGHT',
    maxExecutions: 8,
    provenance: ['asset', 'startDate', 'endDate'],
  },
  get_regime_performance: {
    executionClass: 'LIGHTWEIGHT',
    maxExecutions: 6,
    provenance: ['asset', 'strategy', 'regimeEngineVersion'],
  },
  get_drawdown_analysis: {
    executionClass: 'LIGHTWEIGHT',
    maxExecutions: 6,
    provenance: ['asset', 'strategy', 'drawdownEvents'],
  },
  get_correlation_matrix: {
    executionClass: 'LIGHTWEIGHT',
    maxExecutions: 4,
    provenance: ['universe', 'startDate', 'endDate'],
  },
  get_rolling_correlation: {
    executionClass: 'LIGHTWEIGHT',
    maxExecutions: 4,
    provenance: ['assetA', 'assetB', 'windowDays'],
  },
  get_robustness_analysis: {
    executionClass: 'MEDIUM',
    maxExecutions: 4,
    provenance: ['asset', 'strategy', 'costGrid', 'parameterGrid'],
  },
  get_stress_result: {
    executionClass: 'LIGHTWEIGHT',
    maxExecutions: 6,
    provenance: ['scenarioId', 'shockParameters'],
  },
  get_strategy_genome: {
    executionClass: 'LIGHTWEIGHT',
    maxExecutions: 4,
    provenance: ['genomeNodes', 'graphEdges', 'phenotype'],
  },
  get_research_trail: {
    executionClass: 'LIGHTWEIGHT',
    maxExecutions: 4,
    provenance: ['historicalLogs'],
  },
  get_risk_brief: {
    executionClass: 'LIGHTWEIGHT',
    maxExecutions: 4,
    provenance: ['riskPack', 'officerPerspectives'],
  },
  get_portfolio_metrics: {
    executionClass: 'LIGHTWEIGHT',
    maxExecutions: 6,
    provenance: ['weights', 'covarianceMatrix', 'observationCount'],
  },
  get_portfolio_optimization: {
    executionClass: 'MEDIUM',
    maxExecutions: 4,
    provenance: ['objective', 'targetReturn', 'simplexMethod'],
  },
  get_monte_carlo_risk: {
    executionClass: 'HEAVY_WORKER',
    maxExecutions: 3,
    provenance: ['method', 'simulations', 'horizonDays', 'seed', 'workerExecution'],
  },
  get_regime_monte_carlo_risk: {
    executionClass: 'HEAVY_WORKER',
    maxExecutions: 3,
    provenance: ['startingRegime', 'transitionMatrix', 'simulations', 'seed', 'workerExecution'],
  },
  compare_regime_simulations: {
    executionClass: 'HEAVY_WORKER',
    maxExecutions: 2,
    provenance: ['baselineRegime', 'comparisonRegimes', 'simulations', 'seed'],
  },
  compare_monte_carlo_backtest: {
    executionClass: 'HEAVY_WORKER',
    maxExecutions: 2,
    provenance: ['backtestRealized', 'simulatedDistribution'],
  },
};

/**
 * Built authoritative allowlist of research tools.
 */
export const RESEARCH_TOOL_REGISTRY: Record<string, ResearchToolDefinition> = {};

// Register existing native engines from ALL_BLACKBOX_TOOLS
for (const [toolName, toolDef] of Object.entries(ALL_BLACKBOX_TOOLS)) {
  const meta = TOOL_METADATA_MAP[toolName] || {
    executionClass: 'LIGHTWEIGHT',
    maxExecutions: 4,
    provenance: ['deterministicEngine'],
  };

  RESEARCH_TOOL_REGISTRY[toolName] = {
    toolName: toolDef.name,
    category: toolDef.category,
    description: toolDef.description,
    executionClass: meta.executionClass,
    maxExecutionsPerSession: meta.maxExecutions,
    provenanceRequirements: meta.provenance,
    inputSchema: toolDef.schema,
    execute: toolDef.execute,
  };
}

export function isToolRegistered(toolName: string): boolean {
  return Boolean(RESEARCH_TOOL_REGISTRY[toolName]);
}

export function getRegisteredTool(toolName: string): ResearchToolDefinition {
  const tool = RESEARCH_TOOL_REGISTRY[toolName];
  if (!tool) {
    throw new Error(
      `Unregistered tool rejection: "${toolName}" is not present in the ResearchToolRegistry allowlist. ` +
      `AI-generated or arbitrary tool execution is strictly prohibited.`
    );
  }
  return tool;
}

export function getAllRegisteredTools(): ResearchToolDefinition[] {
  return Object.values(RESEARCH_TOOL_REGISTRY);
}

/**
 * Executes a tool with strict allowlist and schema validation,
 * budget capping, and performance monitoring.
 */
export async function executeRegisteredTool(
  toolName: string,
  args: Record<string, any>
): Promise<{ result: any; latencyMs: number; toolName: string }> {
  const tool = getRegisteredTool(toolName);

  // Security guardrail: Enforce simulation path bounds (ceiling: 10,000 paths)
  const sanitizedArgs = { ...args };
  if (sanitizedArgs.simulations && typeof sanitizedArgs.simulations === 'number') {
    if (sanitizedArgs.simulations > 10000) {
      sanitizedArgs.simulations = 10000;
    }
  }

  // Schema validation
  if (tool.inputSchema && typeof tool.inputSchema.safeParse === 'function') {
    const parseResult = tool.inputSchema.safeParse(sanitizedArgs);
    if (!parseResult.success) {
      throw new Error(
        `Tool argument validation failure for "${toolName}": ${JSON.stringify(parseResult.error.issues)}`
      );
    }
  }

  const start = performance.now();
  const rawResult = await tool.execute(sanitizedArgs);
  const end = performance.now();
  const latencyMs = Math.round(end - start);

  return {
    result: rawResult,
    latencyMs,
    toolName,
  };
}
