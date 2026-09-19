/**
 * BLACKBOX X — Vercel Serverless Function: AI Risk Committee CRO Briefing
 * Route: POST /api/risk-brief
 * 
 * Uses Google GenAI SDK strictly on the server to interpret the ResearchPack.
 * ⚠️ GEMINI_API_KEY is isolated from the browser bundle.
 */

import { handleRiskBriefRequest } from '../server/riskBriefHandler';
import { handleCors, parseRequestBody, sendResponse } from '../server/apiRouter';

export default async function handler(req: any, res: any) {
  if (handleCors(req, res)) return;

  if (req.method !== 'POST') {
    return sendResponse(res, 405, { error: 'Method not allowed. Use POST.' });
  }

  try {
    const body = await parseRequestBody(req);
    const result = await handleRiskBriefRequest(body);
    return sendResponse(res, 200, result);
  } catch (err) {
    return sendResponse(res, 500, {
      configured: false,
      status: 'ERROR',
      error: (err as Error).message || 'Risk briefing generation failed',
    });
  }
}
