interface QuizEmptyStateProps { onCreate: () => void; }

export function QuizEmptyState({ onCreate }: QuizEmptyStateProps) {
  return (
    <section className="relative overflow-hidden rounded-[34px] border border-[var(--border-hairline)] bg-[var(--bg-surface-1)] p-10 text-center shadow-[var(--shadow-soft)]">
      <div className="absolute inset-x-8 top-0 h-px bg-[linear-gradient(90deg,transparent,var(--accent),transparent)]" />
      <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-[28px] bg-[var(--accent-muted)] text-4xl">?</div>
      <h2 className="text-2xl font-semibold tracking-tight text-[var(--text-primary)]">Crie seu primeiro quiz e qualifique leads automaticamente</h2>
      <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-[var(--text-secondary)]">Transforme perguntas em diagnóstico, score e próximos passos personalizados sem misturar com suas Aplicações.</p>
      <button onClick={onCreate} className="mt-7 min-h-11 rounded-full bg-[var(--accent)] px-6 text-sm font-semibold text-[var(--accent-text)] shadow-[0_12px_40px_rgba(34,211,238,.28)]">Criar meu primeiro quiz</button>
    </section>
  );
}
