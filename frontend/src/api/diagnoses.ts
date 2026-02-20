import { apiFetch } from './client.ts';

export interface DiagnosisSection {
  name: string;
  insights: string[];
}

export interface DiagnosisContent {
  executiveSummary: string;
  sections: DiagnosisSection[];
}

export interface Diagnosis {
  id: string;
  user_id: string;
  consultancy_id: string;
  content: DiagnosisContent;
  is_edited: boolean;
  edited_at: string | null;
  version: number;
  tokens_used: number | null;
  created_at: string;
  updated_at: string;
}

/**
 * Generate a new diagnosis for a consultancy
 */
export function generateDiagnosis(consultancyId: string): Promise<{ data: Diagnosis }> {
  return apiFetch(`/api/consultancies/${consultancyId}/diagnose`, {
    method: 'POST',
  });
}

/**
 * Get the latest diagnosis for a consultancy
 */
export function getDiagnosis(consultancyId: string): Promise<{ data: Diagnosis }> {
  return apiFetch(`/api/consultancies/${consultancyId}/diagnose`);
}

/**
 * Update diagnosis content (creates new version)
 */
export function updateDiagnosis(
  consultancyId: string,
  content: DiagnosisContent,
): Promise<{ data: Diagnosis }> {
  return apiFetch(`/api/consultancies/${consultancyId}/diagnose`, {
    method: 'PUT',
    body: JSON.stringify({ content }),
  });
}

/**
 * Get all diagnosis versions for a consultancy
 */
export function getDiagnosisHistory(consultancyId: string): Promise<{ data: Diagnosis[] }> {
  return apiFetch(`/api/consultancies/${consultancyId}/diagnose/history`);
}
