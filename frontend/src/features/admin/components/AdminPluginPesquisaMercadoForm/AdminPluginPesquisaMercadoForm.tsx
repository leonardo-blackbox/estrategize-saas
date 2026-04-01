import { useState, useEffect } from 'react';
import { usePluginConfig } from '../../hooks/usePluginConfig.ts';
import type { PesquisaMercadoConfig } from '../../../../types/market-intelligence.ts';
import { ConfigSectionGeneral } from './ConfigSectionGeneral.tsx';
import { ConfigSectionInstagram } from './ConfigSectionInstagram.tsx';
import { ConfigSectionDiscovery } from './ConfigSectionDiscovery.tsx';
import { ConfigSectionAIReport } from './ConfigSectionAIReport.tsx';
import { ConfigSectionRAG } from './ConfigSectionRAG.tsx';
import { ConfigSectionCredits } from './ConfigSectionCredits.tsx';

const SLUG = 'pesquisa-mercado';

function SectionCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface-1)] p-5">
      {children}
    </div>
  );
}

export function AdminPluginPesquisaMercadoForm() {
  const { config, isLoading, updateConfig, isUpdating, updateSuccess, updateError } = usePluginConfig(SLUG);
  const [draft, setDraft] = useState<PesquisaMercadoConfig | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    if (config && !draft) setDraft(config);
  }, [config, draft]);

  useEffect(() => {
    if (updateSuccess) {
      setToast({ type: 'success', message: 'Configuracoes salvas com sucesso.' });
      setTimeout(() => setToast(null), 3000);
    }
  }, [updateSuccess]);

  useEffect(() => {
    if (updateError) {
      setToast({ type: 'error', message: updateError.message ?? 'Erro ao salvar.' });
      setTimeout(() => setToast(null), 4000);
    }
  }, [updateError]);

  function handleChange(partial: Partial<PesquisaMercadoConfig>) {
    if (!draft) return;
    setDraft((prev) => prev ? { ...prev, ...partial } : prev);
  }

  async function handleSave() {
    if (!draft) return;
    await updateConfig(draft);
  }

  const isDirty = JSON.stringify(draft) !== JSON.stringify(config);

  if (isLoading || !draft) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-32 rounded-xl bg-[var(--bg-surface-1)] animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-[var(--text-primary)]">Pesquisa de Mercado — Configuracoes do Plugin</h2>
          <p className="text-xs text-[var(--text-tertiary)] mt-0.5">Controle todos os parametros do plugin de inteligencia de mercado.</p>
        </div>
        <button
          type="button"
          onClick={handleSave}
          disabled={isUpdating || !isDirty}
          className="px-4 py-2 text-sm font-medium rounded-lg bg-[var(--accent)] text-white disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
        >
          {isUpdating ? 'Salvando...' : 'Salvar Configuracoes'}
        </button>
      </div>

      {toast && (
        <div className={`text-sm rounded-lg px-4 py-3 ${toast.type === 'success' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
          {toast.message}
        </div>
      )}

      <SectionCard><ConfigSectionGeneral config={draft} onChange={handleChange} disabled={isUpdating} /></SectionCard>
      <SectionCard><ConfigSectionInstagram config={draft} onChange={handleChange} disabled={isUpdating} /></SectionCard>
      <SectionCard><ConfigSectionDiscovery config={draft} onChange={handleChange} disabled={isUpdating} /></SectionCard>
      <SectionCard><ConfigSectionAIReport config={draft} onChange={handleChange} disabled={isUpdating} /></SectionCard>
      <SectionCard><ConfigSectionRAG config={draft} onChange={handleChange} disabled={isUpdating} /></SectionCard>
      <SectionCard><ConfigSectionCredits config={draft} onChange={handleChange} disabled={isUpdating} /></SectionCard>
    </div>
  );
}
