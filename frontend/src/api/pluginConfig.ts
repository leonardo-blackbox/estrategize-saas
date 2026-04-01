import { client } from './client.ts';
import type { PesquisaMercadoConfig } from '../types/market-intelligence.ts';

export async function getPluginConfig(slug: string): Promise<PesquisaMercadoConfig> {
  const res = await client.get(`/api/admin/plugins/${slug}/config`).json<{ config: PesquisaMercadoConfig }>();
  return res.config;
}

export async function updatePluginConfig(
  slug: string,
  partial: Partial<PesquisaMercadoConfig>,
): Promise<PesquisaMercadoConfig> {
  const res = await client
    .put(`/api/admin/plugins/${slug}/config`, { json: partial })
    .json<{ config: PesquisaMercadoConfig }>();
  return res.config;
}
