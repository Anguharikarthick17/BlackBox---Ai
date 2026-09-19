/**
 * BLACKBOX X — Phase 3.8
 * Dedicated Monte Carlo Simulation Web Worker
 *
 * Executes probabilistic simulations off the main browser UI thread.
 * Receives serializable MonteCarloConfig and posts back serializable MonteCarloResult.
 * Ensures zero UI thread blocking during 10k–50k path generation.
 */

import { runMonteCarloSimulation } from './monteCarloEngine';
import { MonteCarloConfig, MonteCarloResult } from './monteCarloTypes';
import { runRegimeMonteCarloSimulation } from './regimeMonteCarloEngine';
import { RegimeMonteCarloConfig, RegimeMonteCarloResult } from './regimeMonteCarloTypes';

export interface WorkerRequestMessage {
  id: string;
  action?: 'UNCONDITIONAL' | 'REGIME';
  config?: MonteCarloConfig;
  regimeConfig?: RegimeMonteCarloConfig;
}

export interface WorkerResponseMessage {
  id: string;
  success: boolean;
  result?: MonteCarloResult;
  regimeResult?: RegimeMonteCarloResult;
  error?: string;
}

// Check if running in a Web Worker context
if (typeof self !== 'undefined' && typeof (self as any).postMessage === 'function') {
  self.onmessage = (event: MessageEvent<WorkerRequestMessage>) => {
    const { id, action, config, regimeConfig } = event.data;
    try {
      if (action === 'REGIME' || regimeConfig) {
        const targetConfig = regimeConfig || (config as unknown as RegimeMonteCarloConfig);
        const regimeResult = runRegimeMonteCarloSimulation(targetConfig);
        const response: WorkerResponseMessage = {
          id,
          success: true,
          regimeResult,
        };
        self.postMessage(response);
      } else if (config) {
        const result = runMonteCarloSimulation(config);
        const response: WorkerResponseMessage = {
          id,
          success: true,
          result,
        };
        self.postMessage(response);
      } else {
        throw new Error('Worker request missing configuration payload.');
      }
    } catch (err: any) {
      const response: WorkerResponseMessage = {
        id,
        success: false,
        error: err.message || 'Monte Carlo worker execution failed',
      };
      self.postMessage(response);
    }
  };
}
