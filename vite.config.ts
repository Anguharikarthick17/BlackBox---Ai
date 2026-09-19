import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import type { Plugin } from 'vite'

function apiServerPlugin(): Plugin {
  const handleApiRequest = async (req: any, res: any) => {
    const url = req.url?.split('?')[0];

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
        },
        security: {
          keysExposed: false,
          serverSideOnly: true,
        },
      }));
      return;
    }

    if (req.method !== 'POST') {
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
        } else {
          res.statusCode = 404;
          res.end(JSON.stringify({ error: `Not found: ${url}` }));
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

