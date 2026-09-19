/**
 * BLACKBOX X — Web Search Provider Types
 */

export interface SearchResult {
  title: string;
  url: string;
  domain: string;
  snippet: string;
  publishedDate?: string;
  score?: number;
}

export interface SearchOptions {
  maxResults?: number;
  searchDepth?: 'basic' | 'advanced';
  includeDomains?: string[];
  excludeDomains?: string[];
}

export interface WebSearchResponse {
  query: string;
  results: SearchResult[];
  answer?: string;
  error?: string;
  provider: string;
  isMockFallback?: boolean;
}
