/**
 * BLACKBOX X — Phase 3.8
 * Monte Carlo Web Worker Client
 *
 * Manages asynchronous worker communication for non-blocking simulation.
 * Transparently falls back to direct engine in Node.js test environments.
 */

import { MonteCarloConfig, MonteCarloResult } from './monteCarloTypes';
import { runMonteCarloSimulation } from './monteCarloEngine';
import { RegimeMonteCarloConfig, RegimeMonteCarloResult } from './regimeMonteCarloTypes';
import { runRegimeMonteCarloSimulation } from './regimeMonteCarloEngine';
import { WorkerRequestMessage, WorkerResponseMessage } from './monteCarlo.worker';

let sharedWorker: Worker | null = null;
let pendingRequests = new Map<string, { resolve: (res: any) => void; reject: (err: any) => void }>();

function getWorker(): Worker | null {
  if (typeof window === 'undefined' || typeof Worker === 'undefined') {
    return null; // Node.js / CLI environment
  }

  if (!sharedWorker) {
    try {
      sharedWorker = new Worker(new URL('./monteCarlo.worker.ts', import.meta.url), {
        type: 'module',
      });

      sharedWorker.onmessage = (event: MessageEvent<WorkerResponseMessage>) => {
        const { id, success, result, regimeResult, error } = event.data;
        const pending = pendingRequests.get(id);
        if (pending) {
          pendingRequests.delete(id);
          if (success) {
            pending.resolve(regimeResult || result);
          } else {
            pending.reject(new Error(error || 'Worker simulation failed'));
          }
        }
      };

      sharedWorker.onerror = (err) => {
        console.error('Monte Carlo worker encountered an unhandled error:', err);
      };
    } catch (e) {
      console.warn('Unable to initialize Monte Carlo Web Worker, falling back to main thread:', e);
      sharedWorker = null;
    }
  }

  return sharedWorker;
}

/**
 * Runs a Monte Carlo simulation asynchronously off the main thread when in a browser,
 * or using direct execution in Node.js.
 */
export function runMonteCarloSimulationAsync(config: MonteCarloConfig): Promise<MonteCarloResult> {
  const worker = getWorker();

  if (!worker) {
    // Synchronous execution fallback for CLI / Node.js
    return new Promise((resolve, reject) => {
      try {
        const res = runMonteCarloSimulation(config);
        resolve(res);
      } catch (err) {
        reject(err);
      }
    });
  }

  return new Promise((resolve, reject) => {
    const id = `req-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    pendingRequests.set(id, { resolve, reject });

    const message: WorkerRequestMessage = { id, action: 'UNCONDITIONAL', config };
    worker.postMessage(message);
  });
}

/**
 * Runs a Regime-Conditioned Monte Carlo simulation asynchronously off the main thread
 * when in a browser, or using direct execution in Node.js.
 */
export function runRegimeMonteCarloSimulationAsync(config: RegimeMonteCarloConfig): Promise<RegimeMonteCarloResult> {
  const worker = getWorker();

  if (!worker) {
    // Synchronous execution fallback for CLI / Node.js
    return new Promise((resolve, reject) => {
      try {
        const res = runRegimeMonteCarloSimulation(config);
        resolve(res);
      } catch (err) {
        reject(err);
      }
    });
  }

  return new Promise((resolve, reject) => {
    const id = `rmc-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    pendingRequests.set(id, { resolve, reject });

    const message: WorkerRequestMessage = { id, action: 'REGIME', regimeConfig: config };
    worker.postMessage(message);
  });
}
