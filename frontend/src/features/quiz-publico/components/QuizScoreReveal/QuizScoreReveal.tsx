import { useEffect, useState } from 'react';

export function QuizScoreReveal({ score, onDone }: { score: number; onDone: () => void }) {
  const [visibleScore, setVisibleScore] = useState(0);
  const circumference = 2 * Math.PI * 45;
  const offset = circumference - (score / 100) * circumference;
  useEffect(() => {
    const started = Date.now();
    const id = window.setInterval(() => {
      const progress = Math.min(1, (Date.now() - started) / 1500);
      setVisibleScore(Math.round(score * progress));
      if (progress === 1) { window.clearInterval(id); onDone(); }
    }, 32);
    return () => window.clearInterval(id);
  }, [onDone, score]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 p-6 text-center text-white">
      <div>
        <svg viewBox="0 0 120 120" className="mx-auto h-44 w-44 -rotate-90"><circle cx="60" cy="60" r="45" stroke="rgba(255,255,255,.12)" strokeWidth="10" fill="none" /><circle cx="60" cy="60" r="45" stroke="#67e8f9" strokeWidth="10" fill="none" strokeLinecap="round" style={{ strokeDasharray: circumference, strokeDashoffset: offset, transition: 'stroke-dashoffset 1.5s ease-out' }} /></svg>
        <div className="-mt-28 mb-16 text-5xl font-semibold">{visibleScore}%</div>
        <p className="text-slate-300">Calculando seu resultado...</p>
      </div>
    </div>
  );
}
