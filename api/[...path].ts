/**
 * BLACKBOX X — Vercel Serverless Function: Catch-All API Handler
 * 
 * Handles all /api/* requests on Vercel:
 * - /api/env-check, /api/health
 * - /api/risk-brief
 * - /api/ai/chat, /api/ai/tool, /api/ai/research
 * - /api/web/search
 * - /api/research/health, /api/research/cases, /api/research/cases/:id, /api/research/cases/:id/replay
 */

import { dispatchApiRequest } from '../server/apiRouter';

export default async function handler(req: any, res: any) {
  return dispatchApiRequest(req, res);
}
