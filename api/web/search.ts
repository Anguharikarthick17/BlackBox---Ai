/**
 * BLACKBOX X — Vercel Serverless Function: Web Search Proxy
 * Route: POST /api/web/search
 * 
 * Proxies financial search via TavilyProvider on the server.
 * ⚠️ TAVILY_API_KEY remains server-side.
 */

import { handleWebSearchRequest } from '../../server/api/web/search';
import { handleCors, parseRequestBody, sendResponse } from '../../server/apiRouter';

export default async function handler(req: any, res: any) {
  if (handleCors(req, res)) return;

  if (req.method !== 'POST') {
    return sendResponse(res, 405, { error: 'Method not allowed. Use POST.' });
  }

  try {
    const body = await parseRequestBody(req);
    const result = await handleWebSearchRequest(body);
    return sendResponse(res, 200, result);
  } catch (err) {
    return sendResponse(res, 500, {
      query: '',
      results: [],
      error: (err as Error).message || 'Web search failed',
      provider: 'Tavily',
    });
  }
}
