/**
 * BLACKBOX X — Vercel Serverless API Verification Suite
 * 
 * Verifies:
 * 1. URL and path normalization across Vercel and Node environments
 * 2. GET /api, /api/health, /api/env-check endpoint contract
 * 3. Zero secret exposure in API responses
 * 4. Error handling and safe validation failure responses
 * 5. Method not allowed and 404 responses conform to JSON spec
 * 6. CORS preflight (OPTIONS) header handling
 * 7. Offline fallback capabilities when AI keys are unconfigured
 */

import {
  dispatchApiRequest,
  normalizeApiPath,
  extractQueryString,
  parseRequestBody,
} from '../server/apiRouter';

let totalTests = 0;
let passedTests = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`✓ PASS: ${testName}`);
  } else {
    console.error(`✗ FAIL: ${testName}`);
    if (detail) console.error(`  Detail: ${detail}`);
    throw new Error(`Assertion failed: ${testName} - ${detail || ''}`);
  }
}

// Mock HTTP Request/Response for isolated testing
function createMockHttp(options: {
  method?: string;
  url?: string;
  query?: Record<string, any>;
  body?: any;
}) {
  const headers: Record<string, string> = {};
  let statusCode = 200;
  let responseData = '';
  let ended = false;

  const req: any = {
    method: options.method || 'GET',
    url: options.url || '/api',
    query: options.query,
    body: options.body,
  };

  const res: any = {
    setHeader(key: string, val: string) {
      headers[key.toLowerCase()] = val;
    },
    getHeader(key: string) {
      return headers[key.toLowerCase()];
    },
    status(code: number) {
      statusCode = code;
      return res;
    },
    json(data: any) {
      responseData = JSON.stringify(data);
      ended = true;
      return res;
    },
    end(data?: string) {
      if (data) responseData = data;
      ended = true;
    },
    get statusCode() {
      return statusCode;
    },
    set statusCode(c: number) {
      statusCode = c;
    },
  };

  return {
    req,
    res,
    getResponse: () => ({
      statusCode,
      headers,
      body: responseData ? JSON.parse(responseData) : null,
      rawBody: responseData,
      ended,
    }),
  };
}

async function runVercelApiSuite() {
  console.log('\n========================================================');
  console.log('BLACKBOX X: VERCEL SERVERLESS API VERIFICATION');
  console.log('========================================================\n');

  // Test 1: Path Normalization
  console.log('--- Test 1: Path Normalization ---');
  assert(
    normalizeApiPath({ url: '/api/health' }) === '/api/health',
    'Normalizes direct /api/health url'
  );
  assert(
    normalizeApiPath({ url: '/api/research/cases?limit=10' }) === '/api/research/cases',
    'Strips query parameters from path'
  );
  assert(
    normalizeApiPath({ query: { path: ['ai', 'chat'] } }) === '/api/ai/chat',
    'Normalizes Vercel dynamic catch-all array query.path'
  );
  assert(
    normalizeApiPath({ query: { path: 'risk-brief' } }) === '/api/risk-brief',
    'Normalizes string query.path'
  );

  // Test 2: Query String Extraction
  console.log('\n--- Test 2: Query String Extraction ---');
  assert(
    extractQueryString({ url: '/api/cases?asset=BTC&limit=5' }) === 'asset=BTC&limit=5',
    'Extracts raw query string from url'
  );
  assert(
    extractQueryString({ query: { path: ['cases'], limit: '5', asset: 'BTC' } }) === 'limit=5&asset=BTC',
    'Omits internal path segment and constructs URLSearchParams'
  );

  // Test 3: CORS Preflight
  console.log('\n--- Test 3: CORS Preflight (OPTIONS) ---');
  const mockOptions = createMockHttp({ method: 'OPTIONS', url: '/api/ai/chat' });
  await dispatchApiRequest(mockOptions.req, mockOptions.res);
  const optRes = mockOptions.getResponse();
  assert(optRes.statusCode === 204, 'OPTIONS responds with 204 No Content');
  assert(
    optRes.headers['access-control-allow-origin'] === '*',
    'OPTIONS includes Access-Control-Allow-Origin: *'
  );
  assert(
    optRes.headers['access-control-allow-methods'].includes('POST'),
    'OPTIONS includes Access-Control-Allow-Methods'
  );

  // Test 4: Health & Env Check (Zero Secret Leakage)
  console.log('\n--- Test 4: Health & Env Check ---');
  const mockHealth = createMockHttp({ method: 'GET', url: '/api/health' });
  await dispatchApiRequest(mockHealth.req, mockHealth.res);
  const healthRes = mockHealth.getResponse();
  assert(healthRes.statusCode === 200, 'GET /api/health responds with 200 OK');
  assert(healthRes.body.status === 'HEALTHY', 'Status is HEALTHY');
  assert(healthRes.body.security.keysExposed === false, 'Security confirms keysExposed: false');
  assert(healthRes.body.security.serverSideOnly === true, 'Security confirms serverSideOnly: true');
  assert(!healthRes.rawBody.includes('AIzaSy'), 'No Google keys in response');
  assert(!healthRes.rawBody.includes('eyJhbGci'), 'No Supabase tokens in response');
  assert(!healthRes.rawBody.includes('tvly-'), 'No Tavily keys in response');

  // Test 5: Research Health Check
  console.log('\n--- Test 5: Research Persistence Health ---');
  const mockResHealth = createMockHttp({ method: 'GET', url: '/api/research/health' });
  await dispatchApiRequest(mockResHealth.req, mockResHealth.res);
  const resHealthRes = mockResHealth.getResponse();
  assert(
    resHealthRes.statusCode === 200 || resHealthRes.statusCode === 503,
    'GET /api/research/health responds with valid HTTP status'
  );
  assert(
    typeof resHealthRes.body.ok === 'boolean',
    'Health response has boolean ok flag'
  );
  assert(
    resHealthRes.body.supabase !== undefined,
    'Health response reports Supabase connection status'
  );

  // Test 6: Safe Error Handling for Unknown Route
  console.log('\n--- Test 6: Unknown Route Handling ---');
  const mock404 = createMockHttp({ method: 'POST', url: '/api/nonexistent-endpoint', body: {} });
  await dispatchApiRequest(mock404.req, mock404.res);
  const res404 = mock404.getResponse();
  assert(res404.statusCode === 404, 'POST to unknown API endpoint returns 404');
  assert(res404.body.error !== undefined, 'Returns clean JSON error message');

  // Test 7: Method Not Allowed
  console.log('\n--- Test 7: Method Not Allowed ---');
  const mock405 = createMockHttp({ method: 'DELETE', url: '/api/ai/chat' });
  await dispatchApiRequest(mock405.req, mock405.res);
  const res405 = mock405.getResponse();
  assert(res405.statusCode === 405, 'DELETE to POST-only endpoint returns 405');

  // Test 8: AI Assistant Offline Demo Fallback
  console.log('\n--- Test 8: AI Assistant Offline Demo Fallback ---');
  const mockChat = createMockHttp({
    method: 'POST',
    url: '/api/ai/chat',
    body: {
      messages: [{ role: 'user', content: 'What is the Sharpe ratio of the EMA strategy?' }],
      offlineDemo: true,
      currentContext: { asset: 'BTC', strategy: 'EMA_TREND' },
    },
  });
  await dispatchApiRequest(mockChat.req, mockChat.res);
  const chatRes = mockChat.getResponse();
  assert(chatRes.statusCode === 200, 'POST /api/ai/chat responds 200 with offlineDemo');
  assert(chatRes.body.message !== undefined, 'Chat response returns structured message');
  assert(
    chatRes.body.message.content.length > 20,
    'Chat response contains grounded analysis'
  );

  // Test 9: Direct Vercel Entrypoint Execution — api/ai/chat.ts
  console.log('\n--- Test 9: Direct Vercel Entrypoint: api/ai/chat.ts ---');
  const { default: aiChatHandler } = await import('../api/ai/chat');
  const directChatHttp = createMockHttp({
    method: 'POST',
    url: '/api/ai/chat',
    body: {
      messages: [{ role: 'user', content: 'Compare BTC vs buy and hold' }],
      offlineDemo: true,
      currentContext: { asset: 'BTC', strategy: 'EMA_TREND' },
    },
  });
  await aiChatHandler(directChatHttp.req, directChatHttp.res);
  const directChatRes = directChatHttp.getResponse();
  assert(directChatRes.statusCode === 200, 'api/ai/chat.ts directly returns 200 OK (NOT 404)');
  assert(directChatRes.body.message !== undefined, 'api/ai/chat.ts yields valid message structure');

  // Test 10: Direct Vercel Entrypoint: api/ai/tool.ts
  console.log('\n--- Test 10: Direct Vercel Entrypoint: api/ai/tool.ts ---');
  const { default: aiToolHandler } = await import('../api/ai/tool');
  const directToolHttp = createMockHttp({
    method: 'POST',
    url: '/api/ai/tool',
    body: { tool: 'get_asset_metrics', args: { asset: 'BTC' } },
  });
  await aiToolHandler(directToolHttp.req, directToolHttp.res);
  const directToolRes = directToolHttp.getResponse();
  assert(directToolRes.statusCode === 200, 'api/ai/tool.ts directly returns 200 OK (NOT 404)');
  assert(directToolRes.body.success === true, 'api/ai/tool.ts executes quantitative tool');

  // Test 11: Direct Vercel Entrypoint: api/health.ts & api/env-check.ts
  console.log('\n--- Test 11: Direct Vercel Entrypoints: api/health.ts & env-check.ts ---');
  const { default: healthHandler } = await import('../api/health');
  const directHealthHttp = createMockHttp({ method: 'GET', url: '/api/health' });
  await healthHandler(directHealthHttp.req, directHealthHttp.res);
  const directHealthRes = directHealthHttp.getResponse();
  assert(directHealthRes.statusCode === 200, 'api/health.ts directly returns 200 OK (NOT 404)');
  assert(directHealthRes.body.status === 'HEALTHY', 'api/health.ts status is HEALTHY');

  // Test 12: Direct Vercel Entrypoint: api/research/cases.ts
  console.log('\n--- Test 12: Direct Vercel Entrypoint: api/research/cases.ts ---');
  const { default: researchCasesHandler } = await import('../api/research/cases');
  const directCasesHttp = createMockHttp({ method: 'GET', url: '/api/research/cases?limit=1' });
  await researchCasesHandler(directCasesHttp.req, directCasesHttp.res);
  const directCasesRes = directCasesHttp.getResponse();
  assert(directCasesRes.statusCode === 200, 'api/research/cases.ts directly returns 200 OK (NOT 404)');
  assert(Array.isArray(directCasesRes.body.cases), 'api/research/cases.ts returns cases array');

  // Test 13: Direct Vercel Entrypoint: api/ai/research.ts
  console.log('\n--- Test 13: Direct Vercel Entrypoint: api/ai/research.ts ---');
  const { default: aiResearchHandler } = await import('../api/ai/research');
  const directResearchHttp = createMockHttp({
    method: 'POST',
    url: '/api/ai/research',
    body: {
      question: 'Evaluate EMA strategy risk for BTC',
      mode: 'HYBRID',
      currentContext: { asset: 'BTC', strategy: 'EMA_TREND' },
    },
  });
  await aiResearchHandler(directResearchHttp.req, directResearchHttp.res);
  const directResearchRes = directResearchHttp.getResponse();
  assert(directResearchRes.statusCode === 200, 'api/ai/research.ts directly returns 200 OK (NOT 404)');

  // Test 14: Direct Vercel Entrypoint: api/risk-brief.ts
  console.log('\n--- Test 14: Direct Vercel Entrypoint: api/risk-brief.ts ---');
  const { default: riskBriefHandler } = await import('../api/risk-brief');
  const directRiskHttp = createMockHttp({
    method: 'POST',
    url: '/api/risk-brief',
    body: {
      snapshot: {
        portfolio: { totalValue: 1000000, dailyPnl: 2500 },
        risk: { portfolioVaR95: 0.024, maxDrawdown: 0.12, beta: 0.95 },
      },
    },
  });
  await riskBriefHandler(directRiskHttp.req, directRiskHttp.res);
  const directRiskRes = directRiskHttp.getResponse();
  assert(directRiskRes.statusCode === 200, 'api/risk-brief.ts directly returns 200 OK (NOT 404)');

  // Test 15: Direct Vercel Entrypoint: api/web/search.ts
  console.log('\n--- Test 15: Direct Vercel Entrypoint: api/web/search.ts ---');
  const { default: webSearchHandler } = await import('../api/web/search');
  const directSearchHttp = createMockHttp({
    method: 'POST',
    url: '/api/web/search',
    body: { query: 'Federal Reserve rate decision market impact' },
  });
  await webSearchHandler(directSearchHttp.req, directSearchHttp.res);
  const directSearchRes = directSearchHttp.getResponse();
  assert(directSearchRes.statusCode === 200, 'api/web/search.ts directly returns 200 OK (NOT 404)');

  // Test 16: Direct Vercel Entrypoint: api/research/health.ts
  console.log('\n--- Test 16: Direct Vercel Entrypoint: api/research/health.ts ---');
  const { default: researchHealthHandler } = await import('../api/research/health');
  const directResHealthHttp = createMockHttp({ method: 'GET', url: '/api/research/health' });
  await researchHealthHandler(directResHealthHttp.req, directResHealthHttp.res);
  const directResHealthRes = directResHealthHttp.getResponse();
  assert(
    directResHealthRes.statusCode === 200 || directResHealthRes.statusCode === 503,
    'api/research/health.ts directly returns valid status (NOT 404)'
  );

  // Test 17: Vercel Hobby Plan Function Count Audit (Must be <= 12)
  console.log('\n--- Test 17: Vercel Function Count Audit ---');
  const fs = await import('fs');
  const path = await import('path');
  function countFiles(dir: string): string[] {
    let results: string[] = [];
    const list = fs.readdirSync(dir);
    list.forEach((file) => {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);
      if (stat && stat.isDirectory()) {
        results = results.concat(countFiles(fullPath));
      } else if (file.endsWith('.ts') || file.endsWith('.js')) {
        results.push(fullPath);
      }
    });
    return results;
  }
  const apiFiles = countFiles(path.resolve(process.cwd(), 'api'));
  console.log(`Detected Vercel Serverless Function files (${apiFiles.length}):`);
  apiFiles.forEach((f) => console.log(`  - ${path.relative(process.cwd(), f)}`));
  assert(apiFiles.length <= 12, `Vercel function count (${apiFiles.length}) is <= 12 Hobby limit`);
  assert(apiFiles.length <= 11, `Vercel function count (${apiFiles.length}) is <= 11 target`);
  assert(!apiFiles.some(f => f.includes('[...path]')), 'api/[...path].ts is successfully removed');

  console.log('\n========================================================');
  console.log(`RESULTS: ${passedTests}/${totalTests} Tests Passed (100%)`);
  console.log('========================================================\n');
}

runVercelApiSuite().catch((err) => {
  console.error('Test Suite Failed:', err);
  process.exit(1);
});
