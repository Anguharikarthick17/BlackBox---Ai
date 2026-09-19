/**
 * BLACKBOX X — Vercel Serverless Function: Single Research Case Lookup
 * Route: GET /api/research/cases/:caseId
 */

import { handleGetResearchCase } from '../../../../server/api/research/cases';
import { handleCors, sendResponse } from '../../../../server/apiRouter';

function extractCaseId(req: any): string {
  if (req.query?.caseId) {
    return Array.isArray(req.query.caseId) ? req.query.caseId[0] : req.query.caseId;
  }
  const match = req.url?.match(/\/cases\/([^/?]+)/);
  return match ? match[1] : '';
}

export default async function handler(req: any, res: any) {
  if (handleCors(req, res)) return;

  const method = req.method?.toUpperCase() || 'GET';
  if (method !== 'GET') {
    return sendResponse(res, 405, { error: `Method ${method} not allowed` });
  }

  const caseId = extractCaseId(req);
  if (!caseId) {
    return sendResponse(res, 400, { error: 'Case ID is required' });
  }

  try {
    const result = await handleGetResearchCase(caseId);
    return sendResponse(res, result.caseData ? 200 : 404, result);
  } catch (err) {
    return sendResponse(res, 500, { error: (err as Error).message });
  }
}
