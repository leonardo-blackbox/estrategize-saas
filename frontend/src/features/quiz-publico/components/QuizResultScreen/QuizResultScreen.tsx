import { toast } from 'sonner';
import type { PublicQuizData, QuizSubmitResult } from '../../services/quiz-publico.api.ts';

function whatsappUrl(raw: string) {
  const digits = raw.replace(/\D/g, '');
  return `https://wa.me/55${digits}?text=Ol%C3%A1!%20Vi%20meu%20resultado%20no%20quiz%20e%20quero%20saber%20mais.`;
}

export function QuizResultScreen({ quiz, result }: { quiz: PublicQuizData; result?: QuizSubmitResult }) {
  const outcome = result?.outcome;
  const theme = quiz.application.theme_config as { backgroundColor?: string; logoUrl?: string } | undefined;
  const background = outcome?.background_color ?? theme?.backgroundColor ?? '#061018';
  const share = () => navigator.clipboard.writeText(`${window.location.origin}/q/${quiz.application.slug}`).then(() => toast.success('Link copiado!'));
  const ctaHref = outcome?.cta_type === 'whatsapp' && outcome.cta_url ? whatsappUrl(outcome.cta_url) : outcome?.cta_url;
  const title = outcome?.title ?? quiz.application.settings?.thankYouTitle ?? 'Obrigado por responder!';
  const description = outcome?.description ?? quiz.application.settings?.thankYouMessage ?? 'Recebemos suas respostas.';

  return (
    <main className="flex min-h-screen items-center justify-center bg-cover bg-center p-6 text-white" style={{ backgroundColor: background, backgroundImage: outcome?.image_url ? `linear-gradient(rgba(0,0,0,.5),rgba(0,0,0,.5)),url(${outcome.image_url})` : undefined }}>
      <section className="w-full max-w-2xl rounded-[36px] border border-white/15 bg-black/35 p-8 text-center backdrop-blur-2xl">
        {theme?.logoUrl && <img src={theme.logoUrl} alt="Logo" className="mx-auto mb-6 h-12 object-contain" />}
        <span className="rounded-full bg-white/10 px-4 py-2 text-sm text-slate-200">Seu score: {result?.score ?? 0}%</span>
        <h1 className="mt-6 text-4xl font-semibold tracking-[-.04em]">{title}</h1>
        <p className="mt-4 whitespace-pre-line text-lg leading-8 text-slate-100">{description}</p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          {outcome && outcome.cta_type !== 'none' && ctaHref && <a href={ctaHref} target="_blank" rel="noopener noreferrer" aria-label={outcome.cta_label ?? 'Abrir próximo passo'} className="min-h-11 rounded-full bg-cyan-300 px-6 py-3 font-semibold text-slate-950">{outcome.cta_label || 'Quero saber mais'}</a>}
          <button onClick={share} className="min-h-11 rounded-full bg-white/10 px-6 py-3 font-semibold text-white">Compartilhar quiz</button>
        </div>
      </section>
    </main>
  );
}
