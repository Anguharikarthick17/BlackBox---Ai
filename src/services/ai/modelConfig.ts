/**
 * BLACKBOX X — AI Assistant Model & Provider Configuration
 */

export const MODEL_CONFIG = {
  defaultModel: 'Qwen/Qwen2.5-7B-Instruct',
  fallbackModel: 'Qwen/Qwen2.5-7B-Instruct',
  featherlessBaseUrl: 'https://api.featherless.ai/v1',
  maxOutputTokens: 2048,
  maxToolCallsPerTurn: 2,
  maxContextMessages: 10,
  temperature: 0.15, // Low temperature for factual precision and grounded citations
  requestTimeoutMs: 15000,
};

export function getActiveFeatherlessModel(): string {
  if (typeof process !== 'undefined' && process.env.FEATHERLESS_MODEL && process.env.FEATHERLESS_MODEL.trim().length > 0) {
    return process.env.FEATHERLESS_MODEL.trim();
  }
  return MODEL_CONFIG.defaultModel;
}
