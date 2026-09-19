/**
 * BLACKBOX X — Vercel Serverless Function: System Health Check
 * Route: GET /api/health
 */

import { handleCors, sendResponse, getHealthPayload } from '../server/apiRouter';

export default async function handler(req: any, res: any) {
  if (handleCors(req, res)) return;
  return sendResponse(res, 200, getHealthPayload());
}
