# BLACKBOX X — DEPLOYMENT & OPERATIONS GUIDE
**Document Version:** 1.0 (Phase 4.3 Final)  
**Target Environment:** Node.js 20+ / Modern Web Browsers (Chrome, Edge, Safari)  
**Security Level:** Institutional Research Grade

---

## 1. System Requirements & Node Runtime

- **Node.js**: `v20.0.0` or higher (tested on Node v20.12.2 and v22.x)
- **Package Manager**: `npm` v10+ (or `pnpm` / `yarn` compatible)
- **Supported Browsers**: Chrome 110+, Safari 16+, Edge 110+, Firefox 115+ (WebGL 2.0 & Web Worker support required)
- **RAM**: Minimum 2 GB (4 GB recommended for Web Worker simulations)

---

## 2. Environment Variables Configuration

Copy the template from `.env.example` to `.env`:

```bash
cp .env.example .env
```

### Environment Variable Reference

| Variable | Required? | Default / Example | Purpose |
| :--- | :---: | :--- | :--- |
| `FEATHERLESS_API_KEY` | Optional | `rc_...` | API key for Featherless LLM inference (`/api/ai/chat`). If unset, system defaults to deterministic offline grounding. |
| `FEATHERLESS_MODEL` | Optional | `meta-llama/Meta-Llama-3.1-8B-Instruct` | Target model for chat assistant and research synthesis. |
| `GEMINI_API_KEY` | Optional | `AIzaSy...` | Server-side key for Google Gemini GenAI SDK (`/api/risk-brief`). If unset, built-in deterministic fallback is utilized. |
| `GEMINI_MODEL` | Optional | `gemini-2.5-flash` | Target model for Chief Risk Officer (CRO) Risk Committee briefs. |
| `TAVILY_API_KEY` | Optional | `tvly-...` | API key for live external financial search (`/api/web/search`). If unset, web search returns graceful offline message. |

> [!IMPORTANT]
> **API Key Security**: None of these keys are exposed to the browser or bundled in Vite client builds. All external provider requests are proxied via server middleware (`server/api/`).

---

## 3. Local Development

To run BLACKBOX X locally with live reloading and server middleware:

```bash
# 1. Install dependencies
npm install

# 2. Run test suite to verify quantitative integrity
npm test

# 3. Start local development server
npm run dev
```

The application will be accessible at:
```
http://localhost:5173
```

Verify the environment configuration safely by navigating to:
```
http://localhost:5173/api/env-check
```

---

## 4. Production Build & Optimization

To compile and bundle BLACKBOX X for production:

```bash
# Run TypeScript compilation and Vite build
npm run build
```

This compiles static assets into the `dist/` directory with code splitting:
- `dist/assets/vendor-three-*.js` (~998 kB, WebGL & Three.js core)
- `dist/assets/vendor-charts-*.js` (~430 kB, Recharts analytical charting)
- `dist/assets/vendor-motion-*.js` (~122 kB, Framer Motion UI transitions)
- `dist/assets/index-*.js` (~902 kB, application logic, quantitative engines, and audit layer)
- `dist/assets/monteCarlo.worker-*.js` (~29 kB, dedicated Web Worker script)
- `dist/assets/index-*.css` (~75 kB, Tailwind institutional styling)

To preview the production bundle locally:

```bash
npm run preview
```

---

## 5. Deployment Options

### Option A: Static Web Hosting (Vercel / Netlify / Cloudflare Pages)
Because BLACKBOX X's core quantitative engines, backtesters, Monte Carlo simulations, and Research Observatory run 100% client-side in the browser:
- Build Command: `npm run build`
- Output Directory: `dist`
- If external LLMs are needed on Vercel/Netlify, export the handlers in `server/api/` as serverless functions.
- If deployed purely as a static SPA without serverless functions, the application runs in **Deterministic Offline Mode** with 100% functionality across all quantitative analytics, backtests, and mock briefs.

### Option B: Node.js Container / Full-Stack (Docker, Render, Railway, Cloud Run)
To preserve the Vite API server middleware:
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
EXPOSE 5173
CMD ["npm", "run", "preview", "--", "--host", "0.0.0.0", "--port", "5173"]
```

---

## 6. Offline Demo Mode & Presentation Safety

BLACKBOX X is engineered so that **no live internet connection or external API key is required** for hackathon judging:
1. **Core Engines**: 100% deterministic TypeScript running in browser memory.
2. **Monte Carlo**: Computes 10,000 paths in a local Web Worker.
3. **AI Fallbacks**: If `FEATHERLESS_API_KEY` or `GEMINI_API_KEY` are not set, all AI interfaces gracefully switch to deterministic offline responses citing verified backtest numbers.
4. **Demo Reset**: Clicking **RESET DEMO** in the top navigation immediately resets all states to the canonical baseline.

---

## 7. Known Architectural Limitations

1. **Simulated Offline Dataset**: Synchronized 5-year daily pricing (2019-01-01 to 2023-12-31, 1,825 bars). Live exchange WebSocket feeds are reserved for future roadmap scope.
2. **Static Friction Model**: Assumes a constant 10 bps turnover fee and next-bar close fills without intraday limit-order queue modeling.
3. **In-Memory Case Store**: Research cases and audit logs are persisted in browser memory and LocalStorage. Multi-tenant cloud databases (PostgreSQL/Supabase) are identified as future scope.
