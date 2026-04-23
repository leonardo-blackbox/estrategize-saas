interface QuizEmptyStateProps { onCreate: () => void; }

export function QuizEmptyState({ onCreate }: QuizEmptyStateProps) {
  return (
    <section className="relative overflow-hidden rounded-[34px] border border-cyan-200/15 bg-[radial-gradient(circle_at_20%_20%,rgba(34,211,238,.22),transparent_34%),linear-gradient(135deg,rgba(15,23,42,.94),rgba(8,13,20,.98))] p-10 text-center shadow-[0_30px_120px_rgba(8,47,73,.28)]">
      <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-[28px] bg-cyan-300/10 text-4xl">?</div>
      <h2 className="text-2xl font-semibold tracking-tight text-white">Crie seu primeiro quiz e qualifique leads automaticamente</h2>
      <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-300">Transforme perguntas em diagnóstico, score e próximos passos personalizados sem misturar com suas Aplicações.</p>
      <button onClick={onCreate} className="mt-7 min-h-11 rounded-full bg-cyan-300 px-6 text-sm font-semibold text-slate-950 shadow-[0_12px_40px_rgba(34,211,238,.28)]">Criar meu primeiro quiz</button>
    </section>
  );
}
