/**
 * BLACKBOX X — Vercel Serverless Function: AI Risk Committee Brief
 * Route: POST /api/risk-brief
 * 
 * Invokes server-side Gemini 2.5 Flash for multimodal risk brief generation.
 * ⚠️ GEMINI_API_KEY remains server-side.
 */

import { handleRiskBriefRequest, handleCors, parseRequestBody, sendResponse } from '../server/apiBundle.js';

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
      success: false,
      error: (err as Error).message || 'Risk brief generation failed',
    });
  }
}
