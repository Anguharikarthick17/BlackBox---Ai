/**
 * BLACKBOX X — Vercel Serverless Function: Environment Status Check
 * Route: GET /api/env-check
 */

import { getHealthPayload, handleCors, sendResponse } from '../server/apiBundle.js';

export default async function handler(req: any, res: any) {
  if (handleCors(req, res)) return;

  const health = getHealthPayload();
  return sendResponse(res, 200, {
    status: health.status,
    environment: health.environment,
    security: health.security,
    timestamp: health.timestamp,
  });
}
