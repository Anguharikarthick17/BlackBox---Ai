/**
 * BLACKBOX X — Server API: Web Search Endpoint
 * 
 * Endpoint: POST /api/web/search
 * Executes search query via TavilyProvider server-side.
 */

import { TavilyProvider } from '../../../src/services/web/TavilyProvider';
import { WebSearchResponse } from '../../../src/services/web/types';

export async function handleWebSearchRequest(body: { query?: string; maxResults?: number }): Promise<WebSearchResponse> {
  const query = body?.query?.trim();

  if (!query) {
    return {
      query: '',
      results: [],
      error: 'Query parameter is required for web search.',
      provider: 'Tavily',
    };
  }

  const provider = new TavilyProvider();
  return await provider.search(query, { maxResults: body.maxResults ?? 4 });
}
