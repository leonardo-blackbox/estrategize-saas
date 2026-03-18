import { useState, useEffect } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  updateApplication,
  deleteApplication,
  applicationKeys,
  type ThemeConfig,
  type FormSettings,
} from '../../../api/applications.ts';
import { cn } from '../../../lib/cn.ts';
import type { ApplicationShellContext } from './ApplicationShell.tsx';

// ─── Section wrapper ─────────────────────────────────────────────────────────
function Section({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <section className="py-6">
      <div className="mb-4">
        <h3 className="text-[15px] font-semibold text-[var(--text-primary)]">{title}</h3>
        {description && (
          <p className="text-[13px] text-[var(--text-secondary)] mt-0.5">{description}</p>
        )}
      </div>
      {children}
    </section>
  );
}

// ─── ToggleField ─────────────────────────────────────────────────────────────
function ToggleField({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-[13px] text-[var(--text-secondary)]">{label}</span>
      <button
        role="switch"
        aria-checked={value}
        onClick={() => onChange(!value)}
        className={cn(
          'relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full',
          'border-2 border-transparent transition-colors duration-200',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-base)]',
          value ? 'bg-[var(--accent)]' : 'bg-[var(--bg-hover)]',
        )}
      >
        <span
          className={cn(
            'pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow',
            'transform transition duration-200 ease-in-out',
            value ? 'translate-x-5' : 'translate-x-0',
          )}
        />
      </button>
    </div>
  );
}

// ─── Main ────────────────────────────────────────────────────────────────────
export default function OpcoesPage() {
  const { application, isLoading, refetch } = useOutletContext<ApplicationShellContext>();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [settings, setSettings] = useState<Partial<FormSettings>>({});
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    if (application) {
      setTitle(application.title);
      setSettings({ ...application.settings });
      setIsDirty(false);
    }
  }, [application]);

  function updateSettings(updates: Partial<FormSettings>) {
    setSettings((prev) => ({ ...prev, ...updates }));
    setIsDirty(true);
  }

  const saveMutation = useMutation({
    mutationFn: () =>
      updateApplication(application!.id, {
        title: title.trim() || application!.title,
        theme_config: application!.theme_config as ThemeConfig,
        settings: settings as FormSettings,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: applicationKeys.detail(application!.id) });
      void queryClient.invalidateQueries({ queryKey: applicationKeys.lists() });
      setIsDirty(false);
      refetch();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteApplication(application!.id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: applicationKeys.lists() });
      navigate('/aplicacoes');
    },
  });

  if (isLoading || !application) {
    return (
      <div className="flex items-center justify-center h-full">
        <span className="inline-block w-6 h-6 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto" style={{ background: 'var(--bg-base)' }}>
      <div className="max-w-2xl mx-auto px-6 py-8">

        {/* Save bar (sticky) */}
        {isDirty && (
          <div
            className={cn(
              'sticky top-0 z-10 -mx-6 px-6 py-3 mb-6',
              'flex items-center justify-between',
              'bg-[var(--bg-surface-2)] border-b border-[var(--border-hairline)]',
            )}
          >
            <span className="text-[13px] text-[var(--text-secondary)]">
              Você tem alterações não salvas.
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  if (application) {
                    setTitle(application.title);
                    setSettings({ ...application.settings });
                    setIsDirty(false);
                  }
                }}
                className="px-3 py-1.5 rounded-lg text-[13px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer transition-colors active:scale-[0.97]"
              >
                Descartar
              </button>
              <button
                onClick={() => saveMutation.mutate()}
                disabled={saveMutation.isPending}
                className="px-4 py-1.5 rounded-lg text-[13px] font-semibold bg-[var(--accent)] text-white hover:opacity-90 disabled:opacity-50 cursor-pointer transition-all duration-150 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-1"
              >
                {saveMutation.isPending ? 'Salvando...' : 'Salvar alterações'}
              </button>
            </div>
          </div>
        )}

        <div style={{ height: 1, background: 'var(--border-hairline)', marginBottom: 24 }} />

        {/* ── Geral ── */}
        <Section title="Geral">
          <div>
            <label className="block text-[13px] text-[var(--text-secondary)] mb-1.5">
              Título do formulário <span className="text-[var(--text-tertiary)]">(máx. 200 caracteres)</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => { setTitle(e.target.value.slice(0, 200)); setIsDirty(true); }}
              maxLength={200}
              className={cn(
                'w-full px-3 py-2 rounded-lg text-[14px]',
                'bg-[var(--bg-surface-1)] border border-[var(--border-hairline)]',
                'text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)]',
                'focus:outline-none focus:border-[var(--accent)] transition-colors',
              )}
            />
            <div className="text-right text-[11px] text-[var(--text-tertiary)] mt-1">{title.length}/200</div>
          </div>
        </Section>

        <div style={{ height: 1, background: 'var(--border-hairline)' }} />

        {/* ── Aparência ── */}
        <section className="py-6">
          <div className="mb-4">
            <h3 className="text-[15px] font-semibold text-[var(--text-primary)]">Aparência</h3>
            <p className="text-[13px] text-[var(--text-secondary)] mt-0.5">
              Cores, logo, fonte e estilo visual do formulário.
            </p>
          </div>
          <button
            onClick={() => navigate(`/aplicacoes/${application.id}/editor`)}
            className={cn(
              'w-full flex items-center justify-between px-4 py-3.5 rounded-xl',
              'border border-[var(--border-hairline)] hover:border-[var(--accent)]',
              'bg-[var(--bg-surface-1)] hover:bg-[rgba(124,92,252,0.05)]',
              'text-left cursor-pointer transition-all duration-150 group',
            )}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: 'rgba(124,92,252,0.12)' }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#7c5cfc" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="13.5" cy="6.5" r=".5" fill="#7c5cfc" />
                  <circle cx="17.5" cy="10.5" r=".5" fill="#7c5cfc" />
                  <circle cx="8.5" cy="7.5" r=".5" fill="#7c5cfc" />
                  <circle cx="6.5" cy="12.5" r=".5" fill="#7c5cfc" />
                  <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z" />
                </svg>
              </div>
              <div>
                <div className="text-[13px] font-semibold text-[var(--text-primary)] group-hover:text-[var(--accent)] transition-colors">
                  Personalizar aparência
                </div>
                <div className="text-[12px] text-[var(--text-tertiary)] mt-0.5">
                  Cores, logo, fonte, imagem de fundo e bordas
                </div>
              </div>
            </div>
            <svg
              width="14" height="14" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round"
              className="text-[var(--text-tertiary)] group-hover:text-[var(--accent)] transition-colors flex-shrink-0"
            >
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </section>

        <div style={{ height: 1, background: 'var(--border-hairline)' }} />

        {/* ── Configurações do formulário ── */}
        <Section title="Configurações do formulário">
          <div className="space-y-1">
            <ToggleField
              label="Mostrar barra de progresso"
              value={settings.showProgressBar ?? true}
              onChange={(v) => updateSettings({ showProgressBar: v })}
            />
            <ToggleField
              label="Mostrar numeração das perguntas"
              value={settings.showQuestionNumbers ?? true}
              onChange={(v) => updateSettings({ showQuestionNumbers: v })}
            />
            <ToggleField
              label="Limitar uma resposta por sessão"
              value={settings.limitOneResponsePerSession ?? false}
              onChange={(v) => updateSettings({ limitOneResponsePerSession: v })}
            />
            <ToggleField
              label="Mostrar marca d'água"
              value={settings.showBranding ?? true}
              onChange={(v) => updateSettings({ showBranding: v })}
            />
          </div>

          <div className="space-y-3 mt-4">
            <div>
              <label className="block text-[13px] text-[var(--text-secondary)] mb-1.5">
                URL de redirecionamento após envio
              </label>
              <input
                type="url"
                value={settings.redirectUrl ?? ''}
                onChange={(e) => updateSettings({ redirectUrl: e.target.value || undefined })}
                className={cn(
                  'w-full px-3 py-2 rounded-lg text-[13px]',
                  'bg-[var(--bg-surface-1)] border border-[var(--border-hairline)]',
                  'text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)]',
                  'focus:outline-none focus:border-[var(--accent)] transition-colors',
                )}
                placeholder="https://exemplo.com/obrigado"
              />
            </div>
            <div>
              <label className="block text-[13px] text-[var(--text-secondary)] mb-1.5">
                Fechar após X respostas <span className="text-[var(--text-tertiary)]">(0 = sem limite)</span>
              </label>
              <input
                type="number"
                value={settings.closeAfterResponses ?? ''}
                onChange={(e) => updateSettings({ closeAfterResponses: e.target.value ? Number(e.target.value) : undefined })}
                min={0}
                className={cn(
                  'w-full px-3 py-2 rounded-lg text-[13px]',
                  'bg-[var(--bg-surface-1)] border border-[var(--border-hairline)]',
                  'text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)]',
                  'focus:outline-none focus:border-[var(--accent)] transition-colors',
                )}
                placeholder="Sem limite"
              />
            </div>
          </div>
        </Section>

        <div style={{ height: 1, background: 'var(--border-hairline)' }} />

        {/* ── Mensagem de agradecimento ── */}
        <Section title="Mensagem de agradecimento" description="Exibida ao final do formulário.">
          <div className="space-y-3">
            <div>
              <label className="block text-[13px] text-[var(--text-secondary)] mb-1.5">Título</label>
              <input
                type="text"
                value={settings.thankYouTitle ?? ''}
                onChange={(e) => updateSettings({ thankYouTitle: e.target.value })}
                className={cn(
                  'w-full px-3 py-2 rounded-lg text-[13px]',
                  'bg-[var(--bg-surface-1)] border border-[var(--border-hairline)]',
                  'text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)]',
                  'focus:outline-none focus:border-[var(--accent)] transition-colors',
                )}
                placeholder="Obrigado!"
              />
            </div>
            <div>
              <label className="block text-[13px] text-[var(--text-secondary)] mb-1.5">Mensagem</label>
              <textarea
                value={settings.thankYouMessage ?? ''}
                onChange={(e) => updateSettings({ thankYouMessage: e.target.value })}
                rows={3}
                className={cn(
                  'w-full px-3 py-2 rounded-lg text-[13px] resize-none',
                  'bg-[var(--bg-surface-1)] border border-[var(--border-hairline)]',
                  'text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)]',
                  'focus:outline-none focus:border-[var(--accent)] transition-colors',
                )}
                placeholder="Suas respostas foram recebidas."
              />
            </div>
          </div>
        </Section>

        <div style={{ height: 1, background: 'var(--border-hairline)' }} />

        {/* ── Zona perigosa ── */}
        <Section title="Zona perigosa">
          <div className={cn(
            'rounded-xl border border-red-500/20 p-4',
            'bg-red-500/5',
          )}>
            <h4 className="text-[13px] font-semibold text-red-400 mb-1">Excluir formulário</h4>
            <p className="text-[12px] text-[var(--text-secondary)] mb-3">
              Ação permanente. Todos os campos e respostas serão removidos.
            </p>
            <button
              onClick={() => {
                if (confirm('Tem certeza? Esta ação não pode ser desfeita. Todos os campos e respostas serão removidos permanentemente.')) {
                  deleteMutation.mutate();
                }
              }}
              disabled={deleteMutation.isPending}
              className="px-3 py-1.5 rounded-lg text-[12px] font-semibold text-red-400 border border-red-500/30 hover:bg-red-500/10 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/50"
            >
              {deleteMutation.isPending ? 'Excluindo...' : 'Excluir formulário'}
            </button>
          </div>
        </Section>
      </div>
    </div>
  );
}
