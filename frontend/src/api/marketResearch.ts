import { client } from './client.ts';
import type {
  InstagramSnapshotResponse,
  MarketResearchResponse,
} from '../types/market-intelligence.ts';

export async function getInstagramSnapshot(consultancyId: string): Promise<InstagramSnapshotResponse> {
  return client.get(`/api/market-research/instagram/${consultancyId}`).json<InstagramSnapshotResponse>();
}

export async function getMarketResearch(consultancyId: string): Promise<MarketResearchResponse> {
  return client.get(`/api/market-research/${consultancyId}`).json<MarketResearchResponse>();
}

export async function startMarketResearch(consultancyId: string): Promise<{ researchId: string; status: string }> {
  return client.post(`/api/market-research/${consultancyId}/start`).json<{ researchId: string; status: string }>();
}

export async function manualRagIndex(consultancyId: string): Promise<{ success: boolean }> {
  return client.post(`/api/market-research/${consultancyId}/rag-index`).json<{ success: boolean }>();
}
