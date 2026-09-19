/**
 * BLACKBOX X — Unified Server API Router
 * 
 * SERVER-ONLY: Used both by Vite dev server (apiServerPlugin) and
 * Vercel Serverless Functions (/api/*).
 * 
 * Guarantees 100% parity between local development and Vercel production.
 * Never leaks API keys or internal stack traces.
 */

import { handleRiskBriefRequest } from './riskBriefHandler';
import { handleAssistantChatRequest } from './api/ai/chat';
import { handleToolExecutionRequest } from './api/ai/tool';
import { handleWebSearchRequest } from './api/web/search';
import { handleResearchRequest } from './api/ai/research';
import {
  handleResearchHealthRequest,
  handleListResearchCases,
  handleGetResearchCase,
  handleSaveResearchCase,
  handleSaveReplayVerification,
} from './api/research/cases';

export function normalizeApiPath(req: any): string {
  // If Vercel passed query.path as array or string (e.g. from [...path])
  if (req.query && req.query.path) {
    const p = Array.isArray(req.query.path) ? req.query.path.join('/') : req.query.path;
    return `/api/${p}`.replace(/\/+/g, '/');
  }

  const rawUrl = req.url || '';
  const clean = rawUrl.split('?')[0];

  if (clean.startsWith('/api')) {
    return clean;
  }
  return `/api${clean.startsWith('/') ? '' : '/'}${clean}`;
}

export function extractQueryString(req: any): string {
  const rawUrl = req.url || '';
  if (rawUrl.includes('?')) {
    return rawUrl.slice(rawUrl.indexOf('?') + 1);
  }
  // If req.query is already parsed by Vercel / Express
  if (req.query && typeof req.query === 'object') {
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(req.query)) {
      if (k === 'path') continue; // omit internal router segment
      if (Array.isArray(v)) {
        v.forEach((item) => params.append(k, String(item)));
      } else if (v !== undefined) {
        params.append(k, String(v));
      }
    }
    return params.toString();
  }
  return '';
}

export async function parseRequestBody(req: any): Promise<any> {
  if (req.body !== undefined && req.body !== null) {
    if (typeof req.body === 'string') {
      try {
        return JSON.parse(req.body);
      } catch {
        return {};
      }
    }
    return req.body;
  }

  if (typeof req.on === 'function') {
    return new Promise((resolve) => {
      let bodyStr = '';
      req.on('data', (chunk: any) => {
        bodyStr += chunk;
      });
      req.on('end', () => {
        try {
          resolve(JSON.parse(bodyStr || '{}'));
        } catch {
          resolve({});
        }
      });
      req.on('error', () => {
        resolve({});
      });
    });
  }

  return {};
}

export function handleCors(req: any, res: any): boolean {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method?.toUpperCase() === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return true;
  }
  return false;
}

export function sendResponse(res: any, statusCode: number, data: any): void {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (typeof res.status === 'function' && typeof res.json === 'function') {
    res.status(statusCode).json(data);
  } else {
    res.statusCode = statusCode;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(data));
  }
}

export function getHealthPayload(): any {
  return {
    status: 'HEALTHY',
    service: 'BLACKBOX X Institutional Quant Server API',
    timestamp: new Date().toISOString(),
    environment: {
      featherless: Boolean(process.env.FEATHERLESS_API_KEY?.trim()) ? 'CONFIGURED' : 'NOT CONFIGURED',
      gemini: Boolean(process.env.GEMINI_API_KEY?.trim()) ? 'CONFIGURED' : 'NOT CONFIGURED',
      tavily: Boolean(process.env.TAVILY_API_KEY?.trim()) ? 'CONFIGURED' : 'NOT CONFIGURED',
      supabase: Boolean(process.env.VITE_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) ? 'CONFIGURED' : 'NOT CONFIGURED',
    },
    security: {
      keysExposed: false,
      serverSideOnly: true,
    },
  };
}

/**
 * Main API Request Dispatcher
 */
export async function dispatchApiRequest(req: any, res: any): Promise<void> {
  // Handle CORS preflight
  if (handleCors(req, res)) {
    return;
  }

  const method = req.method?.toUpperCase() || 'GET';
  const url = normalizeApiPath(req);
  const queryString = extractQueryString(req);

  // --------------------------------------------------------
  // GET-capable endpoints
  // --------------------------------------------------------
  if (url === '/api' || url === '/api/' || url === '/api/env-check' || url === '/api/health') {
    sendResponse(res, 200, getHealthPayload());
    return;
  }

  // --------------------------------------------------------
  // RESEARCH PERSISTENCE API — GET routes
  // --------------------------------------------------------
  if (url === '/api/research/health' && method === 'GET') {
    try {
      const result = await handleResearchHealthRequest();
      sendResponse(res, result.ok ? 200 : 503, result);
    } catch (err) {
      sendResponse(res, 503, { ok: false, error: (err as Error).message });
    }
    return;
  }

  if (url === '/api/research/cases' && method === 'GET') {
    try {
      const params = new URLSearchParams(queryString);
      const result = await handleListResearchCases(params);
      sendResponse(res, 200, result);
    } catch (err) {
      sendResponse(res, 500, { error: (err as Error).message });
    }
    return;
  }

  const caseGetMatch = url.match(/^\/api\/research\/cases\/([^/]+)$/);
  if (caseGetMatch && method === 'GET') {
    try {
      const result = await handleGetResearchCase(caseGetMatch[1]);
      sendResponse(res, result.caseData ? 200 : 404, result);
    } catch (err) {
      sendResponse(res, 500, { error: (err as Error).message });
    }
    return;
  }

  // --------------------------------------------------------
  // POST-only routes
  // --------------------------------------------------------
  if (method !== 'POST') {
    sendResponse(res, 405, { error: `Method ${method} not allowed for ${url}` });
    return;
  }

  try {
    const body = await parseRequestBody(req);

    if (url === '/api/risk-brief') {
      const result = await handleRiskBriefRequest(body);
      sendResponse(res, 200, result);
    } else if (url === '/api/ai/chat') {
      const result = await handleAssistantChatRequest(body);
      sendResponse(res, 200, result);
    } else if (url === '/api/ai/tool') {
      const result = await handleToolExecutionRequest(body);
      sendResponse(res, 200, result);
    } else if (url === '/api/web/search') {
      const result = await handleWebSearchRequest(body);
      sendResponse(res, 200, result);
    } else if (url === '/api/ai/research') {
      const result = await handleResearchRequest(body);
      sendResponse(res, 200, result);
    } else if (url === '/api/research/cases') {
      const result = await handleSaveResearchCase(body);
      sendResponse(res, result.success ? 201 : 500, result);
    } else {
      const replayPostMatch = url.match(/^\/api\/research\/cases\/([^/]+)\/replay$/);
      if (replayPostMatch) {
        const result = await handleSaveReplayVerification(replayPostMatch[1], body);
        sendResponse(res, result.success ? 201 : 500, result);
      } else {
        sendResponse(res, 404, { error: `Endpoint not found: ${url}` });
      }
    }
  } catch (err) {
    sendResponse(res, 500, {
      configured: false,
      status: 'ERROR',
      error: (err as Error).message || 'Internal server error',
    });
  }
}
