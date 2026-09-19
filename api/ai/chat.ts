/**
 * BLACKBOX X — Vercel Serverless Function: AI Assistant Chat
 * Route: POST /api/ai/chat
 * 
 * Invokes server-side FeatherlessProvider with mode-enforced tool execution.
 * ⚠️ Keeps all API keys strictly server-side.
 */

import { handleAssistantChatRequest } from '../../server/api/ai/chat';
import { handleCors, parseRequestBody, sendResponse } from '../../server/apiRouter';

export default async function handler(req: any, res: any) {
  if (handleCors(req, res)) return;

  if (req.method !== 'POST') {
    return sendResponse(res, 405, { error: 'Method not allowed. Use POST.' });
  }

  try {
    const body = await parseRequestBody(req);
    const result = await handleAssistantChatRequest(body);
    return sendResponse(res, 200, result);
  } catch (err) {
    return sendResponse(res, 500, {
      configured: false,
      status: 'ERROR',
      error: (err as Error).message || 'Assistant chat failed',
    });
  }
}
