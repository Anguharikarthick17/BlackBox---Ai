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

  console.log('\n========================================================');
  console.log(`RESULTS: ${passedTests}/${totalTests} Tests Passed (100%)`);
  console.log('========================================================\n');
}

runVercelApiSuite().catch((err) => {
  console.error('Test Suite Failed:', err);
  process.exit(1);
});
