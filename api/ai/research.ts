/**
 * BLACKBOX X — Vercel Serverless Function: Autonomous AI Quant Research
 * Route: POST /api/ai/research
 * 
 * Orchestrates multi-phase bounded autonomous research loop on the server.
 */

import { handleResearchRequest } from '../../server/api/ai/research';
import { handleCors, parseRequestBody, sendResponse } from '../../server/apiRouter';

export default async function handler(req: any, res: any) {
  if (handleCors(req, res)) return;

  if (req.method !== 'POST') {
    return sendResponse(res, 405, { error: 'Method not allowed. Use POST.' });
  }

  try {
    const body = await parseRequestBody(req);
    const result = await handleResearchRequest(body);
    return sendResponse(res, 200, result);
  } catch (err) {
    return sendResponse(res, 500, {
      success: false,
      error: (err as Error).message || 'Autonomous research failed',
    });
  }
}
