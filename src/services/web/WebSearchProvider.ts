/**
 * BLACKBOX X — Abstract Web Search Provider
 */

import { SearchOptions, WebSearchResponse } from './types';

export interface WebSearchProvider {
  name: string;
  isConfigured(): boolean;
  search(query: string, options?: SearchOptions): Promise<WebSearchResponse>;
}
