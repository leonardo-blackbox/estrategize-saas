import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
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

// ─── Color math ──────────────────────────────────────────────────────────────

function hsvToHex(h: number, s: number, v: number): string {
  const f = (n: number) => {
    const k = (n + h / 60) % 6;
    return v - v * s * Math.max(0, Math.min(k, 4 - k, 1));
  };
  return (
    '#' +
    [f(5), f(3), f(1)]
      .map((x) => Math.round(x * 255).toString(16).padStart(2, '0'))
      .join('')
  );
}

function hexToHsv(hex: string): [number, number, number] {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!m) return [0, 0, 1];
  const r = parseInt(m[1], 16) / 255;
  const g = parseInt(m[2], 16) / 255;
  const b = parseInt(m[3], 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  let h = 0;
  if (d !== 0) {
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) * 60;
    else if (max === g) h = ((b - r) / d + 2) * 60;
    else h = ((r - g) / d + 4) * 60;
  }
  return [h, max === 0 ? 0 : d / max, max];
}

const PICKER_PRESETS = [
  '#7c5cfc', '#3b82f6', '#06b6d4', '#10b981',
  '#f59e0b', '#ef4444', '#ec4899', '#f97316',
  '#ffffff', '#d1d5db', '#6b7280', '#000000',
];

// ─── Color Picker Popover ─────────────────────────────────────────────────────

function ColorPickerPopover({
  value,
  onChange,
  onClose,
  anchorRect,
}: {
  value: string;
  onChange: (v: string) => void;
  onClose: () => void;
  anchorRect: DOMRect;
}) {
  const [hsv, setHsv] = useState<[number, number, number]>(() => hexToHsv(value));
  const [hexInput, setHexInput] = useState(() => value.replace('#', '').toUpperCase());
  const popoverRef = useRef<HTMLDivElement>(null);

  const PICKER_W = 244;
  const PICKER_H = 380;

  // Position: prefer left of anchor, fallback to right
  const left =
    anchorRect.left - PICKER_W - 10 > 0
      ? anchorRect.left - PICKER_W - 10
      : anchorRect.right + 10;
  const top = Math.min(
    anchorRect.top,
    window.innerHeight - PICKER_H - 12,
  );

  // Click outside → close
  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener('mousedown', onDown, true);
    return () => document.removeEventListener('mousedown', onDown, true);
  }, [onClose]);

  const emit = useCallback(
    (nh: number, ns: number, nv: number) => {
      setHsv([nh, ns, nv]);
      const hex = hsvToHex(nh, ns, nv);
      setHexInput(hex.replace('#', '').toUpperCase());
      onChange(hex);
    },
    [onChange],
  );

  // Gradient drag
  function readGradientPos(e: React.PointerEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const ns = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const nv = Math.max(0, Math.min(1, 1 - (e.clientY - rect.top) / rect.height));
    emit(hsv[0], ns, nv);
  }

  // Hue drag
  function readHuePos(e: React.PointerEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const nh = Math.max(0, Math.min(360, ((e.clientX - rect.left) / rect.width) * 360));
    emit(nh, hsv[1], hsv[2]);
  }

  const hueColor = hsvToHex(hsv[0], 1, 1);
  const currentHex = hsvToHex(hsv[0], hsv[1], hsv[2]);

  return createPortal(
    <div
      ref={popoverRef}
      style={{
        position: 'fixed',
        top,
        left,
        zIndex: 9999,
        width: PICKER_W,
        background: 'var(--bg-surface-1)',
        border: '1px solid var(--border-hairline)',
        borderRadius: 14,
        boxShadow: '0 12px 40px rgba(0,0,0,0.5)',
        padding: 12,
        userSelect: 'none',
      }}
    >
      {/* ── Gradient SV ── */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: 160,
          borderRadius: 8,
          overflow: 'hidden',
          cursor: 'crosshair',
          touchAction: 'none',
          marginBottom: 10,
        }}
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId);
          readGradientPos(e);
        }}
        onPointerMove={(e) => {
          if (e.buttons) readGradientPos(e);
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `linear-gradient(to right, #fff, ${hueColor})`,
          }}
        />
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(to top, #000, transparent)',
          }}
        />
        {/* cursor */}
        <div
          style={{
            position: 'absolute',
            left: `${hsv[1] * 100}%`,
            top: `${(1 - hsv[2]) * 100}%`,
            transform: 'translate(-50%, -50%)',
            width: 16,
            height: 16,
            borderRadius: '50%',
            border: '2.5px solid white',
            boxShadow: '0 0 0 1.5px rgba(0,0,0,0.35)',
            background: currentHex,
            pointerEvents: 'none',
          }}
        />
      </div>

      {/* ── Hue strip ── */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: 14,
          borderRadius: 7,
          cursor: 'ew-resize',
          touchAction: 'none',
          background:
            'linear-gradient(to right, #f00, #ff0, #0f0, #0ff, #00f, #f0f, #f00)',
          marginBottom: 14,
        }}
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId);
          readHuePos(e);
        }}
        onPointerMove={(e) => {
          if (e.buttons) readHuePos(e);
        }}
      >
        <div
          style={{
            position: 'absolute',
            left: `${(hsv[0] / 360) * 100}%`,
            top: '50%',
            transform: 'translate(-50%, -50%)',
            width: 20,
            height: 20,
            borderRadius: '50%',
            border: '2.5px solid white',
            boxShadow: '0 0 0 1.5px rgba(0,0,0,0.35)',
            background: hueColor,
            pointerEvents: 'none',
          }}
        />
      </div>

      {/* ── Current color + Hex input ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 7,
            background: currentHex,
            border: '1px solid rgba(255,255,255,0.14)',
            flexShrink: 0,
          }}
        />
        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            background: 'var(--bg-base)',
            border: '1px solid var(--border-hairline)',
            borderRadius: 7,
            padding: '5px 10px',
          }}
        >
          <span style={{ fontSize: 12, color: 'var(--text-tertiary)', marginRight: 2 }}>#</span>
          <input
            type="text"
            value={hexInput}
            onChange={(e) => {
              const v = e.target.value.toUpperCase().replace(/[^0-9A-F]/g, '').slice(0, 6);
              setHexInput(v);
              if (v.length === 6) {
                const hex = '#' + v;
                const newHsv = hexToHsv(hex);
                setHsv(newHsv);
                onChange(hex);
              }
            }}
            style={{
              background: 'transparent',
              border: 'none',
              outline: 'none',
              fontSize: 12,
              fontFamily: 'monospace',
              color: 'var(--text-primary)',
              width: '100%',
              letterSpacing: '0.06em',
            }}
            placeholder="7C5CFC"
          />
        </div>
      </div>

      {/* ── Preset swatches ── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(6, 1fr)',
          gap: 5,
        }}
      >
        {PICKER_PRESETS.map((preset) => {
          const isActive = currentHex.toLowerCase() === preset.toLowerCase();
          return (
            <button
              key={preset}
              title={preset}
              onClick={() => {
                const newHsv = hexToHsv(preset);
                setHsv(newHsv);
                setHexInput(preset.replace('#', '').toUpperCase());
                onChange(preset);
              }}
              style={{
                width: '100%',
                aspectRatio: '1',
                borderRadius: 6,
                background: preset,
                border: isActive
                  ? '2.5px solid white'
                  : '1px solid rgba(255,255,255,0.12)',
                cursor: 'pointer',
                transition: 'transform 0.1s, box-shadow 0.1s',
                boxShadow: isActive ? '0 0 0 1.5px rgba(0,0,0,0.4)' : 'none',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.transform = 'scale(1.18)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.transform = 'scale(1)';
              }}
            />
          );
        })}
      </div>
    </div>,
    document.body,
  );
}

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
  const [open, setOpen] = useState(false);
  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null);
  const swatchRef = useRef<HTMLButtonElement>(null);

  function togglePicker() {
    if (swatchRef.current) {
      setAnchorRect(swatchRef.current.getBoundingClientRect());
    }
    setOpen((v) => !v);
  }

  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-[13px] text-[var(--text-secondary)]">{label}</span>
      <div className="flex items-center gap-2">
        {/* Swatch button */}
        <button
          ref={swatchRef}
          onClick={togglePicker}
          title="Escolher cor"
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            background: value,
            border: open
              ? '2px solid var(--accent)'
              : '1px solid var(--border-hairline)',
            cursor: 'pointer',
            transition: 'border-color 0.12s',
            flexShrink: 0,
          }}
        />
        {/* Hex text input */}
        <input
          type="text"
          value={value.replace('#', '').toUpperCase()}
          onChange={(e) => {
            const v = e.target.value.replace(/[^0-9A-Fa-f]/g, '').slice(0, 6);
            if (v.length === 6) onChange('#' + v);
          }}
          maxLength={6}
          placeholder="7C5CFC"
          className={cn(
            'w-24 px-2 py-1.5 rounded-lg text-[12px] font-mono uppercase',
            'bg-[var(--bg-base)] border border-[var(--border-hairline)]',
            'text-[var(--text-primary)] transition-colors duration-150',
            'focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]',
          )}
        />
        {/* Picker popover */}
        {open && anchorRect && (
          <ColorPickerPopover
            value={value}
            onChange={onChange}
            onClose={() => setOpen(false)}
            anchorRect={anchorRect}
          />
        )}
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

  const [title, setTitle] = useState('');
  const [theme, setTheme] = useState<Partial<ThemeConfig>>({});
  const [settings, setSettings] = useState<Partial<FormSettings>>({});
  const [isDirty, setIsDirty] = useState(false);

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
