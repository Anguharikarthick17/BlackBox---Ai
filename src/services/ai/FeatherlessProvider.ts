/**
 * BLACKBOX X — Featherless AI Provider Implementation
 * 
 * Secure server-side client communicating with Featherless OpenAI-compatible API.
 * Base URL: https://api.featherless.ai/v1
 */

import { AIProvider } from './AIProvider';
import { ChatMessage, ToolDefinition, AIResponse, ToolCall } from './types';
import { MODEL_CONFIG, getActiveFeatherlessModel } from './modelConfig';

/**
 * Hard Response Sanitization Boundary:
 * Strips raw injected transcripts (e.g. \nuser\n, "user\n...), special model tokens,
 * and breaks out of degenerate cyclic line, block, or token loops (e.g. ummin\nummin...).
 */
export function sanitizeAssistantContent(raw: string): string {
  if (!raw || typeof raw !== 'string') return '';

  let text = raw;

  // 1. Strip special model tokens
  text = text.replace(/<\|im_end\|>|<\|im_start\|>|<\|endoftext\|>/gi, '');
  text = text.replace(/^(?:assistant|Assistant)\s*[:\n]\s*/, '');

  // 2. Cut off injected / hallucinated turns (including quoted "user or \nuser)
  const turnMatch = text.match(/(?:\n+|^)\s*["']*(?:user|User|human|Human|assistant|Assistant)["']*\s*[:\n]/i);
  if (turnMatch && turnMatch.index !== undefined && turnMatch.index > 0) {
    text = text.slice(0, turnMatch.index);
  } else if (turnMatch && turnMatch.index === 0) {
    const nextAssistant = text.match(/\n+\s*["']*(?:assistant|Assistant)["']*\s*[:\n]\s*/i);
    if (nextAssistant && nextAssistant.index !== undefined) {
      text = text.slice(nextAssistant.index + nextAssistant[0].length);
    }
  }

  // 3. Detect repeating non-empty lines (ignoring blank lines between them)
  const rawLines = text.split('\n');
  const cleanedLines: string[] = [];
  let prevNonEmpty = '';
  let repeatCount = 0;

  for (let i = 0; i < rawLines.length; i++) {
    const trimmed = rawLines[i].trim();
    if (!trimmed) {
      cleanedLines.push(rawLines[i]);
      continue;
    }
    if (trimmed.toLowerCase() === prevNonEmpty.toLowerCase() && trimmed.length > 1) {
      repeatCount++;
      if (repeatCount >= 2) {
        while (cleanedLines.length > 0) {
          const last = cleanedLines[cleanedLines.length - 1].trim().toLowerCase();
          if (last === '' || last === prevNonEmpty.toLowerCase()) {
            cleanedLines.pop();
          } else {
            break;
          }
        }
        break;
      }
    } else {
      repeatCount = 0;
      prevNonEmpty = trimmed;
    }
    cleanedLines.push(rawLines[i]);
  }

  text = cleanedLines.join('\n');

  // 4. Detect repeating multi-line cycles (e.g. 2-line blocks repeating)
  const lines = text.split('\n');
  for (let blockSize = 1; blockSize <= 5; blockSize++) {
    for (let i = 0; i <= lines.length - (blockSize * 2); i++) {
      const b1 = lines.slice(i, i + blockSize).map(l => l.trim()).filter(Boolean).join('\n');
      const b2 = lines.slice(i + blockSize, i + blockSize * 2).map(l => l.trim()).filter(Boolean).join('\n');
      if (b1.length > 10 && b1 === b2) {
        text = lines.slice(0, i + blockSize).join('\n');
        break;
      }
    }
  }

  // 5. Remove consecutive repeating in-line word loops
  text = text.replace(/\b(\w+)(?:\s+\1){3,}\b/gi, '$1');

  return text.trim();
}

export class FeatherlessProvider implements AIProvider {
  name = 'Featherless LLM';
  private apiKey: string | undefined;
  private baseUrl: string;

  constructor(apiKey?: string, baseUrl = MODEL_CONFIG.featherlessBaseUrl) {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
  }

  private resolveApiKey(): string | undefined {
    if (this.apiKey && this.apiKey.trim().length > 0) {
      return this.apiKey.trim();
    }
    if (typeof process !== 'undefined' && process.env.FEATHERLESS_API_KEY) {
      return process.env.FEATHERLESS_API_KEY.trim();
    }
    return undefined;
  }

  isConfigured(): boolean {
    const key = this.resolveApiKey();
    return Boolean(key && key.length > 0);
  }

  private maskKey(k: string | undefined): string {
    if (!k) return 'none';
    if (k.length <= 8) return '****';
    return `${k.slice(0, 4)}...${k.slice(-4)} (len: ${k.length})`;
  }

  async chat(
    messages: ChatMessage[],
    tools?: ToolDefinition[],
    options?: {
      temperature?: number;
      maxTokens?: number;
      model?: string;
    }
  ): Promise<AIResponse> {
    const key = this.resolveApiKey();
    if (!key) {
      throw new Error('FEATHERLESS_API_KEY is not configured on the server.');
    }

    const model = options?.model || getActiveFeatherlessModel();
    const temperature = options?.temperature ?? MODEL_CONFIG.temperature;
    const maxTokens = options?.maxTokens ?? MODEL_CONFIG.maxOutputTokens;

    const payload: Record<string, any> = {
      model,
      messages,
      temperature,
      max_tokens: maxTokens,
      frequency_penalty: MODEL_CONFIG.frequencyPenalty,
      presence_penalty: MODEL_CONFIG.presencePenalty,
      stop: MODEL_CONFIG.stopSequences,
    };

    if (tools && tools.length > 0) {
      payload.tools = tools;
      payload.tool_choice = 'auto';
    }

    if (typeof process !== 'undefined' && process.env.NODE_ENV !== 'production') {
      console.log(`\nFEATHERLESS RUNTIME DIAGNOSTIC`);
      console.log(`provider: Featherless`);
      console.log(`key configured: ${key ? 'true' : 'false'}`);
      console.log(`key length: ${key ? key.length : 0}`);
      console.log(`key fingerprint: ${this.maskKey(key)}`);
      console.log(`model: ${model}`);
      console.log(`base URL: ${this.baseUrl}\n`);
      console.log(`[FEATHERLESS]`);
      console.log(`key configured: ${key ? 'true' : 'false'}`);
      console.log(`key fingerprint: ${this.maskKey(key)}`);
      console.log(`model: ${model}`);
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), MODEL_CONFIG.requestTimeoutMs);

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${key}`,
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      console.log(`[FEATHERLESS RESPONSE]\nstatus: ${response.status}`);

      if (!response.ok) {
        const errorText = await response.text();
        const isGated = response.status === 403 && errorText.includes('model_gated_needs_oauth');
        const isNotFound = response.status === 404 && errorText.includes('model_not_found');

        if ((isGated || isNotFound) && model !== MODEL_CONFIG.fallbackModel) {
          console.log(`[FEATHERLESS FALLBACK] Model "${model}" returned HTTP ${response.status}. Retrying with verified fallback "${MODEL_CONFIG.fallbackModel}".`);
          const fallbackRes = await this.chat(messages, tools, { ...options, model: MODEL_CONFIG.fallbackModel });
          return fallbackRes;
        }

        const sanitizedErrorText = errorText
          .replace(/rc_[a-f0-9]{32,}/gi, '[REDACTED]')
          .replace(/Bearer\s+[^\s]+/gi, 'Bearer [REDACTED]');

        throw new Error(`Featherless API responded with HTTP ${response.status}: ${sanitizedErrorText}`);
      }

      const data = await response.json();
      const choice = data.choices?.[0];

      if (!choice || !choice.message) {
        throw new Error('Empty response from Featherless model endpoint.');
      }

      const rawToolCalls = choice.message.tool_calls;
      let toolCalls: ToolCall[] | undefined = undefined;

      if (Array.isArray(rawToolCalls) && rawToolCalls.length > 0) {
        toolCalls = rawToolCalls.map((tc: any) => ({
          id: String(tc.id || `call-${Math.random().toString(36).slice(2, 8)}`),
          type: 'function',
          function: {
            name: String(tc.function?.name || ''),
            arguments: typeof tc.function?.arguments === 'string'
              ? tc.function.arguments
              : JSON.stringify(tc.function?.arguments || {}),
          },
        }));
      }

      const rawContent = choice.message.content || '';
      const cleanContent = sanitizeAssistantContent(rawContent);

      return {
        content: cleanContent,
        toolCalls,
        usage: data.usage ? {
          promptTokens: data.usage.prompt_tokens,
          completionTokens: data.usage.completion_tokens,
          totalTokens: data.usage.total_tokens,
        } : undefined,
        finishReason: choice.finish_reason,
        model,
      };
    } catch (err: any) {
      clearTimeout(timeout);
      if (err.name === 'AbortError') {
        throw new Error(`Featherless request timed out after ${MODEL_CONFIG.requestTimeoutMs}ms.`);
      }
      throw err;
    }
  }
}
