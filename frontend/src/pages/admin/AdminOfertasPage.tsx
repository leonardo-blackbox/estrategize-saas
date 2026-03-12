import { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { staggerContainer, staggerItem } from '../../lib/motion.ts';
import { cn } from '../../lib/cn.ts';
import { Button } from '../../components/ui/Button.tsx';
import { Input } from '../../components/ui/Input.tsx';
import { Modal } from '../../components/ui/Modal.tsx';
import { Badge } from '../../components/ui/Badge.tsx';
import {
  adminGetOfertas,
  adminCreateOferta,
  adminUpdateOferta,
  adminDeleteOferta,
  adminUpdateOfertaTurmas,
  adminGetTurmas,
  type Oferta,
  type Turma,
} from '../../api/courses.ts';

export function AdminOfertasPage() {
  const qc = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [editingOferta, setEditingOferta] = useState<Oferta | null>(null);
  const [managingOferta, setManagingOferta] = useState<Oferta | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const { data: ofertasData, isLoading } = useQuery({
    queryKey: ['admin-ofertas'],
    queryFn: adminGetOfertas,
  });

  const ofertas = ((ofertasData as any)?.ofertas ?? []) as Oferta[];

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminDeleteOferta(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-ofertas'] });
      setConfirmDeleteId(null);
    },
  });

  return (
    <motion.div
      variants={staggerContainer}
      initial="initial"
      animate="animate"
      className="max-w-5xl mx-auto space-y-6"
    >
      <motion.div variants={staggerItem} className="flex items-center justify-between">
        <div>
          <h1 className="text-base font-semibold text-[var(--text-primary)]">Ofertas</h1>
          <p className="text-xs text-[var(--text-tertiary)] mt-0.5">
            Gerencie as ofertas de acesso e selecione as turmas incluídas em cada uma.
          </p>
        </div>
        <Button size="sm" onClick={() => setShowCreate(true)}>
          + Nova Oferta
        </Button>
      </motion.div>

      <motion.div variants={staggerItem} className="space-y-2">
        {isLoading ? (
          [1, 2, 3].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-[var(--radius-md)] bg-[var(--bg-surface-1)]" />
          ))
        ) : ofertas.length === 0 ? (
          <div className="rounded-[var(--radius-md)] p-10 bg-[var(--bg-surface-1)] border border-[var(--border-hairline)] text-center">
            <p className="text-sm text-[var(--text-tertiary)]">Nenhuma oferta criada ainda.</p>
          </div>
        ) : (
          ofertas.map((oferta) => {
            const turmaCount = (oferta.oferta_turmas ?? []).length;
            return (
              <div
                key={oferta.id}
                className={cn(
                  'flex items-center justify-between gap-4 rounded-[var(--radius-md)] p-3 bg-[var(--bg-surface-1)] border border-[var(--border-hairline)]',
                  oferta.status === 'archived' && 'opacity-50',
                )}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-medium text-[var(--text-primary)]">{oferta.name}</h3>
                    <Badge variant={oferta.status === 'active' ? 'success' : 'locked'}>
                      {oferta.status === 'active' ? 'Ativa' : 'Inativa'}
                    </Badge>
                  </div>
                  <p className="text-xs text-[var(--text-tertiary)] mt-0.5">
                    {oferta.type === 'subscription' ? 'Assinatura' : 'Pagamento único'}
                    {oferta.price_display ? ` · ${oferta.price_display}` : ''}
                    {' · '}{turmaCount} turma{turmaCount !== 1 ? 's' : ''}
                  </p>
                </div>
                <div className="shrink-0 flex items-center gap-2">
                  <Button size="sm" variant="ghost" onClick={() => setManagingOferta(oferta)}>
                    Turmas
                  </Button>
                  <button
                    onClick={() => setEditingOferta(oferta)}
                    className="text-xs text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors"
                  >
                    Editar
                  </button>
                  {confirmDeleteId === oferta.id ? (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => deleteMutation.mutate(oferta.id)}
                        disabled={deleteMutation.isPending}
                        className="text-[10px] text-red-500 hover:text-red-400 transition-colors"
                      >
                        Arquivar
                      </button>
                      <button
                        onClick={() => setConfirmDeleteId(null)}
                        className="text-[10px] text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors"
                      >
                        Não
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmDeleteId(oferta.id)}
                      className="text-xs text-[var(--text-tertiary)] hover:text-red-500 transition-colors"
                    >
                      Arquivar
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </motion.div>

      {showCreate && (
        <OfertaFormModal
          onClose={() => setShowCreate(false)}
          onSaved={() => {
            qc.invalidateQueries({ queryKey: ['admin-ofertas'] });
            setShowCreate(false);
          }}
        />
      )}

      {editingOferta && (
        <OfertaFormModal
          oferta={editingOferta}
          onClose={() => setEditingOferta(null)}
          onSaved={() => {
            qc.invalidateQueries({ queryKey: ['admin-ofertas'] });
            setEditingOferta(null);
          }}
        />
      )}

      {managingOferta && (
        <ManageOfertaTurmasModal
          key={managingOferta.id}
          oferta={managingOferta}
          onClose={() => setManagingOferta(null)}
          onSaved={() => {
            qc.invalidateQueries({ queryKey: ['admin-ofertas'] });
            setManagingOferta(null);
          }}
        />
      )}
    </motion.div>
  );
}

// ─── OfertaFormModal ─────────────────────────────────────────────
function OfertaFormModal({
  oferta,
  onClose,
  onSaved,
}: {
  oferta?: Oferta;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    name: oferta?.name ?? '',
    type: (oferta?.type ?? 'one-time') as 'one-time' | 'subscription',
    price_display: oferta?.price_display ?? '',
  });
  const [error, setError] = useState('');

  const createMutation = useMutation({
    mutationFn: () => adminCreateOferta({
      name: form.name,
      type: form.type,
      price_display: form.price_display || undefined,
    }),
    onSuccess: onSaved,
    onError: (e: any) => setError((e as Error).message),
  });

  const updateMutation = useMutation({
    mutationFn: () => adminUpdateOferta(oferta!.id, {
      name: form.name,
      type: form.type,
      price_display: form.price_display || null,
    }),
    onSuccess: onSaved,
    onError: (e: any) => setError((e as Error).message),
  });

  const isPending = createMutation.isPending || updateMutation.isPending;

  const handleSubmit = () => {
    if (!form.name.trim()) { setError('Nome é obrigatório.'); return; }
    if (oferta) updateMutation.mutate();
    else createMutation.mutate();
  };

  return (
    <Modal open onClose={onClose} className="sm:max-w-xs">
      <div className="p-6 space-y-4">
        <h2 className="text-base font-semibold text-[var(--text-primary)]">
          {oferta ? 'Editar oferta' : 'Nova oferta'}
        </h2>

        <Input
          label="Nome da oferta"
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          placeholder="Ex: Plano Pro"
        />

        <div>
          <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">Tipo</label>
          <select
            value={form.type}
            onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as 'one-time' | 'subscription' }))}
            className="w-full text-xs rounded-[var(--radius-sm)] border border-[var(--border-hairline)] bg-[var(--bg-surface-1)] px-3 py-2 text-[var(--text-secondary)] focus:outline-none focus:ring-1 focus:ring-[var(--text-primary)]"
          >
            <option value="one-time">Pagamento único</option>
            <option value="subscription">Assinatura</option>
          </select>
        </div>

        <Input
          label="Preço (exibição)"
          value={form.price_display ?? ''}
          onChange={(e) => setForm((f) => ({ ...f, price_display: e.target.value }))}
          placeholder="Ex: R$ 197/mês"
        />

        {error && <p className="text-xs text-red-500">{error}</p>}

        <div className="flex gap-2 pt-1">
          <Button className="flex-1" onClick={handleSubmit} disabled={isPending}>
            {isPending ? 'Salvando...' : (oferta ? 'Salvar' : 'Criar')}
          </Button>
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
        </div>
      </div>
    </Modal>
  );
}

// ─── ManageOfertaTurmasModal ─────────────────────────────────────
function ManageOfertaTurmasModal({
  oferta,
  onClose,
  onSaved,
}: {
  oferta: Oferta;
  onClose: () => void;
  onSaved: () => void;
}) {
  const currentTurmaIds = new Set(
    (oferta.oferta_turmas ?? []).map((ot) => ot.turmas?.id).filter(Boolean) as string[],
  );

  const [selected, setSelected] = useState<Set<string>>(new Set(currentTurmaIds));

  const { data: turmasData } = useQuery({
    queryKey: ['admin-turmas'],
    queryFn: adminGetTurmas,
  });

  const allTurmas = ((turmasData as any)?.turmas ?? []) as Turma[];
  const activeTurmas = allTurmas.filter((t) => t.status === 'active');

  const saveMutation = useMutation({
    mutationFn: () => adminUpdateOfertaTurmas(oferta.id, Array.from(selected)),
    onSuccess: onSaved,
  });

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <Modal open onClose={onClose} className="sm:max-w-sm">
      <div className="p-6 space-y-4">
        <div>
          <h2 className="text-base font-semibold text-[var(--text-primary)]">
            Turmas — {oferta.name}
          </h2>
          <p className="text-xs text-[var(--text-tertiary)] mt-0.5">
            Selecione as turmas que o comprador terá acesso ao adquirir esta oferta.
          </p>
        </div>

        <div className="max-h-64 overflow-y-auto space-y-1">
          {activeTurmas.length === 0 ? (
            <p className="text-xs text-[var(--text-tertiary)] py-4 text-center">Nenhuma turma ativa. Crie turmas primeiro.</p>
          ) : (
            activeTurmas.map((turma) => (
              <button
                key={turma.id}
                onClick={() => toggle(turma.id)}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2 rounded-[var(--radius-sm)] border text-left transition-colors',
                  selected.has(turma.id)
                    ? 'bg-[var(--bg-hover)] border-[var(--border-default)]'
                    : 'bg-[var(--bg-surface-1)] border-[var(--border-hairline)]',
                )}
              >
                <div className={cn(
                  'h-4 w-4 rounded border flex items-center justify-center shrink-0',
                  selected.has(turma.id)
                    ? 'bg-[var(--text-primary)] border-[var(--text-primary)]'
                    : 'border-[var(--border-default)]',
                )}>
                  {selected.has(turma.id) && (
                    <svg className="h-3 w-3 text-[var(--bg-base)]" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                    </svg>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-sm text-[var(--text-primary)] truncate">{turma.name}</p>
                  <p className="text-[10px] text-[var(--text-tertiary)] truncate">
                    {(turma as any).courses?.title ?? 'Curso'}
                  </p>
                </div>
              </button>
            ))
          )}
        </div>

        <div className="flex gap-2 pt-1">
          <Button
            className="flex-1"
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
          >
            {saveMutation.isPending ? 'Salvando...' : `Salvar (${selected.size})`}
          </Button>
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
        </div>
      </div>
    </Modal>
  );
}
