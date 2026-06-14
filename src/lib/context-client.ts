export interface SearchResult {
  url: string;
  title: string;
  description: string;
  relevance: 'high' | 'medium' | 'low';
  markdown?: {
    markdown: string | null;
    code: 'SUCCESS' | 'NOT_REQUESTED' | 'TIMEOUT' | 'WEBSITE_ACCESS_ERROR' | 'ERROR';
  };
}

export interface SearchResponse {
  results: SearchResult[];
  query: string;
  key_metadata?: {
    credits_consumed: number;
    credits_remaining: number;
  };
}

export interface ScreenshotResponse {
  status: string;
  domain: string;
  screenshot: string; // URL
  screenshotType: 'viewport' | 'fullPage';
  width: number;
  height: number;
  code: number;
}

export interface BrandResponse {
  status: string;
  brand: {
    domain: string;
    title: string;
    description: string;
    slogan?: string;
    colors?: Array<{ hex: string; name: string }>;
    logos?: Array<{
      url: string;
      mode: 'light' | 'dark' | 'has_opaque_background';
      resolution?: { width: number; height: number; aspect_ratio: number };
      type?: 'icon' | 'logo';
    }>;
  };
}

const CONTEXT_DEV_API_KEY = process.env.CONTEXT_DEV_API_KEY || '';

export class ContextClient {
  private static baseUrl = 'https://api.context.dev/v1';

  private static getHeaders() {
    if (!CONTEXT_DEV_API_KEY) {
      console.warn('CONTEXT_DEV_API_KEY is not defined in environment variables.');
    }
    return {
      'Authorization': `Bearer ${CONTEXT_DEV_API_KEY}`,
      'Content-Type': 'application/json',
    };
  }

  /**
   * Search the web and return results with scraped Markdown in one trip
   */
  static async search(query: string, options?: { freshness?: string }): Promise<SearchResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/web/search`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          query,
          freshness: options?.freshness || undefined,
          queryFanout: true,
          markdownOptions: {
            enabled: true,
            useMainContentOnly: true,
            includeImages: true,
            timeoutMS: 15000,
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Search API failed with status ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Context.dev search failed:', error);
      throw error;
    }
  }

  /**
   * Capture a screenshot of a webpage
   */
  static async screenshot(urlOrDomain: string): Promise<ScreenshotResponse> {
    try {
      const isUrl = urlOrDomain.startsWith('http://') || urlOrDomain.startsWith('https://');
      const paramName = isUrl ? 'directUrl' : 'domain';
      
      const url = new URL(`${this.baseUrl}/web/screenshot`);
      url.searchParams.append(paramName, urlOrDomain);
      url.searchParams.append('fullScreenshot', 'false');
      url.searchParams.append('handleCookiePopup', 'true');

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${CONTEXT_DEV_API_KEY}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Screenshot API failed with status ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`Context.dev screenshot failed for ${urlOrDomain}:`, error);
      throw error;
    }
  }

  /**
   * Retrieve brand assets and info for a domain
   */
  static async getBrand(domain: string): Promise<BrandResponse | null> {
    try {
      // Extract domain from URL if full URL is passed
      let cleanDomain = domain.replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0];
      
      const url = new URL(`${this.baseUrl}/brand/retrieve`);
      url.searchParams.append('domain', cleanDomain);
      url.searchParams.append('maxSpeed', 'true'); // Faster response

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${CONTEXT_DEV_API_KEY}`,
        },
      });

      if (!response.ok) {
        // Return null silently for domains without brand profiles
        return null;
      }

      return await response.json();
    } catch (error) {
      console.error(`Context.dev brand retrieve failed for ${domain}:`, error);
      return null;
    }
  }
}
