/**
 * BLACKBOX X — Vercel Serverless Function: Research Cases Collection
 * Routes:
 *   GET  /api/research/cases — List cases
 *   POST /api/research/cases — Persist sealed research case
 */

import { handleListResearchCases, handleSaveResearchCase } from '../../server/api/research/cases';
import { handleCors, parseRequestBody, extractQueryString, sendResponse } from '../../server/apiRouter';

export default async function handler(req: any, res: any) {
  if (handleCors(req, res)) return;

  const method = req.method?.toUpperCase() || 'GET';

  if (method === 'GET') {
    try {
      const queryString = extractQueryString(req);
      const params = new URLSearchParams(queryString);
      const result = await handleListResearchCases(params);
      return sendResponse(res, 200, result);
    } catch (err) {
      return sendResponse(res, 500, { error: (err as Error).message });
    }
  }

  if (method === 'POST') {
    try {
      const body = await parseRequestBody(req);
      const result = await handleSaveResearchCase(body);
      return sendResponse(res, result.success ? 201 : 500, result);
    } catch (err) {
      return sendResponse(res, 500, { success: false, error: (err as Error).message });
    }
  }

  return sendResponse(res, 405, { error: `Method ${method} not allowed` });
}
