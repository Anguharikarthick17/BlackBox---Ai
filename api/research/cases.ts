/**
 * BLACKBOX X — Vercel Serverless Function: Research Cases (List & Save)
 * Routes: GET /api/research/cases, POST /api/research/cases
 */

import {
  handleListResearchCases,
  handleSaveResearchCase,
  handleCors,
  parseRequestBody,
  sendResponse,
} from '../../server/apiBundle.js';

export default async function handler(req: any, res: any) {
  if (handleCors(req, res)) return;

  const method = req.method?.toUpperCase() || 'GET';

  if (method === 'GET') {
    try {
      const result = await handleListResearchCases();
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
