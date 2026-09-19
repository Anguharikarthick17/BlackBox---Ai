/**
 * BLACKBOX X — Vercel Serverless Function: Research Persistence Health
 * Route: GET /api/research/health
 */

import { handleResearchHealthRequest, handleCors, sendResponse } from '../../server/apiBundle.js';

export default async function handler(req: any, res: any) {
  if (handleCors(req, res)) return;

  try {
    const result = await handleResearchHealthRequest();
    return sendResponse(res, result.ok ? 200 : 503, result);
  } catch (err) {
    return sendResponse(res, 503, { ok: false, error: (err as Error).message });
  }
}
