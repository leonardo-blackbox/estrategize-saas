import { supabaseAdmin } from '../lib/supabaseAdmin.js';
import { generateDiagnosis, type DiagnosisContent } from './irisAIService.js';

export interface DiagnosisRecord {
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
 * Generate and save a new diagnosis for a consultancy
 */
export async function createDiagnosis(
  userId: string,
  consultancyId: string,
  title: string,
  clientName?: string | null,
): Promise<DiagnosisRecord> {
  if (!supabaseAdmin) {
    throw new Error('Supabase not initialized');
  }

  // Verify user owns the consultancy
  const { data: consultancy, error: consultancyError } = await supabaseAdmin
    .from('consultancies')
    .select('id, user_id, title, client_name')
    .eq('id', consultancyId)
    .eq('user_id', userId)
    .single();

  if (consultancyError || !consultancy) {
    throw new Error(`Consultancy not found or unauthorized: ${consultancyId}`);
  }

  // Generate diagnosis via OpenAI
  const { content, tokensUsed } = await generateDiagnosis(title, clientName);

  // Save diagnosis to database
  const { data, error } = await supabaseAdmin
    .from('consultancy_diagnostics')
    .insert({
      user_id: userId,
      consultancy_id: consultancyId,
      content,
      is_edited: false,
      version: 1,
      tokens_used: tokensUsed,
    })
    .select()
    .single();

  if (error || !data) {
    throw new Error(`Failed to save diagnosis: ${error?.message ?? 'Unknown error'}`);
  }

  return data as DiagnosisRecord;
}

/**
 * Get the latest diagnosis for a consultancy
 */
export async function getDiagnosisByConsultancy(
  userId: string,
  consultancyId: string,
): Promise<DiagnosisRecord | null> {
  if (!supabaseAdmin) {
    throw new Error('Supabase not initialized');
  }

  const { data, error } = await supabaseAdmin
    .from('consultancy_diagnostics')
    .select('*')
    .eq('user_id', userId)
    .eq('consultancy_id', consultancyId)
    .order('version', { ascending: false })
    .limit(1)
    .single();

  if (error) {
    // If no rows found, return null
    if (error.code === 'PGRST116') {
      return null;
    }
    throw new Error(`Failed to fetch diagnosis: ${error.message}`);
  }

  return data as DiagnosisRecord;
}

/**
 * Update diagnosis content (mark as edited)
 * Creates a new version with updated content
 */
export async function updateDiagnosis(
  userId: string,
  consultancyId: string,
  newContent: DiagnosisContent,
): Promise<DiagnosisRecord> {
  if (!supabaseAdmin) {
    throw new Error('Supabase not initialized');
  }

  // Get current diagnosis version
  const current = await getDiagnosisByConsultancy(userId, consultancyId);
  if (!current) {
    throw new Error('No diagnosis found for this consultancy');
  }

  // Check if this is an edit of the existing version or a new version
  const newVersion = current.version + 1;

  const { data, error } = await supabaseAdmin
    .from('consultancy_diagnostics')
    .insert({
      user_id: userId,
      consultancy_id: consultancyId,
      content: newContent,
      is_edited: true,
      edited_at: new Date().toISOString(),
      version: newVersion,
      tokens_used: null, // Manual edit, no tokens
    })
    .select()
    .single();

  if (error || !data) {
    throw new Error(`Failed to update diagnosis: ${error?.message ?? 'Unknown error'}`);
  }

  return data as DiagnosisRecord;
}

/**
 * Get all diagnosis versions for a consultancy
 */
export async function getDiagnosisHistory(
  userId: string,
  consultancyId: string,
): Promise<DiagnosisRecord[]> {
  if (!supabaseAdmin) {
    throw new Error('Supabase not initialized');
  }

  const { data, error } = await supabaseAdmin
    .from('consultancy_diagnostics')
    .select('*')
    .eq('user_id', userId)
    .eq('consultancy_id', consultancyId)
    .order('version', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch diagnosis history: ${error.message}`);
  }

  return data as DiagnosisRecord[];
}
