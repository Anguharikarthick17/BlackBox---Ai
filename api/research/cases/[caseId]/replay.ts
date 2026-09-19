/**
 * BLACKBOX X — Vercel Serverless Function: Research Case Replay Audit
 * Route: POST /api/research/cases/:caseId/replay
 */

import {
  handleSaveReplayVerification,
  handleCors,
  parseRequestBody,
  sendResponse,
} from '../../../../server/apiBundle.js';

function extractCaseId(req: any): string {
  if (req.query?.caseId) {
    return Array.isArray(req.query.caseId) ? req.query.caseId[0] : req.query.caseId;
  }
  const match = req.url?.match(/\/cases\/([^/?]+)\/replay/);
  return match ? match[1] : '';
}

export default async function handler(req: any, res: any) {
  if (handleCors(req, res)) return;

  const method = req.method?.toUpperCase() || 'POST';
  if (method !== 'POST') {
    return sendResponse(res, 405, { error: `Method ${method} not allowed. Use POST.` });
  }

  const caseId = extractCaseId(req);
  if (!caseId) {
    return sendResponse(res, 400, { error: 'Case ID is required' });
  }

  try {
    const body = await parseRequestBody(req);
    const result = await handleSaveReplayVerification(caseId, body);
    return sendResponse(res, result.success ? 201 : 500, result);
  } catch (err) {
    return sendResponse(res, 500, { success: false, error: (err as Error).message });
  }
}
