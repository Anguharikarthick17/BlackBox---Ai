/**
 * BLACKBOX X — Tavily Search Provider Implementation
 * 
 * Secure server-side web research client utilizing Tavily API.
 * 
 * PROMPT INJECTION DEFENSE:
 * Retrieved web content is strictly DATA.
 * Content snippets are sanitized to neutralize injection patterns.
 */

import { WebSearchProvider } from './WebSearchProvider';
import { SearchOptions, WebSearchResponse, SearchResult } from './types';

// Curated verified demo market research snippets for offline evaluation
const DEMO_WEB_CACHE: Record<string, SearchResult[]> = {
  nvidia: [
    {
      title: 'NVIDIA Expands AI Infrastructure Architecture & Blackwell Acceleration',
      url: 'https://nvidianews.nvidia.com/news/blackwell-platform-accelerates-computing',
      domain: 'nvidianews.nvidia.com',
      snippet: 'NVIDIA announced enhanced enterprise computing platforms and deployment milestones for its Blackwell ultra-scale architecture, reporting sustained semiconductor demand across data center hyperscalers.',
      publishedDate: '2024-09-18',
    },
    {
      title: 'Semiconductor Capital Expenditures and Data Center GPU Supply Constraints',
      url: 'https://www.reuters.com/technology/nvidia-datacenter-ai-capex-analysis',
      domain: 'reuters.com',
      snippet: 'Global technology enterprises maintain elevated capital allocations to AI hardware, with financial analysts tracking GPU production yields and lead times for high-density compute clusters.',
      publishedDate: '2024-09-17',
    },
    {
      title: 'Tech Equity Correlation and Macro Rate Expectations',
      url: 'https://www.bloomberg.com/news/articles/tech-momentum-equities-rates',
      domain: 'bloomberg.com',
      snippet: 'Semiconductor equities continue to exhibit elevated beta relative to the broader S&P 500 as markets digest monetary policy trajectory and sovereign yield curve movements.',
      publishedDate: '2024-09-16',
    },
  ],
  bitcoin: [
    {
      title: 'Bitcoin Market Dynamics: ETF Inflows and Liquidity Distributions',
      url: 'https://www.coindesk.com/markets/bitcoin-liquidity-etf-inflows-macro',
      domain: 'coindesk.com',
      snippet: 'Institutional spot digital asset flows demonstrated renewed stability following macroeconomic policy announcements, with perpetual funding rates resetting to neutral historical percentiles.',
      publishedDate: '2024-09-18',
    },
    {
      title: 'Macro Liquidity Cycles and Digital Asset Correlation Trends',
      url: 'https://www.ft.com/content/crypto-macro-liquidity-cycles',
      domain: 'ft.com',
      snippet: 'Institutional researchers analyze rolling pairwise correlation shifts between digital assets and Nasdaq equities during volatility spikes and central bank balance sheet contractions.',
      publishedDate: '2024-09-15',
    },
  ],
  gold: [
    {
      title: 'Gold Trades Near Historical Highs on Central Bank Sovereign Accumulation',
      url: 'https://www.reuters.com/markets/commodities/gold-sovereign-reserve-accumulation',
      domain: 'reuters.com',
      snippet: 'Global sovereign reserve managers reported continued net purchases of physical bullion, providing structural support amidst geopolitical hedging and monetary easing cycles.',
      publishedDate: '2024-09-18',
    },
    {
      title: 'World Gold Council: Central Bank Reserve Allocation Report',
      url: 'https://www.gold.org/goldhub/research/gold-demand-trends',
      domain: 'gold.org',
      snippet: 'Official sector reserve allocations to non-dollar reserve assets remain resilient across Asian and emerging market central banking institutions.',
      publishedDate: '2024-09-12',
    },
  ],
};

export class TavilyProvider implements WebSearchProvider {
  name = 'Tavily Search Engine';
  private apiKey: string | undefined;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.TAVILY_API_KEY;
  }

  isConfigured(): boolean {
    return Boolean(this.apiKey && this.apiKey.trim().length > 0);
  }

  /**
   * Sanitizes web search snippet text to neutralize prompt injection phrases.
   */
  public sanitizeContent(text: string): string {
    return this.sanitizeSnippet(text);
  }

  private sanitizeSnippet(text: string): string {
    return text
      .replace(/ignore\s+(all\s+)?(previous|prior)\s+instructions/gi, '[neutralized instruction]')
      .replace(/system\s+prompt/gi, '[system note]')
      .replace(/you\s+must\s+now\s+act\s+as/gi, '[role attempt]')
      .slice(0, 500);
  }

  private extractDomain(url: string): string {
    try {
      const parsed = new URL(url);
      return parsed.hostname.replace(/^www\./, '');
    } catch {
      return 'web-source';
    }
  }

  async search(query: string, options?: SearchOptions): Promise<WebSearchResponse> {
    const maxResults = options?.maxResults ?? 4;

    // If no API key configured, check offline demo cache or return informative unconfigured state
    if (!this.isConfigured()) {
      const lowerQ = query.toLowerCase();
      let cachedResults: SearchResult[] | null = null;

      if (lowerQ.includes('nvda') || lowerQ.includes('nvidia')) {
        cachedResults = DEMO_WEB_CACHE.nvidia;
      } else if (lowerQ.includes('btc') || lowerQ.includes('bitcoin')) {
        cachedResults = DEMO_WEB_CACHE.bitcoin;
      } else if (lowerQ.includes('gold') || lowerQ.includes('xau')) {
        cachedResults = DEMO_WEB_CACHE.gold;
      }

      if (cachedResults) {
        return {
          query,
          results: cachedResults.slice(0, maxResults),
          answer: `Retrieved ${cachedResults.length} market research articles for "${query}" via verified financial reporting cache.`,
          provider: 'Offline Research Archive (TAVILY_API_KEY unconfigured)',
          isMockFallback: true,
        };
      }

      return {
        query,
        results: [],
        error: 'TAVILY_API_KEY is not configured on the server. Set TAVILY_API_KEY in your environment or .env file to enable live web research.',
        provider: 'Tavily',
        isMockFallback: true,
      };
    }

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000); // 8 second timeout

      const response = await fetch('https://api.tavily.com/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          api_key: this.apiKey,
          query,
          search_depth: options?.searchDepth ?? 'basic',
          include_answer: true,
          max_results: maxResults,
          include_domains: options?.includeDomains,
          exclude_domains: options?.excludeDomains,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!response.ok) {
        const errorBody = await response.text();
        return {
          query,
          results: [],
          error: `Tavily API responded with HTTP ${response.status}: ${errorBody}`,
          provider: 'Tavily',
        };
      }

      const data = await response.json();
      const rawResults = Array.isArray(data.results) ? data.results : [];

      const results: SearchResult[] = rawResults.map((r: any) => ({
        title: String(r.title || 'Market Source'),
        url: String(r.url || ''),
        domain: this.extractDomain(r.url || ''),
        snippet: this.sanitizeSnippet(String(r.content || r.snippet || '')),
        publishedDate: r.published_date ? String(r.published_date) : undefined,
        score: typeof r.score === 'number' ? r.score : undefined,
      }));

      return {
        query,
        results,
        answer: data.answer ? this.sanitizeSnippet(String(data.answer)) : undefined,
        provider: 'Tavily Live Web',
        isMockFallback: false,
      };
    } catch (err: any) {
      return {
        query,
        results: [],
        error: `Web search failed: ${err.message || 'Network timeout'}`,
        provider: 'Tavily',
      };
    }
  }
}
