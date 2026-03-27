import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { cn } from '../../../../lib/cn.ts';
import { Button } from '../../../../components/ui/Button.tsx';
import { Input } from '../../../../components/ui/Input.tsx';
import { adminGetUserCreditTransactions, adminAdjustCredits } from '../../services/admin.api.ts';
import { formatDate, TX_TYPE_LABEL, TX_TYPE_COLOR } from '../../helpers/format.ts';

interface TabCreditsProps {
  userId: string;
}

export function AdminUserDetailTabCredits({ userId }: TabCreditsProps) {
  const qc = useQueryClient();
  const [page, setPage] = useState(0);
  const [adjustForm, setAdjustForm] = useState({ amount: '', description: '' });
  const [adjustError, setAdjustError] = useState('');
  const limit = 20;
  const offset = page * limit;

  const { data: txData, isLoading } = useQuery({
    queryKey: ['admin-user-credits', userId, offset],
    queryFn: () => adminGetUserCreditTransactions(userId, { limit, offset }),
  });

  const adjustMutation = useMutation({
    mutationFn: (data: { amount: number; description: string }) => adminAdjustCredits(userId, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-user-credits', userId] }); setAdjustForm({ amount: '', description: '' }); setAdjustError(''); },
    onError: (e: any) => setAdjustError(e.message ?? 'Erro ao ajustar creditos'),
  });

  const tx = (txData as any)?.transactions ?? [];
  const total = (txData as any)?.total ?? 0;
  const balance = (txData as any)?.balance ?? 0;
  const reserved = (txData as any)?.reserved ?? 0;
  const consumedThisMonth = (txData as any)?.consumed_this_month ?? 0;
  const totalPages = Math.ceil(total / limit);

  const handleAdjust = () => {
    const amount = Number(adjustForm.amount);
    if (!amount || isNaN(amount)) { setAdjustError('Informe um valor diferente de zero'); return; }
    if (!adjustForm.description.trim()) { setAdjustError('Descricao e obrigatoria'); return; }
    setAdjustError('');
    adjustMutation.mutate({ amount, description: adjustForm.description.trim() });
  };

  return (
    <div className="space-y-6">
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="rounded-[var(--radius-md)] p-4 bg-[var(--bg-surface-1)] border border-[var(--border-hairline)]">
          <p className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-wider mb-1">Saldo atual</p>
          <p className={cn('text-3xl font-bold', balance < 0 ? 'text-red-500' : 'text-[var(--text-primary)]')}>{balance.toLocaleString('pt-BR')}</p>
          <p className="text-xs text-[var(--text-tertiary)] mt-0.5">creditos disponiveis</p>
          {reserved > 0 && <p className="text-xs text-amber-500 mt-1">{reserved} reservados</p>}
          {consumedThisMonth > 0 && <p className="text-xs text-[var(--text-tertiary)] mt-0.5">{consumedThisMonth} usados este mes</p>}
        </div>
        <div className="rounded-[var(--radius-md)] p-4 bg-[var(--bg-surface-1)] border border-[var(--border-hairline)] space-y-3">
          <p className="text-[10px] font-semibold text-[var(--text-tertiary)] uppercase tracking-wider">Ajuste manual</p>
          <Input label="Valor (+ adicionar / - remover)" type="number" value={adjustForm.amount} onChange={(e) => setAdjustForm((f) => ({ ...f, amount: e.target.value }))} placeholder="Ex: 50 ou -10" />
          <Input label="Descricao" value={adjustForm.description} onChange={(e) => setAdjustForm((f) => ({ ...f, description: e.target.value }))} placeholder="Motivo do ajuste..." />
          {adjustError && <p className="text-xs text-red-500">{adjustError}</p>}
          <Button size="sm" className="w-full" onClick={handleAdjust} disabled={adjustMutation.isPending}>{adjustMutation.isPending ? 'Aplicando...' : 'Aplicar ajuste'}</Button>
        </div>
      </div>

      <div>
        <h3 className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-3">Historico de transacoes ({total})</h3>
        {isLoading ? (
          [1, 2, 3].map((i) => <div key={i} className="h-12 mb-1 animate-pulse rounded-[var(--radius-sm)] bg-[var(--bg-surface-1)]" />)
        ) : tx.length === 0 ? (
          <p className="text-xs text-[var(--text-tertiary)]">Nenhuma transacao registrada.</p>
        ) : (
          <div className="space-y-1">
            {tx.map((t: any) => (
              <div key={t.id} className="flex items-center gap-3 px-3 py-2 rounded-[var(--radius-sm)] bg-[var(--bg-surface-1)] border border-[var(--border-hairline)]">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={cn('text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-[var(--bg-hover)]', TX_TYPE_COLOR[t.type] ?? 'text-[var(--text-tertiary)]')}>{TX_TYPE_LABEL[t.type] ?? t.type}</span>
                    <span className="text-xs text-[var(--text-secondary)] truncate">{t.description ?? '—'}</span>
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <p className={cn('text-sm font-semibold', ['purchase', 'monthly_grant', 'release'].includes(t.type) ? 'text-emerald-500' : ['consume', 'reserve'].includes(t.type) ? 'text-red-500' : 'text-[var(--text-primary)]')}>
                    {['purchase', 'monthly_grant', 'release'].includes(t.type) ? '+' : '-'}{t.amount}
                  </p>
                  <p className="text-[10px] text-[var(--text-tertiary)]">{formatDate(t.created_at)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-3">
            <p className="text-xs text-[var(--text-tertiary)]">{offset + 1}–{Math.min(offset + limit, total)} de {total}</p>
            <div className="flex gap-2">
              <Button size="sm" variant="ghost" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>Anterior</Button>
              <Button size="sm" variant="ghost" disabled={page >= totalPages - 1} onClick={() => setPage((p) => p + 1)}>Proximo</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
