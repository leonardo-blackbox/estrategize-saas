export function QuizProgressBar({ index, total }: { index: number; total: number }) {
  const progress = total > 0 ? ((index + 1) / total) * 100 : 0;
  return <div className="mb-8"><div className="h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-cyan-300 transition-all" style={{ width: `${progress}%` }} /></div><p className="mt-2 text-sm text-slate-300">Pergunta {index + 1} de {total}</p></div>;
}
