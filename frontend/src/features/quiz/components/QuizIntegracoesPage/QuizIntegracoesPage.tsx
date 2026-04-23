import { Link, useOutletContext } from 'react-router-dom';
import type { Quiz } from '../../services/quiz.api.ts';

interface ShellContext { quiz: Quiz; }

function hasTrigger(options: unknown) {
  return Boolean((options as { triggerLeadEvent?: boolean } | undefined)?.triggerLeadEvent);
}

export function QuizIntegracoesPage() {
  const { quiz } = useOutletContext<ShellContext>();
  const leadField = quiz.fields?.find((field) => hasTrigger(field.options));
  const rows = [
    ['1', 'ViewContent', 'Welcome screen exibida'],
    ['2', 'QuizStarted', 'Usuário clica "Começar"'],
    ['3', 'Lead', leadField ? `Campo: "${leadField.title}"` : 'Não configurado'],
    ['4', 'SubmitApplication', 'Quiz finalizado'],
  ];

  return (
    <section className="overflow-hidden rounded-[32px] border border-[var(--border-hairline)] bg-[var(--bg-surface-1)] shadow-[var(--shadow-soft)]">
      <div className="border-b border-[var(--border-hairline)] p-7">
        <p className="text-xs font-semibold uppercase tracking-[.3em] text-[var(--accent)]">Meta Pixel + CAPI</p>
        <h2 className="mt-2 text-3xl font-semibold tracking-tight text-[var(--text-primary)]">Como os eventos são disparados durante o quiz</h2>
      </div>
      <div className="grid gap-4 p-7">
        {rows.map(([step, event, detail]) => (
          <div key={event} className="grid gap-3 rounded-3xl border border-[var(--border-hairline)] bg-[var(--bg-surface-1)] p-5 md:grid-cols-[48px_220px_1fr] md:items-center">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--accent)] text-sm font-bold text-[var(--accent-text)]">{step}</span>
            <strong className="text-lg text-[var(--text-primary)]">{event}</strong>
            <span className="text-sm text-[var(--text-secondary)]">{detail}</span>
          </div>
        ))}
        <div className={`rounded-3xl border p-5 ${leadField ? 'border-emerald-300/30 bg-emerald-300/10' : 'border-amber-300/30 bg-amber-300/10'}`}>
          <p className="text-sm font-semibold text-[var(--text-primary)]">Lead: {leadField ? 'Configurado' : 'Não configurado'}</p>
          <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">Para configurar o gatilho do Lead, vá para a aba Editor e ative "Gatilho de Lead" em um campo de captura.</p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link to={`/quiz/${quiz.id}/editor`} className="rounded-full bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-[var(--accent-text)]">Ir para o Editor →</Link>
            <Link to={`/quiz/${quiz.id}/resultados`} className="rounded-full bg-[var(--bg-hover)] px-4 py-2 text-sm text-[var(--text-primary)]">Ver Resultados →</Link>
          </div>
        </div>
        <div className="rounded-3xl border border-[var(--border-hairline)] bg-[var(--bg-surface-1)] p-5">
          <p className="text-sm font-semibold text-[var(--text-primary)]">Eventos adicionais por resultado</p>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">Configuráveis na aba Resultados, campo por outcome.</p>
        </div>
      </div>
    </section>
  );
}
