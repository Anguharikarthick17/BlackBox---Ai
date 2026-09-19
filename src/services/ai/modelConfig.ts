/**
 * BLACKBOX X — AI Assistant Model & Provider Configuration
 */

export const MODEL_CONFIG = {
  defaultModel: 'meta-llama/Meta-Llama-3.1-8B-Instruct',
  fallbackModel: 'Qwen/Qwen2.5-7B-Instruct',
  featherlessBaseUrl: 'https://api.featherless.ai/v1',
  maxOutputTokens: 2048,
  maxToolCallsPerTurn: 6,
  maxContextMessages: 10,
  temperature: 0.15, // Low temperature for factual precision and grounded citations
  requestTimeoutMs: 30000,
};

export function getActiveFeatherlessModel(): string {
  if (typeof process !== 'undefined' && process.env.FEATHERLESS_MODEL) {
    return process.env.FEATHERLESS_MODEL;
  }
  return MODEL_CONFIG.defaultModel;
}
