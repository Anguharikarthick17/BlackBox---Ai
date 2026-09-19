/**
 * BLACKBOX X — Vercel Serverless Function: Health Check
 * Route: GET /api/health
 */

import { getHealthPayload, handleCors, sendResponse } from '../server/apiBundle.js';

export default async function handler(req: any, res: any) {
  if (handleCors(req, res)) return;

  const health = getHealthPayload();
  return sendResponse(res, 200, health);
}
