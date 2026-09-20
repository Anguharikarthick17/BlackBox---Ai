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
  temperature: 0.3, // Calibrated to prevent repetition collapse while ensuring rigorous quantitative precision
  frequencyPenalty: 0.3,
  presencePenalty: 0.1,
  stopSequences: [
    '<|im_end|>',
    '<|im_start|>',
    '<|endoftext|>',
    '\nuser\n',
    '\nUser:\n',
    '\nUser: ',
    '\nuser:\n',
    '\nuser: ',
    '\nassistant\n',
    '\nAssistant:\n',
    '\nAssistant: ',
  ],
  requestTimeoutMs: 15000,
};

export function getActiveFeatherlessModel(): string {
  if (typeof process !== 'undefined' && process.env.FEATHERLESS_MODEL && process.env.FEATHERLESS_MODEL.trim().length > 0) {
    return process.env.FEATHERLESS_MODEL.trim();
  }
  return MODEL_CONFIG.defaultModel;
}
