/**
 * BLACKBOX X — Vercel Serverless Function: AI Direct Tool Execution
 * Route: POST /api/ai/tool
 * 
 * Executes a single quantitative tool deterministically on the server.
 */

import { handleToolExecutionRequest, handleCors, parseRequestBody, sendResponse } from '../../server/apiBundle.js';

export default async function handler(req: any, res: any) {
  if (handleCors(req, res)) return;

  if (req.method !== 'POST') {
    return sendResponse(res, 405, { error: 'Method not allowed. Use POST.' });
  }

  try {
    const body = await parseRequestBody(req);
    const result = await handleToolExecutionRequest(body);
    return sendResponse(res, 200, result);
  } catch (err) {
    return sendResponse(res, 500, {
      success: false,
      error: (err as Error).message || 'Tool execution failed',
    });
  }
}
