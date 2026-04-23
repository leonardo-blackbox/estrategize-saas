interface QuizActionsProps { canGoBack: boolean; onBack: () => void; onNext: () => void; showNext: boolean; }
export function QuizActions({ canGoBack, onBack, onNext, showNext }: QuizActionsProps) {
  return <div className="mt-8 flex items-center justify-between"><button disabled={!canGoBack} onClick={onBack} className="min-h-11 rounded-full bg-white/10 px-4 text-white disabled:opacity-30">←</button>{showNext && <button onClick={onNext} className="min-h-11 rounded-full bg-cyan-300 px-6 font-semibold text-slate-950">Próxima</button>}</div>;
}
