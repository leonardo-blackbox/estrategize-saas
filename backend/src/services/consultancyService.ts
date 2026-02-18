import { supabaseAdmin } from '../lib/supabaseAdmin.js';

export interface Consultancy {
  id: string;
  user_id: string;
  title: string;
  client_name: string | null;
  status: 'active' | 'archived';
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateConsultancyInput {
  title: string;
  client_name?: string;
  status?: 'active' | 'archived';
}

export interface UpdateConsultancyInput {
  title?: string;
  client_name?: string;
  status?: 'active' | 'archived';
}

function ensureAdmin() {
  if (!supabaseAdmin) {
    throw new Error('Database service unavailable');
  }
  return supabaseAdmin;
}

export async function listConsultancies(userId: string): Promise<Consultancy[]> {
  const db = ensureAdmin();

  const { data, error } = await db
    .from('consultancies')
    .select('*')
    .eq('user_id', userId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to list consultancies: ${error.message}`);
  }

  return data as Consultancy[];
}

export async function getConsultancy(
  userId: string,
  consultancyId: string,
): Promise<Consultancy | null> {
  const db = ensureAdmin();

  const { data, error } = await db
    .from('consultancies')
    .select('*')
    .eq('id', consultancyId)
    .eq('user_id', userId)
    .is('deleted_at', null)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw new Error(`Failed to get consultancy: ${error.message}`);
  }

  return data as Consultancy;
}

export async function createConsultancy(
  userId: string,
  input: CreateConsultancyInput,
): Promise<Consultancy> {
  const db = ensureAdmin();

  const { data, error } = await db
    .from('consultancies')
    .insert({
      user_id: userId,
      title: input.title,
      client_name: input.client_name ?? null,
      status: input.status ?? 'active',
    })
    .select('*')
    .single();

  if (error) {
    throw new Error(`Failed to create consultancy: ${error.message}`);
  }

  return data as Consultancy;
}

export async function updateConsultancy(
  userId: string,
  consultancyId: string,
  input: UpdateConsultancyInput,
): Promise<Consultancy | null> {
  const db = ensureAdmin();

  const existing = await getConsultancy(userId, consultancyId);
  if (!existing) return null;

  const { data, error } = await db
    .from('consultancies')
    .update(input)
    .eq('id', consultancyId)
    .eq('user_id', userId)
    .is('deleted_at', null)
    .select('*')
    .single();

  if (error) {
    throw new Error(`Failed to update consultancy: ${error.message}`);
  }

  return data as Consultancy;
}

export async function softDeleteConsultancy(
  userId: string,
  consultancyId: string,
): Promise<boolean> {
  const db = ensureAdmin();

  const existing = await getConsultancy(userId, consultancyId);
  if (!existing) return false;

  const { error } = await db
    .from('consultancies')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', consultancyId)
    .eq('user_id', userId)
    .is('deleted_at', null);

  if (error) {
    throw new Error(`Failed to delete consultancy: ${error.message}`);
  }

  return true;
}
