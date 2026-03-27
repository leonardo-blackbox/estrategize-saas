import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { adminUpdateCourseSales } from '../../services/admin.api.ts';
import { cn } from '../../../../lib/cn.ts';
import { Button } from '../../../../components/ui/Button.tsx';
import { Input } from '../../../../components/ui/Input.tsx';

interface AdminCursoDetailSalesTabProps {
  course: any;
  courseId: string;
}

export function AdminCursoDetailSalesTab({ course, courseId }: AdminCursoDetailSalesTabProps) {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    sales_url: (course.sales_url as string) ?? '',
    offer_badge_enabled: (course.offer_badge_enabled as boolean) ?? false,
    offer_badge_text: (course.offer_badge_text as string) ?? 'Oferta',
  });
  const [error, setError] = useState('');

  useEffect(() => {
    setForm({
      sales_url: (course.sales_url as string) ?? '',
      offer_badge_enabled: (course.offer_badge_enabled as boolean) ?? false,
      offer_badge_text: (course.offer_badge_text as string) ?? 'Oferta',
    });
  }, [course.sales_url, course.offer_badge_enabled, course.offer_badge_text]);

  const saveMutation = useMutation({
    mutationFn: () => adminUpdateCourseSales(courseId, {
      sales_url: form.sales_url || null,
      offer_badge_enabled: form.offer_badge_enabled,
      offer_badge_text: form.offer_badge_text || null,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-course', courseId] });
      setError('');
    },
    onError: (e: any) => setError((e as Error).message ?? 'Erro ao salvar'),
  });

  return (
    <div className="space-y-6">
      <div className="rounded-[var(--radius-md)] p-4 bg-[var(--bg-surface-1)] border border-[var(--border-hairline)] space-y-4">
        <p className="text-[10px] font-semibold text-[var(--text-tertiary)] uppercase tracking-wider">Pagina de vendas</p>
        <Input label="URL da pagina de vendas" type="url" value={form.sales_url} onChange={(e) => setForm((f) => ({ ...f, sales_url: e.target.value }))} placeholder="https://checkout.exemplo.com/curso" />
        <p className="text-xs text-[var(--text-tertiary)] -mt-2">Quando configurado, membros sem acesso verao um botao "Comprar" no card do curso.</p>
      </div>

      <div className="rounded-[var(--radius-md)] p-4 bg-[var(--bg-surface-1)] border border-[var(--border-hairline)] space-y-4">
        <p className="text-[10px] font-semibold text-[var(--text-tertiary)] uppercase tracking-wider">Selo de oferta</p>
        <label className="flex items-center justify-between cursor-pointer">
          <div>
            <p className="text-sm font-medium text-[var(--text-primary)]">Ativar selo</p>
            <p className="text-xs text-[var(--text-tertiary)] mt-0.5">Exibe um badge de destaque no card do curso.</p>
          </div>
          <button
            onClick={() => setForm((f) => ({ ...f, offer_badge_enabled: !f.offer_badge_enabled }))}
            className={cn(
              'relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200',
              form.offer_badge_enabled ? 'bg-[var(--text-primary)]' : 'bg-[var(--bg-hover)]',
            )}
          >
            <span className={cn(
              'inline-block h-4 w-4 transform rounded-full bg-[var(--bg-base)] shadow transition-transform duration-200',
              form.offer_badge_enabled ? 'translate-x-6' : 'translate-x-1',
            )} />
          </button>
        </label>

        {form.offer_badge_enabled && (
          <div className="space-y-3">
            <Input label="Texto do selo (max. 30 chars)" value={form.offer_badge_text} onChange={(e) => setForm((f) => ({ ...f, offer_badge_text: e.target.value.slice(0, 30) }))} placeholder="Oferta" />
            <div className="flex items-center gap-2">
              <span className="text-xs text-[var(--text-tertiary)]">Preview:</span>
              <span className="inline-flex items-center rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider backdrop-blur-md border bg-[var(--text-primary)] text-[var(--bg-base)] border-[var(--border-default)]">
                {form.offer_badge_text || 'Oferta'}
              </span>
            </div>
          </div>
        )}
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
        {saveMutation.isPending ? 'Salvando...' : 'Salvar configuracoes'}
      </Button>
    </div>
  );
}
