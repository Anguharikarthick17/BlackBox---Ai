/**
 * BLACKBOX X — Vercel Serverless Function: Root API Handler
 * Handles GET /api
 */

import { dispatchApiRequest } from '../server/apiRouter';

export default async function handler(req: any, res: any) {
  return dispatchApiRequest(req, res);
}
