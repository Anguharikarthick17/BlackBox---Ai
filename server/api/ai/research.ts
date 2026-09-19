/**
 * BLACKBOX X — Server API: Autonomous Quant Research Endpoint
 * 
 * Endpoint: POST /api/ai/research
 * Orchestrates server-side autonomous quant research:
 * Research Question -> Hypotheses -> Bounded Plan -> Tool Execution -> Evidence -> Contradiction -> Synthesis
 * 
 * Keeps API keys server-side and enforces strict tool boundaries.
 */

import fs from 'fs';
import path from 'path';
import { runAutonomousResearch, ResearchConclusion, ResearchRunState } from '../../../src/core/researchAgent';
import { Asset } from '../../../src/core/data';
import { StrategyType } from '../../../src/core/strategies';

export interface ResearchApiRequestBody {
  query?: string;
  asset?: Asset;
  strategy?: StrategyType;
  startDate?: string;
  endDate?: string;
}

export interface ResearchApiResponse {
  success: boolean;
  conclusion?: ResearchConclusion;
  state?: ResearchRunState;
  trailEntry?: {
    observation: string;
    hypothesis: string;
    evidence: string;
    impact: string;
    nextTest: string;
  };
  error?: string;
}

function ensureEnvLoaded(): void {
  try {
    const envPath = path.resolve(process.cwd(), '.env');
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf8');
      const matchKey = content.match(/^FEATHERLESS_API_KEY=(.+)$/m);
      if (matchKey && matchKey[1].trim()) {
        process.env.FEATHERLESS_API_KEY = matchKey[1].trim();
      }
    }
  } catch {}
}

export async function handleResearchRequest(body: ResearchApiRequestBody): Promise<ResearchApiResponse> {
  ensureEnvLoaded();

  const query = body?.query?.trim();
  if (!query) {
    return {
      success: false,
      error: 'A quantitative research question is required.',
    };
  }

  try {
    const result = await runAutonomousResearch(query, {
      asset: body.asset,
      strategy: body.strategy,
      startDate: body.startDate,
      endDate: body.endDate,
    });

    return {
      success: true,
      conclusion: result.conclusion,
      state: result.state,
      trailEntry: result.trailEntry,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || 'Autonomous research execution failed.',
    };
  }
}
