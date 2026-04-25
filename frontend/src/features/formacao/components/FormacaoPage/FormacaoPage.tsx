import { motion, useReducedMotion } from 'framer-motion';
import { staggerContainer } from '../../../../lib/motion.ts';
import { useFormacao } from '../../hooks/useFormacao';
import { FormacaoHero } from '../FormacaoHero';
import { FormacaoSectionBlock } from '../FormacaoSectionBlock';

export function FormacaoPage() {
  const prefersReducedMotion = useReducedMotion();
  const {
    homeSettings,
    courses,
    sectionsCourses,
    hasSections,
    sectionsLoading,
    catalogLoading,
    continueLearning,
  } = useFormacao();

  const containerVariants = prefersReducedMotion
    ? { initial: { opacity: 0 }, animate: { opacity: 1 } }
    : staggerContainer;

  return (
    <>
      <motion.div
        variants={containerVariants}
        initial="initial"
        animate="animate"
        className="w-full max-w-6xl mx-auto pb-24 lg:pb-12"
      >
        <div className={homeSettings?.subtitle ? 'mb-4 sm:mb-6' : 'mb-8 sm:mb-12'}>
          <h1
            className="text-[28px] sm:text-[32px] font-bold tracking-tight leading-none"
            style={{
              background: 'linear-gradient(135deg, var(--text-primary) 0%, var(--accent) 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            {homeSettings?.title ?? 'Forma\u00e7\u00e3o'}
          </h1>
          {homeSettings?.subtitle && (
            <p className="text-[17px] text-[var(--color-text-secondary)] mt-2">
              {homeSettings.subtitle}
            </p>
          )}
        </div>

        {continueLearning && <FormacaoHero data={continueLearning} />}

        {sectionsLoading ? (
          <FormacaoSectionBlock title="Seus Cursos" courses={[]} loading={true} />
        ) : hasSections ? (
          sectionsCourses.map((section) => (
            <FormacaoSectionBlock
              key={section.id}
              title={section.title}
              courses={section.courses}
              loading={false}
            />
          ))
        ) : (
          <FormacaoSectionBlock
            title="Seus Cursos"
            courses={courses}
            loading={catalogLoading}
          />
        )}

      </motion.div>
    </>
  );
}
