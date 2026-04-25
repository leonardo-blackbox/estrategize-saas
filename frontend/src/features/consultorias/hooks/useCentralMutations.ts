import { useEffect, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  centralApi,
  type CentralPage,
  type CreatePagePayload,
  type ReorderItem,
  type UpdatePagePayload,
} from '../services/central.api.ts';
import { centralKeys } from './useCentralPages.ts';

export function useCentralMutations(consultancyId: string) {
  const qc = useQueryClient();

  const invalidatePages = () =>
    qc.invalidateQueries({ queryKey: centralKeys.pages(consultancyId) });

  const create = useMutation({
    mutationFn: (payload: CreatePagePayload) => centralApi.create(consultancyId, payload),
    onSuccess: (page) => {
      invalidatePages();
      qc.setQueryData(centralKeys.page(consultancyId, page.id), page);
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : 'Erro ao criar página'),
  });

  const update = useMutation({
    mutationFn: (vars: { pageId: string; payload: UpdatePagePayload }) =>
      centralApi.update(consultancyId, vars.pageId, vars.payload),
    onSuccess: (page) => {
      qc.setQueryData(centralKeys.page(consultancyId, page.id), page);
      // refresh tree only if title/parent/position changed
      qc.invalidateQueries({ queryKey: centralKeys.pages(consultancyId) });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : 'Erro ao salvar'),
  });

  const remove = useMutation({
    mutationFn: (pageId: string) => centralApi.remove(consultancyId, pageId),
    onSuccess: (_, pageId) => {
      invalidatePages();
      qc.removeQueries({ queryKey: centralKeys.page(consultancyId, pageId) });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : 'Erro ao excluir'),
  });

  const reorder = useMutation({
    mutationFn: (items: ReorderItem[]) => centralApi.reorder(consultancyId, items),
    onSuccess: invalidatePages,
    onError: (e) => toast.error(e instanceof Error ? e.message : 'Erro ao reordenar'),
  });

  const applyTemplate = useMutation({
    mutationFn: (key: string) => centralApi.applyTemplate(consultancyId, key),
    onSuccess: (pages) => {
      invalidatePages();
      pages.forEach((p) => qc.setQueryData(centralKeys.page(consultancyId, p.id), p));
      toast.success('Template aplicado');
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : 'Erro ao aplicar template'),
  });

  return { create, update, remove, reorder, applyTemplate };
}

/**
 * Hook helper: debounced auto-save for blocks/title.
 * Returns scheduleSave(pageId, payload) — accumulates 800ms then flushes.
 */
export function useAutoSave(
  consultancyId: string,
  delayMs: number = 800,
): {
  scheduleSave: (pageId: string, payload: UpdatePagePayload) => void;
  flush: () => void;
  isSaving: boolean;
} {
  const qc = useQueryClient();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pending = useRef<{ pageId: string; payload: UpdatePagePayload } | null>(null);

  const mutation = useMutation({
    mutationFn: (vars: { pageId: string; payload: UpdatePagePayload }) =>
      centralApi.update(consultancyId, vars.pageId, vars.payload),
    onSuccess: (page) => {
      qc.setQueryData(centralKeys.page(consultancyId, page.id), (prev: CentralPage | undefined) =>
        prev ? { ...prev, ...page } : page,
      );
    },
  });

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  const flush = () => {
    if (timer.current) { clearTimeout(timer.current); timer.current = null; }
    if (pending.current) {
      mutation.mutate(pending.current);
      pending.current = null;
    }
  };

  const scheduleSave = (pageId: string, payload: UpdatePagePayload) => {
    pending.current = {
      pageId,
      payload: { ...(pending.current?.pageId === pageId ? pending.current.payload : {}), ...payload },
    };
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(flush, delayMs);
  };

  return { scheduleSave, flush, isSaving: mutation.isPending };
}
