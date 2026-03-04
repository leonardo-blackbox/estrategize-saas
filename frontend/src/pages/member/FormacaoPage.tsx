import { useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { staggerContainer, staggerItem } from '../../lib/motion.ts';
import { cn } from '../../lib/cn.ts';
import { isDaysUrgent } from '../../lib/dates.ts';
import { Modal } from '../../components/ui/Modal.tsx';

// --- MOCKS ---

const continueLearning = {
  id: 'curso-1',
  title: 'Estratégia Empresarial Avançada',
  module: 'Módulo 3: Análise Competitiva',
  lesson: 'Aula 7: Cinco Forças de Porter',
  progress: 68,
  thumbnail: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=1470&auto=format&fit=crop',
};

const mockCourses = [
  { id: 'curso-1', title: 'Estratégia Empresarial Avançada', lessons: 24, progress: 68, status: 'active' as const, thumbnail: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=1470&auto=format&fit=crop' },
  { id: 'curso-2', title: 'Liderança e Gestão de Equipes', lessons: 18, progress: 14, status: 'active' as const, thumbnail: 'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?q=80&w=1470&auto=format&fit=crop' },
  { id: 'curso-3', title: 'Operações e Logística', lessons: 10, progress: 100, status: 'completed' as const, thumbnail: 'https://images.unsplash.com/photo-1505330622279-bf7d7fc918f4?q=80&w=1470&auto=format&fit=crop' },
  { id: 'curso-4', title: 'Growth & Escala', lessons: 12, progress: 0, status: 'drip' as const, dripDate: '2026-03-15', thumbnail: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=1470&auto=format&fit=crop' },
  { id: 'curso-5', title: 'Finanças para Decisores', lessons: 16, progress: 35, status: 'expiring' as const, expiryDate: '2026-02-27', thumbnail: 'https://images.unsplash.com/photo-1600880292089-90a7e086ee0c?q=80&w=1470&auto=format&fit=crop' },
  { id: 'curso-6', title: 'Inteligência Artificial Corporativa', lessons: 8, progress: 0, status: 'locked' as const, requiredOffer: 'Plano Pro', thumbnail: null }, // testing gradient fallback
  { id: 'curso-7', title: 'Marketing de Conteúdo', lessons: 20, progress: 0, status: 'active' as const, thumbnail: 'https://images.unsplash.com/photo-1432821596592-e2c18b78144f?q=80&w=1470&auto=format&fit=crop' },
  { id: 'curso-8', title: 'Vendas B2B Complexas', lessons: 15, progress: 0, status: 'locked' as const, requiredOffer: 'Plano Ent', thumbnail: 'https://images.unsplash.com/photo-1556761175-5973dc0f32d7?q=80&w=1470&auto=format&fit=crop' },
  { id: 'curso-9', title: 'Cultura Organizacional', lessons: 14, progress: 100, status: 'completed' as const, thumbnail: 'https://images.unsplash.com/photo-1517048676732-d65bc937f952?q=80&w=1470&auto=format&fit=crop' },
  { id: 'curso-10', title: 'Mentalidade de Founder', lessons: 6, progress: 0, status: 'drip' as const, dripDate: '2026-04-10', thumbnail: 'https://images.unsplash.com/photo-1499951360447-b19be8fe80f5?q=80&w=1470&auto=format&fit=crop' },
];

const mockJourney = [
  { id: 'j1', step: 'Etapa 1/6', title: 'Fundamentos do Consultor', description: 'O baseamento para iniciar sua jornada digital com o pé direito.', recommended: true, cta: 'Continuar' },
  { id: 'j2', step: 'Etapa 2/6', title: 'Produto e Posicionamento', description: 'Descubra seu diferencial e como empacotar sua oferta de alto valor.', recommended: false, cta: 'Começar' },
  { id: 'j3', step: 'Etapa 3/6', title: 'Aquisição de Clientes', description: 'Máquina de vendas e estratégias de marketing para B2B e B2C.', recommended: false, cta: 'Trancado' },
  { id: 'j4', step: 'Etapa 4/6', title: 'Entrega e Encantamento', description: 'Estratégias de overdelivery e retenção perpétua de clientes.', recommended: false, cta: 'Trancado' },
];

type MaterialType = 'PDF' | 'Template' | 'Imagem';
interface Material {
  id: string;
  title: string;
  type: MaterialType;
  description: string;
  uploadedAt: string;
  size: string;
  downloadUrl?: string;
}

const mockMaterials: Material[] = [
  { id: 'm1', title: 'Checklist de Diagnóstico', type: 'PDF', description: 'O checklist completo para sua primeira reunião de diagnóstico com um lead qualificado. Essencial para impressionar nos primeiros 5 minutos.', uploadedAt: '12 Jan 2026', size: '2.4 MB', downloadUrl: '#' },
  { id: 'm2', title: 'Proposta Comercial Premium', type: 'Template', description: 'Template em Notion para enviar propostas formatadas de alto valor percebido.', uploadedAt: '15 Jan 2026', size: '1.1 MB', downloadUrl: '#' },
  { id: 'm3', title: 'Mapa Mental: Funil B2B', type: 'Imagem', description: 'Estrutura visual de um funil de conversão outbound para empresas corporativas.', uploadedAt: '03 Fev 2026', size: '4.8 MB', downloadUrl: '#' },
  { id: 'm4', title: 'Script de Vendas Consultivas', type: 'PDF', description: 'O roteiro exato que usamos para fechar contratos high-ticket.', uploadedAt: '10 Fev 2026', size: '1.8 MB', downloadUrl: '#' },
  { id: 'm5', title: 'Calculadora de Precificação', type: 'Template', description: 'Planilha inteligente para precificar sua hora e pacotes baseados na margem de lucro.', uploadedAt: '20 Fev 2026', size: '500 KB' }, // sem link
];

// --- COMPONENTS ---

function EntitlementBadge({ status, requiredOffer, dripDate, expiryDate }: {
  status: 'active' | 'locked' | 'drip' | 'expiring' | 'completed';
  requiredOffer?: string;
  dripDate?: string;
  expiryDate?: string;
}) {
  const isUrgent = status === 'expiring' && isDaysUrgent(expiryDate);
  const baseStyle = "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider backdrop-blur-md border";

  if (status === 'locked') {
    return (
      <span className={cn(baseStyle, "bg-[var(--color-bg-primary)]/80 border-[var(--color-border-subtle)] text-[var(--color-text-secondary)]")}>
        Requer {requiredOffer}
      </span>
    );
  }
  if (status === 'drip') {
    return (
      <span className={cn(baseStyle, "bg-black/80 border-[var(--color-border-subtle)] text-[var(--color-text-primary)]")}>
        Libera {dripDate}
      </span>
    );
  }
  if (status === 'expiring') {
    return (
      <span className={cn(baseStyle, isUrgent ? "bg-black/80 border-[var(--color-text-primary)] text-[var(--color-text-primary)]" : "bg-black/60 border-[var(--color-border-subtle)] text-[var(--color-text-primary)]")}>
        Expira {expiryDate}
      </span>
    );
  }
  if (status === 'completed') {
    return (
      <span className={cn(baseStyle, "bg-[var(--color-text-primary)]/10 border-[rgba(255,255,255,0.15)] text-[var(--color-text-primary)]")}>
        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
        </svg>
        Completo
      </span>
    );
  }
  return null;
}

// --- MAIN PAGE ---

export function FormacaoPage() {
  const prefersReducedMotion = useReducedMotion();
  const [showAllMaterials, setShowAllMaterials] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);

  // If prefers reduced motion, disable stagger
  const containerVariants = prefersReducedMotion ? { initial: { opacity: 0 }, animate: { opacity: 1 } } : staggerContainer;
  const itemVariants = prefersReducedMotion ? { initial: { opacity: 0 }, animate: { opacity: 1 } } : staggerItem;

  const materialsList = showAllMaterials ? mockMaterials : mockMaterials.slice(0, 4);

  return (
    <>
      {/* Subtle Premium Background Noise */}
      <div
        className="fixed inset-0 z-0 pointer-events-none opacity-[0.02]"
        style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.65\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E")' }}
      />

      <motion.div
        variants={containerVariants}
        initial="initial"
        animate="animate"
        className="relative z-10 w-full max-w-6xl mx-auto pb-24 lg:pb-12"
      >
        <div className="flex items-center justify-between mb-8 sm:mb-12">
          <h1 className="text-[32px] sm:text-[40px] font-semibold tracking-tight text-[var(--color-text-primary)]">
            Formação
          </h1>
        </div>

        {/* 1. Continue Learning Hero */}
        <motion.div variants={itemVariants}>
          <Link
            to={`/formacao/curso/${continueLearning.id}`}
            className={cn(
              'group relative block overflow-hidden rounded-[24px]',
              'bg-[var(--color-bg-elevated)] border border-[var(--color-border-subtle)]',
              'transition-all duration-300 hover:border-[var(--color-border-default)]',
              'shadow-[0_4px_24px_rgba(0,0,0,0.15)]'
            )}
          >
            {/* Image Background */}
            <div className="absolute inset-0 z-0 pointer-events-none">
              <img
                src={continueLearning.thumbnail}
                alt={continueLearning.title}
                className="w-full h-full object-cover opacity-50 grayscale mix-blend-luminosity motion-safe:group-hover:scale-[1.02] motion-safe:group-hover:opacity-60 transition-all duration-[800ms] ease-out"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-transparent" />
            </div>

            <div className="relative z-10 p-6 sm:p-10 flex flex-col justify-end min-h-[360px] sm:min-h-[440px]">
              <div className="text-[12px] font-semibold text-[var(--color-text-tertiary)] uppercase tracking-widest mb-3">
                Continuar aprendendo
              </div>
              <h2 className="text-[28px] sm:text-[40px] font-semibold tracking-tight text-[var(--color-text-primary)] leading-tight mb-2 max-w-2xl">
                {continueLearning.title}
              </h2>
              <p className="text-[15px] sm:text-[17px] text-[var(--color-text-secondary)] mb-8">
                {continueLearning.module} &middot; {continueLearning.lesson}
              </p>

              {/* Progress bar and CTA row */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                <div className="flex-1 w-full max-w-sm">
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-1 bg-[rgba(255,255,255,0.1)] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[var(--color-text-primary)] rounded-full motion-safe:transition-all motion-safe:duration-500 ease-out"
                        style={{ width: `${continueLearning.progress}%` }}
                      />
                    </div>
                    <span className="text-[12px] font-medium text-[var(--color-text-secondary)]">
                      {continueLearning.progress}%
                    </span>
                  </div>
                </div>

                <div className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-[var(--color-text-primary)] px-6 py-3 text-[15px] font-semibold text-[var(--color-bg-primary)] motion-safe:transition-transform motion-safe:duration-200 active:scale-95 hover:opacity-90 min-w-[140px] min-h-[44px]">
                  Continuar
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                  </svg>
                </div>
              </div>
            </div>
          </Link>
        </motion.div>

        {/* 2. Cursos Section */}
        <motion.div variants={itemVariants} className="mt-12 sm:mt-16 -mx-4 sm:mx-0">
          <div className="px-4 sm:px-0 mb-6">
            <h3 className="text-[22px] font-semibold tracking-tight text-[var(--color-text-primary)]">
              Seus Cursos
            </h3>
          </div>

          <div className="flex sm:grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 overflow-x-auto snap-x snap-mandatory px-4 sm:px-0 pb-6 sm:pb-0 scrollbar-none">
            {mockCourses.map((course) => (
              <div
                key={course.id}
                className="w-[85vw] sm:w-auto shrink-0 snap-center sm:snap-align-none h-full"
              >
                <Link
                  to={course.status === 'locked' ? '#' : `/formacao/curso/${course.id}`}
                  className={cn(
                    'relative flex flex-col h-full min-h-[300px] rounded-[24px] overflow-hidden',
                    'bg-[var(--color-bg-secondary)] border border-[var(--color-border-subtle)]',
                    'transition-all duration-300 group outline-none focus-visible:ring-2 focus-visible:ring-white',
                    course.status === 'locked'
                      ? 'opacity-[0.6] cursor-not-allowed filter grayscale-[50%]'
                      : 'hover:border-[var(--color-border-default)] hover:-translate-y-1 hover:shadow-[0_12px_32px_rgba(0,0,0,0.3)] cursor-pointer'
                  )}
                  onClick={course.status === 'locked' ? (e) => e.preventDefault() : undefined}
                >
                  {/* Thumbnail area */}
                  <div className="relative h-44 sm:h-48 w-full bg-[var(--color-bg-tertiary)] overflow-hidden">
                    {course.thumbnail ? (
                      <img
                        src={course.thumbnail}
                        alt={course.title}
                        className="w-full h-full object-cover grayscale mix-blend-luminosity opacity-40 motion-safe:group-hover:scale-[1.03] motion-safe:group-hover:opacity-60 transition-all duration-[600ms] ease-out"
                      />
                    ) : (
                      <div className="w-full h-full opacity-60 bg-gradient-to-br from-[#161616] to-[#0a0a0a]" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-bg-secondary)] via-[var(--color-bg-secondary)]/10 to-transparent opacity-95" />

                    <div className="absolute top-4 right-4 z-10">
                      <EntitlementBadge
                        status={course.status}
                        requiredOffer={course.requiredOffer}
                        dripDate={course.dripDate}
                        expiryDate={course.expiryDate}
                      />
                    </div>

                    {course.status === 'locked' && (
                      <div className="absolute inset-0 flex items-center justify-center z-10">
                        <div className="h-12 w-12 rounded-full bg-black/60 backdrop-blur-md flex items-center justify-center border border-[rgba(255,255,255,0.08)]">
                          <svg className="h-5 w-5 text-[#f5f5f7]" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
                          </svg>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Course info */}
                  <div className="p-6 flex flex-col flex-1 bg-[var(--color-bg-secondary)] relative z-10">
                    <h3 className="text-[18px] font-semibold leading-snug tracking-tight text-[var(--color-text-primary)] mb-1">
                      {course.title}
                    </h3>
                    <p className="text-[14px] text-[var(--color-text-tertiary)] mb-6">
                      {course.lessons} aulas
                    </p>

                    <div className="mt-auto">
                      {course.status !== 'locked' && course.progress > 0 ? (
                        <div className="flex items-center gap-3">
                          <div className="flex-1 h-1 bg-[rgba(255,255,255,0.08)] rounded-full overflow-hidden">
                            <div
                              className={cn(
                                "h-full rounded-full motion-safe:transition-all motion-safe:duration-500 ease-out",
                                course.progress === 100 ? "bg-[var(--color-text-primary)]" : "bg-[var(--color-text-secondary)]"
                              )}
                              style={{ width: `${course.progress}%` }}
                            />
                          </div>
                          <span className="text-[12px] font-medium text-[var(--color-text-secondary)]">
                            {course.progress}%
                          </span>
                        </div>
                      ) : course.status !== 'locked' ? (
                        <div className="text-[13px] font-medium text-[var(--color-text-primary)]">
                          Começar curso
                        </div>
                      ) : (
                        <div className="text-[13px] font-medium text-[var(--color-text-tertiary)]">
                          Indisponível no seu plano
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        </motion.div>

        {/* 3. Jornada do Consultor Digital */}
        <motion.div variants={itemVariants} className="mt-12 sm:mt-16 -mx-4 sm:mx-0">
          <div className="px-4 sm:px-0 mb-6 flex flex-col gap-1">
            <h3 className="text-[22px] font-semibold tracking-tight text-[var(--color-text-primary)]">
              Jornada do Consultor Digital
            </h3>
            <p className="text-[15px] text-[var(--color-text-secondary)]">
              Siga o caminho estruturado do iniciante ao mestre.
            </p>
          </div>

          <div className="flex overflow-x-auto snap-x snap-mandatory px-4 sm:px-0 pb-6 sm:pb-0 scrollbar-none gap-4">
            {mockJourney.map((item) => (
              <div
                key={item.id}
                className="w-[85vw] sm:w-[320px] shrink-0 snap-center sm:snap-align-start h-full"
              >
                <div className={cn(
                  "relative flex flex-col h-full min-h-[220px] rounded-[24px] p-6 border",
                  item.recommended
                    ? "bg-[var(--color-bg-elevated)] border-[var(--color-border-default)] shadow-[0_4px_24px_rgba(0,0,0,0.15)]"
                    : "bg-[var(--color-bg-secondary)] border-[var(--color-border-subtle)]"
                )}>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[12px] font-bold text-[var(--color-text-tertiary)] uppercase tracking-wider">
                      {item.step}
                    </span>
                    {item.recommended && (
                      <span className="inline-flex items-center rounded-sm bg-[var(--color-text-primary)]/10 px-2 py-0.5 text-[10px] font-bold text-[var(--color-text-primary)] uppercase tracking-wider">
                        Recomendado
                      </span>
                    )}
                  </div>

                  <h4 className="text-[18px] font-semibold text-[var(--color-text-primary)] tracking-tight mb-2">
                    {item.title}
                  </h4>
                  <p className="text-[14px] text-[var(--color-text-secondary)] mb-6 flex-1">
                    {item.description}
                  </p>

                  <button
                    disabled={item.cta === 'Trancado'}
                    className={cn(
                      "mt-auto inline-flex items-center justify-center rounded-full px-4 py-2.5 text-[14px] font-semibold transition-all duration-200 outline-none focus-visible:ring-2 min-h-[44px]",
                      item.recommended
                        ? "bg-[var(--color-text-primary)] text-[var(--color-bg-primary)] hover:opacity-90 active:scale-95"
                        : item.cta === 'Trancado'
                          ? "bg-[var(--color-bg-active)] text-[var(--color-text-tertiary)] cursor-not-allowed opacity-60"
                          : "bg-[var(--color-bg-active)] text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)] active:scale-95"
                    )}
                  >
                    {item.cta}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* 4. Materiais (Downloads) */}
        <motion.div variants={itemVariants} className="mt-12 sm:mt-16">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
            <div className="flex flex-col gap-1">
              <h3 className="text-[22px] font-semibold tracking-tight text-[var(--color-text-primary)]">
                Materiais Extras
              </h3>
              <p className="text-[15px] text-[var(--color-text-secondary)]">
                Templates, planilhas e scripts para aplicar.
              </p>
            </div>

            {mockMaterials.length > 4 && (
              <button
                onClick={() => setShowAllMaterials(!showAllMaterials)}
                className="text-[14px] font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors self-start sm:self-auto min-h-[44px] px-2 -ml-2 sm:ml-0"
              >
                {showAllMaterials ? 'Mostrar menos' : 'Ver todos'}
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {materialsList.map((material) => (
              <button
                key={material.id}
                onClick={() => setSelectedMaterial(material)}
                className="group flex flex-col md:flex-row md:items-center gap-4 rounded-[20px] border border-[var(--color-border-subtle)] bg-[var(--color-bg-secondary)] p-5 text-left transition-all duration-200 hover:border-[var(--color-border-default)] hover:bg-[var(--color-bg-elevated)] min-h-[80px] outline-none focus-visible:ring-2 focus-visible:ring-white"
              >
                {/* Icon based on type */}
                <div className="shrink-0 h-12 w-12 rounded-full bg-[var(--color-bg-active)] flex items-center justify-center border border-[var(--color-border-subtle)] text-[var(--color-text-primary)]">
                  {material.type === 'PDF' && (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m3.75 9v6m3-3H9m1.5-12H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                    </svg>
                  )}
                  {material.type === 'Template' && (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 15L12 18.75 15.75 15m-7.5-6L12 5.25 15.75 9" />
                    </svg>
                  )}
                  {material.type === 'Imagem' && (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
                    </svg>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <h4 className="text-[16px] font-semibold text-[var(--color-text-primary)] tracking-tight truncate">
                    {material.title}
                  </h4>
                  <div className="flex items-center gap-2 mt-1 text-[13px] text-[var(--color-text-tertiary)]">
                    <span>{material.type}</span>
                    <span className="w-1 h-1 rounded-full bg-[var(--color-text-tertiary)] opacity-50" />
                    <span>{material.size}</span>
                  </div>
                </div>

                <div className="shrink-0 self-start md:self-center ml-auto">
                  <div className="h-8 w-8 rounded-full bg-transparent flex items-center justify-center text-[var(--color-text-secondary)] group-hover:text-[var(--color-text-primary)] transition-colors">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                    </svg>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </motion.div>
      </motion.div>

      {/* 5. Material Download Modal */}
      <Modal open={!!selectedMaterial} onClose={() => setSelectedMaterial(null)} className="sm:max-w-md p-0 overflow-hidden">
        {selectedMaterial && (
          <div className="flex flex-col h-full bg-[var(--color-bg-secondary)]">
            <div className="p-8 pb-6 border-b border-[var(--color-border-subtle)]">
              <div className="inline-flex items-center rounded-sm bg-[var(--color-bg-active)] px-2.5 py-1 text-[11px] font-bold text-[var(--color-text-secondary)] uppercase tracking-wider mb-4 border border-[var(--color-border-subtle)]">
                {selectedMaterial.type}
              </div>
              <h3 className="text-[24px] font-semibold tracking-tight text-[var(--color-text-primary)] leading-tight mb-3">
                {selectedMaterial.title}
              </h3>
              <div className="flex items-center gap-3 text-[14px] text-[var(--color-text-tertiary)]">
                <span>Adicionado em: {selectedMaterial.uploadedAt}</span>
                <span className="w-1 h-1 rounded-full bg-[var(--color-text-tertiary)] opacity-50" />
                <span>Tamanho: {selectedMaterial.size}</span>
              </div>
            </div>

            <div className="p-8 flex flex-col gap-8">
              <p className="text-[16px] leading-relaxed text-[var(--color-text-secondary)]">
                {selectedMaterial.description}
              </p>

              <div className="flex flex-col gap-3">
                <a
                  href={selectedMaterial.downloadUrl || '#'}
                  onClick={!selectedMaterial.downloadUrl ? (e) => e.preventDefault() : undefined}
                  className={cn(
                    "w-full inline-flex items-center justify-center rounded-full px-6 py-3.5 text-[16px] font-semibold min-h-[44px] transition-all duration-200 outline-none focus-visible:ring-2",
                    selectedMaterial.downloadUrl
                      ? "bg-[var(--color-text-primary)] text-[var(--color-bg-primary)] hover:opacity-90 active:scale-95"
                      : "bg-[var(--color-bg-active)] text-[var(--color-text-tertiary)] cursor-not-allowed opacity-60"
                  )}
                >
                  {selectedMaterial.downloadUrl ? 'Fazer Download' : 'Em breve'}
                </a>

                <button
                  onClick={() => setSelectedMaterial(null)}
                  className="w-full inline-flex items-center justify-center rounded-full px-6 py-3.5 text-[16px] font-semibold bg-transparent text-[var(--color-text-primary)] hover:bg-[var(--color-bg-active)] active:scale-95 min-h-[44px] transition-all duration-200"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
