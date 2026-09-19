/**
 * BLACKBOX X — AI Provider & Assistant Types
 */

import { SearchResult } from '../web/types';

export type AssistantRole = 'system' | 'user' | 'assistant' | 'tool';

export interface ChatMessage {
  role: AssistantRole;
  content: string;
  name?: string;
  tool_call_id?: string;
  tool_calls?: ToolCall[];
}

export interface ToolCall {
  id: string;
  type: 'function';
  function: {
    name: string;
    arguments: string;
  };
}

export interface ToolDefinition {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: Record<string, any>;
  };
}

export interface AIResponse {
  content: string;
  toolCalls?: ToolCall[];
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  finishReason?: string;
  model?: string;
}

export type EvidenceClassification =
  | 'BLACKBOX'
  | 'WEB'
  | 'GENERAL_KNOWLEDGE'
  | 'USER_INPUT';

export interface EvidenceCitation {
  id: string;
  claim: string;
  source: string;
  sourceType: EvidenceClassification;
  url?: string;
  domain?: string;
  toolName?: string;
  quantitativeValues?: Record<string, any>;
}

export type AssistantMode = 'GENERAL' | 'BLACKBOX' | 'WEB' | 'HYBRID';

export interface ToolActivityItem {
  id: string;
  toolName: string;
  label?: string;
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'ERROR' | 'running' | 'success' | 'error';
  inputSummary?: string;
  resultSnippet?: string;
  durationMs?: number;
  error?: string;
}

export interface AssistantMessageData {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  mode: AssistantMode;
  toolActivity?: ToolActivityItem[];
  citations?: EvidenceCitation[];
  webSources?: SearchResult[];
  evidence?: any;
  nextActions?: string[];
  error?: string;
  isStreaming?: boolean;
}

export type AssistantMessageItem = AssistantMessageData;
export type WebSourceCitation = SearchResult;

export interface AssistantChatRequest {
  messages: Array<{ role: 'user' | 'assistant'; content: string }>;
  currentContext: {
    asset: string;
    strategy: string;
    regime?: string;
    capital?: number;
  };
  offlineDemo?: boolean;
}

export interface AssistantChatResponse {
  message: AssistantMessageData;
  mode: AssistantMode;
  configured: boolean;
  model: string;
  error?: string;
}
