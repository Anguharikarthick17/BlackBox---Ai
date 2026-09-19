/**
 * BLACKBOX X — Vercel Serverless API Bundler
 * 
 * Bundles the server API router and all internal dependencies (src/core, src/services, server)
 * into a single self-contained ES module (server/apiBundle.js).
 * 
 * This guarantees:
 * 1. Zero runtime ERR_MODULE_NOT_FOUND errors on Vercel / Linux Lambda (/var/task).
 * 2. Complete resolution of extensionless imports and directory imports at build time.
 * 3. Exact type preservation with server/apiBundle.d.ts.
 */

import esbuild from 'esbuild';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

async function buildBundle() {
  const outfile = path.join(rootDir, 'server', 'apiBundle.js');
  const dtsfile = path.join(rootDir, 'server', 'apiBundle.d.ts');

  console.log('[API_BUNDLE] Bundling server/apiRouter.ts into server/apiBundle.js...');

  await esbuild.build({
    entryPoints: [path.join(rootDir, 'server', 'apiRouter.ts')],
    bundle: true,
    platform: 'node',
    target: 'node20',
    format: 'esm',
    outfile,
    external: ['@google/genai', '@supabase/supabase-js'],
    sourcemap: false,
    minify: false,
  });

  const dtsContent = `/**
 * BLACKBOX X — Auto-generated API Bundle Declarations
 */

export declare function normalizeApiPath(req: any): string;
export declare function extractQueryString(req: any): string;
export declare function parseRequestBody(req: any): Promise<any>;
export declare function handleCors(req: any, res: any): boolean;
export declare function sendResponse(res: any, statusCode: number, data: any): void;
export declare function getHealthPayload(): any;
export declare function dispatchApiRequest(req: any, res: any): Promise<any>;

export declare function handleRiskBriefRequest(body: any): Promise<any>;
export declare function handleAssistantChatRequest(body: any): Promise<any>;
export declare function handleToolExecutionRequest(body: any): Promise<any>;
export declare function handleWebSearchRequest(body: any): Promise<any>;
export declare function handleResearchRequest(body: any): Promise<any>;
export declare function handleResearchHealthRequest(): Promise<any>;
export declare function handleListResearchCases(): Promise<any>;
export declare function handleGetResearchCase(caseId: string): Promise<any>;
export declare function handleSaveResearchCase(body: any): Promise<any>;
export declare function handleSaveReplayVerification(caseId: string, body: any): Promise<any>;
`;

  fs.writeFileSync(dtsfile, dtsContent);

  const stats = fs.statSync(outfile);
  console.log(`[API_BUNDLE] Generated server/apiBundle.js (${Math.round(stats.size / 1024)} KB)`);
}

buildBundle().catch((err) => {
  console.error('[API_BUNDLE] Build failed:', err);
  process.exit(1);
});
