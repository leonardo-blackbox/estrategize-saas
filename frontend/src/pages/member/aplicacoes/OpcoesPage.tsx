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

// ─── ColorField ──────────────────────────────────────────────────────────────
function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-[13px] text-[var(--text-secondary)]">{label}</span>
      <div className="flex items-center gap-2">
        <div className="relative w-8 h-8 rounded-lg overflow-hidden border border-[var(--border-hairline)] cursor-pointer hover:border-[var(--text-tertiary)] transition-colors">
          <input
            type="color"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="absolute inset-0 w-[140%] h-[140%] -translate-x-[14%] -translate-y-[14%] cursor-pointer border-0 bg-transparent p-0 opacity-0"
            aria-label={`Cor: ${label}`}
          />
          <span
            className="absolute inset-0 rounded-lg"
            style={{ backgroundColor: value }}
            aria-hidden="true"
          />
        </div>
        <input
          type="text"
          value={value.toUpperCase()}
          onChange={(e) => {
            const v = e.target.value;
            if (/^#[0-9A-Fa-f]{0,6}$/.test(v)) onChange(v);
          }}
          maxLength={7}
          className={cn(
            'w-24 px-2 py-1.5 rounded-lg text-[12px] font-mono uppercase',
            'bg-[var(--bg-base)] border border-[var(--border-hairline)]',
            'text-[var(--text-primary)] transition-colors duration-150',
            'focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]',
          )}
        />
      </div>
    </div>
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

  // Local state for form
  const [title, setTitle] = useState('');
  const [theme, setTheme] = useState<Partial<ThemeConfig>>({});
  const [settings, setSettings] = useState<Partial<FormSettings>>({});
  const [isDirty, setIsDirty] = useState(false);

  // Seed from application data
  useEffect(() => {
    if (application) {
      setTitle(application.title);
      setTheme({ ...application.theme_config });
      setSettings({ ...application.settings });
      setIsDirty(false);
    }
  }, [application]);

  function updateTheme(updates: Partial<ThemeConfig>) {
    setTheme((prev) => ({ ...prev, ...updates }));
    setIsDirty(true);
  }

  function updateSettings(updates: Partial<FormSettings>) {
    setSettings((prev) => ({ ...prev, ...updates }));
    setIsDirty(true);
  }

  const saveMutation = useMutation({
    mutationFn: () =>
      updateApplication(application!.id, {
        title: title.trim() || application!.title,
        theme_config: theme as ThemeConfig,
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
                    setTheme({ ...application.theme_config });
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

        {/* Divider */}
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

        {/* ── Personalizar estilo ── */}
        <Section title="Personalizar estilo" description="Defina as cores e visual do seu formulário.">
          <div className="space-y-1">
            <ColorField
              label="Cor do botão"
              value={theme.buttonColor ?? '#7c5cfc'}
              onChange={(v) => updateTheme({ buttonColor: v })}
            />
            <ColorField
              label="Cor da pergunta"
              value={theme.questionColor ?? '#f5f5f7'}
              onChange={(v) => updateTheme({ questionColor: v })}
            />
            <ColorField
              label="Cor da resposta"
              value={theme.answerColor ?? '#f5f5f7'}
              onChange={(v) => updateTheme({ answerColor: v })}
            />
            <ColorField
              label="Cor do fundo"
              value={theme.backgroundColor ?? '#000000'}
              onChange={(v) => updateTheme({ backgroundColor: v })}
            />
          </div>

          {/* Border radius */}
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[13px] text-[var(--text-secondary)]">Bordas</span>
              <span className="text-[12px] font-mono text-[var(--text-tertiary)]">{theme.borderRadius ?? 12}px</span>
            </div>
            <input
              type="range"
              min={0}
              max={32}
              value={theme.borderRadius ?? 12}
              onChange={(e) => updateTheme({ borderRadius: Number(e.target.value) })}
              className="w-full accent-[var(--accent)]"
            />
            <div className="flex justify-between text-[11px] text-[var(--text-tertiary)] mt-1">
              <span>Quadradas</span>
              <span>Redondas</span>
            </div>
          </div>
        </Section>

        <div style={{ height: 1, background: 'var(--border-hairline)' }} />

        {/* ── Configurações ── */}
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
