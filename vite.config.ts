import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import type { Plugin } from 'vite'

function apiServerPlugin(): Plugin {
  return {
    name: 'vite-plugin-blackbox-api',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (req.url?.startsWith('/api')) {
          const { dispatchApiRequest } = await import('./server/apiRouter');
          await dispatchApiRequest(req, res);
        } else {
          next();
        }
      });
    },
    configurePreviewServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (req.url?.startsWith('/api')) {
          const { dispatchApiRequest } = await import('./server/apiRouter');
          await dispatchApiRequest(req, res);
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

