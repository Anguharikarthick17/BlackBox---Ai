import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import type { Plugin } from 'vite'

function apiServerPlugin(): Plugin {
  const handleApiRequest = async (req: any, res: any) => {
    const rawUrl = req.url || '';
    const url = rawUrl.split('?')[0];
    const queryString = rawUrl.includes('?') ? rawUrl.slice(rawUrl.indexOf('?') + 1) : '';
    const method = req.method?.toUpperCase() || 'GET';

    // --------------------------------------------------------
    // GET-capable endpoints
    // --------------------------------------------------------
    if (url === '/api/env-check' || url === '/api/health') {
      res.setHeader('Content-Type', 'application/json');
      res.statusCode = 200;
      res.end(JSON.stringify({
        status: 'HEALTHY',
        timestamp: new Date().toISOString(),
        environment: {
          featherless: Boolean(process.env.FEATHERLESS_API_KEY && process.env.FEATHERLESS_API_KEY.trim()) ? 'CONFIGURED' : 'NOT CONFIGURED',
          gemini: Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim()) ? 'CONFIGURED' : 'NOT CONFIGURED',
          tavily: Boolean(process.env.TAVILY_API_KEY && process.env.TAVILY_API_KEY.trim()) ? 'CONFIGURED' : 'NOT CONFIGURED',
          supabase: Boolean(process.env.VITE_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) ? 'CONFIGURED' : 'NOT CONFIGURED',
        },
        security: {
          keysExposed: false,
          serverSideOnly: true,
        },
      }));
      return;
    }

    // --------------------------------------------------------
    // RESEARCH PERSISTENCE API — GET routes
    // /api/research/health
    // /api/research/cases           (list)
    // /api/research/cases/:caseId   (single case)
    // --------------------------------------------------------
    if (url === '/api/research/health' && method === 'GET') {
      res.setHeader('Content-Type', 'application/json');
      try {
        const { handleResearchHealthRequest } = await import('./server/api/research/cases');
        const result = await handleResearchHealthRequest();
        res.statusCode = result.ok ? 200 : 503;
        res.end(JSON.stringify(result));
      } catch (err) {
        res.statusCode = 503;
        res.end(JSON.stringify({ ok: false, error: (err as Error).message }));
      }
      return;
    }

    if (url === '/api/research/cases' && method === 'GET') {
      res.setHeader('Content-Type', 'application/json');
      try {
        const { handleListResearchCases } = await import('./server/api/research/cases');
        const params = new URLSearchParams(queryString);
        const result = await handleListResearchCases(params);
        res.statusCode = 200;
        res.end(JSON.stringify(result));
      } catch (err) {
        res.statusCode = 500;
        res.end(JSON.stringify({ error: (err as Error).message }));
      }
      return;
    }

    const caseGetMatch = url.match(/^\/api\/research\/cases\/([^/]+)$/);
    if (caseGetMatch && method === 'GET') {
      res.setHeader('Content-Type', 'application/json');
      try {
        const { handleGetResearchCase } = await import('./server/api/research/cases');
        const result = await handleGetResearchCase(caseGetMatch[1]);
        res.statusCode = result.caseData ? 200 : 404;
        res.end(JSON.stringify(result));
      } catch (err) {
        res.statusCode = 500;
        res.end(JSON.stringify({ error: (err as Error).message }));
      }
      return;
    }

    // --------------------------------------------------------
    // POST-only routes (existing + new research routes)
    // --------------------------------------------------------
    if (method !== 'POST') {
      res.statusCode = 405;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'Method not allowed' }));
      return;
    }

    let bodyStr = '';
    req.on('data', (chunk: any) => {
      bodyStr += chunk;
    });

    req.on('end', async () => {
      try {
        const body = JSON.parse(bodyStr || '{}');
        res.setHeader('Content-Type', 'application/json');

        if (url === '/api/risk-brief') {
          const { handleRiskBriefRequest } = await import('./server/riskBriefHandler');
          const result = await handleRiskBriefRequest(body);
          res.statusCode = 200;
          res.end(JSON.stringify(result));
        } else if (url === '/api/ai/chat') {
          const { handleAssistantChatRequest } = await import('./server/api/ai/chat');
          const result = await handleAssistantChatRequest(body);
          res.statusCode = 200;
          res.end(JSON.stringify(result));
        } else if (url === '/api/ai/tool') {
          const { handleToolExecutionRequest } = await import('./server/api/ai/tool');
          const result = await handleToolExecutionRequest(body);
          res.statusCode = 200;
          res.end(JSON.stringify(result));
        } else if (url === '/api/web/search') {
          const { handleWebSearchRequest } = await import('./server/api/web/search');
          const result = await handleWebSearchRequest(body);
          res.statusCode = 200;
          res.end(JSON.stringify(result));
        } else if (url === '/api/ai/research') {
          const { handleResearchRequest } = await import('./server/api/ai/research');
          const result = await handleResearchRequest(body);
          res.statusCode = 200;
          res.end(JSON.stringify(result));
        // -----------------------------------------------
        // RESEARCH PERSISTENCE — POST routes
        // -----------------------------------------------
        } else if (url === '/api/research/cases') {
          const { handleSaveResearchCase } = await import('./server/api/research/cases');
          const result = await handleSaveResearchCase(body);
          res.statusCode = result.success ? 201 : 500;
          res.end(JSON.stringify(result));
        } else {
          // Check for /api/research/cases/:caseId/replay POST
          const replayPostMatch = url.match(/^\/api\/research\/cases\/([^/]+)\/replay$/);
          if (replayPostMatch) {
            const { handleSaveReplayVerification } = await import('./server/api/research/cases');
            const result = await handleSaveReplayVerification(replayPostMatch[1], body);
            res.statusCode = result.success ? 201 : 500;
            res.end(JSON.stringify(result));
          } else {
            res.statusCode = 404;
            res.end(JSON.stringify({ error: `Not found: ${url}` }));
          }
        }
      } catch (err) {
        res.setHeader('Content-Type', 'application/json');
        res.statusCode = 500;
        res.end(JSON.stringify({
          configured: false,
          status: 'ERROR',
          error: (err as Error).message,
        }));
      }
    });
  };

  return {
    name: 'vite-plugin-blackbox-api',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url?.startsWith('/api/')) {
          handleApiRequest(req, res);
        } else {
          next();
        }
      });
    },
    configurePreviewServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url?.startsWith('/api/')) {
          handleApiRequest(req, res);
        } else {
          next();
        }
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  if (env.GEMINI_API_KEY) {
    process.env.GEMINI_API_KEY = env.GEMINI_API_KEY;
  }
  if (env.GEMINI_MODEL) {
    process.env.GEMINI_MODEL = env.GEMINI_MODEL;
  }
  if (env.FEATHERLESS_API_KEY) {
    process.env.FEATHERLESS_API_KEY = env.FEATHERLESS_API_KEY;
  }
  if (env.FEATHERLESS_MODEL) {
    process.env.FEATHERLESS_MODEL = env.FEATHERLESS_MODEL;
  }
  if (env.TAVILY_API_KEY) {
    process.env.TAVILY_API_KEY = env.TAVILY_API_KEY;
  }
  // Supabase — server-side only
  // VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are automatically exposed to browser via VITE_ prefix
  // SUPABASE_SERVICE_ROLE_KEY must NEVER be exposed to browser — loaded only for server handlers
  if (env.SUPABASE_SERVICE_ROLE_KEY) {
    process.env.SUPABASE_SERVICE_ROLE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;
  }
  if (env.VITE_SUPABASE_URL) {
    process.env.VITE_SUPABASE_URL = env.VITE_SUPABASE_URL;
  }

  return {
    plugins: [react(), apiServerPlugin()],
    optimizeDeps: {
      include: ['three', '@react-three/fiber', '@react-three/drei'],
    },
    build: {
      chunkSizeWarningLimit: 2000,
      rollupOptions: {
        output: {
          manualChunks: {
            'vendor-react': ['react', 'react-dom'],
            'vendor-three': ['three', '@react-three/fiber', '@react-three/drei'],
            'vendor-motion': ['framer-motion'],
            'vendor-charts': ['recharts'],
            'vendor-zustand': ['zustand'],
          },
        },
      },
    },
  };
});

