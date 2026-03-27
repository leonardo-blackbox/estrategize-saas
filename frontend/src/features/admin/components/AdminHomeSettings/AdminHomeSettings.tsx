import { motion } from 'framer-motion';
import { staggerItem } from '../../../../lib/motion.ts';
import { cn } from '../../../../lib/cn.ts';
import { Button } from '../../../../components/ui/Button.tsx';
import { Input } from '../../../../components/ui/Input.tsx';

interface AdminHomeSettingsProps {
  title: string;
  setTitle: (v: string) => void;
  subtitle: string;
  setSubtitle: (v: string) => void;
  settingsLoading: boolean;
  saveMutation: { mutate: () => void; isPending: boolean };
  saved: boolean;
  previewTitle: string;
  previewSubtitle: string;
}

export function AdminHomeSettings({
  title, setTitle, subtitle, setSubtitle,
  settingsLoading, saveMutation, saved,
  previewTitle, previewSubtitle,
}: AdminHomeSettingsProps) {
  return (
    <motion.div variants={staggerItem} className="space-y-6">
      <div>
        <h1 className="text-base font-semibold text-[var(--text-primary)]">Home</h1>
        <p className="text-xs text-[var(--text-tertiary)] mt-0.5">
          Personalize o titulo e subtitulo exibidos na pagina inicial da area de membros.
        </p>
      </div>

      {settingsLoading ? (
        <div className="space-y-3">
          <div className="h-10 animate-pulse rounded-[var(--radius-md)] bg-[var(--bg-surface-1)]" />
          <div className="h-20 animate-pulse rounded-[var(--radius-md)] bg-[var(--bg-surface-1)]" />
        </div>
      ) : (
        <div className="rounded-[var(--radius-md)] border border-[var(--border-hairline)] bg-[var(--bg-surface-1)] p-5 space-y-4">
          <Input
            label="Titulo da pagina"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Formacao"
          />

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[var(--text-secondary)]">
              Subtitulo / instrucao
            </label>
            <textarea
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              placeholder="Bem-vindo a sua area de aprendizado..."
              rows={3}
              maxLength={300}
              className={cn(
                'w-full resize-none rounded-[var(--radius-sm)] border bg-[var(--bg-hover)]',
                'border-[var(--border-default)] px-3 py-2 text-sm text-[var(--text-primary)]',
                'placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--border-focus)]',
                'transition-colors',
              )}
            />
            <p className="text-[10px] text-[var(--text-tertiary)] text-right">
              {subtitle.length}/300
            </p>
          </div>

          {/* Preview */}
          <div className="rounded-[var(--radius-sm)] border border-[var(--border-hairline)] bg-[var(--bg-base)] px-5 py-4">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)] mb-3">
              Preview
            </p>
            <h1 className="text-[28px] font-semibold tracking-tight text-[var(--text-primary)] leading-tight">
              {previewTitle}
            </h1>
            {previewSubtitle && (
              <p className="text-[15px] text-[var(--text-secondary)] mt-2">
                {previewSubtitle}
              </p>
            )}
          </div>

          <div className="flex items-center gap-3">
            <Button
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending || !title.trim()}
            >
              {saveMutation.isPending ? 'Salvando...' : saved ? '✓ Salvo!' : 'Salvar alterações'}
            </Button>
            {saved && (
              <span className="text-xs text-emerald-500 font-medium">Alterações salvas com sucesso.</span>
            )}
          </div>
        </div>
      )}
    </motion.div>
  );
}
