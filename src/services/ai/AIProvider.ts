/**
 * BLACKBOX X — Abstract AI Provider Interface
 * 
 * Permits swapping Featherless with alternative OpenAI-compatible providers
 * without redesigning assistant or tool orchestration code.
 */

import { ChatMessage, ToolDefinition, AIResponse } from './types';

export interface AIProvider {
  name: string;
  isConfigured(): boolean;
  chat(
    messages: ChatMessage[],
    tools?: ToolDefinition[],
    options?: {
      temperature?: number;
      maxTokens?: number;
      model?: string;
    }
  ): Promise<AIResponse>;
}
