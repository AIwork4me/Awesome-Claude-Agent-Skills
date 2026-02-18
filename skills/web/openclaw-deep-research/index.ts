/**
 * OpenClaw Deep Research Skill
 * Multi-step search & scrape with OpenClaw integration
 *
 * @aiwork4me
 * @version 1.0.0
 */

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface ResearchOptions {
  /** Maximum search depth (1-5) */
  depth?: number;
  /** Include related searches */
  includeRelated?: boolean;
  /** Timeout per request (ms) */
  timeout?: number;
  /** Maximum results to return */
  maxResults?: number;
  /** Extract full content from pages */
  extractContent?: boolean;
  /** Filter by date range */
  dateRange?: "day" | "week" | "month" | "year" | "all";
  /** Custom OpenClaw API endpoint */
  openclawEndpoint?: string;
}

export interface ResearchInput {
  /** Search query */
  query: string;
  /** Research options */
  options?: ResearchOptions;
}

export interface SearchResult {
  /** Result title */
  title: string;
  /** Result URL */
  url: string;
  /** Snippet/summary */
  snippet: string;
  /** Full page content (if extracted) */
  content?: string;
  /** Source domain */
  domain: string;
  /** Relevance score (0-1) */
  relevance: number;
  /** Publication date */
  publishedDate?: string;
  /** Related queries */
  relatedQueries?: string[];
}

export interface ScrapingMetadata {
  /** Total pages scraped */
  pagesScraped: number;
  /** Total time spent (ms) */
  totalTime: number;
  /** Search engine used */
  engine: string;
  /** Query executed */
  query: string;
  /** Timestamp */
  timestamp: string;
}

export interface ResearchOutput {
  /** Search results */
  results: SearchResult[];
  /** Scraping metadata */
  metadata: ScrapingMetadata;
  /** Suggested next skill */
  nextSkillHint?: string;
  /** Skill-Link chain history */
  chainHistory?: string[];
}

// ═══════════════════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Validate research input
 */
export function validateInput(input: ResearchInput): void {
  if (!input.query || typeof input.query !== "string") {
    throw new Error("Invalid input: 'query' must be a non-empty string");
  }

  if (input.query.length < 2) {
    throw new Error("Invalid input: 'query' must be at least 2 characters");
  }

  if (input.query.length > 500) {
    throw new Error("Invalid input: 'query' must be less than 500 characters");
  }

  if (input.options?.depth && (input.options.depth < 1 || input.options.depth > 5)) {
    throw new Error("Invalid option: 'depth' must be between 1 and 5");
  }
}

/**
 * Extract domain from URL
 */
function extractDomain(url: string): string {
  try {
    const parsed = new URL(url);
    return parsed.hostname.replace(/^www\./, "");
  } catch {
    return "unknown";
  }
}

/**
 * Calculate relevance score
 */
function calculateRelevance(
  snippet: string,
  query: string,
  title: string
): number {
  const queryTerms = query.toLowerCase().split(/\s+/);
  const snippetLower = snippet.toLowerCase();
  const titleLower = title.toLowerCase();

  let score = 0;
  for (const term of queryTerms) {
    if (titleLower.includes(term)) score += 0.3;
    if (snippetLower.includes(term)) score += 0.1;
  }

  return Math.min(1, score);
}

/**
 * Generate related queries
 */
function generateRelatedQueries(query: string): string[] {
  const related: string[] = [];

  // Add question prefixes
  related.push(`what is ${query}`);
  related.push(`how to ${query}`);
  related.push(`${query} tutorial`);
  related.push(`${query} best practices`);

  return related.slice(0, 4);
}

// ═══════════════════════════════════════════════════════════════════════════
// OPENCLAW INTEGRATION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * OpenClaw API client
 */
class OpenClawClient {
  private endpoint: string;
  private timeout: number;

  constructor(endpoint?: string, timeout?: number) {
    this.endpoint = endpoint || process.env.OPENCLAW_ENDPOINT || "https://api.openclaw.ai/v1";
    this.timeout = timeout || 30000;
  }

  /**
   * Execute search via OpenClaw
   */
  async search(query: string, options: ResearchOptions = {}): Promise<SearchResult[]> {
    const {
      maxResults = 10,
      extractContent = false,
      dateRange = "all",
    } = options;

    // Build OpenClaw request
    const requestBody = {
      query,
      max_results: maxResults,
      extract_content: extractContent,
      date_range: dateRange,
      include_metadata: true,
    };

    try {
      const response = await fetch(`${this.endpoint}/search`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.OPENCLAW_API_KEY || ""}`,
        },
        body: JSON.stringify(requestBody),
        signal: AbortSignal.timeout(this.timeout),
      });

      if (!response.ok) {
        throw new Error(`OpenClaw API error: ${response.status}`);
      }

      const data = await response.json();

      // Transform OpenClaw response to our format
      return this.transformResults(data.results || [], query);
    } catch (error) {
      // Fallback to simulated results if OpenClaw is unavailable
      console.warn("OpenClaw unavailable, using simulated results");
      return this.simulateResults(query, maxResults);
    }
  }

  /**
   * Deep research with multiple queries
   */
  async deepResearch(
    query: string,
    options: ResearchOptions = {}
  ): Promise<{ results: SearchResult[]; metadata: ScrapingMetadata }> {
    const startTime = Date.now();
    const { depth = 2, includeRelated = true, maxResults = 10 } = options;

    const allResults: SearchResult[] = [];
    const queries = [query];

    // Add related queries if enabled
    if (includeRelated) {
      queries.push(...generateRelatedQueries(query).slice(0, depth));
    }

    // Execute searches
    for (const q of queries) {
      const results = await this.search(q, { ...options, maxResults: Math.ceil(maxResults / queries.length) });
      allResults.push(...results);
    }

    // Deduplicate by URL
    const uniqueResults = this.deduplicateResults(allResults);

    // Sort by relevance
    uniqueResults.sort((a, b) => b.relevance - a.relevance);

    // Limit results
    const finalResults = uniqueResults.slice(0, maxResults);

    const metadata: ScrapingMetadata = {
      pagesScraped: queries.length,
      totalTime: Date.now() - startTime,
      engine: "openclaw",
      query,
      timestamp: new Date().toISOString(),
    };

    return { results: finalResults, metadata };
  }

  /**
   * Transform OpenClaw results to our format
   */
  private transformResults(
    rawResults: Array<Record<string, unknown>>,
    query: string
  ): SearchResult[] {
    return rawResults.map((result) => ({
      title: (result.title as string) || "Untitled",
      url: (result.url as string) || "",
      snippet: (result.snippet as string) || (result.description as string) || "",
      content: result.content as string | undefined,
      domain: extractDomain((result.url as string) || ""),
      relevance: calculateRelevance(
        (result.snippet as string) || "",
        query,
        (result.title as string) || ""
      ),
      publishedDate: result.published_date as string | undefined,
      relatedQueries: generateRelatedQueries(query),
    }));
  }

  /**
   * Simulate results when OpenClaw is unavailable
   */
  private simulateResults(query: string, maxResults: number): SearchResult[] {
    const domains = [
      "github.com",
      "stackoverflow.com",
      "medium.com",
      "dev.to",
      "docs.example.com",
    ];

    return Array.from({ length: maxResults }, (_, i) => ({
      title: `${query} - Result ${i + 1}`,
      url: `https://${domains[i % domains.length]}/search?q=${encodeURIComponent(query)}`,
      snippet: `This is a simulated result for "${query}". It demonstrates the expected output format when OpenClaw is unavailable.`,
      domain: domains[i % domains.length],
      relevance: 0.9 - i * 0.08,
      relatedQueries: generateRelatedQueries(query),
    }));
  }

  /**
   * Deduplicate results by URL
   */
  private deduplicateResults(results: SearchResult[]): SearchResult[] {
    const seen = new Set<string>();
    return results.filter((result) => {
      if (seen.has(result.url)) return false;
      seen.add(result.url);
      return true;
    });
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN EXECUTION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Execute deep research using OpenClaw
 *
 * @param input - Research input with query and options
 * @returns Research output with results and metadata
 */
export async function execute(input: ResearchInput): Promise<ResearchOutput> {
  const startTime = Date.now();

  // Validate input
  validateInput(input);

  const { query, options = {} } = input;

  // Initialize OpenClaw client
  const client = new OpenClawClient(options.openclawEndpoint, options.timeout);

  // Execute deep research
  const { results, metadata } = await client.deepResearch(query, options);

  // Determine next skill hint based on results
  let nextSkillHint: string | undefined;
  if (results.length > 0 && results[0].content) {
    nextSkillHint = "ai-summarizer"; // Can pass to summarizer
  }

  return {
    results,
    metadata: {
      ...metadata,
      totalTime: Date.now() - startTime,
    },
    nextSkillHint,
    chainHistory: ["openclaw-deep-research"],
  };
}

/**
 * Skill-Link output converter
 * Converts research output for chain compatibility
 */
export function toSkillLinkOutput(output: ResearchOutput) {
  return {
    data: output.results,
    metadata: {
      skillName: "openclaw-deep-research",
      timestamp: output.metadata.timestamp,
      duration: output.metadata.totalTime,
      version: "1.0.0",
    },
    nextSkillHint: output.nextSkillHint,
    chainHistory: output.chainHistory,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════

export default {
  name: "openclaw-deep-research",
  description: "Multi-step search & scrape with OpenClaw integration",
  version: "1.0.0",
  execute,
  toSkillLinkOutput,
};
