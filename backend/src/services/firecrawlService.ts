import FirecrawlApp from '@mendable/firecrawl-js';
import { logger } from '../lib/logger.js';

// ============================================================================
// Firecrawl Service — URL scraping wrapper
// ============================================================================

const TIMEOUT_MS = 30_000;
const MIN_CONTENT_LENGTH = 200;

function getClient(): FirecrawlApp {
  const apiKey = process.env.FIRECRAWL_API_KEY;
  if (!apiKey) {
    throw new Error('FIRECRAWL_API_KEY is not set in environment variables');
  }
  return new FirecrawlApp({ apiKey });
}

/**
 * Scrape a URL and return clean Markdown content.
 * Returns empty string if content is too short (< 200 chars) or on any error.
 */
export async function scrapeUrl(url: string): Promise<string> {
  try {
    const client = getClient();

    const resultPromise = client.scrape(url, {
      formats: ['markdown'],
    });

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Firecrawl timeout')), TIMEOUT_MS),
    );

    const result = await Promise.race([resultPromise, timeoutPromise]);

    const markdown = result.markdown ?? '';

    if (markdown.length < MIN_CONTENT_LENGTH) {
      logger.info(`[firecrawl] Content too short (${markdown.length} chars) for ${url} — skipping`);
      return '';
    }

    return markdown;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logger.error(`[firecrawl] Error scraping ${url}: ${message}`);
    return '';
  }
}
