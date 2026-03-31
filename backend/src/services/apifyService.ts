import { ApifyClient } from 'apify-client';

if (!process.env.APIFY_API_KEY) {
  throw new Error('APIFY_API_KEY is not set in environment variables');
}

export const apifyClient = new ApifyClient({
  token: process.env.APIFY_API_KEY,
});

/**
 * Runs an Apify Actor and waits for it to finish.
 * @param actorId - The Actor ID or name (e.g. "apify/web-scraper")
 * @param input - The Actor input object
 * @returns The dataset items produced by the Actor run
 */
export async function runActor<T = unknown>(actorId: string, input: Record<string, unknown>): Promise<T[]> {
  const run = await apifyClient.actor(actorId).call(input);

  const { items } = await apifyClient.dataset(run.defaultDatasetId).listItems();
  return items as T[];
}

/**
 * Fetches items from an existing Apify dataset.
 * @param datasetId - The dataset ID
 * @returns The dataset items
 */
export async function getDatasetItems<T = unknown>(datasetId: string): Promise<T[]> {
  const { items } = await apifyClient.dataset(datasetId).listItems();
  return items as T[];
}
